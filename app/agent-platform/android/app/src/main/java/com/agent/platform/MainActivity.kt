package com.agent.platform

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.lifecycle.lifecycleScope
import com.agent.platform.control.CtrlService
import com.agent.platform.net.Api
import com.agent.platform.service.AgentService
import com.agent.platform.store.Prefs
import com.agent.platform.ui.BindScreen
import kotlinx.coroutines.launch
import java.util.UUID

class MainActivity : ComponentActivity() {

    private lateinit var prefs: Prefs
    private val projectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            val serviceIntent = Intent(this, AgentService::class.java).apply {
                action = AgentService.ACTION_START
                putExtra(AgentService.EXTRA_RESULT_CODE, result.resultCode)
                putExtra(AgentService.EXTRA_RESULT_DATA, result.data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
            Toast.makeText(this, "Screen stream service started", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)

        if (prefs.deviceId.isEmpty()) {
            prefs.deviceId = UUID.randomUUID().toString()
        }

        // Deep link extraction (orvian://bind?token=...&host=...)
        val deepLinkToken = intent?.data?.getQueryParameter("token").orEmpty()
        val deepLinkHost = intent?.data?.getQueryParameter("host").orEmpty()
        if (deepLinkHost.isNotEmpty()) {
            prefs.serverUrl = deepLinkHost
        }

        setContent {
            var serverUrl by remember { mutableStateOf(prefs.serverUrl) }
            var inviteCode by remember { mutableStateOf(deepLinkToken) }
            var isPaired by remember { mutableStateOf(prefs.isPaired) }
            var isLoading by remember { mutableStateOf(false) }
            val isAccessibilityEnabled = CtrlService.instance != null

            BindScreen(
                serverUrl = serverUrl,
                onServerUrlChange = {
                    serverUrl = it
                    prefs.serverUrl = it
                },
                inviteCode = inviteCode,
                onInviteCodeChange = { inviteCode = it },
                isPaired = isPaired,
                isAccessibilityEnabled = isAccessibilityEnabled,
                onOpenAccessibilitySettings = {
                    startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                },
                onRequestScreenShare = {
                    val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                    projectionLauncher.launch(mpm.createScreenCaptureIntent())
                },
                onPairClick = {
                    isLoading = true
                    lifecycleScope.launch {
                        val api = Api(serverUrl)
                        val result = api.registerDevice(inviteCode, prefs.deviceId, prefs.deviceName)
                        isLoading = false
                        if (result.isSuccess) {
                            prefs.isPaired = true
                            isPaired = true
                            Toast.makeText(this@MainActivity, "Device paired successfully!", Toast.LENGTH_LONG).show()

                            // Start background AgentService for telemetry & remote control
                            val serviceIntent = Intent(this@MainActivity, AgentService::class.java).apply {
                                action = AgentService.ACTION_START
                            }
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                startForegroundService(serviceIntent)
                            } else {
                                startService(serviceIntent)
                            }

                            // Auto-prompt screen share
                            val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                            projectionLauncher.launch(mpm.createScreenCaptureIntent())
                        } else {
                            Toast.makeText(this@MainActivity, "Pairing error: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                isLoading = isLoading
            )
        }
    }
}
