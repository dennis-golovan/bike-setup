package com.bikesetup.app.data.db

import androidx.room.ColumnInfo
import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.TerrainType
import com.bikesetup.app.data.model.Weather
import com.bikesetup.app.data.model.WheelSize
import java.time.LocalDate

@Entity(tableName = "bikes")
data class BikeEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: BikeType,
    val wheelSize: WheelSize,
    val forkModel: String,
    val shockModel: String,
    val shockType: ShockType,
    val notes: String,
    val createdAt: Long,
    val updatedAt: Long,
    val deletedAt: Long? = null,
    @Embedded(prefix = "fork_spec_") val forkSpec: SuspensionSpec = SuspensionSpec(),
    @Embedded(prefix = "shock_spec_") val shockSpec: SuspensionSpec = SuspensionSpec(),
)

data class SuspensionSpec(
    @ColumnInfo(defaultValue = "1") val lsrEnabled: Boolean = true,
    val lsrMax: Int? = null,
    @ColumnInfo(defaultValue = "0") val hsrEnabled: Boolean = false,
    val hsrMax: Int? = null,
    @ColumnInfo(defaultValue = "1") val lscEnabled: Boolean = true,
    val lscMax: Int? = null,
    @ColumnInfo(defaultValue = "1") val hscEnabled: Boolean = true,
    val hscMax: Int? = null,
)

@Entity(tableName = "locations")
data class LocationEntity(
    @PrimaryKey val id: String,
    val name: String,
    val terrainType: TerrainType,
    val latitude: Double?,
    val longitude: Double?,
    val notes: String,
    val createdAt: Long,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

data class ForkSettings(
    val pressureBar: Double? = null,
    val sagPercent: Double? = null,
    val tokens: Int? = null,
    val rebound: Int? = null,
    val hsr: Int? = null,
    val lsc: Int? = null,
    val hsc: Int? = null,
)

data class ShockSettings(
    val pressureBar: Double? = null,
    val springRateLbs: Int? = null,
    val sagPercent: Double? = null,
    val tokens: Int? = null,
    val rebound: Int? = null,
    val hsr: Int? = null,
    val lsc: Int? = null,
    val hsc: Int? = null,
)

data class TireSettings(
    val frontPressureBar: Double? = null,
    val rearPressureBar: Double? = null,
    val frontModel: String = "",
    val rearModel: String = "",
    val frontInsert: String = "",
    val rearInsert: String = "",
    val tubeless: Boolean = true,
)

@Entity(
    tableName = "setups",
    indices = [Index("bikeId"), Index("locationId")],
)
data class SetupEntity(
    @PrimaryKey val id: String,
    val bikeId: String,
    val locationId: String?,
    val ridingDate: LocalDate,
    val riderWeightKg: Double?,
    val weather: Weather?,
    val temperatureC: Double?,
    @Embedded(prefix = "fork_") val fork: ForkSettings,
    @Embedded(prefix = "shock_") val shock: ShockSettings,
    @Embedded(prefix = "tire_") val tires: TireSettings,
    val notes: String,
    val createdAt: Long,
    val updatedAt: Long,
    val deletedAt: Long? = null,
)

data class BikeWithStats(
    @Embedded val bike: BikeEntity,
    val setupCount: Int,
    val lastRidingDate: LocalDate?,
)

data class LocationWithStats(
    @Embedded val location: LocationEntity,
    val setupCount: Int,
)

data class SetupWithLocation(
    @Embedded val setup: SetupEntity,
    val locationName: String?,
)
