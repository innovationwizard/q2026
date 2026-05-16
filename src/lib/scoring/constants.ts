export const POINTS = {
  CORRECT_WINNER: 2,
  CORRECT_DRAW:   2,
  CORRECT_EXACT:  5,
  BONUS_CHAMPION:  10,
  BONUS_FINALISTS: 10,
} as const

export const PHASE_FACTORS: Record<string, number> = {
  'group-stage':    1,
  'round-of-32':    2,
  'round-of-16':    3,
  'quarter-finals': 5,
  'semi-finals':    8,
  'third-place':    8,
  'final':         13,
}

export const PRIZE_SPLITS = {
  first:  0.70,
  second: 0.20,
  third:  0.10,
} as const

export function calculatePrizes(enrollmentCount: number, entryFeeGtq: number = 100) {
  const pool = enrollmentCount * entryFeeGtq
  return {
    pool,
    first:  pool * PRIZE_SPLITS.first,
    second: pool * PRIZE_SPLITS.second,
    third:  pool * PRIZE_SPLITS.third,
  }
}
