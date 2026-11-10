package com.bikesetup.app.ui.setup

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bikesetup.app.R
import com.bikesetup.app.data.advice.SuspensionAdvisor
import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.advice.Symptom
import com.bikesetup.app.data.advice.hasEnd
import com.bikesetup.app.data.advice.spec
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.ui.common.labelRes
import com.bikesetup.app.ui.common.recommendationAction
import com.bikesetup.app.ui.common.recommendationChange
import com.bikesetup.app.ui.common.shortLabelRes
import com.bikesetup.app.ui.common.whyRes
import com.bikesetup.app.ui.components.BackButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdviceScreen(
    onBack: () -> Unit,
    onApply: (bikeId: String, setupId: String, symptom: Symptom) -> Unit,
    viewModel: AdviceViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var end by rememberSaveable { mutableStateOf(SuspensionEnd.FORK) }
    LaunchedEffect(state.isLoading, state.setup, state.bike) {
        if (!state.isLoading && (state.setup == null || state.bike == null)) onBack()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.advice_title)) },
                navigationIcon = { BackButton(onBack) },
            )
        },
    ) { padding ->
        val setup = state.setup
        val bike = state.bike
        if (setup != null && bike != null) {
            Column(
                modifier = Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    stringResource(R.string.advice_intro),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (bike.hasEnd(SuspensionEnd.SHOCK)) {
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        SuspensionEnd.entries.forEachIndexed { index, option ->
                            SegmentedButton(
                                selected = option == end,
                                onClick = { end = option },
                                shape = SegmentedButtonDefaults.itemShape(index, SuspensionEnd.entries.size),
                            ) {
                                Text(stringResource(if (option == SuspensionEnd.FORK) R.string.section_fork else R.string.section_shock))
                            }
                        }
                    }
                }
                val visibleEnd = if (bike.hasEnd(end)) end else SuspensionEnd.FORK
                SuspensionAdvisor.symptoms(bike, visibleEnd).forEach { symptom ->
                    SymptomCard(symptom, bike, setup, onApply = { onApply(bike.id, setup.id, symptom) })
                }
            }
        }
    }
}

@Composable
private fun SymptomCard(symptom: Symptom, bike: BikeEntity, setup: SetupEntity, onApply: () -> Unit) {
    var expanded by rememberSaveable(symptom) { mutableStateOf(false) }
    val recommendation = SuspensionAdvisor.recommend(symptom, bike, setup)
    OutlinedCard(onClick = { expanded = !expanded }, modifier = Modifier.fillMaxWidth().animateContentSize()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    stringResource(symptom.labelRes()),
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.weight(1f),
                )
                Icon(if (expanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore, contentDescription = null)
            }
            if (expanded) {
                Text(stringResource(R.string.advice_what_to_do), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                if (recommendation == null) {
                    Text(stringResource(R.string.advice_no_adjuster), style = MaterialTheme.typography.bodyMedium)
                } else {
                    val spec = bike.spec(recommendation.end)
                    Text(recommendationAction(recommendation, spec), style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
                    recommendationChange(recommendation)?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                    }
                    when {
                        recommendation.isAtLimit -> Text(stringResource(R.string.advice_at_limit), style = MaterialTheme.typography.bodySmall)
                        recommendation.to == null -> Text(
                            stringResource(R.string.advice_unknown_value, stringResource(recommendation.adjuster.shortLabelRes(spec))),
                            style = MaterialTheme.typography.bodySmall,
                        )
                        else -> Unit
                    }
                }
                Text(stringResource(R.string.advice_why), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Text(stringResource(symptom.whyRes()), style = MaterialTheme.typography.bodyMedium)
                if (recommendation?.canApply == true) {
                    Button(onClick = onApply, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(R.string.advice_apply))
                    }
                }
            }
        }
    }
}
