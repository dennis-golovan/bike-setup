package com.bikesetup.app.ui.bike

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.WheelSize
import com.bikesetup.app.data.model.newId
import com.bikesetup.app.data.model.nowMillis
import com.bikesetup.app.data.repository.BikeRepository
import com.bikesetup.app.ui.navigation.BikeEditRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BikeForm(
    val name: String = "",
    val type: BikeType = BikeType.TRAIL,
    val wheelSize: WheelSize = WheelSize.TWENTY_NINE,
    val forkModel: String = "",
    val shockModel: String = "",
    val shockType: ShockType = ShockType.AIR,
    val notes: String = "",
)

data class BikeEditUiState(
    val form: BikeForm = BikeForm(),
    val isNew: Boolean = true,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
) {
    val canSave: Boolean get() = form.name.isNotBlank() && !isSaving
}

@HiltViewModel
class BikeEditViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val bikeRepository: BikeRepository,
) : ViewModel() {
    private val bikeId = savedStateHandle.toRoute<BikeEditRoute>().bikeId
    private var existing: BikeEntity? = null
    private val _state = MutableStateFlow(BikeEditUiState(isNew = bikeId == null, isLoading = bikeId != null))
    val state: StateFlow<BikeEditUiState> = _state.asStateFlow()

    init {
        if (bikeId != null) {
            viewModelScope.launch {
                val bike = bikeRepository.get(bikeId)
                existing = bike
                _state.update { it.copy(isLoading = false, form = bike?.toForm() ?: it.form) }
            }
        }
    }

    fun update(transform: BikeForm.() -> BikeForm) {
        _state.update { it.copy(form = it.form.transform()) }
    }

    fun save() {
        val current = _state.value
        if (current.canSave) {
            _state.update { it.copy(isSaving = true) }
            viewModelScope.launch {
                val now = nowMillis()
                val base = existing
                bikeRepository.save(
                    current.form.toEntity(
                        id = base?.id ?: newId(),
                        createdAt = base?.createdAt ?: now,
                        updatedAt = now,
                    ),
                )
                _state.update { it.copy(isSaving = false, isSaved = true) }
            }
        }
    }
}

private fun BikeEntity.toForm() = BikeForm(
    name = name,
    type = type,
    wheelSize = wheelSize,
    forkModel = forkModel,
    shockModel = shockModel,
    shockType = shockType,
    notes = notes,
)

private fun BikeForm.toEntity(id: String, createdAt: Long, updatedAt: Long) = BikeEntity(
    id = id,
    name = name.trim(),
    type = type,
    wheelSize = wheelSize,
    forkModel = forkModel.trim(),
    shockModel = if (shockType == ShockType.NONE) "" else shockModel.trim(),
    shockType = shockType,
    notes = notes.trim(),
    createdAt = createdAt,
    updatedAt = updatedAt,
)
