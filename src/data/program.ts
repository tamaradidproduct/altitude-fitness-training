import { buildLaterWeeks } from './laterWeeks'

export type SessionKind = 'strength' | 'cardio' | 'core' | 'stretch'

export interface Exercise {
  name: string
  /** Reps, hold time, or interval as written in the program. */
  prescription: string
  description: string
  /** Seconds for a timed exercise (holds, stretches). Exercises without it are rep-based. */
  seconds?: number
  /** Built-in rest after the exercise (or after each side); otherwise the timer adds a short one. */
  restSeconds?: number
  /** Done once on each side within every set (left, then right). */
  perSide?: boolean
  /** Added by the user from the optional list rather than part of the program. */
  optional?: boolean
  /** Hold repeated this many times with rest between (e.g. "30 sec ×2"). */
  repeats?: number
}

export interface Session {
  id: string
  kind: SessionKind
  title: string
  nickname?: string
  durationLabel: string
  rounds: number
  equipment?: string[]
  exercises: Exercise[]
  /** Cardio only: work/recovery seconds per exercise. */
  interval?: { work: number; rest: number }
  warmup?: string[]
  cooldown?: string[]
  /** Seconds per warmup/cooldown move. */
  transitionSeconds?: number
}

export type WeekPhase = 'Base' | 'Peak' | 'Send'

export interface Week {
  number: number
  phase: WeekPhase
  /** Subtitle from the program PDF, when it gives one. */
  theme?: string
  /** Published path of this week's own PDF, when one exists. */
  pdf?: string
  workouts: Session[]
  core: Session
  stretch: Session
}

const core: Session = {
  id: 'core',
  kind: 'core',
  title: 'Core',
  durationLabel: '5 min',
  rounds: 1,
  exercises: [
    {
      name: 'Forearm Plank',
      prescription: '30 sec hold, 30 sec rest',
      seconds: 30,
      restSeconds: 30,
      description:
        'Start on your forearms and toes with elbows directly under your shoulders. Keep your body in a straight line from head to heels. Brace your core and squeeze your glutes without allowing your hips to sag or lift.',
    },
    {
      name: 'Glute Bridge',
      prescription: '30 sec hold, 30 sec rest',
      seconds: 30,
      restSeconds: 30,
      description:
        'Lie on your back with your knees bent and feet flat on the floor. Press through your feet and squeeze your glutes to lift your hips until your shoulders, hips, and knees form a straight line. Hold without arching your lower back.',
    },
    {
      name: 'Bird Dog',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Begin on your hands and knees. Extend one arm forward and the opposite leg backward while keeping your hips and shoulders square. Return with control and alternate sides.',
    },
    {
      name: 'Super Woman — Alternating Arm + Leg',
      prescription: '15 each side',
      seconds: 60,
      description:
        'Lie face down with your arms extended overhead. Lift one arm and the opposite leg slightly off the floor, lower with control, then alternate sides.',
    },
  ],
}

const stretch: Session = {
  id: 'stretch',
  kind: 'stretch',
  title: 'Stretch + Mobility',
  durationLabel: '5 min',
  rounds: 1,
  exercises: [
    {
      name: 'Standing Quad Stretch',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Stand tall and bring one heel toward your glute. Hold your ankle and gently draw your heel closer while keeping your knees near one another and hips facing forward.',
    },
    {
      name: 'Standing Hamstring Fold',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Extend one foot slightly in front of you with your heel down and toes lifted. Hinge from your hips over the extended leg while keeping your back long.',
    },
    {
      name: 'Calf Stretch',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Step one foot behind you and press the back heel toward the floor. Keep the back leg straight and toes facing forward.',
    },
    {
      name: 'Figure-4 Hip Stretch',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Cross one ankle over the opposite thigh and sit your hips backward as if sitting into a chair. Keep your chest lifted and gently press the bent knee outward.',
    },
    {
      name: 'Chest + Shoulder Opener',
      prescription: '60 sec',
      seconds: 60,
      description:
        'Clasp your hands behind your back or reach your arms behind you. Gently draw your shoulders back and down while opening across your chest.',
    },
  ],
}

const cardioCooldown = [
  'Easy March',
  'Standing Quad Stretch',
  'Standing Hamstring/Calf Stretch',
  'Deep Breathing + Overhead Reach',
]

