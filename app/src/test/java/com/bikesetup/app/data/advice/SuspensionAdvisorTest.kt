package com.bikesetup.app.data.advice

import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.ForkSettings
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.db.ShockSettings
import com.bikesetup.app.data.db.SuspensionSpec
import com.bikesetup.app.data.db.TireSettings
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.ShockType
import com.bikesetup.app.data.model.WheelSize
import com.bikesetup.app.ui.setup.SetupForm
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class SuspensionAdvisorTest {
    private val fullSpec = SuspensionSpec(
        lsrEnabled = true, lsrMax = 18,
        hsrEnabled = true, hsrMax = 8,
        lscEnabled = true, lscMax = 16,
        hscEnabled = true, hscMax = 8,
    )
    private val simpleSpec = SuspensionSpec(lsrEnabled = true, lsrMax = 12, hsrEnabled = false, lscEnabled = true, hscEnabled = false)

    private fun bike(forkSpec: SuspensionSpec = fullSpec, shockType: ShockType = ShockType.AIR, type: BikeType = BikeType.ENDURO) =
        BikeEntity("b", "Bike", type, WheelSize.TWENTY_NINE, "", "", shockType, "", 0, 0, null, forkSpec, fullSpec)

    private fun setup(fork: ForkSettings = ForkSettings(tokens = 2, rebound = 8, hsr = 6, lsc = 10, hsc = 4)) = SetupEntity(
        "s", "b", null, LocalDate.of(2026, 11, 10), 75.0, null, null,
        fork, ShockSettings(tokens = 1, rebound = 7, hsr = 5, lsc = 8, hsc = 4), TireSettings(), "", 0, 0,
    )

    @Test
    fun `kick back closes high speed rebound when the damper has it`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_KICKS_BACK, bike(), setup())!!
        assertEquals(Adjuster.HSR, r.adjuster)
        assertEquals(Effect.MORE_DAMPING, r.effect)
        assertEquals(6, r.from)
        assertEquals(4, r.to)
        assertEquals(8, r.max)
    }

    @Test
    fun `without high speed rebound the advice falls back to rebound`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_KICKS_BACK, bike(simpleSpec), setup())!!
        assertEquals(Adjuster.LSR, r.adjuster)
        assertEquals(6, r.to)
    }

    @Test
    fun `packing down opens rebound and never goes past the maximum`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_PACKS_DOWN, bike(), setup(ForkSettings(hsr = 7)))!!
        assertEquals(Adjuster.HSR, r.adjuster)
        assertEquals(8, r.to)
    }

    @Test
    fun `an adjuster at its limit gives way to the next option`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_PACKS_DOWN, bike(), setup(ForkSettings(hsr = 8, rebound = 5)))!!
        assertEquals(Adjuster.LSR, r.adjuster)
        assertEquals(7, r.to)
    }

    @Test
    fun `closing never goes below zero`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_DIVES, bike(), setup(ForkSettings(lsc = 1)))!!
        assertEquals(0, r.to)
        assertTrue(r.canApply)
    }

    @Test
    fun `bottoming out adds a token first`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_BOTTOMS_OUT, bike(), setup())!!
        assertEquals(Adjuster.TOKENS, r.adjuster)
        assertEquals(3, r.to)
    }

    @Test
    fun `coil shock gets compression advice instead of tokens`() {
        val r = SuspensionAdvisor.recommend(Symptom.SHOCK_BOTTOMS_OUT, bike(shockType = ShockType.COIL), setup())!!
        assertEquals(Adjuster.HSC, r.adjuster)
        assertEquals(2, r.to)
    }

    @Test
    fun `hardtail has no shock symptoms`() {
        assertTrue(SuspensionAdvisor.symptoms(bike(shockType = ShockType.NONE), SuspensionEnd.SHOCK).isEmpty())
        assertEquals(6, SuspensionAdvisor.symptoms(bike(), SuspensionEnd.FORK).size)
    }

    @Test
    fun `missing value gives relative advice that cannot be applied automatically`() {
        val r = SuspensionAdvisor.recommend(Symptom.FORK_HARSH, bike(), setup(ForkSettings()))!!
        assertEquals(Adjuster.HSC, r.adjuster)
        assertNull(r.to)
        assertFalse(r.canApply)
    }

    @Test
    fun `no matching adjuster gives no recommendation`() {
        val noCompression = SuspensionSpec(lsrEnabled = true, hsrEnabled = false, lscEnabled = false, hscEnabled = false)
        assertNull(SuspensionAdvisor.recommend(Symptom.FORK_DIVES, bike(noCompression), setup()))
    }

    @Test
    fun `starting point fills only empty fields with the middle of the range and target sag`() {
        val (form, filled) = SetupForm(forkHsc = "3").withStartingPoint(bike())
        assertEquals("9", form.forkRebound)
        assertEquals("4", form.forkHsr)
        assertEquals("8", form.forkLsc)
        assertEquals("3", form.forkHsc)
        assertEquals("22.5", form.forkSag)
        assertEquals("30", form.shockSag)
        assertEquals(9, filled)
    }

    @Test
    fun `values above the maximum block saving`() {
        assertTrue(SetupForm(forkHsr = "9").exceedsLimits(bike()))
        assertFalse(SetupForm(forkHsr = "8").exceedsLimits(bike()))
        assertFalse(SetupForm(forkHsr = "99").exceedsLimits(bike(simpleSpec)))
    }

    @Test
    fun `recommendation is applied to the matching form field`() {
        val r = SuspensionAdvisor.recommend(Symptom.SHOCK_BOBS, bike(), setup())!!
        assertEquals("6", SetupForm(shockLsc = "8").withRecommendation(r).shockLsc)
    }
}
