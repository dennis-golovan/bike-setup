package com.bikesetup.app.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.WeightUnit
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(private val dataStore: DataStore<Preferences>) {
    val settings: Flow<UserSettings> = dataStore.data.map { prefs ->
        val defaults = UserSettings()
        UserSettings(
            suspensionPressureUnit = prefs[SUSPENSION_PRESSURE].toEnum(defaults.suspensionPressureUnit),
            tirePressureUnit = prefs[TIRE_PRESSURE].toEnum(defaults.tirePressureUnit),
            weightUnit = prefs[WEIGHT].toEnum(defaults.weightUnit),
        )
    }

    suspend fun setSuspensionPressureUnit(unit: PressureUnit) {
        dataStore.edit { it[SUSPENSION_PRESSURE] = unit.name }
    }

    suspend fun setTirePressureUnit(unit: PressureUnit) {
        dataStore.edit { it[TIRE_PRESSURE] = unit.name }
    }

    suspend fun setWeightUnit(unit: WeightUnit) {
        dataStore.edit { it[WEIGHT] = unit.name }
    }

    private inline fun <reified T : Enum<T>> String?.toEnum(default: T): T =
        enumValues<T>().firstOrNull { it.name == this } ?: default

    private companion object {
        val SUSPENSION_PRESSURE = stringPreferencesKey("suspension_pressure_unit")
        val TIRE_PRESSURE = stringPreferencesKey("tire_pressure_unit")
        val WEIGHT = stringPreferencesKey("weight_unit")
    }
}
