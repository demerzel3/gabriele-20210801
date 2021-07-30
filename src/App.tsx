import React, { useEffect, useState } from 'react'
import throttle from 'lodash/throttle'

import './App.css'
import patchLevels from './lib/patchLevels'
import { OrderBookLevel } from './types'
import Levels from './Levels'

type ProductId = 'PI_XBTUSD' | 'PI_ETHUSD'

type SummaryEventData = {
  numLevels: number
  product_id: ProductId
  bids: [number, number][]
  asks: [number, number][]
}

type DeltaEventData = {
  product_id: ProductId
  bids: [number, number][]
  asks: [number, number][]
}

type WebsocketEventData =
  | {
      event: 'info'
      version: number
    }
  | {
      event: 'subscribed'
      feed: string
      product_ids: ProductId[]
    }
  | SummaryEventData
  | DeltaEventData

type OrderBook = {
  buy: OrderBookLevel[]
  sell: OrderBookLevel[]
}

const rawLevelToOrderBookLevel = ([price, size]: [
  number,
  number
]): OrderBookLevel => ({ price, size })

function App() {
  const [productId, setProductId] = useState<ProductId>('PI_XBTUSD')
  const [book, setBook] = useState<OrderBook>()

  const handleToggleFeedClick = () => {
    setProductId((currentProductId) =>
      currentProductId === 'PI_XBTUSD' ? 'PI_ETHUSD' : 'PI_XBTUSD'
    )
  }

  useEffect(() => {
    const ws = new WebSocket('wss://www.cryptofacilities.com/ws/v1')
    let delta: DeltaEventData | null = null

    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          event: 'subscribe',
          feed: 'book_ui_1',
          product_ids: [productId],
        })
      )
    })

    ws.addEventListener('message', (ev) => {
      const eventData: WebsocketEventData = JSON.parse(ev.data)

      if ('event' in eventData) {
        // We are not interested in handling info and subscribed events at the moment.
        return
      }

      if ('numLevels' in eventData) {
        // One-time snapshot.
        setBook({
          buy: eventData.bids.reverse().map(rawLevelToOrderBookLevel), // Always sort by price ascending
          sell: eventData.asks.map(rawLevelToOrderBookLevel),
        })
      } else {
        // Delta
        if (delta === null) {
          delta = eventData
        } else {
          delta.asks = delta.asks.concat(eventData.asks)
          delta.bids = delta.bids.concat(eventData.bids)
        }

        updateBook()
      }
    })

    const updateBook = throttle(() => {
      if (delta === null) {
        // No detlas received during this time.
        return
      }
      const deltaToApply = delta
      delta = null

      setBook((book) => ({
        buy: patchLevels(
          book?.buy ?? [],
          deltaToApply.bids.map(rawLevelToOrderBookLevel)
        ),
        sell: patchLevels(
          book?.sell ?? [],
          deltaToApply.asks.map(rawLevelToOrderBookLevel)
        ),
      }))
    }, 16) // 16ms = ~60 fps

    return () => ws.close()
  }, [productId])

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
      <button onClick={handleToggleFeedClick}>Toggle feed</button>
    </div>
  )
}

export default App
