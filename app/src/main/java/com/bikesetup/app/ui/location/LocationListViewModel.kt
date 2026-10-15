package com.bikesetup.app.ui.location

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bikesetup.app.data.db.LocationWithStats
import com.bikesetup.app.data.repository.LocationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class LocationListViewModel @Inject constructor(locationRepository: LocationRepository) : ViewModel() {
    val locations: StateFlow<List<LocationWithStats>?> = locationRepository.observeAllWithStats()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
}
