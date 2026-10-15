package com.bikesetup.app.ui.bike

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bikesetup.app.data.db.BikeWithStats
import com.bikesetup.app.data.repository.BikeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class BikeListViewModel @Inject constructor(bikeRepository: BikeRepository) : ViewModel() {
    val bikes: StateFlow<List<BikeWithStats>?> = bikeRepository.observeAllWithStats()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
}
