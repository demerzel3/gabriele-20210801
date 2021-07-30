import { OrderBookLevel } from '../types'

const patchLevels = (
  initialLevels: OrderBookLevel[],
  delta: OrderBookLevel[]
): OrderBookLevel[] => {
  // Create a copy of the array before mutating it
  const levels = [...initialLevels]

  for (const { price, size } of delta) {
    // Remove element if it is already exists
    const priceIndex = levels.findIndex((lvl) => lvl.price === price)
    if (priceIndex > -1) {
      levels.splice(priceIndex, 1)
    }

    // If size is greater than 0 readd it to the array
    if (size > 0) {
      levels.push({ price, size })
    }
  }

  levels.sort((a, b) => a.price - b.price)

  return levels
}

export default patchLevels
