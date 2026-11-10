package com.bikesetup.app.data.advice

import com.bikesetup.app.data.db.BikeEntity
import com.bikesetup.app.data.db.ForkSettings
import com.bikesetup.app.data.db.SetupEntity
import com.bikesetup.app.data.db.ShockSettings
import com.bikesetup.app.data.db.SuspensionSpec
import com.bikesetup.app.data.model.BikeType
import com.bikesetup.app.data.model.ShockType

enum class SuspensionEnd { FORK, SHOCK }

enum class Adjuster { TOKENS, LSR, HSR, LSC, HSC }

val CLICK_ADJUSTERS = listOf(Adjuster.LSR, Adjuster.HSR, Adjuster.LSC, Adjuster.HSC)

enum class Effect { MORE_DAMPING, LESS_DAMPING, ADD, REMOVE }

data class Remedy(val adjuster: Adjuster, val effect: Effect, val steps: Int)

enum class Symptom(val end: SuspensionEnd, val remedies: List<Remedy>) {
    FORK_KICKS_BACK(
        SuspensionEnd.FORK,
        listOf(Remedy(Adjuster.HSR, Effect.MORE_DAMPING, 2), Remedy(Adjuster.LSR, Effect.MORE_DAMPING, 2)),
    ),
    FORK_PACKS_DOWN(
        SuspensionEnd.FORK,
        listOf(Remedy(Adjuster.HSR, Effect.LESS_DAMPING, 2), Remedy(Adjuster.LSR, Effect.LESS_DAMPING, 2)),
    ),
    FORK_HARSH(
        SuspensionEnd.FORK,
        listOf(Remedy(Adjuster.HSC, Effect.LESS_DAMPING, 2), Remedy(Adjuster.LSC, Effect.LESS_DAMPING, 2)),
    ),
    FORK_BOTTOMS_OUT(
        SuspensionEnd.FORK,
        listOf(
            Remedy(Adjuster.TOKENS, Effect.ADD, 1),
            Remedy(Adjuster.HSC, Effect.MORE_DAMPING, 2),
            Remedy(Adjuster.LSC, Effect.MORE_DAMPING, 2),
        ),
    ),
    FORK_UNUSED_TRAVEL(
        SuspensionEnd.FORK,
        listOf(
            Remedy(Adjuster.TOKENS, Effect.REMOVE, 1),
            Remedy(Adjuster.HSC, Effect.LESS_DAMPING, 2),
            Remedy(Adjuster.LSC, Effect.LESS_DAMPING, 2),
        ),
    ),
    FORK_DIVES(SuspensionEnd.FORK, listOf(Remedy(Adjuster.LSC, Effect.MORE_DAMPING, 2))),
    SHOCK_KICKS_BACK(
        SuspensionEnd.SHOCK,
        listOf(Remedy(Adjuster.HSR, Effect.MORE_DAMPING, 2), Remedy(Adjuster.LSR, Effect.MORE_DAMPING, 2)),
    ),
    SHOCK_PACKS_DOWN(
        SuspensionEnd.SHOCK,
        listOf(Remedy(Adjuster.HSR, Effect.LESS_DAMPING, 2), Remedy(Adjuster.LSR, Effect.LESS_DAMPING, 2)),
    ),
    SHOCK_HARSH(
        SuspensionEnd.SHOCK,
        listOf(Remedy(Adjuster.HSC, Effect.LESS_DAMPING, 2), Remedy(Adjuster.LSC, Effect.LESS_DAMPING, 2)),
    ),
    SHOCK_BOTTOMS_OUT(
        SuspensionEnd.SHOCK,
        listOf(
            Remedy(Adjuster.TOKENS, Effect.ADD, 1),
            Remedy(Adjuster.HSC, Effect.MORE_DAMPING, 2),
            Remedy(Adjuster.LSC, Effect.MORE_DAMPING, 2),
        ),
    ),
    SHOCK_UNUSED_TRAVEL(
        SuspensionEnd.SHOCK,
        listOf(
            Remedy(Adjuster.TOKENS, Effect.REMOVE, 1),
            Remedy(Adjuster.HSC, Effect.LESS_DAMPING, 2),
            Remedy(Adjuster.LSC, Effect.LESS_DAMPING, 2),
        ),
    ),
    SHOCK_BOBS(SuspensionEnd.SHOCK, listOf(Remedy(Adjuster.LSC, Effect.MORE_DAMPING, 2))),
}

