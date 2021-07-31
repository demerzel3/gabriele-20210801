import { OrderBookLevel } from '../types'
import groupLevels from './groupLevels'

describe('groupLevels', () => {
  it('should return the input levels unchanged if the size already fits the data', () => {
    const levels: OrderBookLevel[] = [
      { price: 100, size: 1 },
      { price: 100.5, size: 1 },
      { price: 101, size: 1 },
    ]

    expect(groupLevels(levels, 0.5)).toEqual([
      { price: 100, size: 1 },
      { price: 100.5, size: 1 },
      { price: 101, size: 1 },
    ])
  })

  it('should be empty when input is empty', () => {
    expect(groupLevels([], 0.5)).toEqual([])
  })

  it('should group levels properly with size 1', () => {
    const levels: OrderBookLevel[] = [
      // grouped price 100
      { price: 100, size: 1 },
      { price: 100.5, size: 1 },
      // grouped price 101
      { price: 101, size: 1 },
      // grouped price 105
      { price: 105.5, size: 1 },
    ]

    expect(groupLevels(levels, 1)).toEqual([
      { price: 100, size: 2 },
      { price: 101, size: 1 },
      { price: 105, size: 1 },
    ])
  })

  it('should group levels properly with size 2.5', () => {
    const levels: OrderBookLevel[] = [
      // grouped price 100
      { price: 100, size: 1 },
      { price: 100.5, size: 1 },
      { price: 101, size: 1 },
      { price: 101.5, size: 1 },
      // grouped price 102.5
      { price: 102.5, size: 1 },
      { price: 103, size: 1 },
      // grouped price 105
      { price: 105.5, size: 1 },
    ]

    expect(groupLevels(levels, 2.5)).toEqual([
      { price: 100, size: 4 },
      { price: 102.5, size: 2 },
      { price: 105, size: 1 },
    ])
  })
})
