package com.bikesetup.app.ui.setup

import com.bikesetup.app.data.advice.Adjuster
import com.bikesetup.app.data.advice.StartingPoint
import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.advice.isAvailable
import com.bikesetup.app.data.advice.spec
import com.bikesetup.app.data.catalog.ClickRow
import com.bikesetup.app.data.catalog.ResolvedSource
import com.bikesetup.app.data.catalog.Span
import com.bikesetup.app.data.catalog.WeightPressure
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.Units
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.formatDecimal
import com.bikesetup.app.data.model.parseCount
import com.bikesetup.app.data.model.parseDecimal
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.roundToInt

enum class StartIssue { NEED_WEIGHT, NEED_SHOCK_PRESSURE, NEED_SPRING_RATE }

data class StartResult(val form: SetupForm, val changed: Int, val issues: Set<StartIssue>)

object ManufacturerStart {
    private val CLICKS = listOf(Adjuster.LSR, Adjuster.HSR, Adjuster.LSC, Adjuster.HSC)

    fun apply(form: SetupForm, bike: BikeEntity, settings: UserSettings, end: SuspensionEnd, source: ResolvedSource): StartResult {
        val unit = settings.suspensionPressureUnit
        val kg = parseDecimal(form.riderWeight)?.let { Units.weightToKg(it, settings.weightUnit) }
        val issues = mutableSetOf<StartIssue>()
        val chartPressure = source.chart.filter { it.psi != null }.sortedBy { it.kgFrom }
            .map { WeightPressure(listOf(it.kgFrom, it.kgTo), listOf(it.psi, it.psi)) }
        val chartRebound = source.chart.filter { it.lsr != null || it.hsr != null }.sortedBy { it.kgFrom }.map {
            ClickRow(kg = listOf(it.kgFrom, it.kgTo), lsr = it.lsr?.let { v -> listOf(v.toDouble(), v.toDouble()) },
                hsr = it.hsr?.let { v -> listOf(v.toDouble(), v.toDouble()) })
        }
        val pressureRows = chartPressure.ifEmpty { source.spring?.pressureByWeight.orEmpty() }
        val usePressureRows = pressureRows.isNotEmpty() && (end == SuspensionEnd.FORK || chartPressure.isNotEmpty())
        var pressure: Double? = null
        if (usePressureRows) {
            if (kg == null) issues += StartIssue.NEED_WEIGHT else pressure = pressureForWeight(pressureRows, kg)
        }
        val current = parseDecimal(form.pressure(end))
        val psi = pressure ?: current?.let { Units.pressureFromBar(Units.pressureToBar(it, unit), PressureUnit.PSI).roundToInt().toDouble() }
        val row = reboundRow(form, source, chartRebound, kg, psi, issues)
        val values = mutableMapOf<Adjuster, Int>()
        CLICKS.forEach { adjuster -> clicksFrom(row?.value(adjuster))?.let { values[adjuster] = it } }
        val damper = source.damper
        val spec = bike.spec(end)
        listOf(Adjuster.LSC, Adjuster.HSC).forEach { adjuster ->
            val max = (if (adjuster == Adjuster.LSC) spec.lscMax else spec.hscMax) ?: damper?.maxClicks?.get(adjuster.name)
            val ruled = when (damper?.compressionStartRule) {
                "MIDDLE" -> max?.let(StartingPoint::middle)
                "OPEN" -> max
                else -> null
            }
            val start = damper?.compressionStart?.get(adjuster.name) ?: ruled
            if (start != null && adjuster !in values) values[adjuster] = start
        }
        source.spring?.tokens?.firstOrNull { it.travelMm == source.ref?.travelMm }?.factory?.let { values[Adjuster.TOKENS] = it }
        var next = form
        var changed = 0
        pressure?.let {
            val text = formatDecimal(Units.pressureFromBar(Units.pressureToBar(it, PressureUnit.PSI), unit), Units.pressureDecimals(unit))
            if (next.pressure(end) != text) {
                next = next.withPressure(end, text)
                changed += 1
            }
        }
        values.forEach { (adjuster, value) ->
            if (bike.isAvailable(end, adjuster) && next.clicks(end, adjuster) != value.toString()) {
                next = next.withClicks(end, adjuster, value.toString())
                changed += 1
            }
        }
        return StartResult(next, changed, issues)
    }

