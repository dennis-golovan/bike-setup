package com.bikesetup.app.ui.setup

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.LocationEntity
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.TerrainType
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.newId
import com.bikesetup.app.data.model.nowMillis
import com.bikesetup.app.data.repository.BikeRepository
import com.bikesetup.app.data.repository.LocationRepository
import com.bikesetup.app.data.repository.SettingsRepository
import com.bikesetup.app.data.repository.SetupRepository
import com.bikesetup.app.ui.navigation.SetupEditRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class SetupEditUiState(
    val isLoading: Boolean = true,
    val isNew: Boolean = true,
    val bike: BikeEntity? = null,
    val locations: List<LocationEntity> = emptyList(),
    val settings: UserSettings = UserSettings(),
    val form: SetupForm = SetupForm(),
    val prefilledFrom: LocalDate? = null,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
) {
    val shockType: ShockType get() = bike?.shockType ?: ShockType.AIR
    val canSave: Boolean get() = !isLoading && !isSaving && !form.hasErrors
}

@HiltViewModel
class SetupEditViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val setupRepository: SetupRepository,
    private val bikeRepository: BikeRepository,
    private val locationRepository: LocationRepository,
    private val settingsRepository: SettingsRepository,
) : ViewModel() {
    private val route = savedStateHandle.toRoute<SetupEditRoute>()
    private var existing: SetupEntity? = null
    private val _state = MutableStateFlow(SetupEditUiState(isNew = route.setupId == null))
    val state: StateFlow<SetupEditUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch { load() }
        viewModelScope.launch {
            locationRepository.observeAll().collect { locations ->
                _state.update { it.copy(locations = locations) }
            }
        }
    }

    private suspend fun load() {
        val settings = settingsRepository.settings.first()
        val bike = bikeRepository.get(route.bikeId)
        val current = route.setupId?.let { setupRepository.get(it) }
        existing = current
        val template = when {
            current != null -> null
            route.copyFromId != null -> setupRepository.get(route.copyFromId)
            else -> setupRepository.getLatestForBike(route.bikeId)
        }
        val form = current?.toForm(settings) ?: template?.toForm(settings)?.asFreshCopy() ?: SetupForm()
        _state.update {
            it.copy(
                isLoading = false,
                bike = bike,
                settings = settings,
                form = form,
                prefilledFrom = template?.ridingDate,
            )
        }
    }

    fun update(transform: SetupForm.() -> SetupForm) {
        _state.update { it.copy(form = it.form.transform()) }
    }

    fun addLocation(name: String, terrainType: TerrainType) {
        viewModelScope.launch {
            val now = nowMillis()
            val location = LocationEntity(
                id = newId(),
                name = name.trim(),
                terrainType = terrainType,
                latitude = null,
                longitude = null,
                notes = "",
                createdAt = now,
                updatedAt = now,
            )
            locationRepository.save(location)
            update { copy(locationId = location.id) }
        }
    }

    fun save() {
        val current = _state.value
        if (current.canSave) {
            _state.update { it.copy(isSaving = true) }
            viewModelScope.launch {
                val now = nowMillis()
                val base = existing
                setupRepository.save(
                    current.form.toEntity(
                        id = base?.id ?: newId(),
                        bikeId = route.bikeId,
                        shockType = current.shockType,
                        settings = current.settings,
                        createdAt = base?.createdAt ?: now,
                        updatedAt = now,
                    ),
                )
                _state.update { it.copy(isSaving = false, isSaved = true) }
            }
        }
    }
}
