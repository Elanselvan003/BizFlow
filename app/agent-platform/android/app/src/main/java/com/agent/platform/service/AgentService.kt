package com.agent.platform.service

import android.annotation.SuppressLint
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.agent.platform.control.CtrlService
import com.agent.platform.net.WsClient
import com.agent.platform.screen.ScreenStreamer
import com.agent.platform.store.Prefs
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject

class AgentService : Service(), WsClient.MessageListener, LocationListener {

    private lateinit var prefs: Prefs
    private var wsClient: WsClient? = null
    private var screenStreamer: ScreenStreamer? = null
    private var locationManager: LocationManager? = null
    private var lastLocation: Location? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    companion object {
        const val CHANNEL_ID = "agent_foreground_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_RESULT_DATA = "EXTRA_RESULT_DATA"

        // Cache last projection result so it persists across service restarts
        var cachedResultCode: Int = Activity.RESULT_CANCELED
        var cachedResultData: Intent? = null
    }

    override fun onCreate() {
        super.onCreate()
        prefs = Prefs(this)
        createNotificationChannel()

        // Listen for foreground app changes from Accessibility Service
        CtrlService.appChangeListener = { packageName, appName ->
            scope.launch {
                val appJson = JSONObject().apply {
                    put("type", "app_event")
                    put("deviceId", prefs.deviceId)
                    put("packageName", packageName)
                    put("appName", appName)
                    put("timestamp", System.currentTimeMillis())
                }
                wsClient?.send(appJson.toString())
            }
        }

        initLocationManager()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        if (action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification("Orvian Agent Active — Connected to Fleet"))

        // Initialize ScreenStreamer if projection token data provided
        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED) ?: Activity.RESULT_CANCELED
        val resultData = intent?.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)

        if (resultCode == Activity.RESULT_OK && resultData != null) {
            cachedResultCode = resultCode
            cachedResultData = resultData
        }

        if (cachedResultCode == Activity.RESULT_OK && cachedResultData != null) {
            startScreenStream(cachedResultCode, cachedResultData!!)
        }

        connectWebSocket()
        startTelemetryLoop()

        return START_STICKY
    }

    private fun startScreenStream(code: Int, data: Intent) {
        screenStreamer?.stop()
        screenStreamer = ScreenStreamer(this, code, data) { base64Frame ->
            val frameMsg = JSONObject().apply {
                put("type", "screen_frame")
                put("deviceId", prefs.deviceId)
                put("frame", base64Frame)
            }
            wsClient?.send(frameMsg.toString())
        }
        screenStreamer?.start()
    }

    @SuppressLint("MissingPermission")
    private fun initLocationManager() {
        try {
            locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)
            for (provider in providers) {
                if (locationManager?.isProviderEnabled(provider) == true) {
                    val loc = locationManager?.getLastKnownLocation(provider)
                    if (loc != null && (lastLocation == null || loc.accuracy < lastLocation!!.accuracy)) {
                        lastLocation = loc
                    }
                    locationManager?.requestLocationUpdates(provider, 10000L, 5f, this)
                }
            }
        } catch (e: Exception) {
            Log.e("AgentService", "Location listener init error", e)
        }
    }

    override fun onLocationChanged(location: Location) {
        lastLocation = location
        sendLocationPing(location)
    }

    private fun sendLocationPing(loc: Location) {
        val locJson = JSONObject().apply {
            put("type", "location")
            put("deviceId", prefs.deviceId)
            put("lat", loc.latitude)
            put("lng", loc.longitude)
            put("acc", loc.accuracy)
            put("speed", loc.speed)
            put("bearing", loc.bearing)
            put("ts", System.currentTimeMillis())
        }
        wsClient?.send(locJson.toString())
    }

    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}

    private fun connectWebSocket() {
        if (!prefs.isPaired || prefs.deviceId.isEmpty()) return

        val wsHost = prefs.serverUrl.replace("http://", "ws://").replace("https://", "wss://")
        val wsUrl = "$wsHost/ws?role=device&id=${prefs.deviceId}"

        wsClient?.disconnect()
        wsClient = WsClient(wsUrl, this)
        wsClient?.connect()
    }

    private fun startTelemetryLoop() {
        scope.launch {
            // Wait brief moment for initial connection
            delay(1000)
            while (isActive) {
                try {
                    sendFullTelemetry()
                } catch (e: Exception) {
                    Log.e("AgentService", "Error sending telemetry", e)
                }
                delay(5000) // 5s continuous heartbeat
            }
        }
    }

    private fun sendFullTelemetry() {
        val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val batteryLevel = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        val isCharging = bm.isCharging

        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = cm.activeNetwork
        val caps = cm.getNetworkCapabilities(activeNetwork)
        val networkType = when {
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WiFi"
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "Cellular"
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Ethernet"
            else -> "Disconnected"
        }

        val mi = ActivityManager.MemoryInfo()
        val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        am.getMemoryInfo(mi)
        val ramAvailableMb = mi.availMem / (1024 * 1024)
        val ramTotalMb = mi.totalMem / (1024 * 1024)

        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        val isScreenOn = pm.isInteractive

        val telemetryJson = JSONObject().apply {
            put("type", "telemetry")
            put("deviceId", prefs.deviceId)
            put("model", "${Build.MANUFACTURER} ${Build.MODEL}")
            put("batteryLevel", batteryLevel)
            put("isCharging", isCharging)
            put("networkType", networkType)
            put("ramAvailableMb", ramAvailableMb)
            put("ramTotalMb", ramTotalMb)
            put("isScreenOn", isScreenOn)
            put("activeApp", CtrlService.currentAppName.ifEmpty { "Home / System" })
            put("activePackage", CtrlService.currentAppPackage)
            lastLocation?.let {
                put("lat", it.latitude)
                put("lng", it.longitude)
                put("acc", it.accuracy)
            }
            put("ts", System.currentTimeMillis())
        }

        wsClient?.send(telemetryJson.toString())
    }

    private fun sendInstalledApps() {
        scope.launch {
            try {
                val pm = packageManager
                val apps = pm.getInstalledApplications(0)
                val userApps = JSONArray()
                for (app in apps) {
                    // Filter out core system apps if needed, or include user-facing apps
                    if (app.flags and ApplicationInfo.FLAG_SYSTEM == 0 || app.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP != 0) {
                        val label = pm.getApplicationLabel(app).toString()
                        val obj = JSONObject().apply {
                            put("name", label)
                            put("package", app.packageName)
                        }
                        userApps.put(obj)
                    }
                }
                val msg = JSONObject().apply {
                    put("type", "installed_apps")
                    put("deviceId", prefs.deviceId)
                    put("apps", userApps)
                }
                wsClient?.send(msg.toString())
            } catch (e: Exception) {
                Log.e("AgentService", "Error fetching installed apps", e)
            }
        }
    }

    override fun onConnected() {
        Log.d("AgentService", "Connected to Hub")
        // Send immediate telemetry and installed apps inventory
        sendFullTelemetry()
        sendInstalledApps()
        lastLocation?.let { sendLocationPing(it) }
    }

    override fun onDisconnected() {
        Log.d("AgentService", "Disconnected from Hub, scheduling reconnect")
        scope.launch {
            delay(4000)
            connectWebSocket()
        }
    }

    override fun onMessage(text: String) {
        try {
            val json = JSONObject(text)
            val type = json.optString("type")
            val action = json.optString("action")

            if (type == "control" || type.startsWith("control_")) {
                when {
                    action == "touch" || type == "control_touch" -> {
                        val x = json.optDouble("x", 0.0).toFloat()
                        val y = json.optDouble("y", 0.0).toFloat()
                        CtrlService.instance?.injectTap(x, y)
                    }
                    action == "key" || type == "control_key" -> {
                        val code = json.optString("code")
                        CtrlService.instance?.performKey(code)
                    }
                    action == "launch_app" -> {
                        val pkg = json.optString("package")
                        if (pkg.isNotEmpty()) {
                            val launchIntent = packageManager.getLaunchIntentForPackage(pkg)
                            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            launchIntent?.let { startActivity(it) }
                        }
                    }
                    action == "refresh" -> {
                        sendFullTelemetry()
                        sendInstalledApps()
                        lastLocation?.let { sendLocationPing(it) }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("AgentService", "Error handling message", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Agent Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Orvian Agent")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        screenStreamer?.stop()
        locationManager?.removeUpdates(this)
        wsClient?.disconnect()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
