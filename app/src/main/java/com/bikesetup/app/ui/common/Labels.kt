package com.bikesetup.app.ui.common

import androidx.annotation.StringRes
import com.bikesetup.app.R
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.TerrainType
import com.bikesetup.app.data.model.Weather
import com.bikesetup.app.data.model.WeightUnit
import com.bikesetup.app.data.model.WheelSize

@StringRes
fun BikeType.labelRes(): Int = when (this) {
    BikeType.TRAIL -> R.string.bike_type_trail
    BikeType.ENDURO -> R.string.bike_type_enduro
    BikeType.DOWNHILL -> R.string.bike_type_downhill
    BikeType.XC -> R.string.bike_type_xc
    BikeType.DIRT_JUMP -> R.string.bike_type_dirt_jump
    BikeType.E_BIKE -> R.string.bike_type_e_bike
    BikeType.OTHER -> R.string.bike_type_other
}

@StringRes
fun WheelSize.labelRes(): Int = when (this) {
    WheelSize.TWENTY_NINE -> R.string.wheel_29
    WheelSize.TWENTY_SEVEN_FIVE -> R.string.wheel_27_5
    WheelSize.MULLET -> R.string.wheel_mullet
    WheelSize.TWENTY_SIX -> R.string.wheel_26
}

@StringRes
fun ShockType.labelRes(): Int = when (this) {
    ShockType.AIR -> R.string.shock_type_air
    ShockType.COIL -> R.string.shock_type_coil
    ShockType.NONE -> R.string.shock_type_none
}

@StringRes
fun TerrainType.labelRes(): Int = when (this) {
    TerrainType.TRAIL -> R.string.terrain_trail
    TerrainType.ENDURO -> R.string.terrain_enduro
    TerrainType.BIKE_PARK -> R.string.terrain_bike_park
    TerrainType.DOWNHILL -> R.string.terrain_downhill
    TerrainType.XC -> R.string.terrain_xc
    TerrainType.PUMP_TRACK -> R.string.terrain_pump_track
    TerrainType.OTHER -> R.string.terrain_other
}

@StringRes
fun Weather.labelRes(): Int = when (this) {
    Weather.DRY -> R.string.weather_dry
    Weather.MIXED -> R.string.weather_mixed
    Weather.WET -> R.string.weather_wet
    Weather.MUD -> R.string.weather_mud
}

@StringRes
fun PressureUnit.labelRes(): Int = when (this) {
    PressureUnit.BAR -> R.string.unit_bar
    PressureUnit.PSI -> R.string.unit_psi
}

@StringRes
fun WeightUnit.labelRes(): Int = when (this) {
    WeightUnit.KG -> R.string.unit_kg
    WeightUnit.LB -> R.string.unit_lb
}
