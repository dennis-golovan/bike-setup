package com.bikesetup.app.data.catalog

import com.bikesetup.app.data.advice.SuspensionEnd
import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.CatalogRefEntity
import com.bikesetup.app.data.db.ChartRow
import com.bikesetup.app.data.db.SuspensionSpec
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.WeightUnit
import com.bikesetup.app.data.model.WheelSize
import com.bikesetup.app.ui.setup.ManufacturerStart
import com.bikesetup.app.ui.setup.SetupForm
import com.bikesetup.app.ui.setup.StartIssue
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ManufacturerStartTest {
    private val catalog = Catalog.parse(File("../catalog/dist/catalog.json").readText())
    private val full = SuspensionSpec(hsrEnabled = true)
    private val psi = UserSettings(PressureUnit.PSI, PressureUnit.BAR, WeightUnit.KG)

    private fun bike(
        fork: CatalogRefEntity? = null,
        shock: CatalogRefEntity? = null,
        forkChart: List<ChartRow> = emptyList(),
        forkSpec: SuspensionSpec = full,
        shockType: ShockType = ShockType.AIR,
    ) = BikeEntity("b", "Bike", BikeType.ENDURO, WheelSize.TWENTY_NINE, "", "", shockType, "", 0, 0, null, forkSpec, full, fork, shock, forkChart)

    private fun ref(model: String, damper: String, spring: String? = null, travel: Int? = null) = CatalogRefEntity(model, 2026, damper, spring, travel)

    private fun start(form: SetupForm, bike: BikeEntity, end: SuspensionEnd, settings: UserSettings = psi) =
        ManufacturerStart.apply(form, bike, settings, end, catalog.resolve(bike, end))

    @Test
    fun `catalogue lists forks and covers year ranges`() {
        assertTrue(catalog.families(SuspensionEnd.FORK, "Fox").containsAll(listOf("36", "38", "36SL")))
        assertEquals(2027, catalog.years(SuspensionEnd.FORK, "Fox", "38").first())
        assertEquals("rockshox-lyrik-charger3", catalog.modelFor(SuspensionEnd.FORK, "RockShox", "Lyrik", 2024)?.id)
    }

    @Test
    fun `fox 38 grip x2 for a 75 kg rider`() {
        val bike = bike(fork = ref("fox-38-2026", "GRIP_X2", "FLOAT", 170))
        val result = start(SetupForm(riderWeight = "75"), bike, SuspensionEnd.FORK)
        assertEquals(listOf("89", "7", "6", "5", "10", "2"), with(result.form) { listOf(forkPressure, forkRebound, forkHsr, forkHsc, forkLsc, forkTokens) })
        assertEquals(6, result.changed)
        assertEquals(SagSpan(15, 20), catalog.sag(bike, SuspensionEnd.FORK))
    }

    @Test
    fun `2019 fork interpolates pressure and reads rebound by pressure`() {
        val result = start(SetupForm(riderWeight = "75"), bike(fork = ref("fox-36-2019", "GRIP2", "FLOAT")), SuspensionEnd.FORK)
        assertEquals(listOf("72", "6", "5", "10", "6"), with(result.form) { listOf(forkPressure, forkRebound, forkHsr, forkHsc, forkLsc) })
    }

    @Test
    fun `pressure is written in the user unit and weight is required`() {
        val bike = bike(fork = ref("fox-38-2026", "GRIP_X2", "FLOAT"))
        assertEquals("6.14", start(SetupForm(riderWeight = "75"), bike, SuspensionEnd.FORK, psi.copy(suspensionPressureUnit = PressureUnit.BAR)).form.forkPressure)
        val missing = start(SetupForm(), bike, SuspensionEnd.FORK)
        assertTrue(StartIssue.NEED_WEIGHT in missing.issues)
        assertEquals("", missing.form.forkPressure)
    }

    @Test
    fun `float x2 damping comes from the shock pressure`() {
        val bike = bike(shock = ref("fox-float-x2-2026", "STANDARD"))
        val result = start(SetupForm(riderWeight = "75", shockPressure = "210"), bike, SuspensionEnd.SHOCK)
        assertEquals(listOf("7", "4", "9", "4"), with(result.form) { listOf(shockRebound, shockHsr, shockLsc, shockHsc) })
        assertEquals(setOf(StartIssue.NEED_SHOCK_PRESSURE), start(SetupForm(riderWeight = "75"), bike, SuspensionEnd.SHOCK).issues)
    }

    @Test
    fun `dhx2 damping comes from the spring rate`() {
        val bike = bike(shock = ref("fox-dhx2-2026", "STANDARD"), shockType = ShockType.COIL)
        val result = start(SetupForm(shockSpringRate = "200"), bike, SuspensionEnd.SHOCK)
        assertEquals(listOf("14", "8", "11", "6"), with(result.form) { listOf(shockRebound, shockHsr, shockLsc, shockHsc) })
    }

    @Test
    fun `sticker chart combines with the rockshox starting rule`() {
        val bike = bike(
            fork = ref("rockshox-lyrik-charger3", "CHARGER3_RC2"),
            forkSpec = SuspensionSpec(lscMax = 16, hscMax = 4),
            forkChart = listOf(ChartRow(64.0, 73.0, 80.0, 10, null), ChartRow(73.0, 82.0, 88.0, 9, null)),
        )
        val result = start(SetupForm(riderWeight = "75"), bike, SuspensionEnd.FORK)
        assertEquals(listOf("88", "9", "8", "2"), with(result.form) { listOf(forkPressure, forkRebound, forkLsc, forkHsc) })
    }
}
