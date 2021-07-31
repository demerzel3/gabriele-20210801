import React, { useState, useMemo } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

import { ProductId } from './types'
import useOrderBook from './hooks/useOrderBook'
import Levels from './Levels'
import groupLevels from './lib/groupLevels'
import { SyncAlt, ErrorOutline } from './icons'
import { primary, danger, gray1, gray2, gray3, gray4, gray5 } from './colors'
import { medium, large } from './breakpoints'

const DEFAULT_GROUP_SIZE = {
  PI_XBTUSD: 0.5,
  PI_ETHUSD: 0.05,
} as const

const GlobalStyle = createGlobalStyle`
  body {
    margin: 12px;
    background: ${gray2};
    color: ${gray5};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`

const Main = styled.div`
  background-color: ${gray1};
  margin: 0 auto;

  @media (min-width: ${large}) {
    width: 900px;
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px;

  & > *:not(:last-child) {
    margin-right: 8px;
  }
`

const ActionButton = styled.button`
  border: none;
  color: currentColor;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1em;
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  & > svg {
    flex: 0 0 auto;
    margin-right: 4px;
  }
`

const PrimaryActionButton = styled(ActionButton)`
  background-color: ${primary};
`

const DangerActionButton = styled(ActionButton)`
  background-color: ${danger};
`

const Header = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 64px 16px 16px;
  border-bottom: solid 1px ${gray4};
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.2em;
  font-weight: normal;
`

const GroupSizeSelect = styled.select`
  background-color: ${gray3};
  font-size: 0.8em;
  color: currentColor;
  border: none;
  border-radius: 4px;
  padding: 0 8px;
`

const SidesContainer = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: ${medium}) {
    flex-direction: row-reverse;

    & > * {
      flex: 1 1 50%;
    }
  }
`

function App() {
  const [productId, setProductId] = useState<ProductId>('PI_XBTUSD')
  const [groupSize, setGroupSize] = useState(0.5)
  const { book, toggleKillFeed } = useOrderBook({ productId })
  const groupedBook = useMemo(
    () =>
      book && groupSize !== DEFAULT_GROUP_SIZE[productId]
        ? {
            buy: groupLevels(book.buy, groupSize),
            sell: groupLevels(book.sell, groupSize),
          }
        : book,
    [book, productId, groupSize]
  )

  const handleToggleFeedClick = () => {
    const nextProductId: ProductId =
      productId === 'PI_XBTUSD' ? 'PI_ETHUSD' : 'PI_XBTUSD'

    setProductId(nextProductId)
    setGroupSize(DEFAULT_GROUP_SIZE[nextProductId])
  }

  return (
    <>
      <GlobalStyle />
      <Main>
        <Header>
          <Title>Order Book</Title>
          <GroupSizeSelect
            value={groupSize}
            onChange={(e) => setGroupSize(parseFloat(e.target.value))}
          >
            {productId === 'PI_XBTUSD' && (
              <>
                <option value="0.5">Group 0.5</option>
                <option value="1">Group 1</option>
                <option value="2.5">Group 2.5</option>
              </>
            )}
            {productId === 'PI_ETHUSD' && (
              <>
                <option value="0.05">Group 0.05</option>
                <option value="0.1">Group 0.1</option>
                <option value="0.25">Group 0.25</option>
              </>
            )}
          </GroupSizeSelect>
        </Header>
        {groupedBook && (
          <SidesContainer>
            <Levels levels={groupedBook.sell.slice(0, 15)} side="sell" />
            <Levels levels={groupedBook.buy.slice(-15).reverse()} side="buy" />
          </SidesContainer>
        )}
      </Main>
      <Actions>
        <PrimaryActionButton onClick={handleToggleFeedClick}>
          <SyncAlt />
          <span>Toggle feed</span>
        </PrimaryActionButton>
        <DangerActionButton onClick={toggleKillFeed}>
          <ErrorOutline />
          <span>Kill feed</span>
        </DangerActionButton>
      </Actions>
    </>
  )
}

export default App
