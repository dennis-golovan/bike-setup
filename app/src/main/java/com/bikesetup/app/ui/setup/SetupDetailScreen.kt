package com.bikesetup.app.ui.setup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.SetupWithLocation
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.ui.common.formatDate
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.common.percentValue
import com.bikesetup.app.ui.common.pressureValue
import com.bikesetup.app.ui.common.temperatureValue
import com.bikesetup.app.ui.common.weightValue
import com.bikesetup.app.ui.components.BackButton
import com.bikesetup.app.ui.components.ConfirmDeleteDialog
import com.bikesetup.app.ui.components.SectionCard
import com.bikesetup.app.ui.components.ValueRow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SetupDetailScreen(
    onBack: () -> Unit,
    onEdit: (bikeId: String, setupId: String) -> Unit,
    onCopy: (bikeId: String, setupId: String) -> Unit,
    viewModel: SetupDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isDeleted by viewModel.isDeleted.collectAsStateWithLifecycle()
    var confirmDelete by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(isDeleted, state.isLoading, state.item) {
        if (isDeleted || (!state.isLoading && state.item == null)) onBack()
    }
    val item = state.item
    val bike = state.bike
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(bike?.name.orEmpty(), maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (item != null) {
                            Text(
                                item.locationName ?: stringResource(R.string.setup_base_group),
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                },
                navigationIcon = { BackButton(onBack) },
                actions = {
                    if (item != null) {
                        IconButton(onClick = { onCopy(item.setup.bikeId, item.setup.id) }) {
                            Icon(Icons.Filled.ContentCopy, contentDescription = stringResource(R.string.setup_copy))
                        }
                        IconButton(onClick = { onEdit(item.setup.bikeId, item.setup.id) }) {
                            Icon(Icons.Filled.Edit, contentDescription = stringResource(R.string.action_edit))
                        }
                        IconButton(onClick = { confirmDelete = true }) {
                            Icon(Icons.Filled.Delete, contentDescription = stringResource(R.string.action_delete))
                        }
                    }
                },
            )
        },
    ) { padding ->
        if (item != null && bike != null) {
            SetupDetailContent(item, bike, state.settings, Modifier.padding(padding))
        }
    }
    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = stringResource(R.string.setup_delete_title),
            text = stringResource(R.string.setup_delete_text),
            onConfirm = viewModel::delete,
            onDismiss = { confirmDelete = false },
        )
    }
}

@Composable
private fun SetupDetailContent(item: SetupWithLocation, bike: BikeEntity, settings: UserSettings, modifier: Modifier) {
    val setup = item.setup
    val suspensionUnit = settings.suspensionPressureUnit
    Column(
        modifier = modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        DetailSection(
            title = stringResource(R.string.section_general),
            rows = listOfNotNull(
                stringResource(R.string.field_location) to (item.locationName ?: stringResource(R.string.setup_no_location)),
                stringResource(R.string.field_date) to formatDate(setup.ridingDate),
                setup.weather?.let { stringResource(R.string.field_weather) to stringResource(it.labelRes()) },
                setup.temperatureC?.let { stringResource(R.string.field_temperature) to temperatureValue(it) },
                setup.riderWeightKg?.let { stringResource(R.string.field_rider_weight) to weightValue(it, settings.weightUnit) },
            ),
        )
        DetailSection(
            title = stringResource(R.string.section_fork),
            rows = listOfNotNull(
                setup.fork.pressureBar?.let { stringResource(R.string.field_pressure) to pressureValue(it, suspensionUnit) },
                setup.fork.sagPercent?.let { stringResource(R.string.field_sag) to percentValue(it) },
                setup.fork.tokens?.let { stringResource(R.string.field_tokens) to it.toString() },
                setup.fork.rebound?.let { stringResource(R.string.field_rebound) to it.toString() },
                setup.fork.lsc?.let { stringResource(R.string.field_lsc) to it.toString() },
                setup.fork.hsc?.let { stringResource(R.string.field_hsc) to it.toString() },
            ),
        )
        if (bike.shockType != ShockType.NONE) {
            val isAir = bike.shockType == ShockType.AIR
            DetailSection(
                title = stringResource(R.string.section_shock),
                rows = listOfNotNull(
                    setup.shock.pressureBar?.takeIf { isAir }?.let { stringResource(R.string.field_pressure) to pressureValue(it, suspensionUnit) },
                    setup.shock.springRateLbs?.takeIf { !isAir }?.let { stringResource(R.string.field_spring_rate) to stringResource(R.string.value_spring_rate, it) },
                    setup.shock.sagPercent?.let { stringResource(R.string.field_sag) to percentValue(it) },
                    setup.shock.tokens?.takeIf { isAir }?.let { stringResource(R.string.field_tokens) to it.toString() },
                    setup.shock.rebound?.let { stringResource(R.string.field_rebound) to it.toString() },
                    setup.shock.lsc?.let { stringResource(R.string.field_lsc) to it.toString() },
                    setup.shock.hsc?.let { stringResource(R.string.field_hsc) to it.toString() },
                ),
            )
        }
        val tires = setup.tires
        DetailSection(
            title = stringResource(R.string.section_tires),
            rows = listOfNotNull(
                tires.frontPressureBar?.let { stringResource(R.string.field_front_pressure) to pressureValue(it, settings.tirePressureUnit) },
                tires.rearPressureBar?.let { stringResource(R.string.field_rear_pressure) to pressureValue(it, settings.tirePressureUnit) },
                tires.frontModel.takeIf { it.isNotBlank() }?.let { stringResource(R.string.field_front_tire) to it },
                tires.rearModel.takeIf { it.isNotBlank() }?.let { stringResource(R.string.field_rear_tire) to it },
                tires.frontInsert.takeIf { it.isNotBlank() }?.let { stringResource(R.string.field_front_insert) to it },
                tires.rearInsert.takeIf { it.isNotBlank() }?.let { stringResource(R.string.field_rear_insert) to it },
                stringResource(R.string.field_tubeless) to stringResource(if (tires.tubeless) R.string.yes else R.string.no),
            ),
        )
        if (setup.notes.isNotBlank()) {
            SectionCard(title = stringResource(R.string.field_notes)) {
                Text(setup.notes, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun DetailSection(title: String, rows: List<Pair<String, String>>) {
    SectionCard(title = title) {
        if (rows.isEmpty()) {
            Text(
                stringResource(R.string.section_not_filled),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        rows.forEach { (label, value) -> ValueRow(label, value) }
    }
}
