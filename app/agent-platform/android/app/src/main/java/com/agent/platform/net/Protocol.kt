package com.agent.platform.net

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class BaseMessage(
    val type: String,
    val deviceId: String? = null
)

@JsonClass(generateAdapter = true)
data class TouchCommand(
    val type: String = "control_touch",
    val deviceId: String,
    val action: String, // "DOWN", "UP", "MOVE"
    val x: Float, // Normalized 0.0 - 1.0
    val y: Float  // Normalized 0.0 - 1.0
)

@JsonClass(generateAdapter = true)
data class KeyCommand(
    val type: String = "control_key",
    val deviceId: String,
    val code: String // "BACK", "HOME", "RECENTS", "POWER"
)

@JsonClass(generateAdapter = true)
data class TelemetryPayload(
    val type: String = "telemetry",
    val deviceId: String,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val batteryLevel: Int = 100,
    val networkType: String = "WIFI"
)

@JsonClass(generateAdapter = true)
data class WebRtcSignal(
    val type: String, // "webrtc_offer", "webrtc_answer", "webrtc_ice"
    val deviceId: String,
    val sdp: Any? = null,
    val candidate: Any? = null
)
