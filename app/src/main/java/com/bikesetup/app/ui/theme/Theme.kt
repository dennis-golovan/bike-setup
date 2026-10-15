package com.bikesetup.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFFA63F00),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFFFDBCC),
    onPrimaryContainer = Color(0xFF370E00),
    secondary = Color(0xFF4A6553),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFCCEBD4),
    onSecondaryContainer = Color(0xFF062013),
    tertiary = Color(0xFF3A6377),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFBFE8FF),
    onTertiaryContainer = Color(0xFF001F2B),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFFFB595),
    onPrimary = Color(0xFF591D00),
    primaryContainer = Color(0xFF7E2D00),
    onPrimaryContainer = Color(0xFFFFDBCC),
    secondary = Color(0xFFB0CFB8),
    onSecondary = Color(0xFF1C3526),
    secondaryContainer = Color(0xFF334D3C),
    onSecondaryContainer = Color(0xFFCCEBD4),
    tertiary = Color(0xFFA2CCE3),
    onTertiary = Color(0xFF033547),
    tertiaryContainer = Color(0xFF214B5E),
    onTertiaryContainer = Color(0xFFBFE8FF),
)

@Composable
fun BikeSetupTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
