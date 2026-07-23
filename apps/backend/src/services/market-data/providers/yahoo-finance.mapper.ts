export class YahooSymbolMapper {
  /**
   * Maps a canonical database identifier to a Yahoo Finance symbol.
   * Handles both NSE alphabetic symbols and BSE numeric codes.
   */
  static toProviderSymbol(ticker: string, exchange: string): string {
    const isNumeric = /^\d+$/.test(ticker);

    if (isNumeric || exchange === 'BSE') {
      return `${ticker}.BO`;
    }

    return `${ticker}.NS`;
  }
}
