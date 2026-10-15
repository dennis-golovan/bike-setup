package com.bikesetup.app.data.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class UnitsTest {
    @Test
    fun `psi round trip keeps displayed value`() {
        val bar = Units.pressureToBar(85.0, PressureUnit.PSI)
        assertEquals("85", formatDecimal(Units.pressureFromBar(bar, PressureUnit.PSI), 1))
    }

    @Test
    fun `psi converts to bar`() {
        assertEquals("6.21", formatDecimal(Units.pressureToBar(90.0, PressureUnit.PSI), 2))
    }

    @Test
    fun `pounds round trip keeps displayed value`() {
        val kg = Units.weightToKg(180.0, WeightUnit.LB)
        assertEquals("180", formatDecimal(Units.weightFromKg(kg, WeightUnit.LB), 1))
    }

    @Test
    fun `decimal parsing accepts comma`() {
        assertEquals(1.75, parseDecimal(" 1,75 ")!!, 0.0)
        assertNull(parseDecimal(""))
        assertNull(parseDecimal("abc"))
    }

    @Test
    fun `validation rejects negatives unless allowed`() {
        assertTrue(isDecimalValid(""))
        assertFalse(isDecimalValid("-3"))
        assertTrue(isDecimalValid("-3", allowNegative = true))
        assertFalse(isCountValid("1.5"))
        assertFalse(isCountValid("-1"))
        assertTrue(isCountValid("12"))
    }
}
