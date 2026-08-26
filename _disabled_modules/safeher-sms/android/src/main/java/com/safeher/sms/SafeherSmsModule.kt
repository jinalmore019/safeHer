package com.safeher.sms

import android.telephony.SmsManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SafeherSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SafeherSms")

    AsyncFunction("sendSmsAsync") { phoneNumber: String, message: String ->
      try {
        val smsManager = SmsManager.getDefault()
        val parts = smsManager.divideMessage(message)
        smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
        true
      } catch (e: Exception) {
        throw Exception("Failed to send SMS: " + e.message)
      }
    }
  }
}
