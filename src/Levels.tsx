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
  'aria-label': string
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

// Invisible element, only for screen readers. From https://webaim.org/techniques/css/invisiblecontent/
const InvisibleCell = styled.div`
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

const Cell = styled.div<{ side?: Side }>`
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', Courier,
    monospace;
  flex: 1 1 33%;
  position: relative;
  z-index: 1;
  ${(p) => (p.side ? `color: ${p.side === 'buy' ? green2 : red2};` : '')}
`

const Levels: React.FC<LevelsProps> = ({
  levels,
  side,
  'aria-label': ariaLabel,
}) => {
  const sizeFormatter = useMemo(() => new Intl.NumberFormat('en-US'), [])
  const priceFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }),
    []
  )
  const depthFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { minimumSignificantDigits: 3 }),
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
    <Root side={side} role="table" aria-label={ariaLabel}>
      <HeaderRow side={side} role="row">
        <Header role="columnheader">Price</Header>
        <Header role="columnheader">Size</Header>
        <Header role="columnheader">Total</Header>
        <InvisibleCell role="columnheader">Depth</InvisibleCell>
      </HeaderRow>
      {levelsWithTotals.map(({ price, size, total }) => {
        const depth = (total / grandTotal) * 100
        const formattedDepth = `${depthFormatter.format(depth)}%`

        return (
          <Row side={side} key={price} role="row">
            <Depth side={side} style={{ width: `${depth}%` }} />
            <Cell side={side} role="cell">
              {priceFormatter.format(price)}
            </Cell>
            <Cell role="cell">{sizeFormatter.format(size)}</Cell>
            <Cell role="cell">{sizeFormatter.format(total)}</Cell>
            <InvisibleCell role="cell">{formattedDepth}</InvisibleCell>
          </Row>
        )
      })}
    </Root>
  )
}

export default Levels
