/**
 * StockLens Premium Visual Data Registry
 * Provides static, cosmetic reference data (exchange labels, follower count styles, and brand lists)
 * for RELIANCE, MSFT, AAPL, TSLA, and other global assets.
 */

export interface StockDetailedData {
  exchangeCode: string; // e.g. "NSE: RELIANCE" or "BSE: 500325"
  secExchange: string;  // secondary code
  followers: string;
  brands: string[];
}

export function getStockDetailedData(symbol: string, currentPriceVal: number, ratiosFromApi?: any, exchange: string = ''): StockDetailedData {
  const sym = symbol.toUpperCase();

  // Check if stock is Reliance Industries
  if (sym === 'RELIANCE' || sym.startsWith('RELIANCE')) {
    return {
      exchangeCode: "NSE: RELIANCE",
      secExchange: "BSE: 500325",
      followers: "33.31 L",
      brands: [
        "Anomaly", "FACEGYM", "Kelvinator", "Campa Cola", "Gapco", "AUTO LPG", "Trans-Connect", "Zivame", "A1 Plaza", "R Care",
        "Qwik Mart", "Refresh", "RELSTAR", "REPOL", "RELENE", "REON", "RELPIPE", "Reflex", "RELWOOD", "IMPRAMER", "RELX", "RELAB",
        "Recron", "Relpet", "Reliance Retail", "Reliance Fresh", "Reliance Super", "Reliance SMART", "RELIANCE MARKET",
        "Reliance Digital", "Reliance Digital Xpress", "iStore", "ResQ", "Reliance Jewels", "TRENDS", "AJIO", "PROJECT EVE",
        "Avaasa", "DNMX", "JOHN PLAYERS", "NETPLAY", "Ermenegildo Zegna", "Paul & Shark", "Stuart Weitzman", "Brooks Brothers",
        "Vision Express", "VIMAL", "Candie's", "Jio", "IBN", "IndiaCast", "IBNLive", "Burpp", "Colosseum", "H. LEWIS",
        "GEORGIA GULLINI", "D-CREASED"
      ]
    };
  }

  const exUpper = (exchange || '').toUpperCase();
  const isNasdaq = sym === 'AAPL' || sym === 'MSFT' || sym === 'TSLA' || sym === 'NVDA' ||
    exUpper.includes('NASDAQ') || exUpper.includes('NYSE') || exUpper.includes('US') || exUpper.includes('OTC') ||
    (!sym.endsWith('.NS') && !sym.endsWith('.BO') && (sym === 'SNDK' || sym === 'DELL' || sym === 'WDC' || sym === 'HPE' || sym === 'NTAP' || sym.length <= 5));

  const defaultBrands = {
    AAPL: ["iPhone", "MacBook Air", "MacBook Pro", "iPad", "Apple Watch", "AirPods", "iOS", "iCloud", "Apple TV+", "Vision Pro"],
    MSFT: ["Windows 11", "Office 365", "Microsoft Azure", "Xbox Series X", "Surface Laptop", "LinkedIn", "Copilot AI", "GitHub Enterprise"],
    TSLA: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Full Self-Driving (FSD)", "Megapack", "Supercharger Network"],
    NVDA: ["GeForce RTX", "NVIDIA H100", "CUDA Architecture", "DGX Systems", "NVIDIA Omniverse", "GeForce NOW", "Shield TV"]
  };

  const selectedBrands = defaultBrands[sym as keyof typeof defaultBrands] || [
    `${sym} Core`, `${sym} Cloud`, `${sym} Enterprise`, `${sym} Premium`, `${sym} Services`
  ];

  return {
    exchangeCode: isNasdaq ? `NASDAQ: ${sym}` : `NSE: ${sym}`,
    secExchange: isNasdaq ? `NYSE: ${sym}` : `BSE: ${sym}`,
    followers: isNasdaq ? "1.5 M" : "5.4 L",
    brands: selectedBrands
  };
}
