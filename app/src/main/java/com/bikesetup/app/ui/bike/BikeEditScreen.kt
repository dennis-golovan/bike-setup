package com.bikesetup.app.ui.bike

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.WheelSize
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.components.BackButton
import com.bikesetup.app.ui.components.DropdownField
import com.bikesetup.app.ui.components.TextInput

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BikeEditScreen(onBack: () -> Unit, viewModel: BikeEditViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(state.isSaved) {
        if (state.isSaved) onBack()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(if (state.isNew) R.string.bike_new_title else R.string.bike_edit_title)) },
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
            BikeFormContent(
                form = state.form,
                onUpdate = viewModel::update,
                modifier = Modifier.padding(padding).consumeWindowInsets(padding),
            )
        }
    }
}

@Composable
private fun BikeFormContent(form: BikeForm, onUpdate: (BikeForm.() -> BikeForm) -> Unit, modifier: Modifier) {
    Column(
        modifier = modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TextInput(
            value = form.name,
            onValueChange = { v -> onUpdate { copy(name = v) } },
            label = stringResource(R.string.bike_name),
            placeholder = stringResource(R.string.bike_name_hint),
        )
        DropdownField(
            label = stringResource(R.string.bike_type),
            options = BikeType.entries,
            selected = form.type,
            optionLabel = { stringResource(it.labelRes()) },
            onSelect = { v -> onUpdate { copy(type = v) } },
            modifier = Modifier.fillMaxWidth(),
        )
        DropdownField(
            label = stringResource(R.string.bike_wheel_size),
            options = WheelSize.entries,
            selected = form.wheelSize,
            optionLabel = { stringResource(it.labelRes()) },
            onSelect = { v -> onUpdate { copy(wheelSize = v) } },
            modifier = Modifier.fillMaxWidth(),
        )
        TextInput(
            value = form.forkModel,
            onValueChange = { v -> onUpdate { copy(forkModel = v) } },
            label = stringResource(R.string.bike_fork_model),
            placeholder = stringResource(R.string.bike_fork_model_hint),
        )
        DropdownField(
            label = stringResource(R.string.bike_shock_type),
            options = ShockType.entries,
            selected = form.shockType,
            optionLabel = { stringResource(it.labelRes()) },
            onSelect = { v -> onUpdate { copy(shockType = v) } },
            modifier = Modifier.fillMaxWidth(),
        )
        if (form.shockType != ShockType.NONE) {
            TextInput(
                value = form.shockModel,
                onValueChange = { v -> onUpdate { copy(shockModel = v) } },
                label = stringResource(R.string.bike_shock_model),
                placeholder = stringResource(R.string.bike_shock_model_hint),
            )
        }
        TextInput(
            value = form.notes,
            onValueChange = { v -> onUpdate { copy(notes = v) } },
            label = stringResource(R.string.field_notes),
            singleLine = false,
            minLines = 3,
        )
    }
}
