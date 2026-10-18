import type { Session } from '../data/program'
import { buildPhases, type Phase } from './timer'

/**
 * Calorie estimates use the MET method: calories = MET × resting burn × time,
 * where a MET is a multiple of resting metabolic rate. Resting burn is
 * personalised with the Mifflin-St Jeor equation (weight, height, age, sex),
 * which is why age and height matter. MET values come from the Compendium of
 * Physical Activities (calisthenics, resistance training, stretching, Pilates)
 * and rounded to one value per kind of work. Expect roughly ±25% error.
 */

export interface Profile {
  weightLb: number
  ageYears: number
  heightIn: number
  sex: 'female' | 'male'
}

/** 155 lb, 38-year-old woman. Height was not given, so 5'5" is assumed. */
export const DEFAULT_PROFILE: Profile = { weightLb: 155, ageYears: 38, heightIn: 65, sex: 'female' }

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54

/** Resting calories per hour (Mifflin-St Jeor), from weight, height, age and sex. */
export function restingKcalPerHour(p: Profile): number {
  const bmr = 10 * p.weightLb * KG_PER_LB + 6.25 * p.heightIn * CM_PER_IN - 5 * p.ageYears + (p.sex === 'male' ? 5 : -161)
  return Math.max(bmr, 0) / 24
}

/** Effort of the cardio work intervals by week: easy marching early, hard bursts later. */
function cardioMet(week: number): number {
  if (week <= 2) return 5
  if (week <= 4) return 7
  if (week <= 8) return 9
  return 10
}

/** Resistance work is steadier; later weeks use heavier weights and slow tempos. */
function strengthMet(week: number): number {
  return week <= 4 ? 3.5 : 5
}

const MET = { warmup: 3, cooldown: 2.5, rest: 2, core: 3.8, stretchStatic: 2.3, stretchFlow: 2.8 }

/** Time for a rep-based step: about 3 seconds a rep (longer with a slow lowering) plus setup. */
export function manualSeconds(label: string, detail = ''): number {
  const n = Number(/(\d+)(?:–(\d+))?/.exec(detail)?.[2] ?? /(\d+)/.exec(detail)?.[1] ?? 10)
  if (/sec/.test(detail) && !/rep/.test(detail)) return n + 5
  const tempo = Number(/(\d)-sec/.exec(label)?.[1] ?? 0)
  // "15 each side, alternating" is the total across both sides.
  const reps = /each side/.test(detail) ? n * 2 : n
  return reps * (tempo ? tempo + 1.5 : 3) + 10
}

function metOf(session: Session, phase: Phase, week: number): number {
  if (phase.kind === 'warmup') return MET.warmup
  if (phase.kind === 'cooldown') return MET.cooldown
  if (phase.kind === 'rest') return MET.rest
  const ex = phase.exerciseIndex === undefined ? undefined : session.exercises[phase.exerciseIndex]
  if (ex?.met) return ex.met
  switch (session.kind) {
    case 'cardio':
      return cardioMet(week)
    case 'strength':
      return strengthMet(week)
    case 'stretch':
      return ex?.perSide ? MET.stretchStatic : MET.stretchFlow
    default:
      return MET.core
  }
}

export interface Estimate {
  kcal: number
  seconds: number
}

/** Estimated calories and time for one session in the given program week. */
export function estimateSession(session: Session, week: number, profile: Profile): Estimate {
  const perSecond = restingKcalPerHour(profile) / 3600
  let kcal = 0
  let seconds = 0
  for (const phase of buildPhases(session)) {
    const s = phase.manual ? manualSeconds(phase.label, phase.detail) : phase.seconds
    kcal += metOf(session, phase, week) * perSecond * s
    seconds += s
  }
  return { kcal, seconds }
}

/** Rounds to the nearest 5 so the estimate doesn't look more precise than it is. */
export function roundKcal(kcal: number): number {
  return Math.round(kcal / 5) * 5
}

export function sumKcal(estimates: Estimate[]): number {
  return estimates.reduce((sum, e) => sum + e.kcal, 0)
}
