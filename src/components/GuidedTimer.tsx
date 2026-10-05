import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { Session } from '../data/program'
import { buildPhases, formatClock, totalSeconds, type Phase } from '../lib/timer'

interface Props {
  session: Session
  onFinish: () => void
  onClose: () => void
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

type Action = { type: 'tick' } | { type: 'toggle' } | { type: 'jump'; to: number }

function reducer(phases: Phase[]) {
  return (state: TimerState, action: Action): TimerState => {
    switch (action.type) {
      case 'toggle':
        return { ...state, running: !state.running }
      case 'jump': {
        const index = Math.min(Math.max(action.to, 0), phases.length - 1)
        return { ...state, index, remaining: phases[index].seconds, done: false }
      }
      case 'tick': {
        if (!state.running || state.done) return state
        if (state.remaining > 1) return { ...state, remaining: state.remaining - 1 }
        const index = state.index + 1
        if (index < phases.length) return { ...state, index, remaining: phases[index].seconds }
        return { ...state, remaining: 0, running: false, done: true }
      }
    }
  }
}

export function GuidedTimer({ session, onFinish, onClose }: Props) {
  const phases = useMemo(() => buildPhases(session), [session])
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

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => window.clearInterval(id)
  }, [running])

  // Audio cues: countdown pips, a tone on each phase change, a long tone when done.
  useEffect(() => {
    if (running && remaining <= 3 && remaining > 0) beep(660, 80)
  }, [remaining, running])
  useEffect(() => {
    if (index > 0) beep(phases[index].kind === 'work' ? 990 : 520, 200)
  }, [index, phases])
  useEffect(() => {
    if (!done) return
    beep(990, 400)
    finishRef.current()
  }, [done])

  const jump = (to: number) => dispatch({ type: 'jump', to })

  const elapsed = phases.slice(0, index).reduce((s, p) => s + p.seconds, 0) + (phase.seconds - remaining)
  const total = totalSeconds(phases)
  const pct = Math.min(100, (elapsed / total) * 100)

  return (
    <div className={`timer timer--${done ? 'done' : phase.kind}`} role="region" aria-label="Guided timer">
      <div className="timer__top">
        <span className="timer__kind">{done ? 'Done' : KIND_LABEL[phase.kind]}</span>
        {phase.round && session.rounds > 1 && !done && (
          <span className="timer__round">
            Round {phase.round} of {session.rounds}
          </span>
        )}
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close timer">
          ✕
        </button>
      </div>

      <p className="timer__label" aria-live="polite">
        {done ? 'Workout complete! 🎿' : phase.label}
      </p>
      <p className="timer__clock" aria-hidden={running}>
        {formatClock(done ? 0 : remaining)}
      </p>
      <p className="timer__next">{!done && next ? `Next: ${next.label}` : ' '}</p>

      <div className="timer__bar" aria-hidden>
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="timer__total">
        {formatClock(elapsed)} / {formatClock(total)}
      </p>

      <div className="timer__controls">
        <button type="button" className="btn btn--ghost" onClick={() => jump(index - 1)} disabled={index === 0}>
          ◀ Back
        </button>
        {done ? (
          <button type="button" className="btn btn--primary" onClick={() => jump(0)}>
            Restart
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'toggle' })}>
            {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => jump(index + 1)}
          disabled={index >= phases.length - 1}
        >
          Skip ▶
        </button>
      </div>
    </div>
  )
}
