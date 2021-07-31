import React, { useMemo } from 'react'
import styled from 'styled-components'
import { medium } from './breakpoints'
import { green1, green2, red1, red2, gray4 } from './colors'

import { OrderBookLevel } from './types'

type OrderBookLevelWithTotal = OrderBookLevel & { total: number }

type Side = 'buy' | 'sell'

type LevelsProps = {
  levels: OrderBookLevel[]
  side: Side
}

const Root = styled.div<{ side: Side }>`
  text-align: right;
  display: flex;
  flex-direction: ${(p) => (p.side === 'buy' ? 'column' : 'column-reverse')};

  @media (min-width: ${medium}) {
    flex-direction: column;
  }
`

const Row = styled.div<{ side: Side }>`
  position: relative;
  display: flex;
  line-height: 1.6em;
  padding: 0 48px;

  @media (min-width: ${medium}) {
    flex-direction: ${(p) => (p.side === 'sell' ? 'row' : 'row-reverse')};
  }
`

const HeaderRow = styled(Row)`
  ${(p) => (p.side === 'sell' ? 'order: 1;' : '')}
  ${(p) => (p.side === 'buy' ? 'visibility: hidden;' : '')}

  @media (min-width: ${medium}) {
    order: 0;
    visibility: visible;
  }
`

const Depth = styled.div<{ side: Side }>`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: ${(p) => (p.side === 'buy' ? green1 : red1)};
  z-index: 0;

  @media (min-width: ${medium}) {
    ${(p) => (p.side === 'sell' ? `right: auto; left: 0;` : '')}
  }
`

const Header = styled.div`
  text-transform: uppercase;
  flex: 1 1 33%;
  color: ${gray4};
`

const Cell = styled.div<{ side?: Side }>`
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', Courier,
    monospace;
  flex: 1 1 33%;
  position: relative;
  z-index: 1;
  ${(p) => (p.side ? `color: ${p.side === 'buy' ? green2 : red2};` : '')}
`

const Levels: React.FC<LevelsProps> = ({ levels, side }) => {
  const sizeFormatter = useMemo(() => new Intl.NumberFormat('en-US'), [])
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }),
    []
  )
  const [levelsWithTotals, grandTotal] = levels.reduce(
    ([levelsWithTotals, grandTotal], level) => {
      grandTotal += level.size
      levelsWithTotals.push({ ...level, total: grandTotal })

      return [levelsWithTotals, grandTotal]
    },
    [[] as OrderBookLevelWithTotal[], 0]
  )

  return (
    <Root side={side}>
      <HeaderRow side={side}>
        <Header>price</Header>
        <Header>size</Header>
        <Header>total</Header>
      </HeaderRow>
      {levelsWithTotals.map(({ price, size, total }) => (
        <Row side={side} key={price}>
          <Depth
            side={side}
            style={{ width: `${(total / grandTotal) * 100}%` }}
          />
          <Cell side={side}>{priceFormatter.format(price)}</Cell>
          <Cell>{sizeFormatter.format(size)}</Cell>
          <Cell>{sizeFormatter.format(total)}</Cell>
        </Row>
      ))}
    </Root>
  )
}

export default Levels
