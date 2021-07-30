import { OrderBookLevel } from '../types'
import patchLevels from './patchLevels'

describe('patchLevels', () => {
  it('should change nothing when the delta is empty', () => {
    const levels: OrderBookLevel[] = [
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ]

    expect(patchLevels(levels, [])).toEqual([
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ])
  })

  it('should update size for existing prices when found in the delta', () => {
    const SIZE_BEFORE = 5
    const SIZE_AFTER = 5555
    const levels: OrderBookLevel[] = [
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: SIZE_BEFORE },
    ]
    const delta: OrderBookLevel[] = [
      {
        price: 101,
        size: SIZE_AFTER,
      },
    ]

    expect(patchLevels(levels, delta)).toEqual([
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: SIZE_AFTER },
    ])
  })

  it('should add new levels in order when in the middle', () => {
    const levels: OrderBookLevel[] = [
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ]
    const delta: OrderBookLevel[] = [
      {
        price: 100.5,
        size: 1234,
      },
    ]

    expect(patchLevels(levels, delta)).toEqual([
      {
        price: 100,
        size: 10,
      },
      { price: 100.5, size: 1234 },
      { price: 101, size: 5 },
    ])
  })

  it('should add new levels in order when lower', () => {
    const levels: OrderBookLevel[] = [
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ]
    const delta: OrderBookLevel[] = [
      {
        price: 50,
        size: 1234,
      },
    ]

    expect(patchLevels(levels, delta)).toEqual([
      { price: 50, size: 1234 },
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ])
  })

  it('should add new levels in order when higher', () => {
    const levels: OrderBookLevel[] = [
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ]
    const delta: OrderBookLevel[] = [
      {
        price: 500,
        size: 1234,
      },
    ]

    expect(patchLevels(levels, delta)).toEqual([
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
      { price: 500, size: 1234 },
    ])
  })

  it('should remove levels with zero size', () => {
    const levels: OrderBookLevel[] = [
      {
        price: 100,
        size: 10,
      },
      { price: 101, size: 5 },
    ]
    const delta: OrderBookLevel[] = [
      {
        price: 100,
        size: 0,
      },
    ]

    expect(patchLevels(levels, delta)).toEqual([{ price: 101, size: 5 }])
  })
})
