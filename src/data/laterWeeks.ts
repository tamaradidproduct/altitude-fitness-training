import type { Exercise, Session, Week, WeekPhase } from './program'
import { describe } from './descriptions'

/**
 * Weeks 3–12, transcribed from the program's matrix PDF ("Workouts.pdf").
 * Each cell is "Name | prescription". Cardio cells are just names because the
 * work/recovery split comes from the phase: Base 15/45, Peak 30/30, Send 45/15.
 *
 * Choices made while transcribing (review against the PDF):
 * - "SL" and "DB" are spelled out (Single-Leg, Dumbbell).
 * - Stretches are 30 sec each side when static and one-sided, and a single 60 sec
 *   block when the PDF describes a flow or dynamic movement.
 * - "DB Press" in Strength A is treated as a chest press, and "Dumbbell" is added to
 *   "RDL" and "Row" where the PDF leaves it out.
 */

const phaseOf = (n: number): WeekPhase => (n <= 4 ? 'Base' : n <= 8 ? 'Peak' : 'Send')

const INTERVALS: Record<WeekPhase, { work: number; rest: number }> = {
  Base: { work: 15, rest: 45 },
  Peak: { work: 30, rest: 30 },
  Send: { work: 45, rest: 15 },
}

interface Spec {
  core: string[]
  stretch: string[]
  strengthA: string[]
  strengthB: string[]
  strengthC: string[]
  cardio1: string[]
  cardio2: string[]
}

