package com.bikesetup.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.Lifecycle
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.bikesetup.app.ui.bike.BikeDetailScreen
import com.bikesetup.app.ui.bike.BikeEditScreen
import com.bikesetup.app.ui.bike.BikeListScreen
import com.bikesetup.app.ui.location.LocationEditScreen
import com.bikesetup.app.ui.location.LocationListScreen
import com.bikesetup.app.ui.settings.SettingsScreen
import com.bikesetup.app.ui.setup.SetupDetailScreen
import com.bikesetup.app.ui.setup.SetupEditScreen

@Composable
fun AppNavHost(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = BikeListRoute) {
        composable<BikeListRoute> {
            BikeListScreen(
                onAddBike = { navController.navigate(BikeEditRoute()) },
                onOpenBike = { navController.navigate(BikeDetailRoute(it)) },
                onOpenLocations = { navController.navigate(LocationListRoute) },
                onOpenSettings = { navController.navigate(SettingsRoute) },
            )
        }
        composable<BikeEditRoute> { entry ->
            BikeEditScreen(onBack = { navController.popFrom(entry) })
        }
        composable<BikeDetailRoute> { entry ->
            val route = entry.toRoute<BikeDetailRoute>()
            BikeDetailScreen(
                onBack = { navController.popFrom(entry) },
                onEditBike = { navController.navigate(BikeEditRoute(route.bikeId)) },
                onAddSetup = { navController.navigate(SetupEditRoute(route.bikeId)) },
                onOpenSetup = { navController.navigate(SetupDetailRoute(it)) },
            )
        }
        composable<SetupDetailRoute> { entry ->
            SetupDetailScreen(
                onBack = { navController.popFrom(entry) },
                onEdit = { bikeId, setupId -> navController.navigate(SetupEditRoute(bikeId, setupId = setupId)) },
                onCopy = { bikeId, setupId -> navController.navigate(SetupEditRoute(bikeId, copyFromId = setupId)) },
            )
        }
        composable<SetupEditRoute> { entry ->
            SetupEditScreen(onBack = { navController.popFrom(entry) })
        }
        composable<LocationListRoute> { entry ->
            LocationListScreen(
                onBack = { navController.popFrom(entry) },
                onAddLocation = { navController.navigate(LocationEditRoute()) },
                onOpenLocation = { navController.navigate(LocationEditRoute(it)) },
            )
        }
        composable<LocationEditRoute> { entry ->
            LocationEditScreen(onBack = { navController.popFrom(entry) })
        }
        composable<SettingsRoute> { entry ->
            SettingsScreen(onBack = { navController.popFrom(entry) })
        }
    }
}

private fun NavHostController.popFrom(entry: NavBackStackEntry) {
    if (entry.lifecycle.currentState == Lifecycle.State.RESUMED) {
        popBackStack()
    }
}
