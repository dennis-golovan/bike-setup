package com.bikesetup.app.data.catalog

import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.CatalogRefEntity
import com.bikesetup.app.data.db.ChartRow
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

typealias Span = List<Double?>

@Serializable
data class CatalogFile(val schema: Int, val models: List<CatalogModel>)

@Serializable
data class CatalogModel(
    val id: String,
    val brand: String,
    val family: String,
    val kind: String,
    val yearFrom: Int,
    val yearTo: Int,
    val source: String,
    val sag: SagSpan? = null,
    val springs: List<CatalogSpring> = emptyList(),
    val dampers: List<CatalogDamper> = emptyList(),
)

@Serializable
data class SagSpan(val min: Int, val max: Int)

@Serializable
data class CatalogSpring(
    val id: String,
    val label: String,
    val pressureByWeight: List<WeightPressure> = emptyList(),
    val tokens: List<TokenRow> = emptyList(),
)

@Serializable
data class WeightPressure(val kg: Span, val psi: Span)

@Serializable
data class TokenRow(val travelMm: Int, val factory: Int? = null, val factoryNote: String? = null, val max: Int)

@Serializable
data class ClickRow(
    val kg: Span? = null,
    val psi: Span? = null,
    val springLbs: Span? = null,
    @SerialName("LSR") val lsr: Span? = null,
    @SerialName("HSR") val hsr: Span? = null,
    @SerialName("LSC") val lsc: Span? = null,
    @SerialName("HSC") val hsc: Span? = null,
)

@Serializable
data class Damping(val by: String, val rows: List<ClickRow>)

@Serializable
data class CatalogDamper(
    val id: String,
    val label: String,
    val adjusters: List<String>,
    val maxClicks: Map<String, Int> = emptyMap(),
    val compressionStart: Map<String, Int> = emptyMap(),
    val compressionStartRule: String? = null,
    val reboundByWeight: List<ClickRow>? = null,
    val reboundByPressure: Map<String, List<ClickRow>>? = null,
    val damping: Damping? = null,
)

data class ResolvedSource(
    val model: CatalogModel?,
    val damper: CatalogDamper?,
    val spring: CatalogSpring?,
    val ref: CatalogRefEntity?,
    val chart: List<ChartRow>,
) {
    val hasData: Boolean get() = model != null || chart.isNotEmpty()
}

class Catalog(val models: List<CatalogModel>) {
    private fun kind(end: SuspensionEnd) = if (end == SuspensionEnd.FORK) "FORK" else "SHOCK"

    fun brands(end: SuspensionEnd): List<String> = models.filter { it.kind == kind(end) }.map { it.brand }.distinct()

    fun families(end: SuspensionEnd, brand: String): List<String> =
        models.filter { it.kind == kind(end) && it.brand == brand }.map { it.family }.distinct()

    fun years(end: SuspensionEnd, brand: String, family: String): List<Int> = models
        .filter { it.kind == kind(end) && it.brand == brand && it.family == family }
        .flatMap { it.yearFrom..it.yearTo }
        .distinct()
        .sortedDescending()

    fun modelFor(end: SuspensionEnd, brand: String, family: String, year: Int): CatalogModel? = models.firstOrNull {
        it.kind == kind(end) && it.brand == brand && it.family == family && year in it.yearFrom..it.yearTo
    }

    fun find(id: String?): CatalogModel? = models.firstOrNull { it.id == id }

    fun resolve(bike: BikeEntity, end: SuspensionEnd): ResolvedSource {
        val ref = if (end == SuspensionEnd.FORK) bike.forkCatalog else bike.shockCatalog
        val chart = if (end == SuspensionEnd.FORK) bike.forkChart else bike.shockChart
        val model = find(ref?.modelId)
        return ResolvedSource(
            model = model,
            damper = model?.dampers?.firstOrNull { it.id == ref?.damperId } ?: model?.dampers?.firstOrNull(),
            spring = model?.springs?.firstOrNull { it.id == ref?.springId } ?: model?.springs?.firstOrNull(),
            ref = ref,
            chart = chart,
        )
    }

    fun sag(bike: BikeEntity, end: SuspensionEnd): SagSpan? = resolve(bike, end).model?.sag

    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        fun parse(text: String): Catalog = Catalog(json.decodeFromString<CatalogFile>(text).models)
    }
}
