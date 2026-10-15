package com.bikesetup.app.ui.common

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import androidx.annotation.StringRes
import com.bikesetup.app.R
import java.util.Locale

enum class AppLanguage(val tag: String?, @StringRes val labelRes: Int) {
    AUTO(null, R.string.language_auto),
    UK("uk", R.string.language_uk),
    EN("en", R.string.language_en),
    DE("de", R.string.language_de),
}

private const val PREFS_NAME = "app_language"
private const val KEY_LANGUAGE = "language"
private val UKRAINIAN_FALLBACK = setOf("uk", "ru", "be")

fun Context.appLanguage(): AppLanguage {
    val stored = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_LANGUAGE, null)
    return AppLanguage.entries.firstOrNull { it.name == stored } ?: AppLanguage.AUTO
}

fun Context.saveAppLanguage(language: AppLanguage) {
    getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putString(KEY_LANGUAGE, language.name).apply()
}

fun detectLanguage(deviceLanguages: List<String>): AppLanguage {
    val match = deviceLanguages.firstOrNull { it == "de" || it == "en" || it in UKRAINIAN_FALLBACK }
    return when (match) {
        "de" -> AppLanguage.DE
        "en", null -> AppLanguage.EN
        else -> AppLanguage.UK
    }
}

fun resolveLanguage(language: AppLanguage, deviceLanguages: List<String>): AppLanguage =
    if (language == AppLanguage.AUTO) detectLanguage(deviceLanguages) else language

fun Context.withAppLocale(): Context {
    val systemLocales = Resources.getSystem().configuration.locales
    val deviceLanguages = (0 until systemLocales.size()).map { systemLocales[it].language }
    val locale = Locale.forLanguageTag(resolveLanguage(appLanguage(), deviceLanguages).tag.orEmpty())
    val config = Configuration(resources.configuration).apply { setLocale(locale) }
    return createConfigurationContext(config)
}
