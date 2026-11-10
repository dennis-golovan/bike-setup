package com.bikesetup.app.ui.setup

import com.bikesetup.app.data.advice.Adjuster
import com.bikesetup.app.data.advice.CLICK_ADJUSTERS
import com.bikesetup.app.data.advice.Recommendation
import com.bikesetup.app.data.advice.StartingPoint
import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.advice.hasEnd
import com.bikesetup.app.data.advice.isAvailable
import com.bikesetup.app.data.advice.maxClicks
import com.bikesetup.app.data.advice.spec
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.ForkSettings
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.db.ShockSettings
import com.bikesetup.app.data.db.TireSettings
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.Units
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.Weather
import com.bikesetup.app.data.model.formatDecimal
import com.bikesetup.app.data.model.isCountValid
import com.bikesetup.app.data.model.isDecimalValid
import com.bikesetup.app.data.model.parseCount
import com.bikesetup.app.data.model.parseDecimal
import java.time.LocalDate

data class SetupForm(
    val locationId: String? = null,
    val ridingDate: LocalDate = LocalDate.now(),
    val weather: Weather? = null,
    val temperature: String = "",
    val riderWeight: String = "",
    val forkPressure: String = "",
    val forkSag: String = "",
    val forkTokens: String = "",
    val forkRebound: String = "",
    val forkHsr: String = "",
    val forkLsc: String = "",
    val forkHsc: String = "",
    val shockPressure: String = "",
    val shockSpringRate: String = "",
    val shockSag: String = "",
    val shockTokens: String = "",
    val shockRebound: String = "",
    val shockHsr: String = "",
    val shockLsc: String = "",
    val shockHsc: String = "",
    val frontTirePressure: String = "",
    val rearTirePressure: String = "",
    val frontTireModel: String = "",
    val rearTireModel: String = "",
    val frontInsert: String = "",
    val rearInsert: String = "",
    val tubeless: Boolean = true,
    val notes: String = "",
) {
    val hasErrors: Boolean
        get() = !isDecimalValid(temperature, allowNegative = true) ||
            listOf(riderWeight, forkPressure, forkSag, shockPressure, shockSag, frontTirePressure, rearTirePressure)
                .any { !isDecimalValid(it) } ||
            listOf(
                forkTokens, forkRebound, forkHsr, forkLsc, forkHsc,
                shockSpringRate, shockTokens, shockRebound, shockHsr, shockLsc, shockHsc,
            ).any { !isCountValid(it) }

    fun clicks(end: SuspensionEnd, adjuster: Adjuster): String = when (end) {
        SuspensionEnd.FORK -> when (adjuster) {
            Adjuster.TOKENS -> forkTokens
            Adjuster.LSR -> forkRebound
            Adjuster.HSR -> forkHsr
            Adjuster.LSC -> forkLsc
            Adjuster.HSC -> forkHsc
        }
        SuspensionEnd.SHOCK -> when (adjuster) {
            Adjuster.TOKENS -> shockTokens
            Adjuster.LSR -> shockRebound
            Adjuster.HSR -> shockHsr
            Adjuster.LSC -> shockLsc
            Adjuster.HSC -> shockHsc
        }
    }

    fun withClicks(end: SuspensionEnd, adjuster: Adjuster, value: String): SetupForm = when (end) {
        SuspensionEnd.FORK -> when (adjuster) {
            Adjuster.TOKENS -> copy(forkTokens = value)
            Adjuster.LSR -> copy(forkRebound = value)
            Adjuster.HSR -> copy(forkHsr = value)
            Adjuster.LSC -> copy(forkLsc = value)
            Adjuster.HSC -> copy(forkHsc = value)
        }
        SuspensionEnd.SHOCK -> when (adjuster) {
            Adjuster.TOKENS -> copy(shockTokens = value)
            Adjuster.LSR -> copy(shockRebound = value)
            Adjuster.HSR -> copy(shockHsr = value)
            Adjuster.LSC -> copy(shockLsc = value)
            Adjuster.HSC -> copy(shockHsc = value)
        }
    }

    fun exceedsLimits(bike: BikeEntity): Boolean = SuspensionEnd.entries.any { end ->
        CLICK_ADJUSTERS.any { adjuster ->
            val max = bike.spec(end).maxClicks(adjuster)
            val value = parseCount(clicks(end, adjuster))
            bike.isAvailable(end, adjuster) && max != null && value != null && value > max
        }
    }

    fun withRecommendation(recommendation: Recommendation): SetupForm =
        recommendation.to?.let { withClicks(recommendation.end, recommendation.adjuster, it.toString()) } ?: this

    fun withStartingPoint(bike: BikeEntity): Pair<SetupForm, Int> {
        var form = this
        var filled = 0
        SuspensionEnd.entries.filter { bike.hasEnd(it) }.forEach { end ->
            CLICK_ADJUSTERS.forEach { adjuster ->
                val max = bike.spec(end).maxClicks(adjuster)
                if (bike.isAvailable(end, adjuster) && max != null && form.clicks(end, adjuster).isBlank()) {
                    form = form.withClicks(end, adjuster, StartingPoint.middle(max).toString())
                    filled += 1
                }
            }
        }
        if (form.forkSag.isBlank()) {
            form = form.copy(forkSag = formatDecimal(StartingPoint.forkSag(bike.type).target, 1))
            filled += 1
        }
        if (bike.hasEnd(SuspensionEnd.SHOCK) && form.shockSag.isBlank()) {
            form = form.copy(shockSag = formatDecimal(StartingPoint.shockSag(bike.type).target, 1))
            filled += 1
        }
        return form to filled
    }

    fun asFreshCopy(): SetupForm = copy(ridingDate = LocalDate.now(), weather = null, temperature = "", notes = "")
}

