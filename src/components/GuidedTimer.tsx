import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { Session } from '../data/program'
import { buildFlowPhases, formatClock, type Phase } from '../lib/timer'

interface Props {
  /** Sessions run back to back, in order. */
  sessions: Session[]
  onFinish: () => void
}

let audioCtx: AudioContext | null = null
function beep(freq = 880, ms = 150) {
  try {
    audioCtx ??= new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.15
    osc.connect(gain).connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + ms / 1000)
  } catch {
    // Audio unavailable; the timer still works silently.
  }
}

const KIND_LABEL = { warmup: 'Warm-up', work: 'Work', rest: 'Recover', cooldown: 'Cooldown' } as const

interface TimerState {
  index: number
  remaining: number
  running: boolean
  done: boolean
}

type Action = { type: 'tick' } | { type: 'toggle' } | { type: 'next' } | { type: 'jump'; to: number }

function advance(state: TimerState, phases: Phase[]): TimerState {
  const index = state.index + 1
  if (index < phases.length) return { ...state, index, remaining: phases[index].seconds }
  return { ...state, remaining: 0, running: false, done: true }
}

function reducer(phases: Phase[]) {
  return (state: TimerState, action: Action): TimerState => {
    switch (action.type) {
      case 'toggle':
        return { ...state, running: !state.running }
      case 'next':
        return state.done ? state : advance(state, phases)
      case 'jump': {
        const index = Math.min(Math.max(action.to, 0), phases.length - 1)
        return { ...state, index, remaining: phases[index].seconds, done: false }
      }
      case 'tick':
        if (!state.running || state.done || phases[state.index].manual) return state
        return state.remaining > 1 ? { ...state, remaining: state.remaining - 1 } : advance(state, phases)
    }
  }
}

export function GuidedTimer({ sessions, onFinish }: Props) {
  const phases = useMemo(() => buildFlowPhases(sessions), [sessions])
  const [{ index, remaining, running, done }, dispatch] = useReducer(reducer(phases), {
    index: 0,
    remaining: phases[0]?.seconds ?? 0,
    running: false,
    done: false,
  })
  const finishRef = useRef(onFinish)
  useEffect(() => {
    finishRef.current = onFinish
  })

  const phase = phases[index]
  const next = phases[index + 1]
  const manual = Boolean(phase.manual)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => window.clearInterval(id)
  }, [running])

  // Audio cues: countdown pips, a tone on each phase change, a long tone when done.
  useEffect(() => {
    if (running && !manual && remaining <= 3 && remaining > 0) beep(660, 80)
  }, [remaining, running, manual])
  useEffect(() => {
    if (index > 0) beep(phases[index].kind === 'work' ? 990 : 520, 200)
  }, [index, phases])
  useEffect(() => {
    if (!done) return
    beep(990, 400)
    finishRef.current()
  }, [done])

  const started = running || index > 0 || remaining !== phases[0].seconds
  const pct = done ? 100 : (index / phases.length) * 100
  const kind = done ? 'done' : phase.kind

  return (
    <div className={`timer timer--${kind}`} role="region" aria-label="Guided timer">
      <div className="timer__top">
        <span className="timer__kind">{done ? 'Done' : manual ? 'Your pace' : KIND_LABEL[phase.kind]}</span>
        {!done && <span className="timer__round">{phase.section}</span>}
        {!done && phase.round && sessions.find((s) => (s.nickname ?? s.title) === phase.section)!.rounds > 1 && (
          <span className="timer__round">· Round {phase.round}</span>
        )}
      </div>

      <p className="timer__label" aria-live="polite">
        {done ? 'Session complete! 🎿' : phase.label}
      </p>
      <p className={`timer__clock ${manual && !done ? 'timer__clock--manual' : ''}`}>{done ? '0:00' : manual ? phase.detail : formatClock(remaining)}</p>
      <p className="timer__next">{!done && next ? `Next: ${next.label}` : ' '}</p>

      <div className="timer__bar" aria-hidden>
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="timer__total">
        Step {done ? phases.length : index + 1} of {phases.length}
      </p>

      <div className="timer__controls">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dispatch({ type: 'jump', to: index - 1 })}
          disabled={index === 0}
        >
          ◀ Back
        </button>
        {done ? (
          <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'jump', to: 0 })}>
            Restart
          </button>
        ) : manual ? (
          <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'next' })}>
            Done ✓
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'toggle' })}>
            {running ? 'Pause' : started ? 'Resume' : 'Start'}
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'next' })} disabled={done}>
          Skip ▶
        </button>
      </div>
    </div>
  )
}
