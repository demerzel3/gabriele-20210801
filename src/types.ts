export type ProductId = 'PI_XBTUSD' | 'PI_ETHUSD'

export type OrderBookLevel = {
  price: number
  size: number
  // TODO: should total be computed everytime or just stored?
}
