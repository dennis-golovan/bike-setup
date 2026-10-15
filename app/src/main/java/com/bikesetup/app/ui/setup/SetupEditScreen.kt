package com.bikesetup.app.ui.setup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.db.LocationEntity
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.TerrainType
import com.bikesetup.app.data.model.Weather
import com.bikesetup.app.ui.common.formatDate
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.components.BackButton
import com.bikesetup.app.ui.components.DateField
import com.bikesetup.app.ui.components.DecimalField
import com.bikesetup.app.ui.components.DropdownField
import com.bikesetup.app.ui.components.SectionCard
import com.bikesetup.app.ui.components.StepperField
import com.bikesetup.app.ui.components.TextInput

private typealias FormUpdate = (SetupForm.() -> SetupForm) -> Unit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SetupEditScreen(onBack: () -> Unit, viewModel: SetupEditViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showAddLocation by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(state.isSaved) {
        if (state.isSaved) onBack()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(if (state.isNew) R.string.setup_new_title else R.string.setup_edit_title)) },
                navigationIcon = { BackButton(onBack) },
                actions = {
                    TextButton(onClick = viewModel::save, enabled = state.canSave) {
                        Text(stringResource(R.string.action_save))
                    }
                },
            )
        },
    ) { padding ->
        if (!state.isLoading) {
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
                state.prefilledFrom?.let {
                    Text(
                        stringResource(R.string.setup_prefilled_from, formatDate(it)),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                }
                GeneralSection(state, viewModel::update, onAddLocation = { showAddLocation = true })
                ForkSection(state.form, state, viewModel::update)
                if (state.shockType != ShockType.NONE) {
                    ShockSection(state.form, state, viewModel::update)
                }
                TireSection(state.form, state, viewModel::update)
                SectionCard(title = stringResource(R.string.field_notes)) {
                    TextInput(
                        value = state.form.notes,
                        onValueChange = { v -> viewModel.update { copy(notes = v) } },
                        label = stringResource(R.string.field_notes),
                        placeholder = stringResource(R.string.setup_notes_hint),
                        singleLine = false,
                        minLines = 3,
                    )
                }
            }
        }
    }
    if (showAddLocation) {
        AddLocationDialog(
            onConfirm = { name, terrain ->
                viewModel.addLocation(name, terrain)
                showAddLocation = false
            },
            onDismiss = { showAddLocation = false },
        )
    }
}