export const week1: Week = {
  number: 1,
  pdf: 'pdf/week-1.pdf',
  phase: 'Base',
  theme: 'Build the Foundation',
  core,
  stretch,
  workouts: [
    {
      id: 'strength-a',
      kind: 'strength',
      title: 'Strength A',
      nickname: 'Powder Day',
      durationLabel: '15–20 min',
      rounds: 3,
      equipment: ['Resistance Band'],
      exercises: [
        {
          name: 'Bodyweight Squat',
          prescription: '12 reps',
          description:
            'Stand with your feet about hip- to shoulder-width apart. Sit your hips back and down while keeping your chest lifted and knees tracking over your toes. Press through your feet to return to standing.',
        },
        {
          name: 'Reverse Lunge',
          prescription: '8 each side',
          perSide: true,
          description:
            'Step one foot backward and lower your back knee toward the floor. Keep your front knee tracking over your foot. Push through your front foot to return to standing.',
        },
        {
          name: 'Incline Push-Up',
          prescription: '10 reps',
          description:
            'Place your hands on a sturdy elevated surface. Keep your body in a straight line as you lower your chest toward your hands, then push away from the surface.',
        },
        {
          name: 'Calf Raise',
          prescription: '15 reps',
          description:
            'Stand tall and slowly lift your heels from the floor, rising onto the balls of your feet. Pause briefly at the top and lower with control.',
        },
        {
          name: 'Band Lateral Walk',
          prescription: '10 each side',
          perSide: true,
          description:
            'Place a resistance band above your knees or around your ankles. Maintain a slight squat and step sideways while keeping tension on the band.',
        },
      ],
    },
    {
      id: 'strength-b',
      kind: 'strength',
      title: 'Strength B',
      nickname: 'Last Chair',
      durationLabel: '15–20 min',
      rounds: 3,
      equipment: ['Resistance Band', 'Box', 'Bar'],
      exercises: [
        {
          name: 'Good Morning',
          prescription: '12 reps',
          description:
            'Stand with your feet about hip-width apart. Soften your knees and push your hips backward while keeping your spine long. Squeeze your glutes to bring your hips forward and return to standing.',
        },
        {
          name: 'Step-Up',
          prescription: '8 each side',
          perSide: true,
          description:
            'Place one foot fully on a sturdy box, bench, or step. Drive through that foot to step up. Lower with control and repeat.',
        },
        {
          name: 'Band Row',
          prescription: '12 reps',
          description:
            'Anchor a resistance band securely in front of you. Pull your elbows backward, bringing your hands toward your ribs while squeezing your shoulder blades together. Slowly extend your arms.',
        },
        {
          name: 'Single-Leg RDL Reach',
          prescription: '8 each side',
          perSide: true,
          description:
            'Balance on one leg with a slight bend in your knee. Hinge forward from your hip as the opposite leg extends behind you. Reach toward the floor, then squeeze your standing-side glute to return upright.',
        },
        {
          name: 'Band Pull-Apart',
          prescription: '12 reps',
          description:
            'Hold a resistance band in front of you at shoulder height. Keeping your arms mostly straight, pull the band apart and squeeze your shoulder blades together. Return slowly.',
        },
      ],
    },
    {
      id: 'strength-c',
      kind: 'strength',
      title: 'Strength C',
      nickname: 'All Mountain Muscle',
      durationLabel: '15–20 min',
      rounds: 3,
      equipment: ['Resistance Band', 'Dumbbells or light weights'],
      exercises: [
        {
          name: 'Lateral Lunge',
          prescription: '8 each side',
          perSide: true,
          description:
            'Step wide to one side and sit your hips back over the stepping leg while keeping the opposite leg relatively straight. Push through the bent leg to return to standing.',
        },
        {
          name: 'Wall Sit',
          prescription: '30 seconds',
          seconds: 30,
          description:
            'Place your back against a wall and slide down into a comfortable squat position. Keep your back against the wall and hold while maintaining steady breathing.',
        },
        {
          name: 'Split Squat',
          prescription: '8 each side',
          perSide: true,
          description:
            'Start in a staggered stance with one foot forward and one behind you. Lower straight down by bending both knees, then press through your front foot to return to the starting position.',
        },
        {
          name: 'Banded Side Step',
          prescription: '10 each side',
          perSide: true,
          description:
            'Place a resistance band above your knees or around your ankles. Keep your knees slightly bent and step laterally while maintaining tension on the band.',
        },
        {
          name: 'Dumbbell Shoulder Press',
          prescription: '10 reps',
          description:
            'Hold dumbbells at shoulder height. Press them overhead until your arms are extended, then lower with control.',
        },
      ],
    },
    {
      id: 'cardio-1',
      kind: 'cardio',
      title: 'Cardio 1',
      nickname: 'Earn Your Turns',
      durationLabel: '~19 min',
      rounds: 3,
      interval: { work: 15, rest: 45 },
      transitionSeconds: 30,
      warmup: ['March in Place', 'Arm Circles + Reach', 'Alternating Knee Drives', 'Side-to-Side Steps'],
      cooldown: cardioCooldown,
      exercises: [
        {
          name: 'March in Place',
          prescription: '15s work / 45s recovery',
          description:
            'Stand tall and alternate lifting one knee and then the other while naturally swinging your arms. Maintain a steady rhythm.',
        },
        {
          name: 'Step Jacks',
          prescription: '15s work / 45s recovery',
          description:
            'Step one foot out to the side while raising both arms overhead. Return to center and repeat on the opposite side.',
        },
        {
          name: 'High Knee March',
          prescription: '15s work / 45s recovery',
          description:
            'March while bringing each knee toward hip height. Stay tall and coordinate your opposite arm and leg.',
        },
        {
          name: 'Side-to-Side Step',
          prescription: '15s work / 45s recovery',
          description: 'Step laterally from one side to the other. Keep your knees soft and maintain an athletic position.',
        },
        {
          name: 'Fast Feet March',
          prescription: '15s work / 45s recovery',
          description:
            'Take small, quick marching steps while pumping your arms. Focus on increasing foot speed while keeping the movement low impact.',
        },
      ],
    },
    {
      id: 'cardio-2',
      kind: 'cardio',
      title: 'Cardio 2',
      nickname: 'Do It for the Après',
      durationLabel: '~19 min',
      rounds: 3,
      interval: { work: 15, rest: 45 },
      transitionSeconds: 30,
      warmup: ['March in Place', 'Arm Circles + Reach', 'Bodyweight Squats', 'Alternating Knee Drives'],
      cooldown: cardioCooldown,
      exercises: [
        {
          name: 'Squat + Reach',
          prescription: '15s work / 45s recovery',
          description:
            'Lower into a bodyweight squat. As you stand, extend both arms overhead. Continue moving at a controlled pace.',
        },
        {
          name: 'Alternating Reverse Lunge',
          prescription: '15s work / 45s recovery',
          description:
            'Step 1 foot backward into a reverse lunge. Return to standing and repeat on the opposite side.',
        },
        {
          name: 'Walkout',
          prescription: '15s work / 45s recovery',
          description:
            'From standing, hinge forward and place your hands on the floor. Walk your hands forward into a high plank, then walk them back toward your feet and return to standing.',
        },
        {
          name: 'Standing Knee Drive',
          prescription: '15s work / 45s recovery',
          description:
            'Start with one foot slightly behind you. Drive that knee forward and upward while pulling your arms toward your knee. Return and repeat before switching sides.',
        },
        {
          name: 'Step-Back Burpee',
          prescription: '15s work / 45s recovery',
          description:
            'Squat down and place your hands on the floor. Step one foot and then the other back into a plank. Step both feet forward again and return to standing.',
        },
      ],
    },
  ],
}