const SPECS: Record<number, Spec> = {
  3: {
    core: [
      'Forearm Plank | 60 sec',
      'Glute Bridge with Block/Ball | 30 sec',
      'Super Woman Hold | 15 sec hold ×2',
      'Alternating Crunch | 15 each side, alternating',
    ],
    stretch: [
      'Quad + Hip Flexor Stretch | 30 sec each side',
      'Half-Split Hamstring Stretch | 30 sec each side',
      'Calf + Ankle Rock | 30 sec each side',
      '90/90 Hip Switch | 60 sec',
      'Open Book Rotation | 30 sec each side',
    ],
    strengthA: [
      'Squat + Band | 12 reps',
      'Reverse Lunge + Knee Drive | 10 each side',
      'Push-Up | 10 reps',
      'Single-Leg Calf Raise | 10 each side',
      'Monster Walk | 12 each side',
    ],
    strengthB: [
      'Banded Good Morning | 12 reps',
      'Step-Up + Balance | 10 each side',
      'Single-Arm Band Row | 10 each side',
      'Single-Leg RDL | 8 each side',
      'Face Pull | 12 reps',
    ],
    strengthC: [
      'Lateral Lunge | 12 each side',
      'Wall Sit | 45 sec',
      'Reverse Lunge → Balance | 10 each side',
      'Monster Walk | 12 each side',
      'Arnold Press | 10 reps',
    ],
    cardio1: ['Jog in Place', 'Jumping Jacks', 'High Knees', 'Lateral Shuffle', 'Speed Skater Step'],
    cardio2: [
      'Quick Squats',
      'Alternating Lunge + Knee Drive',
      'Walkout + Push-Up',
      'Fast Alternating Knee Drive',
      'Low-Impact Burpee',
    ],
  },
  4: {
    core: [
      'Forearm Plank | 90 sec',
      'Glute Bridge March | 15 each side, alternating',
      'Super Woman Hold | 30 sec hold',
      'Bicycle Crunch | 15 each side, alternating',
    ],
    stretch: [
      'Couch Stretch | 30 sec each side',
      'Half-Split + Toe Pull | 30 sec each side',
      'Knee-to-Wall Ankle Mobilization | 30 sec each side',
      '90/90 Hip Stretch | 30 sec each side',
      'Thread the Needle | 30 sec each side',
    ],
    strengthA: [
      'Goblet Squat | 10 reps',
      'Split Squat | 10 each side',
      'Push-Up | 12 reps',
      'Single-Leg Calf Raise | 12 each side',
      'Lateral Lunge | 8 each side',
    ],
    strengthB: [
      'Dumbbell RDL | 10 reps',
      'Weighted Step-Up | 8 each side',
      'Dumbbell Row | 10 each side',
      'Single-Leg RDL | 10 each side',
      'Face Pull | 15 reps',
    ],
    strengthC: [
      'Cossack Squat | 8 each side',
      'Wall Sit | 60 sec',
      'Bulgarian Split Squat | 8 each side',
      'Banded Squat | 12 reps',
      'Arnold Press | 12 reps',
    ],
    cardio1: ['Quick Jog', 'Jumping Jacks', 'High Knees', 'Lateral Shuffle', 'Speed Skaters'],
    cardio2: [
      'Squat + Knee Drive',
      'Reverse Lunge + Reach',
      'Walkout + Push-Up',
      'Standing Mountain Climber',
      'Burpee',
    ],
  },
  5: {
    core: [
      'Straight-Arm Plank | 30 sec',
      'Glute Bridge on Box | 30 sec',
      'Super Woman Hold | 30 sec hold ×2',
      'Bicycle Crunch | 15 each side, alternating',
    ],
    stretch: [
      'Low Lunge + Reach | 30 sec each side',
      'Dynamic Hamstring Sweep | 60 sec',
      'Deep Squat Ankle Rocks | 60 sec',
      '90/90 Hip Switch + Reach | 60 sec',
      "World's Greatest Stretch | 30 sec each side",
    ],
    strengthA: [
      'Goblet Squat | 12 reps',
      'Weighted Split Squat | 8 each side',
      'Dumbbell Chest Press | 10 reps',
      'Weighted Calf Raise | 15 reps',
      'Lateral Lunge | 10 each side',
    ],
    strengthB: [
      'Dumbbell RDL | 12 reps',
      'Weighted Step-Up | 10 each side',
      'Dumbbell Row | 12 each side',
      'Weighted Single-Leg RDL | 8 each side',
      'Reverse Fly | 10 reps',
    ],
    strengthC: [
      'Weighted Lateral Lunge | 8 each side',
      'Weighted Wall Sit | 30 sec',
      'Weighted Split Squat | 8 each side',
      'Banded Squat | 15 reps',
      'Dumbbell Shoulder Press | 10 reps',
    ],
    cardio1: ['Jog/Run in Place', 'Jumping Jacks', 'High Knees', 'Lateral Shuffle', 'Speed Skaters'],
    cardio2: [
      'Quick Squats',
      'Reverse Lunge + Knee Drive',
      'Walkout + Push-Up',
      'Standing Mountain Climbers',
      'Burpee',
    ],
  },
  6: {
    core: [
      'Straight-Arm Plank | 45 sec',
      'Glute Bridge March on Box | 15 each side, alternating',
      'V-Sit / Boat Pose | 30 sec',
    ],
    stretch: [
      'Low Lunge + Side Bend | 30 sec each side',
      'Hamstring Sweep + Hinge | 60 sec',
      'Deep Squat Shift | 60 sec',
      'Shin Box Switches | 60 sec',
      'Lunge + Thoracic Rotation | 30 sec each side',
    ],
    strengthA: [
      'Heavier Goblet Squat | 10 reps',
      'Weighted Split Squat | 10 each side',
      'Dumbbell Chest Press | 12 reps',
      'Weighted Single-Leg Calf Raise | 10 each side',
      'Weighted Lateral Lunge | 8 each side',
    ],
    strengthB: [
      'Heavier Dumbbell RDL | 10 reps',
      'High Step-Up | 10 each side',
      'Heavier Dumbbell Row | 10 each side',
      'Weighted Single-Leg RDL | 10 each side',
      'Reverse Fly | 12 reps',
    ],
    strengthC: [
      'Weighted Lateral Lunge | 10 each side',
      'Weighted Wall Sit | 40 sec',
      'Bulgarian Split Squat | 8 each side',
      'Banded Lateral Squat | 10 each side',
      'Dumbbell Shoulder Press | 12 reps',
    ],
    cardio1: ['Fast Feet', 'Power Jacks', 'High Knees', 'Lateral Shuffle + Touch', 'Speed Skaters'],
    cardio2: [
      'Squat + Alternating Knee Drive',
      'Alternating Power Lunges',
      'Walkout + Push-Up',
      'Mountain Climbers',
      'Burpee + Reach',
    ],
  },
  7: {
    core: [
      'Straight-Arm Plank | 60 sec',
      'Single-Leg Glute Bridge | 30 sec each side',
      'V-Sit / Boat Pose | 30 sec ×2',
    ],
    stretch: [
      'Half-Kneeling Hip Flexor + Quad | 30 sec each side',
      'Inchworm to Down Dog | 60 sec',
      'Cossack Shift | 60 sec',
      '90/90 Get-Up Practice | 60 sec',
      "World's Greatest Stretch + Reach | 30 sec each side",
    ],
    strengthA: [
      'Dumbbell Front Squat | 10 reps',
      'Bulgarian Split Squat | 8 each side',
      'Heavier Dumbbell Chest Press | 10 reps',
      'Weighted Single-Leg Calf Raise | 12 each side',
      'Weighted Lateral Lunge | 10 each side',
    ],
    strengthB: [
      'Dumbbell RDL | 12 reps',
      'Weighted High Step-Up | 8 each side',
      'Dumbbell Row | 12 each side',
      'Heavier Single-Leg RDL | 8 each side',
      'Bent-Over Reverse Fly | 12 reps',
    ],
    strengthC: [
      'Weighted Cossack Squat | 8 each side',
      'Weighted Wall Sit | 45 sec',
      'Weighted Bulgarian Split Squat | 8 each side',
      'Lateral Squat Walk | 10 each side',
      'Single-Arm Press | 10 each side',
    ],
    cardio1: [
      'Fast Feet + Direction Change',
      'Seal Jacks',
      'High Knees + Arms',
      'Lateral Shuffle + Touch',
      'Skaters + Reach',
    ],
    cardio2: [
      'Squat + Cross-Body Knee',
      'Reverse Lunge → Power Knee',
      'Walkout + Push-Up + Shoulder Tap',
      'Mountain Climbers',
      'Burpee + Overhead Reach',
    ],
  },
  8: {
    core: [
      'Straight-Arm Plank | 90 sec',
      'Single-Leg Glute Bridge | 15 each side',
      'V-Sit / Boat Pose | 30 sec ×3',
    ],
    stretch: [
      'Couch Stretch + Glute Squeeze | 30 sec each side',
      'Dynamic Hamstring Reach | 60 sec',
      'Cossack Squat Mobility | 60 sec',
      'Shin Box + Hip Extension | 60 sec',
      'Lunge Rotation + Hamstring Rock | 30 sec each side',
    ],
    strengthA: [
      'Dumbbell Front Squat | 12 reps',
      'Weighted Bulgarian Split Squat | 8 each side',
      'Dumbbell Chest Press | 12 reps',
      'Weighted Single-Leg Calf Raise | 15 each side',
      'Cossack Squat | 8 each side',
    ],
    strengthB: [
      'Heavy Dumbbell RDL | 10 reps',
      'Step-Up + Knee Drive | 10 each side',
      'Heavy Dumbbell Row | 10 each side',
      'Weighted Single-Leg RDL | 10 each side',
      'Renegade Row | 8 each side',
    ],
    strengthC: [
      'Weighted Cossack Squat | 10 each side',
      'Weighted Wall Sit | 60 sec',
      'Weighted Bulgarian Split Squat | 10 each side',
      'Banded Lateral Squat | 12 each side',
      'Single-Arm Press | 12 each side',
    ],
    cardio1: ['Sprint in Place', 'Power Jacks', 'High Knees + Arms', 'Quick Lateral Shuffle', 'Speed Skaters'],
    cardio2: [
      'Fast Squats',
      'Alternating Power Lunges',
      'Walkout + Push-Up',
      'Fast Mountain Climbers',
      'Burpee',
    ],
  },
  9: {
    core: [
      'Side Plank | 30 sec each side',
      'V-Ups | 10 reps',
      'V-Up Hold | 30 sec',
      'Plank Walk-Ups | 10 reps',
    ],
    stretch: [
      "Runner's Lunge Flow | 60 sec",
      'Down Dog → Lunge | 60 sec',
      'Deep Squat → Stand | 60 sec',
      'Cossack Flow | 60 sec',
      "World's Greatest Stretch Flow | 60 sec",
    ],
    strengthA: [
      '3-sec Eccentric Goblet Squat | 10 reps',
      '3-sec Eccentric Split Squat | 8 each side',
      '3-sec Eccentric Push-Up | 8 reps',
      '3-sec Eccentric Calf Raise | 12 reps',
      '3-sec Eccentric Lateral Lunge | 8 each side',
    ],
    strengthB: [
      '3-sec Eccentric Dumbbell RDL | 10 reps',
      'Slow Step-Down | 8 each side',
      '3-sec Eccentric Dumbbell Row | 10 reps',
      '3-sec Eccentric Single-Leg RDL | 8 each side',
      '3-sec Eccentric Reverse Fly | 10 reps',
    ],
    strengthC: [
      '3-sec Eccentric Lateral Lunge | 8 each side',
      '3-sec Squat → Hold | 8 reps',
      '3-sec Bulgarian Split Squat | 8 each side',
      '3-sec Lateral Step-Down | 8 each side',
      '3-sec Eccentric Press | 10 reps',
    ],
    cardio1: ['Fast Feet', 'Jumping Jacks', 'High Knees', 'Lateral Shuffle', 'Speed Skaters'],
    cardio2: [
      'Fast Squats',
      'Reverse Lunge + Knee Drive',
      'Walkout + Push-Up',
      'Mountain Climbers',
      'Burpees',
    ],
  },
  10: {
    core: ['Side Plank | 45 sec each side', 'V-Ups | 20 reps', 'Mountain Climbers | 30 sec'],
    stretch: [
      'Lunge → Quad Stretch Flow | 60 sec',
      'Inchworm → Down Dog | 60 sec',
      'Deep Squat + Rotation | 60 sec',
      '90/90 → Kneeling Transition | 60 sec',
      'Lateral Lunge Flow | 60 sec',
    ],
    strengthA: [
      '4-sec Eccentric Goblet Squat | 10 reps',
      '4-sec Eccentric Split Squat | 8 each side',
      '4-sec Eccentric Push-Up | 8 reps',
      '4-sec Eccentric Calf Raise | 12 reps',
      '4-sec Eccentric Lateral Lunge | 8 each side',
    ],
    strengthB: [
      '4-sec Eccentric Dumbbell RDL | 10 reps',
      '4-sec Step-Down | 8 each side',
      '4-sec Eccentric Dumbbell Row | 10 reps',
      '4-sec Eccentric Single-Leg RDL | 8 each side',
      '4-sec Eccentric Reverse Fly | 10 reps',
    ],
    strengthC: [
      '4-sec Eccentric Lateral Lunge | 8 each side',
      '4-sec Squat → Hold | 8 reps',
      '4-sec Bulgarian Split Squat | 8 each side',
      '4-sec Lateral Step-Down | 8 each side',
      '4-sec Eccentric Press | 10 reps',
    ],
    cardio1: [
      'Fast Feet + Direction Change',
      'Power Jacks',
      'High Knees + Arms',
      'Lateral Shuffle + Touch',
      'Skaters + Reach',
    ],
    cardio2: [
      'Squat + Cross-Body Knee',
      'Alternating Power Lunges',
      'Walkout + Push-Up + Shoulder Tap',
      'Cross-Body Mountain Climbers',
      'Burpee + Reach',
    ],
  },
  11: {
    core: ['Side Plank | 60 sec each side', 'V-Ups | 30 reps', 'Mountain Climbers | 45 sec'],
    stretch: [
      'Low Lunge → Hamstring Flow | 60 sec',
      'Down Dog → Calf Pedal → Lunge | 60 sec',
      'Squat Pry + Reach | 60 sec',
      'Cossack → Deep Squat | 60 sec',
      "World's Greatest Stretch → Rotation | 60 sec",
    ],
    strengthA: [
      '4-sec Eccentric Dumbbell Front Squat | 10 reps',
      '4-sec Eccentric Bulgarian Split Squat | 8 each side',
      '4-sec Eccentric Dumbbell Chest Press | 10 reps',
      'Single-Leg Eccentric Calf Raise | 10 each side',
      'Eccentric Cossack Squat | 8 each side',
    ],
    strengthB: [
      '4-sec Eccentric Dumbbell RDL | 10 reps',
      'Weighted Step-Down | 8 each side',
      '4-sec Eccentric Dumbbell Row | 10 reps',
      'Weighted Eccentric Single-Leg RDL | 8 each side',
      'Eccentric Renegade Row | 8 each side',
    ],
    strengthC: [
      'Weighted 4-sec Cossack Squat | 8 each side',
      '4-sec Squat + 10-sec Hold | 8 reps',
      'Weighted 4-sec Bulgarian Split Squat | 8 each side',
      'Weighted Lateral Step-Down | 8 each side',
      '4-sec Single-Arm Press | 8 each side',
    ],
    cardio1: ['Sprint in Place', 'Power Jacks', 'High Knees + Punch', 'Quick Lateral Shuffle', 'Speed Skaters'],
    cardio2: [
      'Fast Squat + Knee Drive',
      'Reverse Lunge → Power Knee',
      'Walkout + Push-Up',
      'Fast Mountain Climbers',
      'Burpees',
    ],
  },
  12: {
    core: [
      'Side Plank | 90 sec each side',
      'Alternating V-Ups | 15 each side, alternating',
      'Mountain Climbers | 60 sec',
    ],
    stretch: [
      'Full Lunge Flow | 60 sec',
      'Inchworm → Down Dog → Lunge | 60 sec',
      'Deep Squat Mobility Flow | 60 sec',
      '90/90 Hip Flow | 60 sec',
      'Full-Body Mountain Flow | 60 sec',
    ],
    strengthA: [
      '5-sec Eccentric Dumbbell Front Squat | 8 reps',
      '5-sec Eccentric Bulgarian Split Squat | 8 each side',
      '5-sec Eccentric Push-Up | 8 reps',
      'Single-Leg Eccentric Calf Raise | 12 each side',
      '5-sec Eccentric Lateral Lunge | 8 each side',
    ],
    strengthB: [
      '5-sec Eccentric Dumbbell RDL | 8 reps',
      'Weighted 5-sec Step-Down | 8 each side',
      '5-sec Eccentric Dumbbell Row | 8 reps',
      '5-sec Eccentric Single-Leg RDL | 8 each side',
      'Eccentric Reverse Fly | 10 reps',
    ],
    strengthC: [
      'Weighted 5-sec Cossack Squat | 8 each side',
      '5-sec Squat + 15-sec Hold | 6 reps',
      'Weighted 5-sec Bulgarian Split Squat | 8 each side',
      '5-sec Lateral Step-Down | 8 each side',
      '5-sec Single-Arm Press | 8 each side',
    ],
    cardio1: ['Sprint in Place', 'Power Jacks', 'High Knees + Punch', 'Lateral Shuffle + Touch', 'Skaters + Reach'],
    cardio2: [
      'Fast Squat + Knee Drive',
      'Alternating Power Lunges',
      'Walkout + Push-Up + Shoulder Tap',
      'Cross-Body Mountain Climbers',
      'Burpees',
    ],
  },
}

