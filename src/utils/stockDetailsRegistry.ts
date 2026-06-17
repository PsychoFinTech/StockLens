/**
 * StockLens Premium Visual Data Registry
 * Provides highly detailed structure metrics matching Finology Ticker for RELIANCE, MSFT, AAPL, TSLA, and general stocks.
 */

export interface StockDetailedData {
  exchangeCode: string; // e.g. "NSE: RELIANCE" or "BSE: 500325"
  secExchange: string;  // secondary code
  followers: string;
  priceSummary: {
    high: number;
    low: number;
    week52High: number;
    week52Low: number;
  };
  essentials: {
    marketCapCr: string;
    enterpriseValue: string;
    noOfShares: string;
    pe: string;
    pb: string;
    faceValue: string;
    divYield: string;
    bookValue: string;
    cash: string;
    debt: string;
    promoterHolding: string;
    epsTTM: string;
    salesGrowth: string;
    roe: string;
    roce: string;
    profitGrowth: string;
  };
  finStar: {
    overall: number;
    ownership: { status: string; stars: number; desc: string };
    valuation: { status: string; stars: number; desc: string };
    efficiency: { status: string; stars: number; desc: string };
    financials: { status: string; stars: number; desc: string };
  };
  brands: string[];
  indexPresence: Array<{ name: string; desc: string; price: string; change: string; isUp: boolean }>;
  groupCompanies: Array<{ symbol: string; name: string; sector: string; price: string; mcap: string; status: string; isUp: boolean }>;
  ratiosHistorical: {
    salesGrowth: { yr1: string; yr3: string; yr5: string };
    profitGrowth: { yr1: string; yr3: string; yr5: string };
    roe: { yr1: string; yr3: string; yr5: string };
    roce: { yr1: string; yr3: string; yr5: string };
    debtEquity: string;
    priceToCashFlow: string;
    interestCoverage: string;
    cfoPatRatio: string;
  };
  shareholding: {
    promoters: number;
    dii: number;
    fii: number;
    public: number;
    others: number;
    pledgedList: Array<{ date: string; promoterPct: string; pledgePct: string }>;
  };
  strengths: string[];
  limitations: string[];
  quarterlyResults: Array<{
    particulars: string;
    periods: string[];
    values: string[][];
  }>;
  annualPnL: Array<{
    particulars: string;
    periods: string[];
    values: string[][];
  }>;
  balanceSheet: Array<{
    particulars: string;
    periods: string[];
    values: string[][];
  }>;
  cashFlows: Array<{
    particulars: string;
    periods: string[];
    values: string[][];
  }>;
  corporateActions: {
    dividend: Array<{ exDate: string; recordDate: string; divPct: string; amount: string; type: string }>;
    bonus: Array<{ exDate: string; ratio: string }>;
    rights: Array<{ exDate: string; ratio: string; price: string }>;
    splits: Array<{ exDate: string; oldFV: string; newFV: string }>;
  };
  superInvestors: Array<{ name: string; holdingVal: string; period: string; detailsUrl: string; avatar: string }>;
  faqs: Array<{ q: string; a: string }>;
}