fun SetupEntity.toForm(settings: UserSettings): SetupForm = SetupForm(
    locationId = locationId,
    ridingDate = ridingDate,
    weather = weather,
    temperature = temperatureC?.let { formatDecimal(it, 1) }.orEmpty(),
    riderWeight = riderWeightKg?.let { formatDecimal(Units.weightFromKg(it, settings.weightUnit), 1) }.orEmpty(),
    forkPressure = fork.pressureBar.toPressureText(settings.suspensionPressureUnit),
    forkSag = fork.sagPercent?.let { formatDecimal(it, 1) }.orEmpty(),
    forkTokens = fork.tokens.toCountText(),
    forkRebound = fork.rebound.toCountText(),
    forkHsr = fork.hsr.toCountText(),
    forkLsc = fork.lsc.toCountText(),
    forkHsc = fork.hsc.toCountText(),
    shockPressure = shock.pressureBar.toPressureText(settings.suspensionPressureUnit),
    shockSpringRate = shock.springRateLbs.toCountText(),
    shockSag = shock.sagPercent?.let { formatDecimal(it, 1) }.orEmpty(),
    shockTokens = shock.tokens.toCountText(),
    shockRebound = shock.rebound.toCountText(),
    shockHsr = shock.hsr.toCountText(),
    shockLsc = shock.lsc.toCountText(),
    shockHsc = shock.hsc.toCountText(),
    frontTirePressure = tires.frontPressureBar.toPressureText(settings.tirePressureUnit),
    rearTirePressure = tires.rearPressureBar.toPressureText(settings.tirePressureUnit),
    frontTireModel = tires.frontModel,
    rearTireModel = tires.rearModel,
    frontInsert = tires.frontInsert,
    rearInsert = tires.rearInsert,
    tubeless = tires.tubeless,
    notes = notes,
)

fun SetupForm.toEntity(
    id: String,
    bikeId: String,
    shockType: ShockType,
    settings: UserSettings,
    createdAt: Long,
    updatedAt: Long,
): SetupEntity = SetupEntity(
    id = id,
    bikeId = bikeId,
    locationId = locationId,
    ridingDate = ridingDate,
    riderWeightKg = parseDecimal(riderWeight)?.let { Units.weightToKg(it, settings.weightUnit) },
    weather = weather,
    temperatureC = parseDecimal(temperature),
    fork = ForkSettings(
        pressureBar = forkPressure.toBar(settings.suspensionPressureUnit),
        sagPercent = parseDecimal(forkSag),
        tokens = parseCount(forkTokens),
        rebound = parseCount(forkRebound),
        hsr = parseCount(forkHsr),
        lsc = parseCount(forkLsc),
        hsc = parseCount(forkHsc),
    ),
    shock = when (shockType) {
        ShockType.NONE -> ShockSettings()
        else -> ShockSettings(
            pressureBar = shockPressure.toBar(settings.suspensionPressureUnit).takeIf { shockType == ShockType.AIR },
            springRateLbs = parseCount(shockSpringRate).takeIf { shockType == ShockType.COIL },
            sagPercent = parseDecimal(shockSag),
            tokens = parseCount(shockTokens).takeIf { shockType == ShockType.AIR },
            rebound = parseCount(shockRebound),
            hsr = parseCount(shockHsr),
            lsc = parseCount(shockLsc),
            hsc = parseCount(shockHsc),
        )
    },
    tires = TireSettings(
        frontPressureBar = frontTirePressure.toBar(settings.tirePressureUnit),
        rearPressureBar = rearTirePressure.toBar(settings.tirePressureUnit),
        frontModel = frontTireModel.trim(),
        rearModel = rearTireModel.trim(),
        frontInsert = frontInsert.trim(),
        rearInsert = rearInsert.trim(),
        tubeless = tubeless,
    ),
    notes = notes.trim(),
    createdAt = createdAt,
    updatedAt = updatedAt,
)

private fun Double?.toPressureText(unit: PressureUnit): String =
    this?.let { formatDecimal(Units.pressureFromBar(it, unit), Units.pressureDecimals(unit)) }.orEmpty()

private fun Int?.toCountText(): String = this?.toString().orEmpty()

private fun String.toBar(unit: PressureUnit): Double? = parseDecimal(this)?.let { Units.pressureToBar(it, unit) }