data class Recommendation(
    val end: SuspensionEnd,
    val adjuster: Adjuster,
    val effect: Effect,
    val steps: Int,
    val from: Int?,
    val to: Int?,
    val max: Int?,
) {
    val isAtLimit: Boolean get() = from != null && from == to
    val canApply: Boolean get() = to != null && !isAtLimit
}

fun SuspensionSpec.isEnabled(adjuster: Adjuster): Boolean = when (adjuster) {
    Adjuster.TOKENS -> true
    Adjuster.LSR -> lsrEnabled
    Adjuster.HSR -> hsrEnabled
    Adjuster.LSC -> lscEnabled
    Adjuster.HSC -> hscEnabled
}

fun SuspensionSpec.maxClicks(adjuster: Adjuster): Int? = when (adjuster) {
    Adjuster.TOKENS -> null
    Adjuster.LSR -> lsrMax
    Adjuster.HSR -> hsrMax
    Adjuster.LSC -> lscMax
    Adjuster.HSC -> hscMax
}

fun ForkSettings.value(adjuster: Adjuster): Int? = when (adjuster) {
    Adjuster.TOKENS -> tokens
    Adjuster.LSR -> rebound
    Adjuster.HSR -> hsr
    Adjuster.LSC -> lsc
    Adjuster.HSC -> hsc
}

fun ShockSettings.value(adjuster: Adjuster): Int? = when (adjuster) {
    Adjuster.TOKENS -> tokens
    Adjuster.LSR -> rebound
    Adjuster.HSR -> hsr
    Adjuster.LSC -> lsc
    Adjuster.HSC -> hsc
}

fun BikeEntity.spec(end: SuspensionEnd): SuspensionSpec = if (end == SuspensionEnd.FORK) forkSpec else shockSpec

fun BikeEntity.hasEnd(end: SuspensionEnd): Boolean = end == SuspensionEnd.FORK || shockType != ShockType.NONE

fun BikeEntity.isAvailable(end: SuspensionEnd, adjuster: Adjuster): Boolean = hasEnd(end) && when (adjuster) {
    Adjuster.TOKENS -> end == SuspensionEnd.FORK || shockType == ShockType.AIR
    else -> spec(end).isEnabled(adjuster)
}

fun SetupEntity.value(end: SuspensionEnd, adjuster: Adjuster): Int? =
    if (end == SuspensionEnd.FORK) fork.value(adjuster) else shock.value(adjuster)

object SuspensionAdvisor {
    fun symptoms(bike: BikeEntity, end: SuspensionEnd): List<Symptom> =
        if (bike.hasEnd(end)) Symptom.entries.filter { it.end == end } else emptyList()

    fun recommend(symptom: Symptom, bike: BikeEntity, setup: SetupEntity): Recommendation? {
        val options = symptom.remedies
            .filter { bike.isAvailable(symptom.end, it.adjuster) }
            .map { compute(it, symptom.end, bike, setup) }
        return options.firstOrNull { !it.isAtLimit } ?: options.firstOrNull()
    }

    private fun compute(remedy: Remedy, end: SuspensionEnd, bike: BikeEntity, setup: SetupEntity): Recommendation {
        val max = bike.spec(end).maxClicks(remedy.adjuster)
        val from = setup.value(end, remedy.adjuster)
        val delta = when (remedy.effect) {
            Effect.MORE_DAMPING, Effect.REMOVE -> -remedy.steps
            Effect.LESS_DAMPING, Effect.ADD -> remedy.steps
        }
        val to = from?.let { (it + delta).coerceAtLeast(0).let { value -> max?.let(value::coerceAtMost) ?: value } }
        return Recommendation(end, remedy.adjuster, remedy.effect, remedy.steps, from, to, max)
    }
}

data class SagRange(val min: Int, val max: Int) {
    val target: Double get() = (min + max) / 2.0
}

object StartingPoint {
    fun forkSag(type: BikeType): SagRange = when (type) {
        BikeType.XC -> SagRange(15, 20)
        BikeType.DOWNHILL -> SagRange(25, 30)
        BikeType.DIRT_JUMP -> SagRange(10, 15)
        else -> SagRange(20, 25)
    }

    fun shockSag(type: BikeType): SagRange = when (type) {
        BikeType.XC, BikeType.DIRT_JUMP -> SagRange(20, 25)
        BikeType.ENDURO -> SagRange(28, 32)
        BikeType.DOWNHILL -> SagRange(30, 35)
        else -> SagRange(25, 30)
    }

    fun middle(max: Int): Int = (max + 1) / 2
}