/** Week 1's session with new prescriptions (descriptions are unchanged in Week 2). */
function progressed(base: Session, prescriptions: Record<string, string>, seconds: Record<string, number> = {}): Session {
  return {
    ...base,
    exercises: base.exercises.map((ex) => ({
      ...ex,
      prescription: prescriptions[ex.name] ?? ex.prescription,
      ...(seconds[ex.name] ? { seconds: seconds[ex.name] } : {}),
    })),
  }
}

const [strengthA, strengthB, strengthC] = week1.workouts

const week2Core: Session = {
  ...core,
  exercises: [
    {
      name: 'Forearm Plank',
      prescription: '45 sec hold, 15 sec rest',
      seconds: 45,
      restSeconds: 15,
      description: core.exercises[0].description,
    },
    {
      name: 'Glute Bridge with Band',
      prescription: '30 sec',
      seconds: 30,
      description:
        'Lie on your back with your knees bent and feet flat on the floor. Place a resistance band above your knees. Press through your feet to lift your hips while gently pressing your knees outward against the band. Keep your hips level and glutes engaged.',
    },
    {
      name: 'Bird Dog Crunch',
      prescription: '15 each side',
      perSide: true,
      description:
        'Begin on your hands and knees. Extend one arm forward and the opposite leg backward, then bring your elbow and knee together underneath your torso. Re-extend with control before repeating.',
    },
    {
      name: 'Super Woman Hold',
      prescription: '15 sec hold, 15 sec rest',
      seconds: 15,
      restSeconds: 15,
      description:
        'Lie face down with your arms extended overhead. Lift your chest, arms, and legs slightly off the floor and hold. Keep your neck neutral and focus on creating length through your body rather than lifting as high as possible.',
    },
  ],
}

