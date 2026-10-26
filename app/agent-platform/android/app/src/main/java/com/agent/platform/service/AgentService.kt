package com.agent.platform.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.agent.platform.control.CtrlService
import com.agent.platform.net.WsClient
import com.agent.platform.screen.ScreenStreamer
import com.agent.platform.store.Prefs
import kotlinx.coroutines.*
import org.json.JSONObject

class AgentService : Service(), WsClient.MessageListener {

    private lateinit var prefs: Prefs
    private var wsClient: WsClient? = null
    private var screenStreamer: ScreenStreamer? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    companion object {
        const val CHANNEL_ID = "agent_foreground_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_RESULT_DATA = "EXTRA_RESULT_DATA"
    }

    override fun onCreate() {
        super.onCreate()
        prefs = Prefs(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        if (action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification("Agent Active — Connected to Hub"))

        // Initialize MediaProjection screen streamer if token data provided
        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED) ?: Activity.RESULT_CANCELED
        val resultData = intent?.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
        if (resultCode == Activity.RESULT_OK && resultData != null) {
            screenStreamer = ScreenStreamer(this, resultCode, resultData)
            screenStreamer?.start()
        }

        connectWebSocket()
        startTelemetryLoop()

        return START_STICKY
    }

    private fun connectWebSocket() {
        if (!prefs.isPaired || prefs.deviceId.isEmpty()) return

        val wsHost = prefs.serverUrl.replace("http://", "ws://").replace("https://", "wss://")
        val wsUrl = "$wsHost/ws?type=device&deviceId=${prefs.deviceId}"

        wsClient?.disconnect()
        wsClient = WsClient(wsUrl, this)
        wsClient?.connect()
    }

    private fun startTelemetryLoop() {
        scope.launch {
            while (isActive) {
                delay(30_000) // 30s heartbeat
                val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val batteryLevel = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

                val telemetryJson = JSONObject().apply {
                    put("type", "telemetry")
                    put("deviceId", prefs.deviceId)
                    put("batteryLevel", batteryLevel)
                }

                wsClient?.send(telemetryJson.toString())
            }
        }
    }

    override fun onConnected() {
        Log.d("AgentService", "Connected to Hub")
    }

    override fun onDisconnected() {
        Log.d("AgentService", "Disconnected from Hub, scheduling reconnect")
        scope.launch {
            delay(5000)
            connectWebSocket()
        }
    }

    override fun onMessage(text: String) {
        try {
            val json = JSONObject(text)
            when (json.optString("type")) {
                "control_touch" -> {
                    val x = json.getDouble("x").toFloat()
                    val y = json.getDouble("y").toFloat()
                    CtrlService.instance?.injectTap(x, y)
                }
                "control_key" -> {
                    val code = json.getString("code")
                    CtrlService.instance?.performKey(code)
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
            .setContentTitle("Agent Platform")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        screenStreamer?.stop()
        wsClient?.disconnect()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
