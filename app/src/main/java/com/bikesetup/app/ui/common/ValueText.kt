package com.bikesetup.app.ui.common

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.stringResource
import com.bikesetup.app.R
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.Units
import com.bikesetup.app.data.model.WeightUnit
import com.bikesetup.app.data.model.formatDecimal
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun formatDate(date: LocalDate): String {
    val locale = LocalConfiguration.current.locales[0]
    val formatter = remember(locale) { DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale) }
    return date.format(formatter)
}

fun pressureNumber(bar: Double, unit: PressureUnit): String =
    formatDecimal(Units.pressureFromBar(bar, unit), Units.pressureDecimals(unit))

@Composable
fun pressureValue(bar: Double, unit: PressureUnit): String =
    stringResource(R.string.value_with_unit, pressureNumber(bar, unit), stringResource(unit.labelRes()))

@Composable
fun weightValue(kg: Double, unit: WeightUnit): String =
    stringResource(R.string.value_with_unit, formatDecimal(Units.weightFromKg(kg, unit), 1), stringResource(unit.labelRes()))

@Composable
fun percentValue(value: Double): String = stringResource(R.string.value_percent, formatDecimal(value, 1))

@Composable
fun temperatureValue(celsius: Double): String = stringResource(R.string.value_celsius, formatDecimal(celsius, 1))