const week2Stretch: Session = {
  ...stretch,
  exercises: [
    {
      name: 'Half-Kneeling Hip Flexor',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Begin in a half-kneeling position with 1 knee on the floor and the opposite foot in front. Tuck your pelvis slightly & shift forward until you feel a stretch through the front of the kneeling-side hip.',
    },
    {
      name: 'Hamstring Hinge',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Extend 1 leg slightly in front of you with your heel grounded and toes lifted. Push your hips backward and hinge forward while keeping your spine long.',
    },
    {
      name: 'Downward Dog Pedal',
      prescription: '60 sec',
      seconds: 60,
      description:
        'Begin in downward-facing dog. Alternate bending one knee while pressing the opposite heel toward the floor. Move slowly and continuously from side to side.',
    },
    {
      name: 'Standing Figure-4',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Cross one ankle over the opposite thigh and sit your hips backward into a single-leg squat position. Keep your chest lifted and use a wall or chair for balance if needed.',
    },
    {
      name: 'Standing Side Reach',
      prescription: '30 sec each side',
      seconds: 30,
      perSide: true,
      description:
        'Stand tall and reach one arm overhead. Gently lean toward the opposite side, creating length through your torso. Return to center and switch sides.',
    },
  ],
}

const week2StrengthA: Session = (() => {
  const base = progressed(strengthA, {
    'Bodyweight Squat': '15 reps',
    'Reverse Lunge': '10 each side',
    'Calf Raise': '20 reps',
    'Band Lateral Walk': '12 each side',
  })
  return {
    ...base,
    // Week 2 swaps the incline push-up for a full push-up.
    exercises: base.exercises.map((ex) =>
      ex.name === 'Incline Push-Up'
        ? {
            name: 'Push-Up',
            prescription: '8–10 reps',
            description:
              'Begin in a straight-arm plank with your hands slightly wider than shoulder-width. Bend your elbows and lower your chest toward the floor while keeping your body in a straight line. Press through your hands to return to the starting position.',
          }
        : ex,
    ),
  }
})()

