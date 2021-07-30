import WS from 'jest-websocket-mock'
import { WebSocket, CloseOptions } from 'mock-socket'
import { renderHook, cleanup } from '@testing-library/react-hooks'

import useOrderBook from './useOrderBook'
import { ProductId } from '../types'

// Had to redefine this since jest-websocket-mock does not export it
interface MockWebSocket extends Omit<WebSocket, 'close'> {
  close(options?: CloseOptions): void
}

afterEach(() => {
  WS.clean()
  cleanup()
})

describe('useOrderBook', () => {
  it('should subscribe to the specified product id', async () => {
    const ws = new WS('wss://www.cryptofacilities.com/ws/v1', {
      jsonProtocol: true,
    })
    const { result } = renderHook(() =>
      useOrderBook({ productId: 'PI_XBTUSD' })
    )

    await ws.connected
    await expect(ws).toReceiveMessage({
      event: 'subscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_XBTUSD'],
    })

    // Summary
    ws.send({
      numLevels: 2,
      product_id: 'PI_XBTUSD',
      bids: [
        [100.5, 1],
        [100, 1],
      ],
      asks: [
        [110, 1],
        [110.5, 1],
      ],
    })

    expect(result.current.book).toEqual({
      buy: [
        { price: 100, size: 1 },
        { price: 100.5, size: 1 },
      ],
      sell: [
        { price: 110, size: 1 },
        { price: 110.5, size: 1 },
      ],
    })

    // Delta
    ws.send({
      product_id: 'PI_XBTUSD',
      bids: [[99, 1]],
      asks: [[120, 1]],
    })

    expect(result.current.book).toEqual({
      buy: [
        { price: 99, size: 1 },
        { price: 100, size: 1 },
        { price: 100.5, size: 1 },
      ],
      sell: [
        { price: 110, size: 1 },
        { price: 110.5, size: 1 },
        { price: 120, size: 1 },
      ],
    })
  })

  it('should unsubscribe and resubscribe on product change', async () => {
    const ws = new WS('wss://www.cryptofacilities.com/ws/v1', {
      jsonProtocol: true,
    })
    const { rerender } = renderHook(
      ({ productId }) => useOrderBook({ productId }),
      {
        initialProps: { productId: 'PI_XBTUSD' as ProductId },
      }
    )

    await ws.connected
    await expect(ws).toReceiveMessage({
      event: 'subscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_XBTUSD'],
    })

    rerender({ productId: 'PI_ETHUSD' })

    await expect(ws).toReceiveMessage({
      event: 'unsubscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_XBTUSD'],
    })

    await expect(ws).toReceiveMessage({
      event: 'subscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_ETHUSD'],
    })
  })

  it('should reconnect on connection close', async () => {
    let socket: MockWebSocket | undefined
    const ws = new WS('wss://www.cryptofacilities.com/ws/v1', {
      jsonProtocol: true,
    })
    ws.on('connection', (sck) => {
      socket = sck
    })

    renderHook(() => useOrderBook({ productId: 'PI_XBTUSD' }))

    await ws.connected
    await expect(ws).toReceiveMessage({
      event: 'subscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_XBTUSD'],
    })

    expect(socket).toBeDefined()
    // Close connection on existing socket.
    socket?.close()
    socket = undefined

    await ws.connected
    await expect(ws).toReceiveMessage({
      event: 'subscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_XBTUSD'],
    })

    // Double check that there is a connected socket.
    expect(socket).toBeDefined()
  })
})
