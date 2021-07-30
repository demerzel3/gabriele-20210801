import { useRef, useState, useEffect, useMemo } from 'react'
import throttle from 'lodash/throttle'

import { ProductId, OrderBookLevel } from '../types'
import patchLevels from '../lib/patchLevels'

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
  | {
      event: 'unsubscribed'
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

const sendSubscribe = (productId: ProductId, ws: WebSocket) => {
  ws.readyState === WebSocket.OPEN &&
    ws.send(
      JSON.stringify({
        event: 'subscribe',
        feed: 'book_ui_1',
        product_ids: [productId],
      })
    )
}

const sendUnsubscribe = (productId: ProductId, ws: WebSocket) => {
  ws.readyState === WebSocket.OPEN &&
    ws.send(
      JSON.stringify({
        event: 'unsubscribe',
        feed: 'book_ui_1',
        product_ids: [productId],
      })
    )
}

const useOrderBook = ({
  productId,
}: {
  productId: ProductId
}): { book: OrderBook | undefined; toggleKillFeed: () => void } => {
  const [book, setBookImmediate] = useState<OrderBook>()
  const setBook = useMemo(() => throttle(setBookImmediate, 16), []) // 16ms = ~60 fps
  const [shouldKillFeed, setShouldKillFeed] = useState(false)
  const ws = useRef<WebSocket>()

  useEffect(() => {
    let reopenAttempts = 0
    let reopenAttemptTimeoutId: any // For some reason TS is not resolving the correct type for setTimeout

    const handleWsOpen = function (this: WebSocket) {
      // Kill switch ON: forcibly close websocket
      if (shouldKillFeed) {
        this.close()
        return
      }

      reopenAttempts = 0
      reopenAttemptTimeoutId = undefined
      sendSubscribe(productId, this)
    }

    const handleWsClose = function () {
      // Retry after 250, 500, 1000, ... 30000 ms
      const reopenWaitTime = Math.min(30000, Math.pow(2, reopenAttempts) * 250)

      console.log(
        `WebSocket closed, waiting ${reopenWaitTime} ms and trying to reopen`
      )

      ws.current = undefined
      reopenAttemptTimeoutId = setTimeout(() => {
        reopenAttempts += 1
        ws.current = createWebsocket()
      }, reopenWaitTime)
    }

    const handleWsMessage = function (ev: MessageEvent<any>) {
      const eventData: WebsocketEventData = JSON.parse(ev.data)

      if ('event' in eventData) {
        // We are not interested in handling `info`, `subscribed` and `unsubscribed` events at the moment.
        return
      }

      if ('numLevels' in eventData) {
        // One-time snapshot.
        setBookImmediate({
          // Sort both buy and sell by price ascending
          buy: eventData.bids.reverse().map(rawLevelToOrderBookLevel),
          sell: eventData.asks.map(rawLevelToOrderBookLevel),
        })
      } else {
        // Delta
        setBook((book) => ({
          buy: patchLevels(
            book?.buy ?? [],
            eventData.bids.map(rawLevelToOrderBookLevel)
          ),
          sell: patchLevels(
            book?.sell ?? [],
            eventData.asks.map(rawLevelToOrderBookLevel)
          ),
        }))
      }
    }

    const createWebsocket = () => {
      const websocket = new WebSocket('wss://www.cryptofacilities.com/ws/v1')
      websocket.onopen = handleWsOpen
      websocket.onmessage = handleWsMessage
      websocket.onclose = handleWsClose

      return websocket
    }

    const terminateWebsocket = (websocket: WebSocket) => {
      websocket.onopen = null
      websocket.onmessage = null
      websocket.onclose = null
      websocket.close()
    }

    if (ws.current && shouldKillFeed) {
      terminateWebsocket(ws.current)
      ws.current = undefined
    }

    if (!ws.current) {
      ws.current = createWebsocket()
    } else {
      sendSubscribe(productId, ws.current)
    }

    return () => {
      setBook.cancel()
      clearTimeout(reopenAttemptTimeoutId)
      if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
        terminateWebsocket(ws.current)
        ws.current = undefined
      }

      ws.current && sendUnsubscribe(productId, ws.current)
    }
  }, [productId, setBook, shouldKillFeed])

  return {
    book,
    toggleKillFeed: () => {
      setShouldKillFeed((prevShouldKillFeed) => !prevShouldKillFeed)
    },
  }
}

export default useOrderBook
