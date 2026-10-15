package com.bikesetup.app.ui.bike

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.repository.BikeRepository
import com.bikesetup.app.data.repository.SettingsRepository
import com.bikesetup.app.data.repository.SetupRepository
import com.bikesetup.app.ui.navigation.BikeDetailRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SetupGroup(
    val locationId: String?,
    val locationName: String?,
    val setups: List<SetupEntity>,
)

data class BikeDetailUiState(
    val isLoading: Boolean = true,
    val bike: BikeEntity? = null,
    val groups: List<SetupGroup> = emptyList(),
    val settings: UserSettings = UserSettings(),
)

@HiltViewModel
class BikeDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val bikeRepository: BikeRepository,
    setupRepository: SetupRepository,
    settingsRepository: SettingsRepository,
) : ViewModel() {
    private val bikeId = savedStateHandle.toRoute<BikeDetailRoute>().bikeId
    private val _isDeleted = MutableStateFlow(false)
    val isDeleted: StateFlow<Boolean> = _isDeleted.asStateFlow()

    val state: StateFlow<BikeDetailUiState> = combine(
        bikeRepository.observe(bikeId),
        setupRepository.observeForBike(bikeId),
        settingsRepository.settings,
    ) { bike, setups, settings ->
        BikeDetailUiState(
            isLoading = false,
            bike = bike,
            groups = setups.groupBy { it.setup.locationId }.map { (locationId, items) ->
                SetupGroup(locationId, items.first().locationName, items.map { it.setup })
            },
            settings = settings,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), BikeDetailUiState())

    fun delete() {
        viewModelScope.launch {
            bikeRepository.delete(bikeId)
            _isDeleted.value = true
        }
    }
}
