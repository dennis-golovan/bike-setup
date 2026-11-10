package com.bikesetup.app.ui.setup

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.repository.BikeRepository
import com.bikesetup.app.data.repository.SetupRepository
import com.bikesetup.app.ui.navigation.AdviceRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdviceUiState(
    val isLoading: Boolean = true,
    val setup: SetupEntity? = null,
    val bike: BikeEntity? = null,
)

@HiltViewModel
class AdviceViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    setupRepository: SetupRepository,
    bikeRepository: BikeRepository,
) : ViewModel() {
    private val setupId = savedStateHandle.toRoute<AdviceRoute>().setupId
    private val _state = MutableStateFlow(AdviceUiState())
    val state: StateFlow<AdviceUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val setup = setupRepository.get(setupId)
            val bike = setup?.let { bikeRepository.get(it.bikeId) }
            _state.update { AdviceUiState(isLoading = false, setup = setup, bike = bike) }
        }
    }
}
