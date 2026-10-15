package com.bikesetup.app.ui.common

import org.junit.Assert.assertEquals
import org.junit.Test

class AppLocaleTest {
    @Test
    fun `device language picks a supported app language`() {
        assertEquals(AppLanguage.DE, detectLanguage(listOf("de", "en")))
        assertEquals(AppLanguage.UK, detectLanguage(listOf("uk")))
        assertEquals(AppLanguage.UK, detectLanguage(listOf("ru")))
        assertEquals(AppLanguage.EN, detectLanguage(listOf("pl", "en")))
        assertEquals(AppLanguage.EN, detectLanguage(listOf("fr")))
        assertEquals(AppLanguage.EN, detectLanguage(emptyList()))
    }

    @Test
    fun `manual choice wins over device language`() {
        assertEquals(AppLanguage.EN, resolveLanguage(AppLanguage.EN, listOf("uk")))
        assertEquals(AppLanguage.UK, resolveLanguage(AppLanguage.AUTO, listOf("uk")))
    }
}
