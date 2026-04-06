const TICKER_REGEX = /^[A-Z0-9.\-^]{1,10}$/i;

export function isValidTicker(ticker: string): boolean {
  return TICKER_REGEX.test(ticker);
}
