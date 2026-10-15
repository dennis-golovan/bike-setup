package com.bikesetup.app.ui.location

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.model.TerrainType
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.components.BackButton
import com.bikesetup.app.ui.components.ConfirmDeleteDialog
import com.bikesetup.app.ui.components.DecimalField
import com.bikesetup.app.ui.components.DropdownField
import com.bikesetup.app.ui.components.TextInput
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LocationEditScreen(onBack: () -> Unit, viewModel: LocationEditViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var isLocating by remember { mutableStateOf(false) }
    var confirmDelete by rememberSaveable { mutableStateOf(false) }
    val locationFailedText = stringResource(R.string.location_fetch_failed)
    val permissionDeniedText = stringResource(R.string.location_permission_denied)
    val noMapsText = stringResource(R.string.location_no_maps_app)
    val showMessage: (String) -> Unit = { message -> scope.launch { snackbarHostState.showSnackbar(message) } }
    val fetchLocation: () -> Unit = {
        isLocating = true
        requestCurrentLocation(context) { location ->
            isLocating = false
            if (location != null) {
                viewModel.setCoordinates(location.latitude, location.longitude)
            } else {
                showMessage(locationFailedText)
            }
        }
    }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        if (grants.values.any { it }) fetchLocation() else showMessage(permissionDeniedText)
    }
    LaunchedEffect(state.isDone) {
        if (state.isDone) onBack()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(if (state.isNew) R.string.location_new_title else R.string.location_edit_title)) },
                navigationIcon = { BackButton(onBack) },
                actions = {
                    if (!state.isNew) {
                        IconButton(onClick = { confirmDelete = true }) {
                            Icon(Icons.Filled.Delete, contentDescription = stringResource(R.string.action_delete))
                        }
                    }
                    TextButton(onClick = viewModel::save, enabled = state.canSave) {
                        Text(stringResource(R.string.action_save))
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        if (!state.isLoading) {
            val form = state.form
            Column(
                modifier = Modifier
                    .padding(padding)
                    .consumeWindowInsets(padding)
                    .fillMaxSize()
                    .imePadding()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                TextInput(
                    value = form.name,
                    onValueChange = { v -> viewModel.update { copy(name = v) } },
                    label = stringResource(R.string.location_name),
                    placeholder = stringResource(R.string.location_name_hint),
                )
                DropdownField(
                    label = stringResource(R.string.location_terrain),
                    options = TerrainType.entries,
                    selected = form.terrainType,
                    optionLabel = { stringResource(it.labelRes()) },
                    onSelect = { v -> viewModel.update { copy(terrainType = v) } },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    DecimalField(
                        value = form.latitude,
                        onValueChange = { v -> viewModel.update { copy(latitude = v) } },
                        label = stringResource(R.string.location_latitude),
                        allowNegative = true,
                        modifier = Modifier.weight(1f),
                    )
                    DecimalField(
                        value = form.longitude,
                        onValueChange = { v -> viewModel.update { copy(longitude = v) } },
                        label = stringResource(R.string.location_longitude),
                        allowNegative = true,
                        modifier = Modifier.weight(1f),
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = { if (hasLocationPermission(context)) fetchLocation() else permissionLauncher.launch(LOCATION_PERMISSIONS) },
                        enabled = !isLocating,
                        modifier = Modifier.weight(1f),
                    ) {
                        if (isLocating) {
                            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Filled.MyLocation, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
                        Text(stringResource(R.string.location_use_current), modifier = Modifier.padding(start = 8.dp))
                    }
                    val latitude = form.latitudeValue
                    val longitude = form.longitudeValue
                    OutlinedButton(
                        onClick = {
                            if (latitude != null && longitude != null && !openInMaps(context, latitude, longitude, form.name)) {
                                showMessage(noMapsText)
                            }
                        },
                        enabled = form.hasCoordinates,
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Filled.Map, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text(stringResource(R.string.location_open_map), modifier = Modifier.padding(start = 8.dp))
                    }
                }
                TextInput(
                    value = form.notes,
                    onValueChange = { v -> viewModel.update { copy(notes = v) } },
                    label = stringResource(R.string.field_notes),
                    placeholder = stringResource(R.string.location_notes_hint),
                    singleLine = false,
                    minLines = 3,
                )
            }
        }
    }
    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = stringResource(R.string.location_delete_title),
            text = stringResource(R.string.location_delete_text),
            onConfirm = viewModel::delete,
            onDismiss = { confirmDelete = false },
        )
    }
}
