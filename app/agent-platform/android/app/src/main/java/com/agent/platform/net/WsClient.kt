package com.agent.platform.net

import android.util.Log
import okhttp3.*
import java.util.concurrent.TimeUnit

class WsClient(
    private val wsUrl: String,
    private val listener: MessageListener
) {
    interface MessageListener {
        fun onConnected()
        fun onDisconnected()
        fun onMessage(text: String)
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isClosedManually = false

    fun connect() {
        isClosedManually = false
        val request = Request.Builder().url(wsUrl).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("WsClient", "WebSocket Connected")
                listener.onConnected()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                listener.onMessage(text)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("WsClient", "WebSocket Closed: $reason")
                listener.onDisconnected()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("WsClient", "WebSocket Error", t)
                listener.onDisconnected()
            }
        })
    }

    fun send(message: String): Boolean {
        return webSocket?.send(message) ?: false
    }

    fun disconnect() {
        isClosedManually = true
        webSocket?.close(1000, "Normal closure")
        webSocket = null
    }
}
