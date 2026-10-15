package com.bikesetup.app.ui.location

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.db.LocationEntity
import com.bikesetup.app.data.model.TerrainType
import com.bikesetup.app.data.model.formatDecimal
import com.bikesetup.app.data.model.newId
import com.bikesetup.app.data.model.nowMillis
import com.bikesetup.app.data.model.parseDecimal
import com.bikesetup.app.data.repository.LocationRepository
import com.bikesetup.app.ui.navigation.LocationEditRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val COORDINATE_DECIMALS = 6

data class LocationForm(
    val name: String = "",
    val terrainType: TerrainType = TerrainType.TRAIL,
    val latitude: String = "",
    val longitude: String = "",
    val notes: String = "",
) {
    val latitudeValue: Double? get() = parseDecimal(latitude)?.takeIf { it in -90.0..90.0 }
    val longitudeValue: Double? get() = parseDecimal(longitude)?.takeIf { it in -180.0..180.0 }
    val isLatitudeValid: Boolean get() = latitude.isBlank() || latitudeValue != null
    val isLongitudeValid: Boolean get() = longitude.isBlank() || longitudeValue != null
    val hasCoordinates: Boolean get() = latitudeValue != null && longitudeValue != null
    val areCoordinatesValid: Boolean
        get() = (latitude.isBlank() && longitude.isBlank()) || hasCoordinates
}

data class LocationEditUiState(
    val form: LocationForm = LocationForm(),
    val isNew: Boolean = true,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isDone: Boolean = false,
) {
    val canSave: Boolean get() = !isLoading && !isSaving && form.name.isNotBlank() && form.areCoordinatesValid
}

@HiltViewModel
class LocationEditViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val locationRepository: LocationRepository,
) : ViewModel() {
    private val locationId = savedStateHandle.toRoute<LocationEditRoute>().locationId
    private var existing: LocationEntity? = null
    private val _state = MutableStateFlow(LocationEditUiState(isNew = locationId == null, isLoading = locationId != null))
    val state: StateFlow<LocationEditUiState> = _state.asStateFlow()

    init {
        if (locationId != null) {
            viewModelScope.launch {
                val location = locationRepository.get(locationId)
                existing = location
                _state.update { it.copy(isLoading = false, form = location?.toForm() ?: it.form) }
            }
        }
    }

    fun update(transform: LocationForm.() -> LocationForm) {
        _state.update { it.copy(form = it.form.transform()) }
    }

    fun setCoordinates(latitude: Double, longitude: Double) {
        update {
            copy(
                latitude = formatDecimal(latitude, COORDINATE_DECIMALS),
                longitude = formatDecimal(longitude, COORDINATE_DECIMALS),
            )
        }
    }

    fun save() {
        val current = _state.value
        if (current.canSave) {
            _state.update { it.copy(isSaving = true) }
            viewModelScope.launch {
                val now = nowMillis()
                val base = existing
                val form = current.form
                locationRepository.save(
                    LocationEntity(
                        id = base?.id ?: newId(),
                        name = form.name.trim(),
                        terrainType = form.terrainType,
                        latitude = form.latitudeValue,
                        longitude = form.longitudeValue,
                        notes = form.notes.trim(),
                        createdAt = base?.createdAt ?: now,
                        updatedAt = now,
                    ),
                )
                _state.update { it.copy(isSaving = false, isDone = true) }
            }
        }
    }

    fun delete() {
        val id = locationId
        if (id != null) {
            viewModelScope.launch {
                locationRepository.delete(id)
                _state.update { it.copy(isDone = true) }
            }
        }
    }
}

private fun LocationEntity.toForm() = LocationForm(
    name = name,
    terrainType = terrainType,
    latitude = latitude?.let { formatDecimal(it, COORDINATE_DECIMALS) }.orEmpty(),
    longitude = longitude?.let { formatDecimal(it, COORDINATE_DECIMALS) }.orEmpty(),
    notes = notes,
)
