import React, { useEffect, useState } from 'react'
import throttle from 'lodash/throttle'

import './App.css'
import patchLevels from './lib/patchLevels'
import { OrderBookLevel } from './types'

type SummaryEventData = {
  numLevels: number
  product_id: string
  bids: [number, number][]
  asks: [number, number][]
}

type DeltaEventData = {
  product_id: string
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
      product_ids: string[]
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
  const [book, setBook] = useState<OrderBook>()

  useEffect(() => {
    const ws = new WebSocket('wss://www.cryptofacilities.com/ws/v1')
    let delta: DeltaEventData | null = null

    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          event: 'subscribe',
          feed: 'book_ui_1',
          product_ids: ['PI_XBTUSD'],
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
  }, [])

  return (
    <div className="App">
      {book && (
        <>
          <h1>Buy</h1>
          <ul>
            {book.buy
              .slice(-15)
              .reverse()
              .map(({ price, size }) => (
                <li key={price}>
                  {price}, {size}
                </li>
              ))}
          </ul>
          <h2>Sell</h2>
          <ul>
            {book.sell.slice(0, 15).map(({ price, size }) => (
              <li key={price}>
                {price}, {size}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default App
