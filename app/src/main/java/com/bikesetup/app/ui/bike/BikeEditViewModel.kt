package com.bikesetup.app.ui.bike

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.catalog.Catalog
import com.bikesetup.app.data.catalog.CatalogDamper
import com.bikesetup.app.data.catalog.CatalogRepository
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.CatalogRefEntity
import com.bikesetup.app.data.db.SuspensionSpec
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
    val forkSpec: SpecForm = SpecForm(),
    val shockSpec: SpecForm = SpecForm(),
    val forkCatalog: CatalogRefEntity? = null,
    val shockCatalog: CatalogRefEntity? = null,
    val forkChart: List<ChartRowForm> = emptyList(),
    val shockChart: List<ChartRowForm> = emptyList(),
) {
    val isValid: Boolean get() = name.isNotBlank() && forkSpec.isValid && (shockType == ShockType.NONE || shockSpec.isValid)
}

data class BikeEditUiState(
    val form: BikeForm = BikeForm(),
    val isNew: Boolean = true,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
) {
    val canSave: Boolean get() = form.isValid && !isSaving
}

@HiltViewModel
class BikeEditViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val bikeRepository: BikeRepository,
    catalogRepository: CatalogRepository,
) : ViewModel() {
    val catalog: Catalog by lazy { catalogRepository.catalog }
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

    fun selectCatalog(end: SuspensionEnd, ref: CatalogRefEntity?, damper: CatalogDamper?) {
        update {
            when (end) {
                SuspensionEnd.FORK -> copy(forkCatalog = ref, forkSpec = damper?.let(forkSpec::withDamper) ?: forkSpec)
                SuspensionEnd.SHOCK -> copy(shockCatalog = ref, shockSpec = damper?.let(shockSpec::withDamper) ?: shockSpec)
            }
        }
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
    forkSpec = forkSpec.toForm(),
    shockSpec = shockSpec.toForm(),
    forkCatalog = forkCatalog,
    shockCatalog = shockCatalog,
    forkChart = forkChart.toChartForm(),
    shockChart = shockChart.toChartForm(),
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
    forkSpec = forkSpec.toSpec(),
    shockSpec = if (shockType == ShockType.NONE) SuspensionSpec() else shockSpec.toSpec(),
    forkCatalog = forkCatalog,
    shockCatalog = shockCatalog.takeIf { shockType != ShockType.NONE },
    forkChart = forkChart.toChart(),
    shockChart = if (shockType == ShockType.NONE) emptyList() else shockChart.toChart(),
)
