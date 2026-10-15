package com.bikesetup.app.ui.setup

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
    val forkLsc: String = "",
    val forkHsc: String = "",
    val shockPressure: String = "",
    val shockSpringRate: String = "",
    val shockSag: String = "",
    val shockTokens: String = "",
    val shockRebound: String = "",
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
            listOf(forkTokens, forkRebound, forkLsc, forkHsc, shockSpringRate, shockTokens, shockRebound, shockLsc, shockHsc)
                .any { !isCountValid(it) }

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
    forkLsc = fork.lsc.toCountText(),
    forkHsc = fork.hsc.toCountText(),
    shockPressure = shock.pressureBar.toPressureText(settings.suspensionPressureUnit),
    shockSpringRate = shock.springRateLbs.toCountText(),
    shockSag = shock.sagPercent?.let { formatDecimal(it, 1) }.orEmpty(),
    shockTokens = shock.tokens.toCountText(),
    shockRebound = shock.rebound.toCountText(),
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
