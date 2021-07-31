import { OrderBookLevel } from '../types'

const groupLevels = (
  levels: OrderBookLevel[],
  groupSize: number
): OrderBookLevel[] => {
  const count = levels.length
  const roundPrice = (price: number) =>
    Math.floor(price / groupSize) * groupSize

  if (count === 0) {
    return levels
  }

  let current: OrderBookLevel = {
    price: roundPrice(levels[0].price),
    size: 0,
  }
  const groupedLevels: OrderBookLevel[] = []

  levels.forEach(({ price, size }) => {
    const roundedPrice = roundPrice(price)
    if (roundedPrice === current.price) {
      current.size += size
    } else {
      groupedLevels.push(current)
      current = {
        price: roundedPrice,
        size,
      }
    }
  })

  groupedLevels.push(current)

  return groupedLevels
}

export default groupLevels
