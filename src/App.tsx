import React, { useState, useMemo } from 'react'

import './App.css'
import { ProductId } from './types'
import useOrderBook from './hooks/useOrderBook'
import Levels from './Levels'
import groupLevels from './lib/groupLevels'

const DEFAULT_GROUP_SIZE = {
  PI_XBTUSD: 0.5,
  PI_ETHUSD: 0.05,
} as const

function App() {
  const [productId, setProductId] = useState<ProductId>('PI_XBTUSD')
  const [groupSize, setGroupSize] = useState(0.5)
  const { book, toggleKillFeed } = useOrderBook({ productId })
  const groupedBook = useMemo(
    () =>
      book && groupSize !== DEFAULT_GROUP_SIZE[productId]
        ? {
            buy: groupLevels(book.buy, groupSize),
            sell: groupLevels(book.sell, groupSize),
          }
        : book,
    [book, productId, groupSize]
  )

  const handleToggleFeedClick = () => {
    const nextProductId: ProductId =
      productId === 'PI_XBTUSD' ? 'PI_ETHUSD' : 'PI_XBTUSD'

    setProductId(nextProductId)
    setGroupSize(DEFAULT_GROUP_SIZE[nextProductId])
  }

  return (
    <div className="App">
      <select
        value={groupSize}
        onChange={(e) => setGroupSize(parseFloat(e.target.value))}
      >
        {productId === 'PI_XBTUSD' && (
          <>
            <option value="0.5">0.5</option>
            <option value="1">1</option>
            <option value="2.5">2.5</option>
          </>
        )}
        {productId === 'PI_ETHUSD' && (
          <>
            <option value="0.05">0.05</option>
            <option value="0.1">0.1</option>
            <option value="0.25">0.25</option>
          </>
        )}
      </select>
      {groupedBook && (
        <>
          <div
            style={{
              padding: '20px',
              float: 'left',
              textAlign: 'left',
              width: 400,
            }}
          >
            <h1>Buy</h1>
            <Levels levels={groupedBook.buy.slice(-15).reverse()} side="buy" />
          </div>
          <div
            style={{
              padding: '20px',
              float: 'left',
              textAlign: 'left',
              width: 400,
            }}
          >
            <h1>Sell</h1>
            <Levels levels={groupedBook.sell.slice(0, 15)} side="sell" />
          </div>
        </>
      )}
      <p>Feed: {productId}</p>
      <button onClick={handleToggleFeedClick}>Toggle feed</button>
      <button onClick={toggleKillFeed}>Kill feed</button>
    </div>
  )
}

export default App
