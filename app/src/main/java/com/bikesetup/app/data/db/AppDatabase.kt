package com.bikesetup.app.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [BikeEntity::class, LocationEntity::class, SetupEntity::class],
    version = 1,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun bikeDao(): BikeDao

    abstract fun locationDao(): LocationDao

    abstract fun setupDao(): SetupDao
}
