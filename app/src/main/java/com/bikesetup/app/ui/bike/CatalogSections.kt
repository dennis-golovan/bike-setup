package com.bikesetup.app.ui.bike

import android.content.ActivityNotFoundException
import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.padding
import androidx.core.net.toUri
import com.bikesetup.app.R
import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.catalog.Catalog
import com.bikesetup.app.data.catalog.CatalogDamper
import com.bikesetup.app.data.db.CatalogRefEntity
import com.bikesetup.app.ui.components.DecimalField
import com.bikesetup.app.ui.components.DropdownField
import com.bikesetup.app.ui.components.SectionCard

private const val NONE = ""

@Composable
fun CatalogPickerSection(
    title: String,
    end: SuspensionEnd,
    value: CatalogRefEntity?,
    catalog: Catalog,
    onSelect: (CatalogRefEntity?, CatalogDamper?) -> Unit,
) {
    val initial = catalog.find(value?.modelId)
    var brand by rememberSaveable { mutableStateOf(initial?.brand ?: NONE) }
    var family by rememberSaveable { mutableStateOf(initial?.family ?: NONE) }
    var year by rememberSaveable { mutableStateOf(value?.year?.toString() ?: NONE) }
    var damperId by rememberSaveable { mutableStateOf(value?.damperId ?: NONE) }
    var springId by rememberSaveable { mutableStateOf(value?.springId ?: NONE) }
    var travel by rememberSaveable { mutableStateOf(value?.travelMm?.toString() ?: NONE) }
    val model = year.toIntOrNull()?.let { y -> catalog.modelFor(end, brand, family, y) }
    val damper = model?.dampers?.firstOrNull { it.id == damperId }
    val spring = model?.springs?.firstOrNull { it.id == springId }
    val emit = {
        val m = year.toIntOrNull()?.let { y -> catalog.modelFor(end, brand, family, y) }
        if (m != null && m.dampers.none { it.id == damperId }) damperId = m.dampers.firstOrNull()?.id ?: NONE
        if (m != null && m.springs.none { it.id == springId }) springId = m.springs.firstOrNull()?.id ?: NONE
        val d = m?.dampers?.firstOrNull { it.id == damperId }
        onSelect(
            if (m != null && d != null) {
                CatalogRefEntity(m.id, year.toInt(), d.id, springId.ifEmpty { null }, travel.toIntOrNull())
            } else {
                null
            },
            d,
        )
    }
    val noneLabel = stringResource(R.string.catalog_none)
    SectionCard(title = title) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DropdownField(
                label = stringResource(R.string.catalog_brand),
                options = listOf(NONE) + catalog.brands(end),
                selected = brand,
                optionLabel = { it.ifEmpty { noneLabel } },
                onSelect = {
                    brand = it
                    family = NONE
                    year = NONE
                    travel = NONE
                    emit()
                },
                modifier = Modifier.weight(1f),
            )
            DropdownField(
                label = stringResource(R.string.catalog_model),
                options = listOf(NONE) + if (brand.isEmpty()) emptyList() else catalog.families(end, brand),
                selected = family,
                optionLabel = { it.ifEmpty { noneLabel } },
                onSelect = {
                    family = it
                    year = NONE
                    travel = NONE
                    emit()
                },
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DropdownField(
                label = stringResource(R.string.catalog_year),
                options = listOf(NONE) + if (family.isEmpty()) emptyList() else catalog.years(end, brand, family).map(Int::toString),
                selected = year,
                optionLabel = { it.ifEmpty { noneLabel } },
                onSelect = {
                    year = it
                    emit()
                },
                modifier = Modifier.weight(1f),
            )
            if (model != null) {
                DropdownField(
                    label = stringResource(R.string.catalog_damper),
                    options = model.dampers.map { it.id },
                    selected = damperId,
                    optionLabel = { id -> model.dampers.firstOrNull { it.id == id }?.label ?: noneLabel },
                    onSelect = {
                        damperId = it
                        emit()
                    },
                    modifier = Modifier.weight(1f),
                )
            } else {
                Spacer(Modifier.weight(1f))
            }
        }
        if (model != null && model.springs.isNotEmpty()) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                DropdownField(
                    label = stringResource(R.string.catalog_spring),
                    options = model.springs.map { it.id },
                    selected = springId,
                    optionLabel = { id -> model.springs.firstOrNull { it.id == id }?.label ?: noneLabel },
                    onSelect = {
                        springId = it
                        travel = NONE
                        emit()
                    },
                    modifier = Modifier.weight(1f),
                )
                if (spring != null && spring.tokens.isNotEmpty()) {
                    DropdownField(
                        label = stringResource(R.string.catalog_travel),
                        options = listOf(NONE) + spring.tokens.map { it.travelMm.toString() },
                        selected = travel,
                        optionLabel = { if (it.isEmpty()) noneLabel else stringResource(R.string.catalog_travel_value, it.toInt()) },
                        onSelect = {
                            travel = it
                            emit()
                        },
                        modifier = Modifier.weight(1f),
                    )
                } else {
                    Spacer(Modifier.weight(1f))
                }
            }
        }
        spring?.tokens?.firstOrNull { it.travelMm.toString() == travel && it.factory != null }?.let {
            Text(
                stringResource(R.string.catalog_factory_tokens, it.factory ?: 0, it.max),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (model != null) {
            val hasTables = model.springs.isNotEmpty() || damper?.reboundByWeight != null || damper?.reboundByPressure != null ||
                damper?.damping != null
            Text(
                stringResource(if (hasTables) R.string.catalog_hint else R.string.catalog_no_tables),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            val context = LocalContext.current
            TextButton(onClick = {
                try {
                    context.startActivity(Intent(Intent.ACTION_VIEW, model.source.toUri()))
                } catch (e: ActivityNotFoundException) {
                    Unit
                }
            }) { Text(stringResource(R.string.catalog_source)) }
        }
    }
}

@Composable
fun ChartEditorSection(rows: List<ChartRowForm>, showHsr: Boolean, onChange: (List<ChartRowForm>) -> Unit) {
    SectionCard(title = stringResource(R.string.chart_title), subtitle = stringResource(R.string.chart_hint)) {
        rows.forEachIndexed { index, row ->
            val set: (ChartRowForm) -> Unit = { updated -> onChange(rows.mapIndexed { i, r -> if (i == index) updated else r }) }
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        DecimalField(row.kgFrom, { set(row.copy(kgFrom = it)) }, stringResource(R.string.chart_kg_from), Modifier.weight(1f))
                        DecimalField(row.kgTo, { set(row.copy(kgTo = it)) }, stringResource(R.string.chart_kg_to), Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        DecimalField(row.psi, { set(row.copy(psi = it)) }, stringResource(R.string.chart_psi), Modifier.weight(1f))
                        DecimalField(
                            row.lsr,
                            { set(row.copy(lsr = it)) },
                            stringResource(if (showHsr) R.string.field_lsr else R.string.field_rebound),
                            Modifier.weight(1f),
                            integerOnly = true,
                        )
                    }
                    if (showHsr) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            DecimalField(row.hsr, { set(row.copy(hsr = it)) }, stringResource(R.string.field_hsr), Modifier.weight(1f), integerOnly = true)
                            Spacer(Modifier.weight(1f))
                        }
                    }
                    TextButton(onClick = { onChange(rows.filterIndexed { i, _ -> i != index }) }) {
                        Text(stringResource(R.string.chart_remove_row), color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
        OutlinedButton(onClick = { onChange(rows + ChartRowForm()) }, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.chart_add_row))
        }
    }
}
