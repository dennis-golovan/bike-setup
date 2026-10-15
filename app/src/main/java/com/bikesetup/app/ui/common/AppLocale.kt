package com.bikesetup.app.ui.common

import android.content.Context
import android.content.res.Configuration
import java.util.Locale

val APP_LOCALE: Locale = Locale.forLanguageTag("uk-UA")

fun Context.withAppLocale(): Context {
    val config = Configuration(resources.configuration).apply { setLocale(APP_LOCALE) }
    return createConfigurationContext(config)
}
