package com.bikesetup.app.data.catalog

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CatalogRepository @Inject constructor(@ApplicationContext private val context: Context) {
    val catalog: Catalog by lazy {
        Catalog.parse(context.assets.open(CATALOG_FILE).use { it.readBytes().decodeToString() })
    }

    private companion object {
        const val CATALOG_FILE = "catalog.json"
    }
}
