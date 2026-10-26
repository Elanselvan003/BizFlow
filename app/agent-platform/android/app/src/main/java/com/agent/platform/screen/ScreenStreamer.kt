package com.agent.platform.screen

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream

class ScreenStreamer(
    private val context: Context,
    private val resultCode: Int,
    private val resultData: Intent,
    private val onFrame: (String) -> Unit
) {
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var handlerThread: HandlerThread? = null
    private var isStreaming = false
    private var lastFrameTime = 0L

    fun start() {
        if (isStreaming) return

        try {
            val mpm = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = mpm.getMediaProjection(resultCode, resultData)

            val dm = context.resources.displayMetrics
            // Downscale to 360px wide for silky fast streaming and low bandwidth
            val scale = 360f / dm.widthPixels.coerceAtLeast(1)
            val width = 360
            val height = ((dm.heightPixels * scale).toInt() / 2) * 2 // ensure even number
            val density = (dm.densityDpi * scale).toInt().coerceAtLeast(120)

            handlerThread = HandlerThread("ScreenCapture").apply { start() }
            val handler = Handler(handlerThread!!.looper)

            imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
            imageReader?.setOnImageAvailableListener({ reader ->
                val now = System.currentTimeMillis()
                // Throttle to ~3-4 frames per second to preserve battery & bandwidth
                if (now - lastFrameTime < 280) {
                    val img = reader.acquireLatestImage()
                    img?.close()
                    return@setOnImageAvailableListener
                }
                lastFrameTime = now

                var image: Image? = null
                try {
                    image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener
                    val planes = image.planes
                    val buffer = planes[0].buffer
                    val pixelStride = planes[0].pixelStride
                    val rowStride = planes[0].rowStride
                    val rowPadding = rowStride - pixelStride * width

                    val bitmap = Bitmap.createBitmap(
                        width + rowPadding / pixelStride,
                        height,
                        Bitmap.Config.ARGB_8888
                    )
                    bitmap.copyPixelsFromBuffer(buffer)

                    val croppedBitmap = if (rowPadding > 0) {
                        Bitmap.createBitmap(bitmap, 0, 0, width, height)
                    } else {
                        bitmap
                    }

                    val baos = ByteArrayOutputStream()
                    croppedBitmap.compress(Bitmap.CompressFormat.JPEG, 60, baos)
                    val base64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
                    onFrame("data:image/jpeg;base64,$base64")

                    if (croppedBitmap != bitmap) {
                        croppedBitmap.recycle()
                    }
                    bitmap.recycle()
                } catch (e: Exception) {
                    Log.e("ScreenStreamer", "Error capturing frame", e)
                } finally {
                    image?.close()
                }
            }, handler)

            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "OrvianScreenStream",
                width,
                height,
                density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader?.surface,
                null,
                handler
            )

            isStreaming = true
            Log.d("ScreenStreamer", "MediaProjection streaming started at ${width}x${height}")
        } catch (e: Exception) {
            Log.e("ScreenStreamer", "Failed to start MediaProjection stream", e)
        }
    }

    fun stop() {
        if (!isStreaming) return
        try {
            virtualDisplay?.release()
            virtualDisplay = null
            imageReader?.close()
            imageReader = null
            mediaProjection?.stop()
            mediaProjection = null
            handlerThread?.quitSafely()
            handlerThread = null
            isStreaming = false
            Log.d("ScreenStreamer", "MediaProjection stopped")
        } catch (e: Exception) {
            Log.e("ScreenStreamer", "Error stopping stream", e)
        }
    }
}
