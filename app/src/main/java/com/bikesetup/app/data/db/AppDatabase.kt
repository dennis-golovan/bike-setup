package com.bikesetup.app.data.db

import androidx.room.AutoMigration
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [BikeEntity::class, LocationEntity::class, SetupEntity::class],
    version = 2,
    exportSchema = true,
    autoMigrations = [AutoMigration(from = 1, to = 2)],
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun bikeDao(): BikeDao

    abstract fun locationDao(): LocationDao

    abstract fun setupDao(): SetupDao
}
