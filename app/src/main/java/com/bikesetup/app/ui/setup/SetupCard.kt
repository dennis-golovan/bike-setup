package com.bikesetup.app.ui.setup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.bikesetup.app.R
import com.bikesetup.app.data.db.ForkSettings
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.db.ShockSettings
import com.bikesetup.app.data.db.TireSettings
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.ui.common.formatDate
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.common.percentValue
import com.bikesetup.app.ui.common.pressureNumber
import com.bikesetup.app.ui.common.pressureValue
import com.bikesetup.app.ui.common.temperatureValue

@Composable
fun SetupCard(
    setup: SetupEntity,
    shockType: ShockType,
    settings: UserSettings,
    isCurrent: Boolean,
    onClick: () -> Unit,
) {
    val content: @Composable () -> Unit = {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(formatDate(setup.ridingDate), style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                val conditions = listOfNotNull(
                    setup.weather?.let { stringResource(it.labelRes()) },
                    setup.temperatureC?.let { temperatureValue(it) },
                )
                if (conditions.isNotEmpty()) {
                    Text(
                        conditions.joinToString(", "),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                if (isCurrent) {
                    AssistChip(onClick = onClick, label = { Text(stringResource(R.string.setup_current)) })
                }
            }
            val lines = listOfNotNull(
                forkSummary(setup.fork, settings)?.let { stringResource(R.string.summary_fork, it) },
                shockSummary(setup.shock, shockType, settings)?.let { stringResource(R.string.summary_shock, it) },
                tireSummary(setup.tires, settings)?.let { stringResource(R.string.summary_tires, it) },
            )
            if (lines.isEmpty()) {
                Text(
                    stringResource(R.string.setup_empty_values),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            lines.forEach { Text(it, style = MaterialTheme.typography.bodyMedium) }
        }
    }
    if (isCurrent) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        ) { content() }
    } else {
        OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) { content() }
    }
}

@Composable
private fun forkSummary(fork: ForkSettings, settings: UserSettings): String? = listOfNotNull(
    fork.pressureBar?.let { pressureValue(it, settings.suspensionPressureUnit) },
    fork.sagPercent?.let { stringResource(R.string.summary_sag, percentValue(it)) },
    fork.tokens?.let { pluralStringResource(R.plurals.token_count, it, it) },
).joinOrNull()

@Composable
private fun shockSummary(shock: ShockSettings, shockType: ShockType, settings: UserSettings): String? = when (shockType) {
    ShockType.NONE -> null
    else -> listOfNotNull(
        shock.pressureBar?.takeIf { shockType == ShockType.AIR }?.let { pressureValue(it, settings.suspensionPressureUnit) },
        shock.springRateLbs?.takeIf { shockType == ShockType.COIL }?.let { stringResource(R.string.value_spring_rate, it) },
        shock.sagPercent?.let { stringResource(R.string.summary_sag, percentValue(it)) },
        shock.tokens?.takeIf { shockType == ShockType.AIR }?.let { pluralStringResource(R.plurals.token_count, it, it) },
    ).joinOrNull()
}

@Composable
private fun tireSummary(tires: TireSettings, settings: UserSettings): String? {
    val unit = settings.tirePressureUnit
    val front = tires.frontPressureBar
    val rear = tires.rearPressureBar
    return if (front == null && rear == null) {
        null
    } else {
        stringResource(
            R.string.summary_tire_pressures,
            front?.let { pressureNumber(it, unit) } ?: stringResource(R.string.value_missing),
            rear?.let { pressureNumber(it, unit) } ?: stringResource(R.string.value_missing),
            stringResource(unit.labelRes()),
        )
    }
}

private fun List<String>.joinOrNull(): String? = takeIf { it.isNotEmpty() }?.joinToString(" · ")
