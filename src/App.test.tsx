import WS from 'jest-websocket-mock'
import { render, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from './App'

afterEach(() => {
  WS.clean()
  cleanup()
})

const xbtusdSummary = {
  numLevels: 2,
  product_id: 'PI_XBTUSD',
  bids: [
    [40101, 1],
    [40100.5, 1],
    [40100, 1],
    [40090, 1],
  ],
  asks: [
    [40110, 1],
    [40110.5, 1],
  ],
}

const ethusdSummary = {
  numLevels: 2,
  product_id: 'PI_ETHUSD',
  bids: [
    [3101, 1],
    [3100.05, 1],
  ],
  asks: [
    [3110, 1],
    [3110.05, 1],
  ],
}

describe('App', () => {
  it('should render all components with default settings', async () => {
    const ws = new WS('wss://www.cryptofacilities.com/ws/v1', {
      jsonProtocol: true,
    })

    render(<App />)

    // Wait for connection and send summary
    await ws.connected
    ws.send(xbtusdSummary)

    // Title
    expect(
      screen.getByRole('heading', { level: 1, name: 'Order Book' })
    ).toBeInTheDocument()

    // Group size select
    const groupSizeSelect = screen.getByRole('combobox', {
      name: 'Select group size',
    })
    expect(groupSizeSelect).toBeInTheDocument()
    expect(groupSizeSelect).toHaveValue('0.5')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveValue('0.5')
    expect(options[1]).toHaveValue('1')
    expect(options[2]).toHaveValue('2.5')

    // Buy side table with its rows
    expect(screen.getByRole('table', { name: 'Buy side' })).toBeInTheDocument()
    // Price Size Total Depth
    expect(
      screen.getByRole('row', { name: '40,090.00 1 4 100%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '40,100.00 1 3 75.0%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '40,100.50 1 2 50.0%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '40,101.00 1 1 25.0%' })
    ).toBeInTheDocument()

    // Sell side table with its rows
    expect(screen.getByRole('table', { name: 'Sell side' })).toBeInTheDocument()
    // Price Size Total Depth
    expect(
      screen.getByRole('row', { name: '40,110.00 1 1 50.0%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '40,110.50 1 2 100%' })
    ).toBeInTheDocument()

    // Make sure row matching is comprehensive
    expect(screen.getAllByRole('row')).toHaveLength(7) // 6 rows of data + header

    // Toggle feed button
    expect(
      screen.getByRole('button', { name: 'Toggle feed' })
    ).toBeInTheDocument()

    // Kill feed button
    expect(
      screen.getByRole('button', { name: 'Kill feed' })
    ).toBeInTheDocument()
  })

  it('should toggle feed', async () => {
    const ws = new WS('wss://www.cryptofacilities.com/ws/v1', {
      jsonProtocol: true,
    })

    render(<App />)

    // Wait for connection and send summary
    await ws.connected
    await expect(ws).toReceiveMessage({
      event: 'subscribe',
      feed: 'book_ui_1',
      product_ids: ['PI_XBTUSD'],
    })
    ws.send(xbtusdSummary)

    userEvent.click(screen.getByRole('button', { name: 'Toggle feed' }))

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
    ws.send(ethusdSummary)

    // Buy side rows with ETH data
    // Price Size Total Depth
    expect(
      screen.getByRole('row', { name: '3,100.05 1 2 100%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '3,101.00 1 1 50.0%' })
    ).toBeInTheDocument()

    // Sell side rows with ETH data
    // Price Size Total Depth
    expect(
      screen.getByRole('row', { name: '3,110.00 1 1 50.0%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '3,110.05 1 2 100%' })
    ).toBeInTheDocument()

    // Make sure row matching is comprehensive
    expect(screen.getAllByRole('row')).toHaveLength(5) // 4 rows of data + header

    // Group size select should be updated
    expect(
      screen.getByRole('combobox', {
        name: 'Select group size',
      })
    ).toHaveValue('0.05')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveValue('0.05')
    expect(options[1]).toHaveValue('0.1')
    expect(options[2]).toHaveValue('0.25')
  })

  it('should change group size', async () => {
    const ws = new WS('wss://www.cryptofacilities.com/ws/v1', {
      jsonProtocol: true,
    })

    render(<App />)

    // Wait for connection and send summary
    await ws.connected
    ws.send(xbtusdSummary)

    // Group size select
    const groupSizeSelect = screen.getByRole('combobox', {
      name: 'Select group size',
    })
    // Group size = 1
    userEvent.selectOptions(groupSizeSelect, 'Group 1')

    // Buy side rows with group size = 1
    // Price Size Total Depth
    expect(
      screen.getByRole('row', { name: '40,090.00 1 4 100%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '40,100.00 2 3 75.0%' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('row', { name: '40,101.00 1 1 25.0%' })
    ).toBeInTheDocument()

    // Sell side rows with group size = 1
    // Price Size Total Depth
    expect(
      screen.getByRole('row', { name: '40,110.00 2 2 100%' })
    ).toBeInTheDocument()

    // Make sure row matching is comprehensive
    expect(screen.getAllByRole('row')).toHaveLength(5) // 4 rows of data + header
  })
})
