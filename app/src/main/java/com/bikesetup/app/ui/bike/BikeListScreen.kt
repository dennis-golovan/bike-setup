package com.bikesetup.app.ui.bike

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsBike
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.db.BikeWithStats
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.ui.common.formatDate
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.components.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BikeListScreen(
    onAddBike: () -> Unit,
    onOpenBike: (String) -> Unit,
    onOpenLocations: () -> Unit,
    onOpenSettings: () -> Unit,
    viewModel: BikeListViewModel = hiltViewModel(),
) {
    val bikes by viewModel.bikes.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.bike_list_title)) },
                actions = {
                    IconButton(onClick = onOpenLocations) {
                        Icon(Icons.Filled.Place, contentDescription = stringResource(R.string.location_list_title))
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = stringResource(R.string.settings_title))
                    }
                },
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onAddBike,
                icon = { Icon(Icons.Filled.Add, contentDescription = null) },
                text = { Text(stringResource(R.string.bike_add)) },
            )
        },
    ) { padding ->
        val list = bikes
        when {
            list == null -> Unit
            list.isEmpty() -> EmptyState(stringResource(R.string.bike_list_empty), Modifier.padding(padding))
            else -> LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(start = 16.dp, top = 8.dp, end = 16.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(list, key = { it.bike.id }) { item ->
                    BikeCard(item = item, onClick = { onOpenBike(item.bike.id) })
                }
            }
        }
    }
}

@Composable
private fun BikeCard(item: BikeWithStats, onClick: () -> Unit) {
    val bike = item.bike
    ElevatedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Icon(
                Icons.AutoMirrored.Filled.DirectionsBike,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(36.dp),
            )
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(bike.name, style = MaterialTheme.typography.titleMedium)
                Text(
                    stringResource(R.string.dot_separated, stringResource(bike.type.labelRes()), stringResource(bike.wheelSize.labelRes())),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                val components = listOf(bike.forkModel, bike.shockModel.takeIf { bike.shockType != ShockType.NONE }.orEmpty())
                    .filter { it.isNotBlank() }
                if (components.isNotEmpty()) {
                    Text(
                        components.joinToString(" / "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                val lastDate = item.lastRidingDate
                Text(
                    if (item.setupCount == 0 || lastDate == null) {
                        stringResource(R.string.bike_no_setups_yet)
                    } else {
                        stringResource(
                            R.string.dot_separated,
                            pluralStringResource(R.plurals.setup_count, item.setupCount, item.setupCount),
                            stringResource(R.string.bike_last_setup, formatDate(lastDate)),
                        )
                    },
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
        }
    }
}
