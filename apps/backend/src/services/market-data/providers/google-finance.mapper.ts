export class GoogleFinanceMapper {
  /**
   * Maps a canonical database identifier to a Google Finance symbol.
   * Google Finance format: TICKER:EXCHANGE
   */
  static toProviderSymbol(ticker: string, exchange: string): string {
    const isNumeric = /^\d+$/.test(ticker);

    if (isNumeric || exchange === 'BSE') {
      return `${ticker}:BOM`; // BOM is the exchange code for BSE on Google Finance
    }

    return `${ticker}:NSE`;
  }
}
