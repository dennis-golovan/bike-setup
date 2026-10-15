package com.bikesetup.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.WeightUnit
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.components.BackButton
import com.bikesetup.app.ui.components.SectionCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(onBack: () -> Unit, viewModel: SettingsViewModel = hiltViewModel()) {
    val settings by viewModel.settings.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val versionName = remember {
        context.packageManager.getPackageInfo(context.packageName, 0).versionName.orEmpty()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings_title)) },
                navigationIcon = { BackButton(onBack) },
            )
        },
    ) { padding ->
        val current = settings
        if (current != null) {
            Column(
                modifier = Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                SectionCard(title = stringResource(R.string.settings_units)) {
                    UnitChoice(
                        title = stringResource(R.string.settings_suspension_pressure),
                        options = PressureUnit.entries,
                        selected = current.suspensionPressureUnit,
                        optionLabel = { stringResource(it.labelRes()) },
                        onSelect = viewModel::setSuspensionPressureUnit,
                    )
                    UnitChoice(
                        title = stringResource(R.string.settings_tire_pressure),
                        options = PressureUnit.entries,
                        selected = current.tirePressureUnit,
                        optionLabel = { stringResource(it.labelRes()) },
                        onSelect = viewModel::setTirePressureUnit,
                    )
                    UnitChoice(
                        title = stringResource(R.string.settings_weight),
                        options = WeightUnit.entries,
                        selected = current.weightUnit,
                        optionLabel = { stringResource(it.labelRes()) },
                        onSelect = viewModel::setWeightUnit,
                    )
                    Text(
                        stringResource(R.string.settings_units_hint),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                SectionCard(title = stringResource(R.string.settings_about)) {
                    Text(stringResource(R.string.settings_version, versionName), style = MaterialTheme.typography.bodyMedium)
                    Text(
                        stringResource(R.string.settings_storage_hint),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun <T> UnitChoice(
    title: String,
    options: List<T>,
    selected: T,
    optionLabel: @Composable (T) -> String,
    onSelect: (T) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.bodyLarge)
        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            options.forEachIndexed { index, option ->
                SegmentedButton(
                    selected = option == selected,
                    onClick = { onSelect(option) },
                    shape = SegmentedButtonDefaults.itemShape(index, options.size),
                ) {
                    Text(optionLabel(option))
                }
            }
        }
    }
}
