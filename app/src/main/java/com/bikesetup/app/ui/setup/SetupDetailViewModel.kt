package com.bikesetup.app.ui.setup

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.SetupWithLocation
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.repository.BikeRepository
import com.bikesetup.app.data.repository.SettingsRepository
import com.bikesetup.app.data.repository.SetupRepository
import com.bikesetup.app.ui.navigation.SetupDetailRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SetupDetailUiState(
    val isLoading: Boolean = true,
    val item: SetupWithLocation? = null,
    val bike: BikeEntity? = null,
    val settings: UserSettings = UserSettings(),
)

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class SetupDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val setupRepository: SetupRepository,
    bikeRepository: BikeRepository,
    settingsRepository: SettingsRepository,
) : ViewModel() {
    private val setupId = savedStateHandle.toRoute<SetupDetailRoute>().setupId
    private val _isDeleted = MutableStateFlow(false)
    val isDeleted: StateFlow<Boolean> = _isDeleted.asStateFlow()

    val state: StateFlow<SetupDetailUiState> = setupRepository.observe(setupId)
        .flatMapLatest { item ->
            if (item == null) {
                flowOf(null to null)
            } else {
                bikeRepository.observe(item.setup.bikeId).map { bike -> item to bike }
            }
        }
        .combine(settingsRepository.settings) { (item, bike), settings ->
            SetupDetailUiState(isLoading = false, item = item, bike = bike, settings = settings)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SetupDetailUiState())

    fun delete() {
        viewModelScope.launch {
            setupRepository.delete(setupId)
            _isDeleted.value = true
        }
    }
}
