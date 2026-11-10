package com.bikesetup.app.ui.bike

import com.bikesetup.app.data.advice.Adjuster
import com.bikesetup.app.data.advice.CLICK_ADJUSTERS
import com.bikesetup.app.data.catalog.CatalogDamper
import com.bikesetup.app.data.db.ChartRow
import com.bikesetup.app.data.db.SuspensionSpec
import com.bikesetup.app.data.model.formatDecimal
import com.bikesetup.app.data.model.parseCount
import com.bikesetup.app.data.model.parseDecimal

data class AdjusterForm(val enabled: Boolean, val max: String = "") {
    val isValid: Boolean get() = !enabled || max.isBlank() || (parseCount(max) ?: 0) > 0
}

data class SpecForm(
    val lsr: AdjusterForm = AdjusterForm(enabled = true),
    val hsr: AdjusterForm = AdjusterForm(enabled = false),
    val lsc: AdjusterForm = AdjusterForm(enabled = true),
    val hsc: AdjusterForm = AdjusterForm(enabled = true),
) {
    val isValid: Boolean get() = listOf(lsr, hsr, lsc, hsc).all { it.isValid }

    fun get(adjuster: Adjuster): AdjusterForm = when (adjuster) {
        Adjuster.HSR -> hsr
        Adjuster.LSC -> lsc
        Adjuster.HSC -> hsc
        else -> lsr
    }

    fun with(adjuster: Adjuster, form: AdjusterForm): SpecForm = when (adjuster) {
        Adjuster.HSR -> copy(hsr = form)
        Adjuster.LSC -> copy(lsc = form)
        Adjuster.HSC -> copy(hsc = form)
        else -> copy(lsr = form)
    }

    fun toSpec(): SuspensionSpec = SuspensionSpec(
        lsrEnabled = lsr.enabled,
        lsrMax = lsr.maxValue(),
        hsrEnabled = hsr.enabled,
        hsrMax = hsr.maxValue(),
        lscEnabled = lsc.enabled,
        lscMax = lsc.maxValue(),
        hscEnabled = hsc.enabled,
        hscMax = hsc.maxValue(),
    )

    fun withDamper(damper: CatalogDamper): SpecForm = CLICK_ADJUSTERS.fold(this) { form, adjuster ->
        val current = form.get(adjuster)
        form.with(
            adjuster,
            AdjusterForm(
                enabled = adjuster.name in damper.adjusters,
                max = damper.maxClicks[adjuster.name]?.toString() ?: current.max,
            ),
        )
    }

    private fun AdjusterForm.maxValue(): Int? = parseCount(max)?.takeIf { enabled && it > 0 }
}

data class ChartRowForm(
    val kgFrom: String = "",
    val kgTo: String = "",
    val psi: String = "",
    val lsr: String = "",
    val hsr: String = "",
)

fun List<ChartRow>.toChartForm(): List<ChartRowForm> = map {
    ChartRowForm(
        kgFrom = formatDecimal(it.kgFrom, 1),
        kgTo = formatDecimal(it.kgTo, 1),
        psi = it.psi?.let { psi -> formatDecimal(psi, 1) }.orEmpty(),
        lsr = it.lsr?.toString().orEmpty(),
        hsr = it.hsr?.toString().orEmpty(),
    )
}

fun List<ChartRowForm>.toChart(): List<ChartRow> = mapNotNull { row ->
    val from = parseDecimal(row.kgFrom)
    val to = parseDecimal(row.kgTo)
    if (from == null || to == null) null else ChartRow(from, to, parseDecimal(row.psi), parseCount(row.lsr), parseCount(row.hsr))
}

fun SuspensionSpec.toForm(): SpecForm = SpecForm(
    lsr = AdjusterForm(lsrEnabled, lsrMax?.toString().orEmpty()),
    hsr = AdjusterForm(hsrEnabled, hsrMax?.toString().orEmpty()),
    lsc = AdjusterForm(lscEnabled, lscMax?.toString().orEmpty()),
    hsc = AdjusterForm(hscEnabled, hscMax?.toString().orEmpty()),
)
