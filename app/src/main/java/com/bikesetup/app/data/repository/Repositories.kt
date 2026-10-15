package com.bikesetup.app.data.repository

import androidx.room.withTransaction
import com.bikesetup.app.data.db.AppDatabase
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.BikeWithStats
import com.bikesetup.app.data.db.LocationEntity
import com.bikesetup.app.data.db.LocationWithStats
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.db.SetupWithLocation
import com.bikesetup.app.data.model.nowMillis
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BikeRepository @Inject constructor(private val db: AppDatabase) {
    private val bikeDao = db.bikeDao()
    private val setupDao = db.setupDao()

    fun observeAllWithStats(): Flow<List<BikeWithStats>> = bikeDao.observeAllWithStats()

    fun observe(id: String): Flow<BikeEntity?> = bikeDao.observeById(id)

    suspend fun get(id: String): BikeEntity? = bikeDao.getById(id)

    suspend fun save(bike: BikeEntity) = bikeDao.upsert(bike)

    suspend fun delete(id: String) {
        val now = nowMillis()
        db.withTransaction {
            setupDao.softDeleteForBike(id, now)
            bikeDao.softDelete(id, now)
        }
    }
}

@Singleton
class LocationRepository @Inject constructor(private val db: AppDatabase) {
    private val locationDao = db.locationDao()
    private val setupDao = db.setupDao()

    fun observeAllWithStats(): Flow<List<LocationWithStats>> = locationDao.observeAllWithStats()

    fun observeAll(): Flow<List<LocationEntity>> = locationDao.observeAll()

    suspend fun get(id: String): LocationEntity? = locationDao.getById(id)

    suspend fun save(location: LocationEntity) = locationDao.upsert(location)

    suspend fun delete(id: String) {
        val now = nowMillis()
        db.withTransaction {
            setupDao.detachLocation(id, now)
            locationDao.softDelete(id, now)
        }
    }
}

@Singleton
class SetupRepository @Inject constructor(db: AppDatabase) {
    private val setupDao = db.setupDao()

    fun observeForBike(bikeId: String): Flow<List<SetupWithLocation>> = setupDao.observeForBike(bikeId)

    fun observe(id: String): Flow<SetupWithLocation?> = setupDao.observeById(id)

    suspend fun get(id: String): SetupEntity? = setupDao.getById(id)

    suspend fun getLatestForBike(bikeId: String): SetupEntity? = setupDao.getLatestForBike(bikeId)

    suspend fun save(setup: SetupEntity) = setupDao.upsert(setup)

    suspend fun delete(id: String) = setupDao.softDelete(id, nowMillis())
}
