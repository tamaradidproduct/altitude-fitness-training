import type { Profile } from '../lib/calories'

interface Props {
  profile: Profile
  onChange: (profile: Profile) => void
}

const FIELDS: Array<{ key: 'weightLb' | 'ageYears' | 'heightIn'; label: string; min: number; max: number }> = [
  { key: 'weightLb', label: 'Weight (lb)', min: 50, max: 600 },
  { key: 'heightIn', label: 'Height (in)', min: 36, max: 96 },
  { key: 'ageYears', label: 'Age', min: 10, max: 100 },
]

/** Body details behind the calorie estimates. Stored on this device only. */
export function CalorieSettings({ profile, onChange }: Props) {
  return (
    <details className="settings">
      <summary>Calorie estimate settings</summary>
      <div className="settings__body">
        <div className="settings__grid">
          {FIELDS.map(({ key, label, min, max }) => (
            <label key={key} className="settings__field">
              <span>{label}</span>
              <input
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                value={profile[key]}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (Number.isFinite(value) && value >= min && value <= max) onChange({ ...profile, [key]: value })
                }}
              />
            </label>
          ))}
          <label className="settings__field">
            <span>Sex</span>
            <select value={profile.sex} onChange={(e) => onChange({ ...profile, sex: e.target.value as Profile['sex'] })}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
        </div>
        <p className="muted">
          Estimates multiply your resting burn (from weight, height, age and sex) by how hard each move is. They are
          rough, about ±25%, and count all calories burned during the session, including what you would burn resting.
        </p>
      </div>
    </details>
  )
}
