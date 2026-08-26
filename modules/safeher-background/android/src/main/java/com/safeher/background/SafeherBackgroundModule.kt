package com.safeher.background

import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SafeherBackgroundModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SafeherBackground")

    Events("onBackgroundShake")

    OnCreate {
      // Register listener
      ShakeForegroundService.onShakeDetected = {
        this@SafeherBackgroundModule.sendEvent("onBackgroundShake")
      }
    }

    Function("startService") {
      val context = appContext.reactContext ?: return@Function false
      val serviceIntent = Intent(context, ShakeForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(serviceIntent)
      } else {
        context.startService(serviceIntent)
      }
      true
    }

    Function("stopService") {
      val context = appContext.reactContext ?: return@Function false
      val serviceIntent = Intent(context, ShakeForegroundService::class.java)
      context.stopService(serviceIntent)
      true
    }
  }
}
