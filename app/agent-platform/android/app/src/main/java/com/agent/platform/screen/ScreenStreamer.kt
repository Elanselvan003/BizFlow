package com.agent.platform.screen

import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.util.DisplayMetrics
import android.util.Log

class ScreenStreamer(
    private val context: Context,
    private val resultCode: Int,
    private val resultData: Intent
) {
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var isStreaming = false

    fun start() {
        if (isStreaming) return

        val mpm = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = mpm.getMediaProjection(resultCode, resultData)

        val dm = context.resources.displayMetrics
        val width = dm.widthPixels
        val height = dm.heightPixels
        val density = dm.densityDpi

        // In a full WebRTC integration, WebRTC's ScreenCapturerAndroid connects with mediaProjection.
        // VirtualDisplay or SurfaceTexture feeds into video encoder pipeline.
        Log.d("ScreenStreamer", "MediaProjection initialized: ${width}x${height} @ ${density}dpi")
        isStreaming = true
    }

    fun stop() {
        if (!isStreaming) return
        virtualDisplay?.release()
        virtualDisplay = null
        mediaProjection?.stop()
        mediaProjection = null
        isStreaming = false
        Log.d("ScreenStreamer", "MediaProjection stopped")
    }
}
