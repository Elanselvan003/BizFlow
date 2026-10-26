package com.agent.platform.control

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.DisplayMetrics
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class CtrlService : AccessibilityService() {

    companion object {
        var instance: CtrlService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d("CtrlService", "Accessibility Control Service bound")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Monitor window state transitions if needed
    }

    override fun onInterrupt() {
        Log.d("CtrlService", "Accessibility Control Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Injects a tap gesture using normalized 0.0 - 1.0 screen coordinates
     */
    fun injectTap(normX: Float, normY: Float) {
        val dm: DisplayMetrics = resources.displayMetrics
        val x = normX * dm.widthPixels
        val y = normY * dm.heightPixels

        val path = Path().apply {
            moveTo(x, y)
        }

        val stroke = GestureDescription.StrokeDescription(path, 0, 50)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                Log.d("CtrlService", "Tap dispatched at ($x, $y)")
            }
        }, null)
    }

    /**
     * Executes global navigation keys (Back, Home, Recents)
     */
    fun performKey(code: String) {
        when (code.uppercase()) {
            "BACK" -> performGlobalAction(GLOBAL_ACTION_BACK)
            "HOME" -> performGlobalAction(GLOBAL_ACTION_HOME)
            "RECENTS" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
            "NOTIFICATIONS" -> performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
        }
    }
}
