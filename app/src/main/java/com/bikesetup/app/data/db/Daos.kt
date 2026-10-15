package com.bikesetup.app.data.db

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface BikeDao {
    @Query(
        """
        SELECT b.*, COUNT(s.id) AS setupCount, MAX(s.ridingDate) AS lastRidingDate
        FROM bikes b
        LEFT JOIN setups s ON s.bikeId = b.id AND s.deletedAt IS NULL
        WHERE b.deletedAt IS NULL
        GROUP BY b.id
        ORDER BY b.name COLLATE NOCASE
        """,
    )
    fun observeAllWithStats(): Flow<List<BikeWithStats>>

    @Query("SELECT * FROM bikes WHERE id = :id AND deletedAt IS NULL")
    fun observeById(id: String): Flow<BikeEntity?>

    @Query("SELECT * FROM bikes WHERE id = :id AND deletedAt IS NULL")
    suspend fun getById(id: String): BikeEntity?

    @Upsert
    suspend fun upsert(bike: BikeEntity)

    @Query("UPDATE bikes SET deletedAt = :now, updatedAt = :now WHERE id = :id")
    suspend fun softDelete(id: String, now: Long)
}

@Dao
interface LocationDao {
    @Query(
        """
        SELECT l.*, COUNT(s.id) AS setupCount
        FROM locations l
        LEFT JOIN setups s ON s.locationId = l.id AND s.deletedAt IS NULL
        WHERE l.deletedAt IS NULL
        GROUP BY l.id
        ORDER BY l.name COLLATE NOCASE
        """,
    )
    fun observeAllWithStats(): Flow<List<LocationWithStats>>

    @Query("SELECT * FROM locations WHERE deletedAt IS NULL ORDER BY name COLLATE NOCASE")
    fun observeAll(): Flow<List<LocationEntity>>

    @Query("SELECT * FROM locations WHERE id = :id AND deletedAt IS NULL")
    suspend fun getById(id: String): LocationEntity?

    @Upsert
    suspend fun upsert(location: LocationEntity)

    @Query("UPDATE locations SET deletedAt = :now, updatedAt = :now WHERE id = :id")
    suspend fun softDelete(id: String, now: Long)
}

@Dao
interface SetupDao {
    @Query(
        """
        SELECT s.*, l.name AS locationName
        FROM setups s
        LEFT JOIN locations l ON l.id = s.locationId
        WHERE s.bikeId = :bikeId AND s.deletedAt IS NULL
        ORDER BY s.ridingDate DESC, s.createdAt DESC
        """,
    )
    fun observeForBike(bikeId: String): Flow<List<SetupWithLocation>>

    @Query(
        """
        SELECT s.*, l.name AS locationName
        FROM setups s
        LEFT JOIN locations l ON l.id = s.locationId
        WHERE s.id = :id AND s.deletedAt IS NULL
        """,
    )
    fun observeById(id: String): Flow<SetupWithLocation?>

    @Query("SELECT * FROM setups WHERE id = :id AND deletedAt IS NULL")
    suspend fun getById(id: String): SetupEntity?

    @Query(
        """
        SELECT * FROM setups
        WHERE bikeId = :bikeId AND deletedAt IS NULL
        ORDER BY ridingDate DESC, createdAt DESC
        LIMIT 1
        """,
    )
    suspend fun getLatestForBike(bikeId: String): SetupEntity?

    @Upsert
    suspend fun upsert(setup: SetupEntity)

    @Query("UPDATE setups SET deletedAt = :now, updatedAt = :now WHERE id = :id")
    suspend fun softDelete(id: String, now: Long)

    @Query("UPDATE setups SET deletedAt = :now, updatedAt = :now WHERE bikeId = :bikeId AND deletedAt IS NULL")
    suspend fun softDeleteForBike(bikeId: String, now: Long)

    @Query("UPDATE setups SET locationId = NULL, updatedAt = :now WHERE locationId = :locationId AND deletedAt IS NULL")
    suspend fun detachLocation(locationId: String, now: Long)
}
