package com.bikesetup.app.ui.navigation

import kotlinx.serialization.Serializable

@Serializable
data object BikeListRoute

@Serializable
data class BikeEditRoute(val bikeId: String? = null)

@Serializable
data class BikeDetailRoute(val bikeId: String)

@Serializable
data class SetupDetailRoute(val setupId: String)

@Serializable
data class SetupEditRoute(
    val bikeId: String,
    val setupId: String? = null,
    val copyFromId: String? = null,
)

@Serializable
data object LocationListRoute

@Serializable
data class LocationEditRoute(val locationId: String? = null)

@Serializable
data object SettingsRoute
