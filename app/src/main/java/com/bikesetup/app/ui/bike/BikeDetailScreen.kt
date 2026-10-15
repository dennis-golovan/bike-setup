package com.bikesetup.app.ui.bike

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.components.BackButton
import com.bikesetup.app.ui.components.ConfirmDeleteDialog
import com.bikesetup.app.ui.components.EmptyState
import com.bikesetup.app.ui.components.SectionCard
import com.bikesetup.app.ui.components.ValueRow
import com.bikesetup.app.ui.setup.SetupCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BikeDetailScreen(
    onBack: () -> Unit,
    onEditBike: () -> Unit,
    onAddSetup: () -> Unit,
    onOpenSetup: (String) -> Unit,
    viewModel: BikeDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isDeleted by viewModel.isDeleted.collectAsStateWithLifecycle()
    var confirmDelete by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(isDeleted, state.isLoading, state.bike) {
        if (isDeleted || (!state.isLoading && state.bike == null)) onBack()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.bike?.name.orEmpty(), maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = { BackButton(onBack) },
                actions = {
                    IconButton(onClick = onEditBike) {
                        Icon(Icons.Filled.Edit, contentDescription = stringResource(R.string.action_edit))
                    }
                    IconButton(onClick = { confirmDelete = true }) {
                        Icon(Icons.Filled.Delete, contentDescription = stringResource(R.string.action_delete))
                    }
                },
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onAddSetup,
                icon = { Icon(Icons.Filled.Add, contentDescription = null) },
                text = { Text(stringResource(R.string.setup_add)) },
            )
        },
    ) { padding ->
        val bike = state.bike
        if (bike != null) {
            LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(start = 16.dp, top = 8.dp, end = 16.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item(key = "bike") { BikeInfoCard(bike) }
                if (state.groups.isEmpty()) {
                    item(key = "empty") { EmptyState(stringResource(R.string.setup_list_empty)) }
                }
                state.groups.forEach { group ->
                    item(key = "group-${group.locationId}") {
                        SetupGroupSection(group, bike, state.settings, onOpenSetup)
                    }
                }
            }
        }
    }
    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = stringResource(R.string.bike_delete_title),
            text = stringResource(R.string.bike_delete_text),
            onConfirm = viewModel::delete,
            onDismiss = { confirmDelete = false },
        )
    }
}

@Composable
private fun BikeInfoCard(bike: BikeEntity) {
    SectionCard(title = stringResource(R.string.bike_info_title)) {
        ValueRow(stringResource(R.string.bike_type), stringResource(bike.type.labelRes()))
        ValueRow(stringResource(R.string.bike_wheel_size), stringResource(bike.wheelSize.labelRes()))
        if (bike.forkModel.isNotBlank()) {
            ValueRow(stringResource(R.string.bike_fork_model), bike.forkModel)
        }
        ValueRow(stringResource(R.string.bike_shock_type), stringResource(bike.shockType.labelRes()))
        if (bike.shockType != ShockType.NONE && bike.shockModel.isNotBlank()) {
            ValueRow(stringResource(R.string.bike_shock_model), bike.shockModel)
        }
        if (bike.notes.isNotBlank()) {
            Text(bike.notes, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun SetupGroupSection(
    group: SetupGroup,
    bike: BikeEntity,
    settings: UserSettings,
    onOpenSetup: (String) -> Unit,
) {
    var showHistory by rememberSaveable(group.locationId) { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(top = 8.dp),
        ) {
            Icon(Icons.Filled.Place, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
            Text(
                group.locationName ?: stringResource(R.string.setup_base_group),
                style = MaterialTheme.typography.titleMedium,
            )
        }
        val latest = group.setups.first()
        SetupCard(latest, bike.shockType, settings, isCurrent = true, onClick = { onOpenSetup(latest.id) })
        val history = group.setups.drop(1)
        if (history.isNotEmpty()) {
            TextButton(onClick = { showHistory = !showHistory }) {
                Icon(if (showHistory) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore, contentDescription = null)
                Text(stringResource(R.string.setup_history, history.size))
            }
            if (showHistory) {
                history.forEach { setup ->
                    SetupCard(setup, bike.shockType, settings, isCurrent = false, onClick = { onOpenSetup(setup.id) })
                }
            }
        }
    }
}