export const week2: Week = {
  number: 2,
  pdf: 'pdf/week-2.pdf',
  phase: 'Base',
  theme: 'Build the Foundation',
  core: week2Core,
  stretch: week2Stretch,
  workouts: [
    week2StrengthA,
    progressed(strengthB, {
      'Good Morning': '15 reps',
      'Step-Up': '10 each side',
      'Band Row': '15 reps',
      'Single-Leg RDL Reach': '10 each side',
      'Band Pull-Apart': '15 reps',
    }),
    progressed(
      strengthC,
      {
        'Lateral Lunge': '10 each side',
        'Wall Sit': '40 seconds',
        'Split Squat': '10 each side',
        'Banded Side Step': '12 each side',
        'Dumbbell Shoulder Press': '12 reps',
      },
      { 'Wall Sit': 40 },
    ),
    {
      id: 'cardio-1',
      kind: 'cardio',
      title: 'Cardio 1',
      nickname: 'Earn Your Turns',
      durationLabel: '~19 min',
      rounds: 3,
      interval: { work: 15, rest: 45 },
      transitionSeconds: 30,
      warmup: week1.workouts[3].warmup,
      cooldown: cardioCooldown,
      exercises: [
        {
          name: 'Power March',
          prescription: '15s work / 45s recovery',
          description:
            'March in place with intention, driving your knees higher and pumping your opposite arm forward. Move briskly while maintaining an upright posture.',
        },
        {
          name: 'Step Jacks + Arms',
          prescription: '15s work / 45s recovery',
          description:
            'Step one foot out to the side while raising both arms overhead. Return to center and repeat on the opposite side, maintaining a continuous rhythm.',
        },
        {
          name: 'Low High Knees',
          prescription: '15s work / 45s recovery',
          description:
            'Quickly alternate lifting your knees without jumping. Keep your torso tall and increase the pace while staying light on your feet.',
        },
        {
          name: 'Lateral Shuffle Step',
          prescription: '15s work / 45s recovery',
          description:
            'Take two or three quick steps sideways, then change direction. Stay low with your knees slightly bent and your feet facing forward.',
        },
        {
          name: 'Fast Feet',
          prescription: '15s work / 45s recovery',
          description:
            'Stand in an athletic position and take small, rapid steps in place. Keep your knees soft and stay light on your feet.',
        },
      ],
    },
    {
      id: 'cardio-2',
      kind: 'cardio',
      title: 'Cardio 2',
      nickname: 'Do It for the Après',
      durationLabel: '~19 min',
      rounds: 3,
      interval: { work: 15, rest: 45 },
      transitionSeconds: 30,
      warmup: week1.workouts[4].warmup,
      cooldown: cardioCooldown,
      exercises: [
        {
          name: 'Squat + Calf Raise',
          prescription: '15s work / 45s recovery',
          description:
            'Lower into a bodyweight squat. As you return to standing, rise onto the balls of your feet. Lower your heels with control before beginning the next squat.',
        },
        {
          name: 'Reverse Lunge + Knee Drive',
          prescription: '15s work / 45s recovery',
          description:
            'Step one foot backward into a reverse lunge. Drive through your front foot to stand while bringing the back knee forward toward your chest. Repeat before switching sides.',
        },
        {
          name: 'Walkout + Shoulder Tap',
          prescription: '15s work / 45s recovery',
          description:
            'From standing, hinge forward and walk your hands into a high plank. Tap one hand to the opposite shoulder, then the other. Walk your hands back toward your feet and return to standing.',
        },
        {
          name: 'Alternating Power Knee',
          prescription: '15s work / 45s recovery',
          description:
            'Alternate strong knee drives from side to side. Use your arms to create a full-body movement and increase the pace while staying grounded.',
        },
        {
          name: 'Step-Back Burpee + Reach',
          prescription: '15s work / 45s recovery',
          description:
            'Squat down and place your hands on the floor. Step one foot and then the other back into a plank. Step your feet forward, return to standing, and reach both arms overhead.',
        },
      ],
    },
  ],
}

export const program = {
  title: 'From Strength to Snow',
  subtitle: 'Altitude Attitude + ACECoLab Pre-Season Fitness Training Program',
  weeks: [week1, week2, ...buildLaterWeeks([week1, week2])],
}

export type OptionalGroup = 'Weighted' | 'Pilates' | 'Bodyweight'

export interface OptionalExercise extends Exercise {
  group: OptionalGroup
}

/**
 * Optional extras the user can add to the daily Core routine. Not part of the
 * original program, and never included unless selected. Edit freely.
 * Alternating moves (Pilates stretches, scissors, criss-cross) are one set of
 * total reps; moves done on one side at a time are marked `perSide`.
 */