    private fun reboundRow(
        form: SetupForm,
        source: ResolvedSource,
        chartRebound: List<ClickRow>,
        kg: Double?,
        psi: Double?,
        issues: MutableSet<StartIssue>,
    ): ClickRow? {
        val damper = source.damper
        val byPressure = damper?.reboundByPressure
        val damping = damper?.damping
        return when {
            chartRebound.isNotEmpty() || damper?.reboundByWeight != null -> {
                if (kg == null) {
                    issues += StartIssue.NEED_WEIGHT
                    null
                } else {
                    rowFor(chartRebound.ifEmpty { damper?.reboundByWeight.orEmpty() }, kg) { it.kg }
                }
            }
            byPressure != null -> {
                val key = source.spring?.id?.takeIf { it in byPressure } ?: "FLOAT".takeIf { it in byPressure } ?: byPressure.keys.firstOrNull()
                if (psi == null || key == null) null else rowFor(byPressure.getValue(key), psi) { it.psi }
            }
            damping != null -> {
                val byPsi = damping.by == "psi"
                val keyValue = if (byPsi) psi else parseCount(form.shockSpringRate)?.toDouble()
                if (keyValue == null) {
                    issues += if (byPsi) StartIssue.NEED_SHOCK_PRESSURE else StartIssue.NEED_SPRING_RATE
                    null
                } else {
                    rowFor(damping.rows, keyValue) { if (byPsi) it.psi else it.springLbs }
                }
            }
            else -> null
        }
    }

    fun clicksFrom(span: Span?): Int? {
        val low = span?.getOrNull(0)
        val high = span?.getOrNull(1)
        return when {
            low != null && high != null -> floor((low + high) / 2).toInt()
            else -> (low ?: high)?.toInt()
        }
    }

    fun pressureForWeight(rows: List<WeightPressure>, kg: Double): Double? {
        val row = rowFor(rows, kg) { it.kg } ?: return null
        val kgLow = row.kg[0]
        val kgHigh = row.kg[1]
        val psiLow = row.psi[0]
        val psiHigh = row.psi[1]
        val ratio = if (kgLow != null && kgHigh != null && kgHigh > kgLow) ((kg - kgLow) / (kgHigh - kgLow)).coerceIn(0.0, 1.0) else 0.0
        return when {
            psiLow == null -> psiHigh
            psiHigh == null || psiHigh == psiLow -> psiLow
            else -> (psiLow + ratio * (psiHigh - psiLow)).roundToInt().toDouble()
        }
    }

    fun <T> rowFor(rows: List<T>, value: Double, span: (T) -> Span?): T? {
        val ranged = rows.filter { span(it) != null }
        val inside = ranged.withIndex().firstOrNull { (index, row) ->
            val range = span(row)!!
            val low = range.getOrNull(0)
            val high = range.getOrNull(1)
            val contains = (low == null || low <= value) && (high == null || value <= high)
            contains && (index == ranged.lastIndex || high == null || value < high || low == high)
        }?.value
        return inside ?: ranged.minByOrNull { distance(span(it)!!, value) }
    }

    private fun distance(range: Span, value: Double): Double {
        val low = range.getOrNull(0)
        val high = range.getOrNull(1)
        val inside = (low == null || low <= value) && (high == null || value <= high)
        return if (inside) 0.0 else listOfNotNull(low, high).minOf { abs(it - value) }
    }

    private fun ClickRow.value(adjuster: Adjuster): Span? = when (adjuster) {
        Adjuster.LSR -> lsr
        Adjuster.HSR -> hsr
        Adjuster.LSC -> lsc
        Adjuster.HSC -> hsc
        Adjuster.TOKENS -> null
    }
}

fun SetupForm.pressure(end: SuspensionEnd): String = if (end == SuspensionEnd.FORK) forkPressure else shockPressure

fun SetupForm.withPressure(end: SuspensionEnd, value: String): SetupForm =
    if (end == SuspensionEnd.FORK) copy(forkPressure = value) else copy(shockPressure = value)
