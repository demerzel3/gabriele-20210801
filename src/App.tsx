import React, { useState } from 'react'

import './App.css'
import { ProductId } from './types'
import useOrderBook from './hooks/useOrderBook'
import Levels from './Levels'

function App() {
  const [productId, setProductId] = useState<ProductId>('PI_XBTUSD')
  const { book, toggleKillFeed } = useOrderBook({ productId })

  const handleToggleFeedClick = () => {
    setProductId((currentProductId) =>
      currentProductId === 'PI_XBTUSD' ? 'PI_ETHUSD' : 'PI_XBTUSD'
    )
  }

  return (
    <div className="App">
      {book && (
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
            <Levels levels={book.buy.slice(-15).reverse()} side="buy" />
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
            <Levels levels={book.sell.slice(0, 15)} side="sell" />
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
