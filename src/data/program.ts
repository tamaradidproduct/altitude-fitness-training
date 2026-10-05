export type SessionKind = 'strength' | 'cardio' | 'core' | 'stretch'

export interface Exercise {
  name: string
  /** Reps, hold time, or interval as written in the program. */
  prescription: string
  description: string
  /** Seconds for a timed exercise (holds, stretches). Doubled when perSide. */
  seconds?: number
  /** Rest after the exercise (or after each side) in guided timers. */
  restSeconds?: number
  perSide?: boolean
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

export interface Week {
  number: number
  phase: string
  theme: string
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
          description:
            'Start in a staggered stance with one foot forward and one behind you. Lower straight down by bending both knees, then press through your front foot to return to the starting position.',
        },
        {
          name: 'Banded Side Step',
          prescription: '10 each side',
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

export const program = {
  title: 'From Strength to Snow',
  subtitle: 'Altitude Attitude + ACECoLab Pre-Season Fitness Training Program',
  weeks: [week1],
}

/** Weekly goals from the program overview. */
export const WEEKLY_GOALS = { strength: 3, cardio: 2, dailyMin: 5, dailyMax: 7 }
