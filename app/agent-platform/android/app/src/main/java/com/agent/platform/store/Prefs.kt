package com.agent.platform.store

import android.content.Context
import android.content.SharedPreferences

class Prefs(context: Context) {
    private val sp: SharedPreferences = context.getSharedPreferences("agent_prefs", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = sp.getString("server_url", "https://api.orvian.com") ?: "https://api.orvian.com"
        set(value) = sp.edit().putString("server_url", value).apply()

    var deviceId: String
        get() = sp.getString("device_id", "") ?: ""
        set(value) = sp.edit().putString("device_id", value).apply()

    var deviceName: String
        get() = sp.getString("device_name", "Orvian Device") ?: "Orvian Device"
        set(value) = sp.edit().putString("device_name", value).apply()

    var isPaired: Boolean
        get() = sp.getBoolean("is_paired", false)
        set(value) = sp.edit().putBoolean("is_paired", value).apply()

    var token: String
        get() = sp.getString("auth_token", "") ?: ""
        set(value) = sp.edit().putString("auth_token", value).apply()
}