export const optionalCore: OptionalExercise[] = [
  // Weighted: one dumbbell or light weight.
  {
    group: 'Weighted',
    name: 'Goblet Squat',
    prescription: '12 reps',
    description:
      'Hold one dumbbell upright against your chest with both hands. Stand with your feet shoulder-width apart, sit your hips back and down while keeping your chest tall, then press through your feet to stand. Keep your ribs stacked over your hips so your core stays braced.',
  },
  {
    group: 'Weighted',
    name: 'Dumbbell Woodchop',
    prescription: '10 each side',
    perSide: true,
    description:
      'Hold one dumbbell with both hands high beside one shoulder. Rotate through your torso and pivot your back foot as you pull the weight diagonally down and across your body to the opposite hip. Return with control. Finish all reps on one side before switching.',
  },
  {
    group: 'Weighted',
    name: 'Weighted Russian Twist',
    prescription: '20 reps',
    description:
      'Sit with your knees bent and heels on the floor, leaning back slightly with a long spine. Hold a dumbbell at your chest and rotate your torso from side to side, moving the weight with your ribs rather than just your arms. Each side counts as one rep. Skip this one if it bothers your lower back.',
  },
  {
    group: 'Weighted',
    name: 'Weighted Plank Drag',
    prescription: '6 each side',
    perSide: true,
    description:
      'Start in a high plank with a dumbbell on the floor just outside one hand and your feet slightly wider than hip-width. Reach the opposite hand across, drag the weight under your body to the other side, and place it down. Keep your hips level and avoid rocking. One side means dragging with that hand.',
  },
  {
    group: 'Weighted',
    name: 'Weighted Glute Bridge',
    prescription: '12 reps',
    description:
      'Lie on your back with your knees bent and feet flat. Rest a dumbbell across your hips and hold it steady with both hands. Press through your feet and squeeze your glutes to lift your hips until your shoulders, hips, and knees form a straight line. Lower with control without arching your lower back.',
  },
  {
    group: 'Weighted',
    name: 'Weighted Roll-Up',
    prescription: '8 reps',
    description:
      'Sit tall with your legs extended, holding a single dumbbell or kettlebell at your chest. Slowly roll down one vertebra at a time onto your back, then articulate back up to a sitting position, reaching the weight toward your toes or overhead.',
  },

  // Pilates: the classic abdominal series of five, plus teaser variations.
  {
    group: 'Pilates',
    name: 'Single Leg Stretch',
    prescription: '10 alternating',
    description:
      'Lie on your back and curl your head and shoulders off the mat, with your knees pulled toward your chest. Place your right hand on your right ankle and your left hand on your knee, then extend your left leg long. Switch legs in a smooth rhythm, keeping your lower back pressed into the mat. Each switch counts as one rep.',
  },
  {
    group: 'Pilates',
    name: 'Double Leg Stretch',
    prescription: '8 reps',
    description:
      'Lie on your back with your head and shoulders curled up and your knees pulled in, hands on your shins. Reach both arms overhead while extending both legs forward at an angle you can control. Circle your arms around and draw your knees back in. Keep your lower back pressed into the mat.',
  },
  {
    group: 'Pilates',
    name: 'Scissors (Single Straight Leg Stretch)',
    prescription: '10 alternating',
    description:
      'Lie on your back with your head and shoulders curled up and both legs extended toward the ceiling. Lower one leg while holding the other with both hands, pulse twice toward your chest, then switch legs. Keep your hips still and lower only as far as your lower back stays on the mat. Each switch counts as one rep.',
  },
  {
    group: 'Pilates',
    name: 'Double Straight Leg Stretch',
    prescription: '8 reps',
    description:
      'Lie on your back with your head and shoulders curled up, hands behind your head, and both legs extended toward the ceiling. Lower your legs to a height where your lower back stays on the mat, then lift them back up as you keep your upper body curled. Move slowly and keep your elbows wide.',
  },
  {
    group: 'Pilates',
    name: 'Criss-Cross',
    prescription: '10 alternating',
    description:
      'Lie on your back with your hands behind your head and your head and shoulders curled up. Draw one knee toward your chest and extend the other leg. Rotate your ribcage to bring the opposite elbow toward the bent knee, then switch sides. Turn from your ribs, not your elbows. Each switch counts as one rep.',
  },
  {
    group: 'Pilates',
    name: 'Teaser Prep',
    prescription: '6 reps',
    description:
      'Lie on your back with your knees bent and one hand behind each thigh. Nod your chin and roll up through your spine until you are balanced on your sit bones, then roll back down one vertebra at a time. Keep your feet light and move with control.',
  },
  {
    group: 'Pilates',
    name: 'Single-Leg Teaser',
    prescription: '5 each side',
    perSide: true,
    description:
      'Lie on your back with one knee bent and the other leg extended toward the ceiling. Roll up to a V-sit, reaching your arms toward your raised leg. Roll back down with control. Complete all reps on one side before switching.',
  },
  {
    group: 'Pilates',
    name: 'Full Teaser',
    prescription: '5 reps',
    description:
      'Lie on your back with your legs extended and your arms overhead. Roll up and lift your legs at the same time to balance in a V shape on your sit bones, arms reaching toward your toes. Roll back down slowly. Bend your knees to make it easier.',
  },

  {
    group: 'Pilates',
    name: 'Teaser with Leg Lowers',
    prescription: '6 reps',
    description:
      'Roll up into a teaser, balancing in a V on your sit bones with your arms reaching toward your toes. Slowly lower both legs a few inches, then lift them back to the V without letting your chest collapse. Roll down after the last rep. Bend your knees to make it easier.',
  },
  {
    group: 'Pilates',
    name: 'Teaser Hold',
    prescription: '20 sec hold',
    seconds: 20,
    description:
      'Roll up into a teaser and balance in a V on your sit bones with your legs lifted and your arms reaching toward your toes. Keep your chest open and your spine long, and breathe steadily. Bend your knees to make it easier.',
  },
  {
    group: 'Pilates',
    name: 'Teaser with Twist',
    prescription: '8 alternating',
    description:
      'Roll up into a teaser and balance in a V. Rotate your torso to one side, reaching your arms past your hip, then rotate to the other side. Keep your legs steady and turn from your ribs. Each side counts as one rep.',
  },
  {
    group: 'Weighted',
    name: 'Teaser with Weight',
    prescription: '5 reps',
    description:
      'Lie on your back holding a light dumbbell at your chest. Roll up and lift your legs at the same time to balance in a V on your sit bones, extending the weight in front of you. Roll back down slowly. Use a light weight and bend your knees to make it easier.',
  },

  // Bodyweight
  {
    group: 'Bodyweight',
    name: 'Dead Bug',
    prescription: '10 each side',
    perSide: true,
    description:
      'Lie on your back with your arms reaching toward the ceiling and your hips and knees bent to 90 degrees. Press your lower back gently into the floor, then slowly extend the opposite arm and leg toward the floor. Return with control and repeat on the other side.',
  },
  {
    group: 'Bodyweight',
    name: 'Side Plank',
    prescription: '30 sec each side',
    seconds: 30,
    perSide: true,
    description:
      'Lie on your side with your elbow directly under your shoulder and your legs stacked. Lift your hips so your body forms a straight line from head to feet. Keep your hips stacked and breathe steadily. Drop to your knees if you need to.',
  },
  {
    group: 'Bodyweight',
    name: 'Bicycle Crunch',
    prescription: '30 sec',
    seconds: 30,
    description:
      'Lie on your back with your hands lightly behind your head. Bring one knee toward your chest while rotating the opposite elbow toward it, then switch sides in a slow, pedaling motion. Keep your lower back pressed down and avoid pulling on your neck.',
  },
  {
    group: 'Bodyweight',
    name: 'Hollow Body Hold',
    prescription: '20 sec hold',
    seconds: 20,
    description:
      'Lie on your back and press your lower back into the floor. Lift your shoulders and legs a few inches off the ground with your arms reaching overhead. Hold a long, shallow "banana" shape. Bend your knees or raise your legs higher to make it easier.',
  },
  {
    group: 'Bodyweight',
    name: 'Slow Mountain Climber',
    prescription: '30 sec',
    seconds: 30,
    description:
      'Start in a high plank with your hands under your shoulders. Drive one knee toward your chest, then switch legs in a controlled rhythm. Keep your hips level and your core braced.',
  },
]

/**
 * Optional core exercises recommended for each phase, with the suggested
 * reps or time. They are still optional and never added automatically: the
 * picker flags them and offers a one-tap "add suggested". Each phase picks a
 * few moves that build on the program's own core work without repeating it.
 */
export const suggestedCore: Record<WeekPhase, Record<string, Partial<Pick<Exercise, 'prescription' | 'seconds'>>>> = {
  Base: {
    'Dead Bug': { prescription: '8 each side' },
    'Teaser Prep': { prescription: '6 reps' },
    'Single Leg Stretch': { prescription: '10 alternating' },
  },
  Peak: {
    'Teaser with Leg Lowers': { prescription: '6 reps' },
    'Weighted Roll-Up': { prescription: '8 reps' },
    'Dumbbell Woodchop': { prescription: '10 each side' },
  },
  Send: {
    'Teaser with Twist': { prescription: '10 alternating' },
    'Weighted Plank Drag': { prescription: '8 each side' },
    'Hollow Body Hold': { prescription: '30 sec hold', seconds: 30 },
  },
}

/** Weekly goals from the program overview. */
export const WEEKLY_GOALS = { strength: 3, cardio: 2, dailyMin: 5, dailyMax: 7 }
