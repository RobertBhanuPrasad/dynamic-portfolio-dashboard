export interface MarketQuote {
  requestedIdentifier: string; // The original ticker/identifier
  providerSymbol: string; // The mapped symbol used for the provider
  price: number | null; // CMP
  currency?: string;
  exchange?: string;
  marketState?: string;
  fetchedAt: Date;
  errorCategory?: string; // Timeout, Rate Limit, Not Found, etc.
}

export interface MarketDataProvider {
  getQuote(identifier: string, exchange: string): Promise<MarketQuote>;
  getQuotes(identifiers: { ticker: string; exchange: string }[]): Promise<Map<string, MarketQuote>>;
}