export function getStockDetailedData(symbol: string, currentPriceVal: number, ratiosFromApi?: any, exchange: string = ''): StockDetailedData {
  const sym = symbol.toUpperCase();
  const price = currentPriceVal || 1330.95;

  // Derive initial values
  const mcapNum = ratiosFromApi?.market_cap ? ratiosFromApi.market_cap / 10000000 : 1799827.65;
  const peVal = ratiosFromApi?.pe || "41.04";
  const pbVal = ratiosFromApi?.pb || "3.18";
  const roeVal = ratiosFromApi?.roe || "7.91%";
  const roceVal = ratiosFromApi?.roce || "7.92%";
  const epsVal = ratiosFromApi?.eps || "32.40";
  const divYieldVal = ratiosFromApi?.dividend_yield || "0.45%";
  const deVal = ratiosFromApi?.debt_equity || "0.41";

  // Check if stock is Reliance Industries
  if (sym === 'RELIANCE' || sym.startsWith('RELIANCE')) {
    return {
      exchangeCode: "NSE: RELIANCE",
      secExchange: "BSE: 500325",
      followers: "33.31 L",
      priceSummary: {
        high: price * 1.003,
        low: price * 0.99,
        week52High: 1611.20,
        week52Low: 1253.65,
      },
      essentials: {
        marketCapCr: `₹ ${Number(mcapNum).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr.`,
        enterpriseValue: `₹ ${Number(mcapNum * 1.07).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr.`,
        noOfShares: "1,353.25 Cr.",
        pe: peVal,
        pb: pbVal,
        faceValue: "₹ 10",
        divYield: divYieldVal,
        bookValue: "₹ 418.41",
        cash: "₹ 1,08,179 Cr.",
        debt: "₹ 2,31,381 Cr.",
        promoterHolding: "50 %",
        epsTTM: `₹ ${epsVal}`,
        salesGrowth: "-2.26 %",
        roe: roeVal,
        roce: roceVal,
        profitGrowth: "24.36 %"
      },
      finStar: {
        overall: 3,
        ownership: { status: "Stable", stars: 3, desc: "Ownership strength is slightly missing the benchmark." },
        valuation: { status: "Expensive", stars: 1, desc: "The stock is at a premium valuation at this point." },
        efficiency: { status: "Poor", stars: 2, desc: "The company seems highly inefficient in case of asset management." },
        financials: { status: "Average", stars: 3, desc: "The company could improve upon its asset employment." }
      },
      brands: [
        "Anomaly", "FACEGYM", "Kelvinator", "Campa Cola", "Gapco", "AUTO LPG", "Trans-Connect", "Zivame", "A1 Plaza", "R Care",
        "Qwik Mart", "Refresh", "RELSTAR", "REPOL", "RELENE", "REON", "RELPIPE", "Reflex", "RELWOOD", "IMPRAMER", "RELX", "RELAB",
        "Recron", "Relpet", "Reliance Retail", "Reliance Fresh", "Reliance Super", "Reliance SMART", "RELIANCE MARKET",
        "Reliance Digital", "Reliance Digital Xpress", "iStore", "ResQ", "Reliance Jewels", "TRENDS", "AJIO", "PROJECT EVE",
        "Avaasa", "DNMX", "JOHN PLAYERS", "NETPLAY", "Ermenegildo Zegna", "Paul & Shark", "Stuart Weitzman", "Brooks Brothers",
        "Vision Express", "VIMAL", "Candie's", "Jio", "IBN", "IndiaCast", "IBNLive", "Burpp", "Colosseum", "H. LEWIS",
        "GEORGIA GULLINI", "D-CREASED"
      ],
      indexPresence: [
        { name: "NIFTYENERGY", desc: "NIFTY ENERGY INDEX", price: "40,105.15", change: "+189.75 (0.48%)", isUp: true },
        { name: "NIFTINDSCORP", desc: "NIFTY INDIA SELECT 5 GROUPS", price: "38,588.25", change: "+56.70 (0.15%)", isUp: true },
        { name: "NIFTY100WEIGHT", desc: "NIFTY100 EQUAL WEIGHT", price: "34,318.30", change: "+97.95 (0.29%)", isUp: true },
        { name: "NIFTYEQWGT", desc: "NIFTY50 EQUAL WEIGHT", price: "32,545.50", change: "+49.50 (0.15%)", isUp: true }
      ],
      groupCompanies: [
        { symbol: "RELIANCE", name: "Reliance Industries", sector: "Refineries", price: "1,330.95", mcap: "17,99,827.65", status: "ACTIVE", isUp: true },
        { symbol: "JIOFIN", name: "JIO Financial Serv.", sector: "Finance - NBFC", price: "242.40", mcap: "1,60,060.15", status: "ACTIVE", isUp: true },
        { symbol: "NETWORK18", name: "Network 18 Media Inv", sector: "TV Broadcasting", price: "34.17", mcap: "5,269.01", status: "ACTIVE", isUp: true }
      ],
      ratiosHistorical: {
        salesGrowth: { yr1: "-2.26%", yr3: "-2.13%", yr5: "15.53%" },
        profitGrowth: { yr1: "24.36%", yr3: "-0.26%", yr5: "6.54%" },
        roe: { yr1: "7.91%", yr3: "7.68%", yr5: "8.09%" },
        roce: { yr1: "7.92%", yr3: "8.41%", yr5: "8.61%" },
        debtEquity: deVal,
        priceToCashFlow: "22.78",
        interestCoverage: "8.83",
        cfoPatRatio: "1.76"
      },
      shareholding: {
        promoters: 50.39,
        dii: 20.65,
        fii: 18.66,
        public: 10.30,
        others: 0.00,
        pledgedList: [
          { date: "Mar 2026", promoterPct: "50.00%", pledgePct: "0.00%" },
          { date: "Dec 2025", promoterPct: "50.01%", pledgePct: "0.00%" },
          { date: "Sep 2025", promoterPct: "50.01%", pledgePct: "0.00%" },
          { date: "Jun 2025", promoterPct: "50.07%", pledgePct: "0.00%" },
          { date: "Mar 2025", promoterPct: "50.11%", pledgePct: "0.00%" }
        ]
      },
      strengths: [
        `Company has a healthy interest coverage ratio of 8.83.`,
        `The company has an efficient Cash Conversion Cycle of -53.86 days.`,
        `The company has a good cash flow management; CFO/PAT stands at 1.76.`
      ],
      limitations: [
        `The company has shown a poor profit growth of 0.65% for the Past 3 years.`,
        `The company has shown a poor revenue growth of -2.13% for the Past 3 years.`,
        `Company has a poor ROE of 7.68% over the past 3 years.`,
        `The company is trading at a high PE of 41.07.`
      ],
      quarterlyResults: [
        { particulars: "Net Sales", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["1,36,147", "1,21,369", "1,30,610", "1,25,741", "1,46,385"]] },
        { particulars: "Total Expenditure", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["1,21,031", "1,08,199", "1,16,221", "1,10,851", "1,34,423"]] },
        { particulars: "Operating Profit", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["15,116", "13,170", "14,389", "14,890", "11,962"]] },
        { particulars: "Other Income", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["5,577", "13,460", "3,445", "3,412", "3,357"]] },
        { particulars: "Interest", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["2,058", "2,194", "1,770", "1,473", "1,467"]] },
        { particulars: "Depreciation", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["4,464", "4,130", "4,472", "4,434", "4,069"]] },
        { particulars: "Exceptional Items", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["0", "0", "0", "0", "0"]] },
        { particulars: "Profit Before Tax", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["14,171", "20,306", "11,592", "12,395", "9,783"]] },
        { particulars: "Tax", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["2,954", "2,402", "2,463", "2,999", "2,361"]] },
        { particulars: "Profit After Tax", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["11,217", "17,904", "9,129", "9,396", "7,422"]] },
        { particulars: "Adjusted EPS (Rs)", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["8.29", "13.23", "6.75", "6.94", "5.48"]] }
      ],
      annualPnL: [
        { particulars: "Net Sales", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["4,22,323", "5,39,347", "5,34,534", "5,17,349", "5,05,649"]] },
        { particulars: "Total Expenditure", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["3,71,383", "4,73,767", "4,60,269", "4,59,531", "4,51,523"]] },
        { particulars: "Operating Profit", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["50,940", "65,580", "74,265", "57,818", "54,126"]] },
        { particulars: "Other Income", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["13,843", "12,338", "12,128", "16,345", "23,959"]] },
        { particulars: "Interest", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["10,264", "12,633", "13,430", "10,054", "6,904"]] },
        { particulars: "Depreciation", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["10,264", "11,167", "17,690", "17,981", "17,105"]] },
        { particulars: "Profit Before Tax", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["45,396", "54,118", "55,273", "46,128", "54,076"]] },
        { particulars: "Net Profit", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["34,084", "44,190", "42,042", "35,262", "43,851"]] }
      ],
      balanceSheet: [
        { particulars: "Share Capital", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["6,765", "6,766", "6,766", "13,532", "13,532"]] },
        { particulars: "Total Reserves", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["4,64,762", "4,72,312", "5,08,330", "5,29,555", "5,52,703"]] },
        { particulars: "Borrowings", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["1,67,231", "1,35,561", "1,61,059", "1,72,025", "1,88,070"]] },
        { particulars: "Net Block", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["2,39,626", "2,82,301", "2,99,630", "3,11,047", "3,07,109"]] },
        { particulars: "Investments", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["3,30,493", "2,65,067", "3,01,400", "3,33,258", "3,64,073"]] },
        { particulars: "Total Assets", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["8,79,461", "9,29,097", "9,70,565", "10,31,800", "11,73,988"]] }
      ],
      cashFlows: [
        { particulars: "Profit from operations", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["46,786", "55,557", "55,273", "46,128", "54,076"]] },
        { particulars: "Operating Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["67,491", "55,340", "73,998", "79,392", "79,059"]] },
        { particulars: "Investing Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["-45,315", "-3,457", "-38,292", "-28,106", "-50,451"]] },
        { particulars: "Financing Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["-6,035", "-7,369", "-27,465", "-38,063", "-2,900"]] },
        { particulars: "Net Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["16,141", "34,293", "8,241", "13,223", "25,708"]] }
      ],
      corporateActions: {
        dividend: [
          { exDate: "05 Jun 2026", recordDate: "05 Jun 2026", divPct: "60", amount: "6", type: "Final" },
          { exDate: "14 Aug 2025", recordDate: "14 Aug 2025", divPct: "55", amount: "5.5", type: "Final" },
          { exDate: "19 Aug 2024", recordDate: "19 Aug 2024", divPct: "100", amount: "10", type: "Final" }
        ],
        bonus: [
          { exDate: "28 Oct 2024", ratio: "1:1" }
        ],
        rights: [
          { exDate: "14 May 2020", ratio: "1:15", price: "1257.00" }
        ],
        splits: []
      },
      superInvestors: [
        { name: "Mukesh Ambani & Family", holdingVal: "₹ 3,38,531.29 Cr.", period: "As of March 2026", detailsUrl: "Details", avatar: "M" },
        { name: "Government of Singapore", holdingVal: "₹ 18,102.50 Cr.", period: "As of March 2026", detailsUrl: "Details", avatar: "G" },
        { name: "Life Insurance Corporation", holdingVal: "₹ 1,20,376.85 Cr.", period: "As of March 2026", detailsUrl: "Details", avatar: "L" }
      ],
      faqs: [
        { q: "What is Reliance Industries share price today?", a: `The current share price of Reliance Industries is ₹ ${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.` },
        { q: "What is the market capitalisation of Reliance Industries?", a: `Reliance Industries has a market capitalisation of ₹ ${Number(mcapNum).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr.` },
        { q: "What are the P/E and P/B ratios of Reliance Industries?", a: `The PE ratio of Reliance Industries is ${peVal} and the P/B ratio is ${pbVal}.` },
        { q: "What is the 52-week high and low of Reliance Industries share?", a: "The 52-week high share price is ₹ 1,611.20, and the 52-week low is ₹ 1,253.20." },
        { q: "Does Reliance Industries pay dividends?", a: "Yes. Reliance Industries has paid a latest dividend of ₹ 6 per share. Dividends are around 0.45%." },
        { q: "What is the face value and book value of Reliance Industries shares?", a: "The face value is ₹ 10, and the book value per share is ₹ 418.41." },
        { q: "What is the debt of Reliance Industries?", a: "Reliance Industries has a total debt of ₹ 2,31,381 Cr., with a Debt/Equity ratio of 0.41." },
        { q: "What are the ROE and ROCE of Reliance Industries?", a: `The ROE is ${roeVal} and the ROCE is ${roceVal}.` }
      ]
    };
  }

  // --- MOCK AND GENERATED RESPONDERS FOR TSLA, MSFT, AAPL, AND GENERAL STOCKS ---
  const exUpper = (exchange || '').toUpperCase();
  const isNasdaq = sym === 'AAPL' || sym === 'MSFT' || sym === 'TSLA' || sym === 'NVDA' ||
    exUpper.includes('NASDAQ') || exUpper.includes('NYSE') || exUpper.includes('US') || exUpper.includes('OTC') ||
    (!sym.endsWith('.NS') && !sym.endsWith('.BO') && (sym === 'SNDK' || sym === 'DELL' || sym === 'WDC' || sym === 'HPE' || sym === 'NTAP' || sym.length <= 5));
  const currencySign = isNasdaq ? '$' : '₹';

  const defaultBrands = {
    AAPL: ["iPhone", "MacBook Air", "MacBook Pro", "iPad", "Apple Watch", "AirPods", "iOS", "iCloud", "Apple TV+", "Vision Pro"],
    MSFT: ["Windows 11", "Office 365", "Microsoft Azure", "Xbox Series X", "Surface Laptop", "LinkedIn", "Copilot AI", "GitHub Enterprise"],
    TSLA: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Full Self-Driving (FSD)", "Megapack", "Supercharger Network"],
    NVDA: ["GeForce RTX", "NVIDIA H100", "CUDA Architecture", "DGX Systems", "NVIDIA Omniverse", "GeForce NOW", "Shield TV"]
  };

  const selectedBrands = defaultBrands[sym as keyof typeof defaultBrands] || [
    `${sym} Core`, `${sym} Cloud`, `${sym} Enterprise`, `${sym} Premium`, `${sym} Services`
  ];

  const defaultIndices = isNasdaq ? [
    { name: "NASDAQ100", desc: "NASDAQ 100 INDEX", price: "20,412.50", change: "+124.50 (0.61%)", isUp: true },
    { name: "S&P500", desc: "S&P 500 INDEX", price: "5,622.10", change: "+41.80 (0.75%)", isUp: true },
    { name: "DOWJONES", desc: "DOW JONES INDUSTRIAL", price: "41,120.30", change: "-12.50 (-0.03%)", isUp: false },
    { name: "NYSEAHEAD", desc: "NYSE ALL-SHARE", price: "18,220.00", change: "+54.20 (0.30%)", isUp: true }
  ] : [
    { name: "NIFTY55", desc: "NIFTY 50 INDEX", price: "23,124.80", change: "+104.20 (0.45%)", isUp: true },
    { name: "SENSEX", desc: "SENSEX CAP INDEX", price: "76,145.20", change: "+322.10 (0.42%)", isUp: true },
    { name: "NIFTY100", desc: "NIFTY 100 EQUAL WEIGHT", price: "24,510.15", change: "+45.30 (0.19%)", isUp: true },
    { name: "NIFTYIT", desc: "NIFTY IT SECTOR INDEX", price: "36,920.80", change: "-14.20 (-0.04%)", isUp: false }
  ];

  // Dynamically estimate valuation star descriptors
  const peParsed = parseFloat(peVal);
  const roeParsed = parseFloat(roeVal);
  let valRating = { status: "Fair", stars: 3, desc: "Trading at an acceptable value relative to trailing multipliers." };
  if (peParsed > 30) {
    valRating = { status: "Expensive", stars: 1, desc: "The stock is at a premium valuation at this point." };
  } else if (peParsed < 15) {
    valRating = { status: "Attractive", stars: 4, desc: "Trading at positive, comfortable multipliers for value seekers." };
  }

  const overallRating = ratiosFromApi?.pe ? (peParsed > 40 ? 3 : 4) : 4;

  return {
    exchangeCode: isNasdaq ? `NASDAQ: ${sym}` : `NSE: ${sym}`,
    secExchange: isNasdaq ? `NYSE: ${sym}` : `BSE: ${sym}`,
    followers: isNasdaq ? "1.5 M" : "5.4 L",
    priceSummary: {
      high: price * 1.015,
      low: price * 0.985,
      week52High: price * 1.25,
      week52Low: price * 0.78
    },
    essentials: {
      marketCapCr: isNasdaq ? `${currencySign} ${(mcapNum / 100000).toFixed(2)} T` : `₹ ${Number(mcapNum).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr.`,
      enterpriseValue: isNasdaq ? `${currencySign} ${(mcapNum * 1.02 / 100000).toFixed(2)} T` : `₹ ${Number(mcapNum * 1.03).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr.`,
      noOfShares: isNasdaq ? "42.50 B" : "42.50 Cr.",
      pe: peVal,
      pb: pbVal,
      faceValue: `${currencySign} 2`,
      divYield: divYieldVal,
      bookValue: `${currencySign} ${(price * 0.28).toFixed(2)}`,
      cash: `${currencySign} 45.20 B`,
      debt: `${currencySign} 12.80 B`,
      promoterHolding: "12.50 %",
      epsTTM: `${currencySign} ${epsVal}`,
      salesGrowth: "12.40 %",
      roe: roeVal,
      roce: roceVal,
      profitGrowth: "18.30 %"
    },
    finStar: {
      overall: overallRating,
      ownership: { status: "Stable", stars: 4, desc: "The strategic promoter and public registry holds excellent support." },
      valuation: valRating,
      efficiency: { status: roeParsed > 15 ? "Strong" : "Average", stars: roeParsed > 15 ? 4 : 3, desc: `Capital allocation and business operations are returns-accretive with ROE at ${roeVal}.` },
      financials: { status: "Good", stars: 4, desc: "Strong balance sheets and regular commercial asset cycles." }
    },
    brands: selectedBrands,
    indexPresence: defaultIndices,
    groupCompanies: [
      { symbol: sym, name: `${sym} Corp Ltd.`, sector: "Technology core", price: price.toFixed(2), mcap: `${mcapNum}`, status: "ACTIVE", isUp: true }
    ],
    ratiosHistorical: {
      salesGrowth: { yr1: "12.40%", yr3: "9.50%", yr5: "14.20%" },
      profitGrowth: { yr1: "18.30%", yr3: "11.20%", yr5: "12.50%" },
      roe: { yr1: roeVal, yr3: "17.40%", yr5: "16.80%" },
      roce: { yr1: roceVal, yr3: "18.25%", yr5: "19.10%" },
      debtEquity: deVal,
      priceToCashFlow: "18.50",
      interestCoverage: "22.40",
      cfoPatRatio: "1.25"
    },
    shareholding: {
      promoters: 12.50,
      dii: 35.40,
      fii: 42.10,
      public: 10.00,
      others: 0.00,
      pledgedList: [
        { date: "Mar 2026", promoterPct: "12.50%", pledgePct: "0.00%" },
        { date: "Dec 2025", promoterPct: "12.50%", pledgePct: "0.00%" }
      ]
    },
    strengths: [
      `The company has excellent ROCE indicators of ${roceVal}.`,
      `Very conservative debt profile with Debt/Equity index at ${deVal}.`,
      `Efficient cash asset employment across operating platforms.`
    ],
    limitations: [
      `Earnings multiples remain high with standard P/E trailing ${peVal}.`,
      `Subject to global regulatory risks and macroeconomic currency shifts.`
    ],
    quarterlyResults: [
      { particulars: "Revenue", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["82,900", "84,100", "88,200", "91,500", "94,200"]] },
      { particulars: "Cost of Revenue", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["44,500", "45,200", "47,100", "48,900", "50,100"]] },
      { particulars: "Gross Profit", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["38,400", "38,900", "41,100", "42,600", "44,100"]] },
      { particulars: "Research & Development", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["7,500", "7,600", "7,800", "8,000", "8,200"]] },
      { particulars: "SG&A Expenses", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["6,200", "6,300", "6,400", "6,500", "6,600"]] },
      { particulars: "Total Expenses", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["58,200", "59,100", "61,300", "63,400", "64,900"]] },
      { particulars: "Operating Profit (EBITDA)", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["24,700", "25,000", "26,900", "28,100", "29,300"]] },
      { particulars: "Depreciation & Amortization", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["2,900", "2,800", "2,950", "3,000", "3,100"]] },
      { particulars: "Finance Costs / Interest", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["950", "920", "880", "850", "820"]] },
      { particulars: "Other Income (Net)", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["350", "420", "380", "410", "450"]] },
      { particulars: "Profit Before Tax (PBT)", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["21,200", "21,700", "23,450", "24,660", "25,830"]] },
      { particulars: "Tax Expense", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["3,000", "2,700", "3,350", "3,160", "3,030"]] },
      { particulars: "Net Profit / Net Income", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["18,200", "19,000", "20,100", "21,500", "22,800"]] },
      { particulars: "Adjusted EPS", periods: ["MAR 25", "JUN 25", "SEP 25", "DEC 25", "MAR 26"], values: [["1.22", "1.28", "1.34", "1.42", "1.50"]] }
    ],
    annualPnL: [
      { particulars: "Revenue", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["280,000", "310,000", "335,000", "354,000", "380,000"]] },
      { particulars: "Cost of Revenue", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["151,200", "167,400", "180,900", "191,100", "205,200"]] },
      { particulars: "Gross Profit", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["128,800", "142,600", "154,100", "162,900", "174,800"]] },
      { particulars: "R&D Expenses", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["26,000", "28,000", "30,000", "32,000", "34,000"]] },
      { particulars: "SG&A Expenses", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["21,500", "23,400", "24,800", "25,600", "26,700"]] },
      { particulars: "Total Expenses", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["198,700", "218,800", "235,700", "248,700", "265,900"]] },
      { particulars: "Operating Profit (EBITDA)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["81,300", "91,200", "99,300", "105,300", "114,100"]] },
      { particulars: "Depreciation & Amortization", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["9,800", "10,200", "11,500", "12,100", "12,900"]] },
      { particulars: "Finance Costs / Interest", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["3,800", "3,600", "3,400", "3,200", "3,000"]] },
      { particulars: "Other Income / (Loss)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["1,200", "1,400", "1,100", "1,300", "1,500"]] },
      { particulars: "Profit Before Tax (PBT)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["68,900", "78,800", "85,500", "91,300", "99,700"]] },
      { particulars: "Tax Expense", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["14,900", "16,800", "17,500", "17,300", "16,700"]] },
      { particulars: "Net Profit / Net Income", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["54,000", "62,000", "68,000", "74,000", "83,000"]] },
      { particulars: "EPS", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["3.90", "4.40", "4.85", "5.20", "5.75"]] }
    ],
    balanceSheet: [
      { particulars: "Equity Share Capital", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["4,200", "4,200", "4,200", "4,200", "4,200"]] },
      { particulars: "Reserves & Surplus", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["145,000", "168,000", "192,000", "210,000", "242,000"]] },
      { particulars: "Total Shareholders' Equity", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["149,200", "172,200", "196,200", "214,200", "246,200"]] },
      { particulars: "Long Term Borrowings", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["45,000", "48,000", "52,000", "55,000", "62,000"]] },
      { particulars: "Short Term Borrowings", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["15,000", "18,000", "20,000", "25,000", "28,000"]] },
      { particulars: "Total Debt (Borrowings)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["60,000", "66,000", "72,000", "80,000", "90,000"]] },
      { particulars: "Trade Payables", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["38,000", "42,000", "45,000", "48,000", "52,000"]] },
      { particulars: "Other Liabilities", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["22,800", "29,800", "26,800", "32,800", "35,800"]] },
      { particulars: "Total Liabilities", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["210,000", "240,000", "268,000", "295,000", "342,000"]] },
      { particulars: "Net Block (PPE)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["42,000", "44,000", "46,000", "48,000", "50,000"]] },
      { particulars: "Capital WIP", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["4,500", "5,200", "6,100", "6,800", "7,500"]] },
      { particulars: "Long Term Investments", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["75,000", "85,000", "98,000", "108,000", "122,000"]] },
      { particulars: "Trade Receivables", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["22,500", "24,800", "26,900", "28,200", "31,500"]] },
      { particulars: "Cash & Cash Equivalents", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["45,200", "52,000", "58,000", "64,000", "75,000"]] },
      { particulars: "Other Assets", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["20,800", "29,000", "33,000", "40,000", "56,000"]] },
      { particulars: "Total Assets", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["210,000", "240,000", "268,000", "295,000", "342,000"]] }
    ],
    cashFlows: [
      { particulars: "Operating Profit Before WC", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["54,000", "62,000", "68,000", "74,000", "83,000"]] },
      { particulars: "Operating Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["58,000", "65,000", "72,000", "78,000", "86,050"]] },
      { particulars: "Capital Expenditures (CapEx)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["-12,000", "-13,500", "-15,000", "-16,200", "-18,500"]] },
      { particulars: "Investing Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["-25,000", "-28,000", "-32,000", "-36,000", "-41,200"]] },
      { particulars: "Financing Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["-21,000", "-21,800", "-31,100", "-30,600", "-30,550"]] },
      { particulars: "Net Cash Flow", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["12,000", "15,200", "8,900", "11,400", "14,300"]] },
      { particulars: "Free Cash Flow (FCF)", periods: ["MAR 22", "MAR 23", "MAR 24", "MAR 25", "MAR 26"], values: [["46,000", "51,500", "57,000", "61,800", "67,550"]] }
    ],
    corporateActions: {
      dividend: [
        { exDate: "12 May 2026", recordDate: "13 May 2026", divPct: "100", amount: "2.50", type: "Regular" },
        { exDate: "14 Nov 2025", recordDate: "15 Nov 2025", divPct: "90", amount: "2.25", type: "Regular" }
      ],
      bonus: [],
      rights: [],
      splits: []
    },
    superInvestors: [
      { name: "Vanguard Mutual Funds", holdingVal: `${currencySign} 145.20 B`, period: "As of March 2026", detailsUrl: "Details", avatar: "V" },
      { name: "BlackRock Institutional", holdingVal: `${currencySign} 118.50 B`, period: "As of March 2026", detailsUrl: "Details", avatar: "B" }
    ],
    faqs: [
      { q: `What is ${sym} share price today?`, a: `The current share price of ${sym} is ${currencySign} ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}.` },
      { q: `What is the market capitalisation of ${sym}?`, a: `${sym} has an updated equity valuation of ${currencySign} ${(mcapNum / 100).toFixed(2)} Billion.` },
      { q: `What is the P/E ratio of ${sym}?`, a: `The current price-to-earnings trailing multiple is ${peVal}.` }
    ]
  };
}