@Composable
private fun GeneralSection(state: SetupEditUiState, onUpdate: FormUpdate, onAddLocation: () -> Unit) {
    val form = state.form
    val weightUnit = stringResource(state.settings.weightUnit.labelRes())
    SectionCard(title = stringResource(R.string.section_general)) {
        val options: List<LocationEntity?> = listOf<LocationEntity?>(null) + state.locations
        DropdownField(
            label = stringResource(R.string.field_location),
            options = options,
            selected = state.locations.firstOrNull { it.id == form.locationId },
            optionLabel = { it?.name ?: stringResource(R.string.setup_no_location) },
            onSelect = { location -> onUpdate { copy(locationId = location?.id) } },
            modifier = Modifier.fillMaxWidth(),
            extraItem = { close ->
                DropdownMenuItem(
                    text = { Text(stringResource(R.string.location_add_inline)) },
                    leadingIcon = { Icon(Icons.Filled.Add, contentDescription = null) },
                    onClick = {
                        close()
                        onAddLocation()
                    },
                )
            },
        )
        DateField(
            date = form.ridingDate,
            onDateChange = { d -> onUpdate { copy(ridingDate = d) } },
            label = stringResource(R.string.field_date),
            modifier = Modifier.fillMaxWidth(),
        )
        DropdownField(
            label = stringResource(R.string.field_weather),
            options = listOf<Weather?>(null) + Weather.entries,
            selected = form.weather,
            optionLabel = { it?.let { w -> stringResource(w.labelRes()) } ?: stringResource(R.string.value_not_set) },
            onSelect = { w -> onUpdate { copy(weather = w) } },
            modifier = Modifier.fillMaxWidth(),
        )
        FieldRow {
            DecimalField(
                value = form.temperature,
                onValueChange = { v -> onUpdate { copy(temperature = v) } },
                label = stringResource(R.string.field_temperature),
                suffix = stringResource(R.string.unit_celsius),
                allowNegative = true,
                modifier = Modifier.weight(1f),
            )
            DecimalField(
                value = form.riderWeight,
                onValueChange = { v -> onUpdate { copy(riderWeight = v) } },
                label = stringResource(R.string.field_rider_weight_short),
                suffix = weightUnit,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun ForkSection(form: SetupForm, state: SetupEditUiState, onUpdate: FormUpdate) {
    SectionCard(title = stringResource(R.string.section_fork), subtitle = stringResource(R.string.clicks_hint)) {
        FieldRow {
            DecimalField(
                value = form.forkPressure,
                onValueChange = { v -> onUpdate { copy(forkPressure = v) } },
                label = stringResource(R.string.field_pressure),
                suffix = stringResource(state.settings.suspensionPressureUnit.labelRes()),
                modifier = Modifier.weight(1f),
            )
            DecimalField(
                value = form.forkSag,
                onValueChange = { v -> onUpdate { copy(forkSag = v) } },
                label = stringResource(R.string.field_sag),
                suffix = stringResource(R.string.unit_percent),
                modifier = Modifier.weight(1f),
            )
        }
        FieldRow {
            StepperField(form.forkTokens, { v -> onUpdate { copy(forkTokens = v) } }, stringResource(R.string.field_tokens), Modifier.weight(1f))
            StepperField(form.forkRebound, { v -> onUpdate { copy(forkRebound = v) } }, stringResource(R.string.field_rebound), Modifier.weight(1f))
        }
        FieldRow {
            StepperField(form.forkLsc, { v -> onUpdate { copy(forkLsc = v) } }, stringResource(R.string.field_lsc), Modifier.weight(1f))
            StepperField(form.forkHsc, { v -> onUpdate { copy(forkHsc = v) } }, stringResource(R.string.field_hsc), Modifier.weight(1f))
        }
    }
}

@Composable
private fun ShockSection(form: SetupForm, state: SetupEditUiState, onUpdate: FormUpdate) {
    val isAir = state.shockType == ShockType.AIR
    SectionCard(title = stringResource(R.string.section_shock), subtitle = stringResource(R.string.clicks_hint)) {
        FieldRow {
            if (isAir) {
                DecimalField(
                    value = form.shockPressure,
                    onValueChange = { v -> onUpdate { copy(shockPressure = v) } },
                    label = stringResource(R.string.field_pressure),
                    suffix = stringResource(state.settings.suspensionPressureUnit.labelRes()),
                    modifier = Modifier.weight(1f),
                )
            } else {
                DecimalField(
                    value = form.shockSpringRate,
                    onValueChange = { v -> onUpdate { copy(shockSpringRate = v) } },
                    label = stringResource(R.string.field_spring_rate),
                    suffix = stringResource(R.string.unit_lbs_in),
                    integerOnly = true,
                    modifier = Modifier.weight(1f),
                )
            }
            DecimalField(
                value = form.shockSag,
                onValueChange = { v -> onUpdate { copy(shockSag = v) } },
                label = stringResource(R.string.field_sag),
                suffix = stringResource(R.string.unit_percent),
                modifier = Modifier.weight(1f),
            )
        }
        FieldRow {
            if (isAir) {
                StepperField(form.shockTokens, { v -> onUpdate { copy(shockTokens = v) } }, stringResource(R.string.field_tokens), Modifier.weight(1f))
            }
            StepperField(form.shockRebound, { v -> onUpdate { copy(shockRebound = v) } }, stringResource(R.string.field_rebound), Modifier.weight(1f))
        }
        FieldRow {
            StepperField(form.shockLsc, { v -> onUpdate { copy(shockLsc = v) } }, stringResource(R.string.field_lsc), Modifier.weight(1f))
            StepperField(form.shockHsc, { v -> onUpdate { copy(shockHsc = v) } }, stringResource(R.string.field_hsc), Modifier.weight(1f))
        }
    }
}

@Composable
private fun TireSection(form: SetupForm, state: SetupEditUiState, onUpdate: FormUpdate) {
    val unit = stringResource(state.settings.tirePressureUnit.labelRes())
    SectionCard(title = stringResource(R.string.section_tires)) {
        FieldRow {
            DecimalField(
                value = form.frontTirePressure,
                onValueChange = { v -> onUpdate { copy(frontTirePressure = v) } },
                label = stringResource(R.string.field_front_pressure_short),
                suffix = unit,
                modifier = Modifier.weight(1f),
            )
            DecimalField(
                value = form.rearTirePressure,
                onValueChange = { v -> onUpdate { copy(rearTirePressure = v) } },
                label = stringResource(R.string.field_rear_pressure_short),
                suffix = unit,
                modifier = Modifier.weight(1f),
            )
        }
        TextInput(
            value = form.frontTireModel,
            onValueChange = { v -> onUpdate { copy(frontTireModel = v) } },
            label = stringResource(R.string.field_front_tire),
            placeholder = stringResource(R.string.tire_model_hint),
        )
        TextInput(
            value = form.rearTireModel,
            onValueChange = { v -> onUpdate { copy(rearTireModel = v) } },
            label = stringResource(R.string.field_rear_tire),
            placeholder = stringResource(R.string.tire_model_hint),
        )
        FieldRow {
            TextInput(
                value = form.frontInsert,
                onValueChange = { v -> onUpdate { copy(frontInsert = v) } },
                label = stringResource(R.string.field_front_insert),
                modifier = Modifier.weight(1f),
            )
            TextInput(
                value = form.rearInsert,
                onValueChange = { v -> onUpdate { copy(rearInsert = v) } },
                label = stringResource(R.string.field_rear_insert),
                modifier = Modifier.weight(1f),
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.field_tubeless), modifier = Modifier.weight(1f))
            Switch(checked = form.tubeless, onCheckedChange = { v -> onUpdate { copy(tubeless = v) } })
        }
    }
}

@Composable
private fun FieldRow(content: @Composable RowScope.() -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth(), content = content)
}

@Composable
private fun AddLocationDialog(onConfirm: (String, TerrainType) -> Unit, onDismiss: () -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var terrain by rememberSaveable { mutableStateOf(TerrainType.TRAIL) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.location_new_title)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                TextInput(value = name, onValueChange = { name = it }, label = stringResource(R.string.location_name))
                DropdownField(
                    label = stringResource(R.string.location_terrain),
                    options = TerrainType.entries,
                    selected = terrain,
                    optionLabel = { stringResource(it.labelRes()) },
                    onSelect = { terrain = it },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(name, terrain) }, enabled = name.isNotBlank()) {
                Text(stringResource(R.string.action_add))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) }
        },
    )
}
