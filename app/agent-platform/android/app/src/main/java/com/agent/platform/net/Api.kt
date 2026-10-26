package com.agent.platform.net

import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class Api(private val baseUrl: String) {
    private val client = OkHttpClient()
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    suspend fun registerDevice(inviteCode: String, deviceId: String, name: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val cleanCode = inviteCode.trim()
            val json = JSONObject().apply {
                put("inviteCode", cleanCode)
                put("inviteToken", cleanCode)
                put("code", cleanCode)
                put("deviceId", deviceId)
                put("androidId", deviceId)
                put("name", name)
                put("model", "${Build.MANUFACTURER} ${Build.MODEL}")
                put("osVersion", "Android ${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT})")
            }

            val rootUrl = baseUrl.trim().trimEnd('/')
            val request = Request.Builder()
                .url("$rootUrl/api/devices/register")
                .post(json.toString().toRequestBody(jsonType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string().orEmpty()
                if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    var errorMsg = "HTTP ${response.code}"
                    try {
                        val errObj = JSONObject(bodyStr)
                        if (errObj.has("error")) {
                            errorMsg = errObj.getString("error")
                        }
                    } catch (_: Exception) {
                        if (bodyStr.isNotEmpty()) errorMsg = bodyStr
                    }
                    Result.failure(Exception(errorMsg))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
