package com.bikesetup.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.WeightUnit
import com.bikesetup.app.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(private val settingsRepository: SettingsRepository) : ViewModel() {
    val settings: StateFlow<UserSettings?> = settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    fun setSuspensionPressureUnit(unit: PressureUnit) {
        viewModelScope.launch { settingsRepository.setSuspensionPressureUnit(unit) }
    }

    fun setTirePressureUnit(unit: PressureUnit) {
        viewModelScope.launch { settingsRepository.setTirePressureUnit(unit) }
    }

    fun setWeightUnit(unit: WeightUnit) {
        viewModelScope.launch { settingsRepository.setWeightUnit(unit) }
    }
}