/** "30 sec each side" → timed + two-sided; "10 each side" → reps on each side; "30 sec ×2" → repeated holds. */
export function parsePrescription(rx: string): Pick<Exercise, 'seconds' | 'perSide' | 'repeats'> {
  const timed = /^(\d+) sec(?: hold)?( each side)?(?: ×(\d+))?$/.exec(rx)
  if (timed) {
    return {
      seconds: Number(timed[1]),
      ...(timed[2] ? { perSide: true } : {}),
      ...(timed[3] ? { repeats: Number(timed[3]) } : {}),
    }
  }
  if (/^\d+ each side$/.test(rx)) return { perSide: true }
  return {}
}

function exerciseOf(cell: string, known: Record<string, string>, fallbackRx = ''): Exercise {
  const [name, rx = fallbackRx] = cell.split(' | ')
  return { name, prescription: rx, description: describe(name, known), ...parsePrescription(rx) }
}

/** Equipment lists are inferred from the exercises each week uses. */
function strengthEquipment(letter: 'A' | 'B' | 'C', week: number): string[] {
  if (letter === 'A') {
    if (week === 3) return ['Resistance Band']
    return week >= 7 ? ['Dumbbells or kettlebell', 'Bench or box'] : ['Dumbbells or kettlebell']
  }
  if (letter === 'B') return week === 3 ? ['Resistance Band', 'Box'] : ['Dumbbells', 'Box', 'Resistance Band']
  return week === 3 ? ['Resistance Band', 'Dumbbells'] : ['Resistance Band', 'Dumbbells', 'Bench or box']
}

