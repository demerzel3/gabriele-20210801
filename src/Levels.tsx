import React from 'react'

import { OrderBookLevel } from './types'

type OrderBookLevelWithTotal = OrderBookLevel & { total: number }

type LevelsProps = {
  levels: OrderBookLevel[]
  side: 'buy' | 'sell'
}

const Levels: React.FC<LevelsProps> = ({ levels, side }) => {
  const [levelsWithTotals, grandTotal] = levels.reduce(
    ([levelsWithTotals, grandTotal], level) => {
      grandTotal += level.size
      levelsWithTotals.push({ ...level, total: grandTotal })

      return [levelsWithTotals, grandTotal]
    },
    [[] as OrderBookLevelWithTotal[], 0]
  )

  // TODO: achieve the inversion of columns via CSS, use it with media query for mobile
  return side === 'buy' ? (
    <table>
      <thead>
        <tr>
          <th>total</th>
          <th>size</th>
          <th>price</th>
        </tr>
      </thead>
      <tbody>
        {levelsWithTotals.map(({ price, size, total }) => (
          <tr key={price}>
            <td>
              {total} {((total / grandTotal) * 100).toFixed(2)}%
            </td>
            <td>{size}</td>
            <td>{price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <table>
      <thead>
        <tr>
          <th>price</th>
          <th>size</th>
          <th>total</th>
        </tr>
      </thead>
      <tbody>
        {levelsWithTotals.map(({ price, size, total }) => (
          <tr key={price}>
            <td>{price}</td>
            <td>{size}</td>
            <td>
              {total} {((total / grandTotal) * 100).toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Levels
