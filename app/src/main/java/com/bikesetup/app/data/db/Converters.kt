package com.bikesetup.app.data.db

import androidx.room.TypeConverter
import kotlinx.serialization.json.Json
import java.time.LocalDate

class Converters {
    @TypeConverter
    fun localDateToEpochDay(date: LocalDate?): Long? = date?.toEpochDay()

    @TypeConverter
    fun epochDayToLocalDate(value: Long?): LocalDate? = value?.let(LocalDate::ofEpochDay)

    @TypeConverter
    fun chartToJson(rows: List<ChartRow>): String = Json.encodeToString(rows)

    @TypeConverter
    fun jsonToChart(value: String?): List<ChartRow> =
        value?.takeIf { it.isNotBlank() }?.let { Json.decodeFromString<List<ChartRow>>(it) } ?: emptyList()
}
