import type { MealCandidate } from '@cooker/shared'

export type ScoreInput = {
  meal: MealCandidate
  usesExpiringProduct: boolean
  repeatedRecently: boolean
  userIsLazy: boolean
}

export const scoreMeal = ({
  meal,
  usesExpiringProduct,
  repeatedRecently,
  userIsLazy
}: ScoreInput): number => {
  const freshnessWeight = usesExpiringProduct ? 4 : 0
  const varietyWeight = repeatedRecently ? -2 : 2
  const simplicityWeight = userIsLazy ? meal.simplicityScore * 1.5 : meal.simplicityScore

  return freshnessWeight + varietyWeight + simplicityWeight
}
