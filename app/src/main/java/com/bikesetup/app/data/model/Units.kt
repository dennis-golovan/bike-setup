package com.bikesetup.app.data.model

import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

object Units {
    private const val PSI_PER_BAR = 14.503773773
    private const val LB_PER_KG = 2.2046226218

    fun pressureFromBar(bar: Double, unit: PressureUnit): Double =
        if (unit == PressureUnit.PSI) bar * PSI_PER_BAR else bar

    fun pressureToBar(value: Double, unit: PressureUnit): Double =
        if (unit == PressureUnit.PSI) value / PSI_PER_BAR else value

    fun pressureDecimals(unit: PressureUnit): Int = if (unit == PressureUnit.PSI) 1 else 2

    fun weightFromKg(kg: Double, unit: WeightUnit): Double =
        if (unit == WeightUnit.LB) kg * LB_PER_KG else kg

    fun weightToKg(value: Double, unit: WeightUnit): Double =
        if (unit == WeightUnit.LB) value / LB_PER_KG else value
}

fun formatDecimal(value: Double, maxDecimals: Int): String =
    BigDecimal.valueOf(value).setScale(maxDecimals, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString()

fun parseDecimal(text: String): Double? = text.trim().replace(',', '.').takeIf { it.isNotEmpty() }?.toDoubleOrNull()

fun parseCount(text: String): Int? = text.trim().takeIf { it.isNotEmpty() }?.toIntOrNull()

fun isDecimalValid(text: String, allowNegative: Boolean = false): Boolean {
    val value = parseDecimal(text)
    return text.isBlank() || (value != null && (allowNegative || value >= 0))
}

fun isCountValid(text: String): Boolean {
    val value = parseCount(text)
    return text.isBlank() || (value != null && value >= 0)
}

fun newId(): String = UUID.randomUUID().toString()

fun nowMillis(): Long = System.currentTimeMillis()
