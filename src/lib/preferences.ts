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
