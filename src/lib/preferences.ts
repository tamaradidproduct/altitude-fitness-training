import { DEFAULT_PROFILE, type Profile } from './calories'

const OPTIONAL_CORE_KEY = 'strength-to-snow:optional-core:v1'

/** Names of the optional core exercises the user has added (none by default). */
export function loadOptionalCore(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(OPTIONAL_CORE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((n): n is string => typeof n === 'string') : []
  } catch {
    return []
  }
}

export function saveOptionalCore(names: string[]): void {
  try {
    localStorage.setItem(OPTIONAL_CORE_KEY, JSON.stringify(names))
  } catch {
    // Storage unavailable; the selection lasts until the page reloads.
  }
}

const PROFILE_KEY = 'strength-to-snow:profile:v1'

/** Body details used for calorie estimates; defaults to a 155 lb, 38-year-old woman. */
export function loadProfile(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') as Partial<Profile>
    const num = (v: unknown, fallback: number, min: number, max: number) =>
      typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fallback
    return {
      weightLb: num(raw.weightLb, DEFAULT_PROFILE.weightLb, 50, 600),
      ageYears: num(raw.ageYears, DEFAULT_PROFILE.ageYears, 10, 100),
      heightIn: num(raw.heightIn, DEFAULT_PROFILE.heightIn, 36, 96),
      sex: raw.sex === 'male' ? 'male' : 'female',
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // Storage unavailable; the profile lasts until the page reloads.
  }
}
