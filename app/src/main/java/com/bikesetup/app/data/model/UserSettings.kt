package com.bikesetup.app.data.model

data class UserSettings(
    val suspensionPressureUnit: PressureUnit = PressureUnit.PSI,
    val tirePressureUnit: PressureUnit = PressureUnit.BAR,
    val weightUnit: WeightUnit = WeightUnit.KG,
)
