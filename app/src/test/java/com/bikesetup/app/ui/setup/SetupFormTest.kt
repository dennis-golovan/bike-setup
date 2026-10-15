package com.bikesetup.app.ui.setup

import com.bikesetup.app.data.model.PressureUnit
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.UserSettings
import com.bikesetup.app.data.model.Weather
import com.bikesetup.app.data.model.WeightUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class SetupFormTest {
    private val psiSettings = UserSettings(PressureUnit.PSI, PressureUnit.BAR, WeightUnit.KG)
    private val form = SetupForm(
        locationId = "loc",
        ridingDate = LocalDate.of(2026, 10, 15),
        weather = Weather.DRY,
        temperature = "14",
        riderWeight = "82",
        forkPressure = "85",
        forkTokens = "2",
        shockPressure = "210",
        shockSpringRate = "450",
        shockTokens = "1",
        frontTirePressure = "1,6",
        rearTirePressure = "1.75",
        notes = "  fast  ",
    )

    @Test
    fun `round trip through entity keeps form values`() {
        val entity = form.toEntity("id", "bike", ShockType.AIR, psiSettings, 1, 2)
        val restored = entity.toForm(psiSettings)
        assertEquals("85", restored.forkPressure)
        assertEquals("210", restored.shockPressure)
        assertEquals("1.6", restored.frontTirePressure)
        assertEquals("1.75", restored.rearTirePressure)
        assertEquals("fast", restored.notes)
        assertEquals("2", restored.forkTokens)
    }

    @Test
    fun `air shock drops spring rate`() {
        val entity = form.toEntity("id", "bike", ShockType.AIR, psiSettings, 1, 2)
        assertNull(entity.shock.springRateLbs)
        assertEquals(1, entity.shock.tokens)
    }

    @Test
    fun `coil shock keeps spring rate and drops air values`() {
        val entity = form.toEntity("id", "bike", ShockType.COIL, psiSettings, 1, 2)
        assertEquals(450, entity.shock.springRateLbs)
        assertNull(entity.shock.pressureBar)
        assertNull(entity.shock.tokens)
    }

    @Test
    fun `hardtail stores no shock values`() {
        val entity = form.toEntity("id", "bike", ShockType.NONE, psiSettings, 1, 2)
        assertNull(entity.shock.pressureBar)
        assertNull(entity.shock.sagPercent)
    }

    @Test
    fun `values shown in another unit after settings change`() {
        val entity = form.toEntity("id", "bike", ShockType.AIR, psiSettings, 1, 2)
        val inBar = entity.toForm(psiSettings.copy(suspensionPressureUnit = PressureUnit.BAR))
        assertEquals("5.86", inBar.forkPressure)
    }

    @Test
    fun `fresh copy resets day conditions only`() {
        val copy = form.asFreshCopy()
        assertNull(copy.weather)
        assertEquals("", copy.temperature)
        assertEquals("", copy.notes)
        assertEquals(LocalDate.now(), copy.ridingDate)
        assertEquals("85", copy.forkPressure)
        assertEquals("loc", copy.locationId)
    }

    @Test
    fun `invalid numbers block saving`() {
        assertFalse(form.hasErrors)
        assertTrue(form.copy(forkTokens = "1.5").hasErrors)
        assertTrue(form.copy(forkPressure = "abc").hasErrors)
        assertFalse(form.copy(temperature = "-5").hasErrors)
    }
}
