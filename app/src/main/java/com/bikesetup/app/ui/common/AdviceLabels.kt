package com.bikesetup.app.ui.common

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import com.bikesetup.app.R
import com.bikesetup.app.data.advice.Adjuster
import com.bikesetup.app.data.advice.Effect
import com.bikesetup.app.data.advice.Recommendation
import com.bikesetup.app.data.advice.Symptom
import com.bikesetup.app.data.db.SuspensionSpec

@StringRes
fun Symptom.labelRes(): Int = when (this) {
    Symptom.FORK_KICKS_BACK -> R.string.symptom_fork_kicks_back
    Symptom.FORK_PACKS_DOWN -> R.string.symptom_fork_packs_down
    Symptom.FORK_HARSH -> R.string.symptom_fork_harsh
    Symptom.FORK_BOTTOMS_OUT -> R.string.symptom_fork_bottoms_out
    Symptom.FORK_UNUSED_TRAVEL -> R.string.symptom_fork_unused_travel
    Symptom.FORK_DIVES -> R.string.symptom_fork_dives
    Symptom.SHOCK_KICKS_BACK -> R.string.symptom_shock_kicks_back
    Symptom.SHOCK_PACKS_DOWN -> R.string.symptom_shock_packs_down
    Symptom.SHOCK_HARSH -> R.string.symptom_shock_harsh
    Symptom.SHOCK_BOTTOMS_OUT -> R.string.symptom_shock_bottoms_out
    Symptom.SHOCK_UNUSED_TRAVEL -> R.string.symptom_shock_unused_travel
    Symptom.SHOCK_BOBS -> R.string.symptom_shock_bobs
}

@StringRes
fun Symptom.whyRes(): Int = when (this) {
    Symptom.FORK_KICKS_BACK -> R.string.symptom_fork_kicks_back_why
    Symptom.FORK_PACKS_DOWN -> R.string.symptom_fork_packs_down_why
    Symptom.FORK_HARSH -> R.string.symptom_fork_harsh_why
    Symptom.FORK_BOTTOMS_OUT -> R.string.symptom_fork_bottoms_out_why
    Symptom.FORK_UNUSED_TRAVEL -> R.string.symptom_fork_unused_travel_why
    Symptom.FORK_DIVES -> R.string.symptom_fork_dives_why
    Symptom.SHOCK_KICKS_BACK -> R.string.symptom_shock_kicks_back_why
    Symptom.SHOCK_PACKS_DOWN -> R.string.symptom_shock_packs_down_why
    Symptom.SHOCK_HARSH -> R.string.symptom_shock_harsh_why
    Symptom.SHOCK_BOTTOMS_OUT -> R.string.symptom_shock_bottoms_out_why
    Symptom.SHOCK_UNUSED_TRAVEL -> R.string.symptom_shock_unused_travel_why
    Symptom.SHOCK_BOBS -> R.string.symptom_shock_bobs_why
}

@StringRes
fun Adjuster.shortLabelRes(spec: SuspensionSpec): Int = when (this) {
    Adjuster.TOKENS -> R.string.field_tokens
    Adjuster.LSR -> if (spec.hsrEnabled) R.string.field_lsr else R.string.field_rebound
    Adjuster.HSR -> R.string.field_hsr
    Adjuster.LSC -> R.string.field_lsc
    Adjuster.HSC -> R.string.field_hsc
}

@StringRes
fun Adjuster.fullLabelRes(): Int = when (this) {
    Adjuster.TOKENS -> R.string.field_tokens
    Adjuster.LSR -> R.string.adjuster_lsr_full
    Adjuster.HSR -> R.string.adjuster_hsr_full
    Adjuster.LSC -> R.string.adjuster_lsc_full
    Adjuster.HSC -> R.string.adjuster_hsc_full
}

@Composable
fun clicksValue(value: Int, max: Int?): String =
    max?.let { stringResource(R.string.value_of_max, value, it) } ?: value.toString()

@Composable
fun recommendationAction(recommendation: Recommendation, spec: SuspensionSpec): String {
    val label = stringResource(recommendation.adjuster.shortLabelRes(spec))
    val steps = recommendation.steps
    return when (recommendation.effect) {
        Effect.MORE_DAMPING -> pluralStringResource(R.plurals.advice_close, steps, label, steps)
        Effect.LESS_DAMPING -> pluralStringResource(R.plurals.advice_open, steps, label, steps)
        Effect.ADD -> pluralStringResource(R.plurals.advice_add_token, steps, steps)
        Effect.REMOVE -> pluralStringResource(R.plurals.advice_remove_token, steps, steps)
    }
}

@Composable
fun recommendationChange(recommendation: Recommendation): String? {
    val from = recommendation.from
    val to = recommendation.to
    val max = recommendation.max
    return when {
        from == null || to == null || from == to -> null
        max != null -> stringResource(R.string.advice_change_of_max, from.toString(), to.toString(), max)
        else -> stringResource(R.string.advice_change, from.toString(), to.toString())
    }
}
