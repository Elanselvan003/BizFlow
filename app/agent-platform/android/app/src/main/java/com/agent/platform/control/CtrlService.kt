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
        var currentAppPackage: String = ""
        var currentAppName: String = ""
        var appChangeListener: ((packageName: String, appName: String) -> Unit)? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d("CtrlService", "Accessibility Control Service bound")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val pkg = event.packageName?.toString() ?: return
            if (pkg != packageName && pkg != currentAppPackage && !pkg.contains("inputmethod")) {
                val label = try {
                    val appInfo = packageManager.getApplicationInfo(pkg, 0)
                    packageManager.getApplicationLabel(appInfo).toString()
                } catch (_: Exception) {
                    pkg
                }
                currentAppPackage = pkg
                currentAppName = label
                Log.d("CtrlService", "Foreground App Changed: $label ($pkg)")
                appChangeListener?.invoke(pkg, label)
            }
        }
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