/** Builds Weeks 3–12 from the specs, reusing Week 1's session shells and every known description. */
export function buildLaterWeeks(known: Week[]): Week[] {
  const week1 = known[0]
  const descriptions: Record<string, string> = {}
  for (const w of known)
    for (const s of [w.core, w.stretch, ...w.workouts])
      for (const ex of s.exercises) descriptions[ex.name] ??= ex.description

  const [a, b, c, cardio1, cardio2] = week1.workouts

  return Object.entries(SPECS).map(([key, spec]) => {
    const number = Number(key)
    const phase = phaseOf(number)
    const interval = INTERVALS[phase]
    const intervalRx = `${interval.work}s work / ${interval.rest}s recovery`
    const exercises = (cells: string[], rx = '') => cells.map((cell) => exerciseOf(cell, descriptions, rx))

    const strength = (shell: Session, cells: string[], letter: 'A' | 'B' | 'C'): Session => ({
      ...shell,
      equipment: strengthEquipment(letter, number),
      exercises: exercises(cells),
    })
    const cardio = (shell: Session, cells: string[]): Session => ({
      ...shell,
      interval,
      exercises: exercises(cells, intervalRx),
    })

    return {
      number,
      phase,
      ...(phase === 'Base' ? { theme: 'Build the Foundation' } : {}),
      core: { ...week1.core, exercises: exercises(spec.core) },
      stretch: { ...week1.stretch, exercises: exercises(spec.stretch) },
      workouts: [
        strength(a, spec.strengthA, 'A'),
        strength(b, spec.strengthB, 'B'),
        strength(c, spec.strengthC, 'C'),
        cardio(cardio1, spec.cardio1),
        cardio(cardio2, spec.cardio2),
      ],
    }
  })
}
