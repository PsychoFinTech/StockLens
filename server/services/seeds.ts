/**
 * Seeds dataset of S&P 500 plus popular global equities.
 * Total seeded: 643
 */
export interface StockSeed {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
}

export const SEED_STOCKS: StockSeed[] = [
  {
    "symbol": "MMM",
    "name": "3M",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Conglomerates",
    "country": "United States"
  },
  {
    "symbol": "AOS",
    "name": "A. O. Smith",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "ABT",
    "name": "Abbott Laboratories",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "ABBV",
    "name": "AbbVie",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "ACN",
    "name": "Accenture",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "IT Consulting & Other Services",
    "country": "United States"
  },
  {
    "symbol": "ADBE",
    "name": "Adobe Inc.",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "AMD",
    "name": "Advanced Micro Devices",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "AES",
    "name": "AES Corporation",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Independent Power Producers & Energy Traders",
    "country": "United States"
  },
  {
    "symbol": "AFL",
    "name": "Aflac",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Life & Health Insurance",
    "country": "United States"
  },
  {
    "symbol": "A",
    "name": "Agilent Technologies",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "APD",
    "name": "Air Products",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Industrial Gases",
    "country": "United States"
  },
  {
    "symbol": "ABNB",
    "name": "Airbnb",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "AKAM",
    "name": "Akamai Technologies",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Internet Services & Infrastructure",
    "country": "United States"
  },
  {
    "symbol": "ALB",
    "name": "Albemarle Corporation",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "ARE",
    "name": "Alexandria Real Estate Equities",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Office REITs",
    "country": "United States"
  },
  {
    "symbol": "ALGN",
    "name": "Align Technology",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Supplies",
    "country": "United States"
  },
  {
    "symbol": "ALLE",
    "name": "Allegion",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "LNT",
    "name": "Alliant Energy",
    "exchange": "NASDAQ",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "ALL",
    "name": "Allstate",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "GOOGL",
    "name": "Alphabet Inc. (Class A)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Interactive Media & Services",
    "country": "United States"
  },
  {
    "symbol": "GOOG",
    "name": "Alphabet Inc. (Class C)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Interactive Media & Services",
    "country": "United States"
  },
  {
    "symbol": "MO",
    "name": "Altria",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Tobacco",
    "country": "United States"
  },
  {
    "symbol": "AMZN",
    "name": "Amazon",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Broadline Retail",
    "country": "United States"
  },
  {
    "symbol": "AMCR",
    "name": "Amcor",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Paper & Plastic Packaging Products & Materials",
    "country": "United States"
  },
  {
    "symbol": "AEE",
    "name": "Ameren",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "AEP",
    "name": "American Electric Power",
    "exchange": "NASDAQ",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "AXP",
    "name": "American Express",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Consumer Finance",
    "country": "United States"
  },
  {
    "symbol": "AIG",
    "name": "American International Group",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Multi-line Insurance",
    "country": "United States"
  },
  {
    "symbol": "AMT",
    "name": "American Tower",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Telecom Tower REITs",
    "country": "United States"
  },
  {
    "symbol": "AWK",
    "name": "American Water Works",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Water Utilities",
    "country": "United States"
  },
  {
    "symbol": "AMP",
    "name": "Ameriprise Financial",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "AME",
    "name": "Ametek",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Electrical Components & Equipment",
    "country": "United States"
  },
  {
    "symbol": "AMGN",
    "name": "Amgen",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "APH",
    "name": "Amphenol",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Components",
    "country": "United States"
  },
  {
    "symbol": "ADI",
    "name": "Analog Devices",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "AON",
    "name": "Aon plc",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Insurance Brokers",
    "country": "United States"
  },
  {
    "symbol": "APA",
    "name": "APA Corporation",
    "exchange": "NASDAQ",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "APO",
    "name": "Apollo Global Management",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "AMAT",
    "name": "Applied Materials",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductor Materials & Equipment",
    "country": "United States"
  },
  {
    "symbol": "APP",
    "name": "AppLovin",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "APTV",
    "name": "Aptiv",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Automotive Parts & Equipment",
    "country": "United States"
  },
  {
    "symbol": "ACGL",
    "name": "Arch Capital Group",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "ADM",
    "name": "Archer Daniels Midland",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Agricultural Products & Services",
    "country": "United States"
  },
  {
    "symbol": "ARES",
    "name": "Ares Management",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "ANET",
    "name": "Arista Networks",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Communications Equipment",
    "country": "United States"
  },
  {
    "symbol": "AJG",
    "name": "Arthur J. Gallagher & Co.",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Insurance Brokers",
    "country": "United States"
  },
  {
    "symbol": "AIZ",
    "name": "Assurant",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Multi-line Insurance",
    "country": "United States"
  },
  {
    "symbol": "T",
    "name": "AT&T",
    "exchange": "NYSE",
    "sector": "Communication Services",
    "industry": "Integrated Telecommunication Services",
    "country": "United States"
  },
  {
    "symbol": "ATO",
    "name": "Atmos Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Gas Utilities",
    "country": "United States"
  },
  {
    "symbol": "ADSK",
    "name": "Autodesk",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "ADP",
    "name": "Automatic Data Processing",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Human Resource & Employment Services",
    "country": "United States"
  },
  {
    "symbol": "AZO",
    "name": "AutoZone",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Automotive Retail",
    "country": "United States"
  },
  {
    "symbol": "AVB",
    "name": "AvalonBay Communities",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Multi-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "AVY",
    "name": "Avery Dennison",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Paper & Plastic Packaging Products & Materials",
    "country": "United States"
  },
  {
    "symbol": "AXON",
    "name": "Axon Enterprise",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "BKR",
    "name": "Baker Hughes",
    "exchange": "NASDAQ",
    "sector": "Energy",
    "industry": "Oil & Gas Equipment & Services",
    "country": "United States"
  },
  {
    "symbol": "BALL",
    "name": "Ball Corporation",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Metal, Glass & Plastic Containers",
    "country": "United States"
  },
  {
    "symbol": "BAC",
    "name": "Bank of America",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "BAX",
    "name": "Baxter International",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "BDX",
    "name": "Becton Dickinson",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "BRK-B",
    "name": "Berkshire Hathaway",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Multi-Sector Holdings",
    "country": "United States"
  },
  {
    "symbol": "BBY",
    "name": "Best Buy",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Computer & Electronics Retail",
    "country": "United States"
  },
  {
    "symbol": "TECH",
    "name": "Bio-Techne",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "BIIB",
    "name": "Biogen",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "BLK",
    "name": "BlackRock",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "BX",
    "name": "Blackstone Inc.",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "XYZ",
    "name": "Block, Inc.",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "BNY",
    "name": "BNY Mellon",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "BA",
    "name": "Boeing",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "BKNG",
    "name": "Booking Holdings",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "BSX",
    "name": "Boston Scientific",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "BMY",
    "name": "Bristol Myers Squibb",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "AVGO",
    "name": "Broadcom",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "BR",
    "name": "Broadridge Financial Solutions",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Data Processing & Outsourced Services",
    "country": "United States"
  },
  {
    "symbol": "BRO",
    "name": "Brown & Brown",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Insurance Brokers",
    "country": "United States"
  },
  {
    "symbol": "BF-B",
    "name": "Brown–Forman",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Distillers & Vintners",
    "country": "United States"
  },
  {
    "symbol": "BLDR",
    "name": "Builders FirstSource",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "BG",
    "name": "Bunge Global",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Agricultural Products & Services",
    "country": "United States"
  },
  {
    "symbol": "BXP",
    "name": "BXP, Inc.",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Office REITs",
    "country": "United States"
  },
  {
    "symbol": "CHRW",
    "name": "C.H. Robinson",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Air Freight & Logistics",
    "country": "United States"
  },
  {
    "symbol": "CDNS",
    "name": "Cadence Design Systems",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "CPT",
    "name": "Camden Property Trust",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Multi-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "CPB",
    "name": "Campbell's Company (The)",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "COF",
    "name": "Capital One",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Consumer Finance",
    "country": "United States"
  },
  {
    "symbol": "CAH",
    "name": "Cardinal Health",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Distributors",
    "country": "United States"
  },
  {
    "symbol": "CCL",
    "name": "Carnival Corporation",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "CARR",
    "name": "Carrier Global",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "CVNA",
    "name": "Carvana",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Automotive Retail",
    "country": "United States"
  },
  {
    "symbol": "CASY",
    "name": "Casey's",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Food Retail",
    "country": "United States"
  },
  {
    "symbol": "CAT",
    "name": "Caterpillar Inc.",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction Machinery & Heavy Transportation Equipment",
    "country": "United States"
  },
  {
    "symbol": "CBOE",
    "name": "Cboe Global Markets",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "CBRE",
    "name": "CBRE Group",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Real Estate Services",
    "country": "United States"
  },
  {
    "symbol": "CDW",
    "name": "CDW Corporation",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Distributors",
    "country": "United States"
  },
  {
    "symbol": "COR",
    "name": "Cencora",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Distributors",
    "country": "United States"
  },
  {
    "symbol": "CNC",
    "name": "Centene Corporation",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Managed Health Care",
    "country": "United States"
  },
  {
    "symbol": "CNP",
    "name": "CenterPoint Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "CF",
    "name": "CF Industries",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Fertilizers & Agricultural Chemicals",
    "country": "United States"
  },
  {
    "symbol": "CRL",
    "name": "Charles River Laboratories",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "SCHW",
    "name": "Charles Schwab Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Investment Banking & Brokerage",
    "country": "United States"
  },
  {
    "symbol": "CHTR",
    "name": "Charter Communications",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Cable & Satellite",
    "country": "United States"
  },
  {
    "symbol": "CVX",
    "name": "Chevron Corporation",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Integrated Oil & Gas",
    "country": "United States"
  },
  {
    "symbol": "CMG",
    "name": "Chipotle Mexican Grill",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Restaurants",
    "country": "United States"
  },
  {
    "symbol": "CB",
    "name": "Chubb Limited",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "CHD",
    "name": "Church & Dwight",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Household Products",
    "country": "United States"
  },
  {
    "symbol": "CIEN",
    "name": "Ciena",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Communications Equipment",
    "country": "United States"
  },
  {
    "symbol": "CI",
    "name": "Cigna",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Services",
    "country": "United States"
  },
  {
    "symbol": "CINF",
    "name": "Cincinnati Financial",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "CTAS",
    "name": "Cintas",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Diversified Support Services",
    "country": "United States"
  },
  {
    "symbol": "CSCO",
    "name": "Cisco",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Communications Equipment",
    "country": "United States"
  },
  {
    "symbol": "C",
    "name": "Citigroup",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "CFG",
    "name": "Citizens Financial Group",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Regional Banks",
    "country": "United States"
  },
  {
    "symbol": "CLX",
    "name": "Clorox",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Household Products",
    "country": "United States"
  },
  {
    "symbol": "CME",
    "name": "CME Group",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "CMS",
    "name": "CMS Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "KO",
    "name": "Coca-Cola Company (The)",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Soft Drinks & Non-alcoholic Beverages",
    "country": "United States"
  },
  {
    "symbol": "CTSH",
    "name": "Cognizant",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "IT Consulting & Other Services",
    "country": "United States"
  },
  {
    "symbol": "COHR",
    "name": "Coherent Corp.",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Components",
    "country": "United States"
  },
  {
    "symbol": "COIN",
    "name": "Coinbase",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "CL",
    "name": "Colgate-Palmolive",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Household Products",
    "country": "United States"
  },
  {
    "symbol": "CMCSA",
    "name": "Comcast",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Cable & Satellite",
    "country": "United States"
  },
  {
    "symbol": "FIX",
    "name": "Comfort Systems USA",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction & Engineering",
    "country": "United States"
  },
  {
    "symbol": "CAG",
    "name": "Conagra Brands",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "COP",
    "name": "ConocoPhillips",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "ED",
    "name": "Consolidated Edison",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "STZ",
    "name": "Constellation Brands",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Distillers & Vintners",
    "country": "United States"
  },
  {
    "symbol": "CEG",
    "name": "Constellation Energy",
    "exchange": "NASDAQ",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "COO",
    "name": "Cooper Companies (The)",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Supplies",
    "country": "United States"
  },
  {
    "symbol": "CPRT",
    "name": "Copart",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Diversified Support Services",
    "country": "United States"
  },
  {
    "symbol": "GLW",
    "name": "Corning Inc.",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Components",
    "country": "United States"
  },
  {
    "symbol": "CPAY",
    "name": "Corpay",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "CTVA",
    "name": "Corteva",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Fertilizers & Agricultural Chemicals",
    "country": "United States"
  },
  {
    "symbol": "CSGP",
    "name": "CoStar Group",
    "exchange": "NASDAQ",
    "sector": "Real Estate",
    "industry": "Real Estate Services",
    "country": "United States"
  },
  {
    "symbol": "COST",
    "name": "Costco",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Consumer Staples Merchandise Retail",
    "country": "United States"
  },
  {
    "symbol": "CRH",
    "name": "CRH plc",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Construction Materials",
    "country": "United States"
  },
  {
    "symbol": "CRWD",
    "name": "CrowdStrike",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Systems Software",
    "country": "United States"
  },
  {
    "symbol": "CCI",
    "name": "Crown Castle",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Telecom Tower REITs",
    "country": "United States"
  },
  {
    "symbol": "CSX",
    "name": "CSX Corporation",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Rail Transportation",
    "country": "United States"
  },
  {
    "symbol": "CMI",
    "name": "Cummins",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction Machinery & Heavy Transportation Equipment",
    "country": "United States"
  },
  {
    "symbol": "CVS",
    "name": "CVS Health",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Services",
    "country": "United States"
  },
  {
    "symbol": "DHR",
    "name": "Danaher Corporation",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "DRI",
    "name": "Darden Restaurants",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Restaurants",
    "country": "United States"
  },
  {
    "symbol": "DDOG",
    "name": "Datadog",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "DVA",
    "name": "DaVita",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Services",
    "country": "United States"
  },
  {
    "symbol": "DECK",
    "name": "Deckers Brands",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Footwear",
    "country": "United States"
  },
  {
    "symbol": "DE",
    "name": "Deere & Company",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Agricultural & Farm Machinery",
    "country": "United States"
  },
  {
    "symbol": "DELL",
    "name": "Dell Technologies",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "DAL",
    "name": "Delta Air Lines",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Passenger Airlines",
    "country": "United States"
  },
  {
    "symbol": "DVN",
    "name": "Devon Energy",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "DXCM",
    "name": "Dexcom",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "FANG",
    "name": "Diamondback Energy",
    "exchange": "NASDAQ",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "DLR",
    "name": "Digital Realty",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Data Center REITs",
    "country": "United States"
  },
  {
    "symbol": "DG",
    "name": "Dollar General",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Consumer Staples Merchandise Retail",
    "country": "United States"
  },
  {
    "symbol": "DLTR",
    "name": "Dollar Tree",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Consumer Staples Merchandise Retail",
    "country": "United States"
  },
  {
    "symbol": "D",
    "name": "Dominion Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "DPZ",
    "name": "Domino's",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Restaurants",
    "country": "United States"
  },
  {
    "symbol": "DASH",
    "name": "DoorDash",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Specialized Consumer Services",
    "country": "United States"
  },
  {
    "symbol": "DOV",
    "name": "Dover Corporation",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "DOW",
    "name": "Dow Inc.",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Commodity Chemicals",
    "country": "United States"
  },
  {
    "symbol": "DHI",
    "name": "D. R. Horton",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Homebuilding",
    "country": "United States"
  },
  {
    "symbol": "DTE",
    "name": "DTE Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "DUK",
    "name": "Duke Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "DD",
    "name": "DuPont",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "ETN",
    "name": "Eaton Corporation",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Electrical Components & Equipment",
    "country": "United States"
  },
  {
    "symbol": "EBAY",
    "name": "eBay Inc.",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Broadline Retail",
    "country": "United States"
  },
  {
    "symbol": "SATS",
    "name": "EchoStar",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Wireless Telecommunication Services",
    "country": "United States"
  },
  {
    "symbol": "ECL",
    "name": "Ecolab",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "EIX",
    "name": "Edison International",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "EW",
    "name": "Edwards Lifesciences",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "EA",
    "name": "Electronic Arts",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Interactive Home Entertainment",
    "country": "United States"
  },
  {
    "symbol": "ELV",
    "name": "Elevance Health",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Managed Health Care",
    "country": "United States"
  },
  {
    "symbol": "EME",
    "name": "Emcor",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction & Engineering",
    "country": "United States"
  },
  {
    "symbol": "EMR",
    "name": "Emerson Electric",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Electrical Components & Equipment",
    "country": "United States"
  },
  {
    "symbol": "ETR",
    "name": "Entergy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "EOG",
    "name": "EOG Resources",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "EQT",
    "name": "EQT Corporation",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "EFX",
    "name": "Equifax",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Research & Consulting Services",
    "country": "United States"
  },
  {
    "symbol": "EQIX",
    "name": "Equinix",
    "exchange": "NASDAQ",
    "sector": "Real Estate",
    "industry": "Data Center REITs",
    "country": "United States"
  },
  {
    "symbol": "EQR",
    "name": "Equity Residential",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Multi-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "ERIE",
    "name": "Erie Indemnity",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Insurance Brokers",
    "country": "United States"
  },
  {
    "symbol": "ESS",
    "name": "Essex Property Trust",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Multi-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "EL",
    "name": "Estée Lauder Companies (The)",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Personal Care Products",
    "country": "United States"
  },
  {
    "symbol": "EG",
    "name": "Everest Group",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Reinsurance",
    "country": "United States"
  },
  {
    "symbol": "EVRG",
    "name": "Evergy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "ES",
    "name": "Eversource Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "EXC",
    "name": "Exelon",
    "exchange": "NASDAQ",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "EXE",
    "name": "Expand Energy",
    "exchange": "NASDAQ",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "EXPE",
    "name": "Expedia Group",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "EXPD",
    "name": "Expeditors International",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Air Freight & Logistics",
    "country": "United States"
  },
  {
    "symbol": "EXR",
    "name": "Extra Space Storage",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Self-Storage REITs",
    "country": "United States"
  },
  {
    "symbol": "XOM",
    "name": "ExxonMobil",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Integrated Oil & Gas",
    "country": "United States"
  },
  {
    "symbol": "FFIV",
    "name": "F5, Inc.",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Communications Equipment",
    "country": "United States"
  },
  {
    "symbol": "FDS",
    "name": "FactSet",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "FICO",
    "name": "Fair Isaac",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "FAST",
    "name": "Fastenal",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Trading Companies & Distributors",
    "country": "United States"
  },
  {
    "symbol": "FRT",
    "name": "Federal Realty Investment Trust",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Retail REITs",
    "country": "United States"
  },
  {
    "symbol": "FDX",
    "name": "FedEx",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Air Freight & Logistics",
    "country": "United States"
  },
  {
    "symbol": "FDXF",
    "name": "FedEx Freight",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Cargo Ground Transportation",
    "country": "United States"
  },
  {
    "symbol": "FIS",
    "name": "Fidelity National Information Services",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "FITB",
    "name": "Fifth Third Bancorp",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Regional Banks",
    "country": "United States"
  },
  {
    "symbol": "FSLR",
    "name": "First Solar",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "FE",
    "name": "FirstEnergy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "FISV",
    "name": "Fiserv",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "F",
    "name": "Ford Motor Company",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Automobile Manufacturers",
    "country": "United States"
  },
  {
    "symbol": "FTNT",
    "name": "Fortinet",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Systems Software",
    "country": "United States"
  },
  {
    "symbol": "FTV",
    "name": "Fortive",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "FOXA",
    "name": "Fox Corporation (Class A)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Broadcasting",
    "country": "United States"
  },
  {
    "symbol": "FOX",
    "name": "Fox Corporation (Class B)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Broadcasting",
    "country": "United States"
  },
  {
    "symbol": "BEN",
    "name": "Franklin Resources",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "FCX",
    "name": "Freeport-McMoRan",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Copper",
    "country": "United States"
  },
  {
    "symbol": "GRMN",
    "name": "Garmin",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Consumer Electronics",
    "country": "United States"
  },
  {
    "symbol": "IT",
    "name": "Gartner",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "IT Consulting & Other Services",
    "country": "United States"
  },
  {
    "symbol": "GE",
    "name": "GE Aerospace",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "GEHC",
    "name": "GE HealthCare",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "GEV",
    "name": "GE Vernova",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Heavy Electrical Equipment",
    "country": "United States"
  },
  {
    "symbol": "GEN",
    "name": "Gen Digital",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Systems Software",
    "country": "United States"
  },
  {
    "symbol": "GNRC",
    "name": "Generac",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Electrical Components & Equipment",
    "country": "United States"
  },
  {
    "symbol": "GD",
    "name": "General Dynamics",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "GIS",
    "name": "General Mills",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "GM",
    "name": "General Motors",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Automobile Manufacturers",
    "country": "United States"
  },
  {
    "symbol": "GPC",
    "name": "Genuine Parts Company",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Distributors",
    "country": "United States"
  },
  {
    "symbol": "GILD",
    "name": "Gilead Sciences",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "GPN",
    "name": "Global Payments",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "GL",
    "name": "Globe Life",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Life & Health Insurance",
    "country": "United States"
  },
  {
    "symbol": "GDDY",
    "name": "GoDaddy",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Internet Services & Infrastructure",
    "country": "United States"
  },
  {
    "symbol": "GS",
    "name": "Goldman Sachs",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Investment Banking & Brokerage",
    "country": "United States"
  },
  {
    "symbol": "HAL",
    "name": "Halliburton",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Equipment & Services",
    "country": "United States"
  },
  {
    "symbol": "HIG",
    "name": "Hartford (The)",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "HAS",
    "name": "Hasbro",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Leisure Products",
    "country": "United States"
  },
  {
    "symbol": "HCA",
    "name": "HCA Healthcare",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Facilities",
    "country": "United States"
  },
  {
    "symbol": "DOC",
    "name": "Healthpeak Properties",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Health Care REITs",
    "country": "United States"
  },
  {
    "symbol": "HSIC",
    "name": "Henry Schein",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Distributors",
    "country": "United States"
  },
  {
    "symbol": "HSY",
    "name": "Hershey Company (The)",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "HPE",
    "name": "Hewlett Packard Enterprise",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "HLT",
    "name": "Hilton Worldwide",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "HD",
    "name": "Home Depot (The)",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Home Improvement Retail",
    "country": "United States"
  },
  {
    "symbol": "HON",
    "name": "Honeywell",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Industrial Conglomerates",
    "country": "United States"
  },
  {
    "symbol": "HRL",
    "name": "Hormel Foods",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "HST",
    "name": "Host Hotels & Resorts",
    "exchange": "NASDAQ",
    "sector": "Real Estate",
    "industry": "Hotel & Resort REITs",
    "country": "United States"
  },
  {
    "symbol": "HWM",
    "name": "Howmet Aerospace",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "HPQ",
    "name": "HP Inc.",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "HUBB",
    "name": "Hubbell Incorporated",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "HUM",
    "name": "Humana",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Managed Health Care",
    "country": "United States"
  },
  {
    "symbol": "HBAN",
    "name": "Huntington Bancshares",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Regional Banks",
    "country": "United States"
  },
  {
    "symbol": "HII",
    "name": "Huntington Ingalls Industries",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "IBM",
    "name": "IBM",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "IT Consulting & Other Services",
    "country": "United States"
  },
  {
    "symbol": "IEX",
    "name": "IDEX Corporation",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "IDXX",
    "name": "Idexx Laboratories",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "ITW",
    "name": "Illinois Tool Works",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "INCY",
    "name": "Incyte",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "IR",
    "name": "Ingersoll Rand",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "PODD",
    "name": "Insulet Corporation",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "INTC",
    "name": "Intel",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "IBKR",
    "name": "Interactive Brokers",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Investment Banking & Brokerage",
    "country": "United States"
  },
  {
    "symbol": "ICE",
    "name": "Intercontinental Exchange",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "IFF",
    "name": "International Flavors & Fragrances",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "IP",
    "name": "International Paper",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Paper & Plastic Packaging Products & Materials",
    "country": "United States"
  },
  {
    "symbol": "INTU",
    "name": "Intuit",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "ISRG",
    "name": "Intuitive Surgical",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "IVZ",
    "name": "Invesco",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "INVH",
    "name": "Invitation Homes",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Single-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "IQV",
    "name": "IQVIA",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "IRM",
    "name": "Iron Mountain",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Other Specialized REITs",
    "country": "United States"
  },
  {
    "symbol": "JBHT",
    "name": "J.B. Hunt",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Cargo Ground Transportation",
    "country": "United States"
  },
  {
    "symbol": "JBL",
    "name": "Jabil",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Manufacturing Services",
    "country": "United States"
  },
  {
    "symbol": "JKHY",
    "name": "Jack Henry & Associates",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "J",
    "name": "Jacobs Solutions",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction & Engineering",
    "country": "United States"
  },
  {
    "symbol": "JNJ",
    "name": "Johnson & Johnson",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "JCI",
    "name": "Johnson Controls",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "JPM",
    "name": "JPMorgan Chase",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "KVUE",
    "name": "Kenvue",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Personal Care Products",
    "country": "United States"
  },
  {
    "symbol": "KDP",
    "name": "Keurig Dr Pepper",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Soft Drinks & Non-alcoholic Beverages",
    "country": "United States"
  },
  {
    "symbol": "KEY",
    "name": "KeyCorp",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Regional Banks",
    "country": "United States"
  },
  {
    "symbol": "KEYS",
    "name": "Keysight Technologies",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Equipment & Instruments",
    "country": "United States"
  },
  {
    "symbol": "KMB",
    "name": "Kimberly-Clark",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Household Products",
    "country": "United States"
  },
  {
    "symbol": "KIM",
    "name": "Kimco Realty",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Retail REITs",
    "country": "United States"
  },
  {
    "symbol": "KMI",
    "name": "Kinder Morgan",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Storage & Transportation",
    "country": "United States"
  },
  {
    "symbol": "KKR",
    "name": "KKR & Co.",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "KLAC",
    "name": "KLA Corporation",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductor Materials & Equipment",
    "country": "United States"
  },
  {
    "symbol": "KHC",
    "name": "Kraft Heinz",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "KR",
    "name": "Kroger",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Food Retail",
    "country": "United States"
  },
  {
    "symbol": "LHX",
    "name": "L3Harris",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "LH",
    "name": "Labcorp",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Services",
    "country": "United States"
  },
  {
    "symbol": "LRCX",
    "name": "Lam Research",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductor Materials & Equipment",
    "country": "United States"
  },
  {
    "symbol": "LVS",
    "name": "Las Vegas Sands",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Casinos & Gaming",
    "country": "United States"
  },
  {
    "symbol": "LDOS",
    "name": "Leidos",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Diversified Support Services",
    "country": "United States"
  },
  {
    "symbol": "LEN",
    "name": "Lennar",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Homebuilding",
    "country": "United States"
  },
  {
    "symbol": "LII",
    "name": "Lennox International",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "LLY",
    "name": "Lilly (Eli)",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "LIN",
    "name": "Linde plc",
    "exchange": "NASDAQ",
    "sector": "Materials",
    "industry": "Industrial Gases",
    "country": "United States"
  },
  {
    "symbol": "LYV",
    "name": "Live Nation Entertainment",
    "exchange": "NYSE",
    "sector": "Communication Services",
    "industry": "Movies & Entertainment",
    "country": "United States"
  },
  {
    "symbol": "LMT",
    "name": "Lockheed Martin",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "L",
    "name": "Loews Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Multi-line Insurance",
    "country": "United States"
  },
  {
    "symbol": "LOW",
    "name": "Lowe's",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Home Improvement Retail",
    "country": "United States"
  },
  {
    "symbol": "LULU",
    "name": "Lululemon Athletica",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Apparel, Accessories & Luxury Goods",
    "country": "United States"
  },
  {
    "symbol": "LITE",
    "name": "Lumentum",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Communications Equipment",
    "country": "United States"
  },
  {
    "symbol": "LYB",
    "name": "LyondellBasell",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "MTB",
    "name": "M&T Bank",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Regional Banks",
    "country": "United States"
  },
  {
    "symbol": "MPC",
    "name": "Marathon Petroleum",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "country": "United States"
  },
  {
    "symbol": "MAR",
    "name": "Marriott International",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "MRSH",
    "name": "Marsh McLennan",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Insurance Brokers",
    "country": "United States"
  },
  {
    "symbol": "MLM",
    "name": "Martin Marietta Materials",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Construction Materials",
    "country": "United States"
  },
  {
    "symbol": "MAS",
    "name": "Masco",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "MA",
    "name": "Mastercard",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "MKC",
    "name": "McCormick & Company",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "MCD",
    "name": "McDonald's",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Restaurants",
    "country": "United States"
  },
  {
    "symbol": "MCK",
    "name": "McKesson Corporation",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Distributors",
    "country": "United States"
  },
  {
    "symbol": "MDT",
    "name": "Medtronic",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "MRK",
    "name": "Merck & Co.",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "META",
    "name": "Meta Platforms",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Interactive Media & Services",
    "country": "United States"
  },
  {
    "symbol": "MET",
    "name": "MetLife",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Life & Health Insurance",
    "country": "United States"
  },
  {
    "symbol": "MTD",
    "name": "Mettler Toledo",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "MGM",
    "name": "MGM Resorts",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Casinos & Gaming",
    "country": "United States"
  },
  {
    "symbol": "MCHP",
    "name": "Microchip Technology",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "MU",
    "name": "Micron Technology",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "MSFT",
    "name": "Microsoft",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Systems Software",
    "country": "United States"
  },
  {
    "symbol": "MAA",
    "name": "Mid-America Apartment Communities",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Multi-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "MRNA",
    "name": "Moderna",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "TAP",
    "name": "Molson Coors Beverage Company",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Brewers",
    "country": "United States"
  },
  {
    "symbol": "MDLZ",
    "name": "Mondelez International",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "MPWR",
    "name": "Monolithic Power Systems",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "MNST",
    "name": "Monster Beverage",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Soft Drinks & Non-alcoholic Beverages",
    "country": "United States"
  },
  {
    "symbol": "MCO",
    "name": "Moody's Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "MS",
    "name": "Morgan Stanley",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Investment Banking & Brokerage",
    "country": "United States"
  },
  {
    "symbol": "MOS",
    "name": "Mosaic Company (The)",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Fertilizers & Agricultural Chemicals",
    "country": "United States"
  },
  {
    "symbol": "MSI",
    "name": "Motorola Solutions",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Communications Equipment",
    "country": "United States"
  },
  {
    "symbol": "MSCI",
    "name": "MSCI Inc.",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "NDAQ",
    "name": "Nasdaq, Inc.",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "NTAP",
    "name": "NetApp",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "NFLX",
    "name": "Netflix",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Movies & Entertainment",
    "country": "United States"
  },
  {
    "symbol": "NEM",
    "name": "Newmont",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Gold",
    "country": "United States"
  },
  {
    "symbol": "NWSA",
    "name": "News Corp (Class A)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Publishing",
    "country": "United States"
  },
  {
    "symbol": "NWS",
    "name": "News Corp (Class B)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Publishing",
    "country": "United States"
  },
  {
    "symbol": "NEE",
    "name": "NextEra Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "NKE",
    "name": "Nike, Inc.",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Apparel, Accessories & Luxury Goods",
    "country": "United States"
  },
  {
    "symbol": "NI",
    "name": "NiSource",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "NDSN",
    "name": "Nordson Corporation",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "NSC",
    "name": "Norfolk Southern",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Rail Transportation",
    "country": "United States"
  },
  {
    "symbol": "NTRS",
    "name": "Northern Trust",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "NOC",
    "name": "Northrop Grumman",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "NCLH",
    "name": "Norwegian Cruise Line Holdings",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "NRG",
    "name": "NRG Energy",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Independent Power Producers & Energy Traders",
    "country": "United States"
  },
  {
    "symbol": "NUE",
    "name": "Nucor",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Steel",
    "country": "United States"
  },
  {
    "symbol": "NVDA",
    "name": "Nvidia",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "NVR",
    "name": "NVR, Inc.",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Homebuilding",
    "country": "United States"
  },
  {
    "symbol": "NXPI",
    "name": "NXP Semiconductors",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "ORLY",
    "name": "O’Reilly Automotive",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Automotive Retail",
    "country": "United States"
  },
  {
    "symbol": "OXY",
    "name": "Occidental Petroleum",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "ODFL",
    "name": "Old Dominion",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Cargo Ground Transportation",
    "country": "United States"
  },
  {
    "symbol": "OMC",
    "name": "Omnicom Group",
    "exchange": "NYSE",
    "sector": "Communication Services",
    "industry": "Advertising",
    "country": "United States"
  },
  {
    "symbol": "ON",
    "name": "ON Semiconductor",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "OKE",
    "name": "Oneok",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Storage & Transportation",
    "country": "United States"
  },
  {
    "symbol": "ORCL",
    "name": "Oracle Corporation",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "OTIS",
    "name": "Otis Worldwide",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "PCAR",
    "name": "Paccar",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Construction Machinery & Heavy Transportation Equipment",
    "country": "United States"
  },
  {
    "symbol": "PKG",
    "name": "Packaging Corporation of America",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Paper & Plastic Packaging Products & Materials",
    "country": "United States"
  },
  {
    "symbol": "PLTR",
    "name": "Palantir Technologies",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "PANW",
    "name": "Palo Alto Networks",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Systems Software",
    "country": "United States"
  },
  {
    "symbol": "PSKY",
    "name": "Paramount Skydance Corporation",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Movies & Entertainment",
    "country": "United States"
  },
  {
    "symbol": "PH",
    "name": "Parker Hannifin",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "PAYX",
    "name": "Paychex",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Human Resource & Employment Services",
    "country": "United States"
  },
  {
    "symbol": "PYPL",
    "name": "PayPal",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "PNR",
    "name": "Pentair",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "PEP",
    "name": "PepsiCo",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Soft Drinks & Non-alcoholic Beverages",
    "country": "United States"
  },
  {
    "symbol": "PFE",
    "name": "Pfizer",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "PCG",
    "name": "PG&E Corporation",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "PM",
    "name": "Philip Morris International",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Tobacco",
    "country": "United States"
  },
  {
    "symbol": "PSX",
    "name": "Phillips 66",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "country": "United States"
  },
  {
    "symbol": "PNW",
    "name": "Pinnacle West Capital",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "PNC",
    "name": "PNC Financial Services",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "POOL",
    "name": "Pool Corporation",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Distributors",
    "country": "United States"
  },
  {
    "symbol": "PPG",
    "name": "PPG Industries",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "PPL",
    "name": "PPL Corporation",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "PFG",
    "name": "Principal Financial Group",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Life & Health Insurance",
    "country": "United States"
  },
  {
    "symbol": "PG",
    "name": "Procter & Gamble",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Personal Care Products",
    "country": "United States"
  },
  {
    "symbol": "PGR",
    "name": "Progressive Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "PLD",
    "name": "Prologis",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Industrial REITs",
    "country": "United States"
  },
  {
    "symbol": "PRU",
    "name": "Prudential Financial",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Life & Health Insurance",
    "country": "United States"
  },
  {
    "symbol": "PEG",
    "name": "Public Service Enterprise Group",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "PTC",
    "name": "PTC Inc.",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "PSA",
    "name": "Public Storage",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Self-Storage REITs",
    "country": "United States"
  },
  {
    "symbol": "PHM",
    "name": "PulteGroup",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Homebuilding",
    "country": "United States"
  },
  {
    "symbol": "PWR",
    "name": "Quanta Services",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction & Engineering",
    "country": "United States"
  },
  {
    "symbol": "QCOM",
    "name": "Qualcomm",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "DGX",
    "name": "Quest Diagnostics",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Services",
    "country": "United States"
  },
  {
    "symbol": "Q",
    "name": "Qnity Electronics",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Semiconductor Materials & Equipment",
    "country": "United States"
  },
  {
    "symbol": "RL",
    "name": "Ralph Lauren Corporation",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Apparel, Accessories & Luxury Goods",
    "country": "United States"
  },
  {
    "symbol": "RJF",
    "name": "Raymond James Financial",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Investment Banking & Brokerage",
    "country": "United States"
  },
  {
    "symbol": "RTX",
    "name": "RTX Corporation",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "O",
    "name": "Realty Income",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Retail REITs",
    "country": "United States"
  },
  {
    "symbol": "REG",
    "name": "Regency Centers",
    "exchange": "NASDAQ",
    "sector": "Real Estate",
    "industry": "Retail REITs",
    "country": "United States"
  },
  {
    "symbol": "REGN",
    "name": "Regeneron Pharmaceuticals",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "RF",
    "name": "Regions Financial Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Regional Banks",
    "country": "United States"
  },
  {
    "symbol": "RSG",
    "name": "Republic Services",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Environmental & Facilities Services",
    "country": "United States"
  },
  {
    "symbol": "RMD",
    "name": "ResMed",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "RVTY",
    "name": "Revvity",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "HOOD",
    "name": "Robinhood Markets",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Investment Banking & Brokerage",
    "country": "United States"
  },
  {
    "symbol": "ROK",
    "name": "Rockwell Automation",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Electrical Components & Equipment",
    "country": "United States"
  },
  {
    "symbol": "ROL",
    "name": "Rollins, Inc.",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Environmental & Facilities Services",
    "country": "United States"
  },
  {
    "symbol": "ROP",
    "name": "Roper Technologies",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Electronic Equipment & Instruments",
    "country": "United States"
  },
  {
    "symbol": "ROST",
    "name": "Ross Stores",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Apparel Retail",
    "country": "United States"
  },
  {
    "symbol": "RCL",
    "name": "Royal Caribbean Group",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Hotels, Resorts & Cruise Lines",
    "country": "United States"
  },
  {
    "symbol": "SPGI",
    "name": "S&P Global",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Financial Exchanges & Data",
    "country": "United States"
  },
  {
    "symbol": "CRM",
    "name": "Salesforce",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "SNDK",
    "name": "Sandisk",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "SBAC",
    "name": "SBA Communications",
    "exchange": "NASDAQ",
    "sector": "Real Estate",
    "industry": "Telecom Tower REITs",
    "country": "United States"
  },
  {
    "symbol": "SLB",
    "name": "Schlumberger",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Equipment & Services",
    "country": "United States"
  },
  {
    "symbol": "STX",
    "name": "Seagate Technology",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "SRE",
    "name": "Sempra",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "NOW",
    "name": "ServiceNow",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Systems Software",
    "country": "United States"
  },
  {
    "symbol": "SHW",
    "name": "Sherwin-Williams",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Specialty Chemicals",
    "country": "United States"
  },
  {
    "symbol": "SPG",
    "name": "Simon Property Group",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Retail REITs",
    "country": "United States"
  },
  {
    "symbol": "SWKS",
    "name": "Skyworks Solutions",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "SJM",
    "name": "J.M. Smucker Company (The)",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "SW",
    "name": "Smurfit Westrock",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Paper & Plastic Packaging Products & Materials",
    "country": "United States"
  },
  {
    "symbol": "SNA",
    "name": "Snap-on",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "SOLV",
    "name": "Solventum",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Technology",
    "country": "United States"
  },
  {
    "symbol": "SO",
    "name": "Southern Company",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "LUV",
    "name": "Southwest Airlines",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Passenger Airlines",
    "country": "United States"
  },
  {
    "symbol": "SWK",
    "name": "Stanley Black & Decker",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "SBUX",
    "name": "Starbucks",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Restaurants",
    "country": "United States"
  },
  {
    "symbol": "STT",
    "name": "State Street Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "STLD",
    "name": "Steel Dynamics",
    "exchange": "NASDAQ",
    "sector": "Materials",
    "industry": "Steel",
    "country": "United States"
  },
  {
    "symbol": "STE",
    "name": "Steris",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "SYK",
    "name": "Stryker Corporation",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "SMCI",
    "name": "Supermicro",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "SYF",
    "name": "Synchrony Financial",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Consumer Finance",
    "country": "United States"
  },
  {
    "symbol": "SNPS",
    "name": "Synopsys",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "SYY",
    "name": "Sysco",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Food Distributors",
    "country": "United States"
  },
  {
    "symbol": "TMUS",
    "name": "T-Mobile US",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Wireless Telecommunication Services",
    "country": "United States"
  },
  {
    "symbol": "TROW",
    "name": "T. Rowe Price",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Asset Management & Custody Banks",
    "country": "United States"
  },
  {
    "symbol": "TTWO",
    "name": "Take-Two Interactive",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Interactive Home Entertainment",
    "country": "United States"
  },
  {
    "symbol": "TPR",
    "name": "Tapestry, Inc.",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Apparel, Accessories & Luxury Goods",
    "country": "United States"
  },
  {
    "symbol": "TRGP",
    "name": "Targa Resources",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Storage & Transportation",
    "country": "United States"
  },
  {
    "symbol": "TGT",
    "name": "Target Corporation",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Consumer Staples Merchandise Retail",
    "country": "United States"
  },
  {
    "symbol": "TEL",
    "name": "TE Connectivity",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Manufacturing Services",
    "country": "United States"
  },
  {
    "symbol": "TDY",
    "name": "Teledyne Technologies",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Electronic Equipment & Instruments",
    "country": "United States"
  },
  {
    "symbol": "TER",
    "name": "Teradyne",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductor Materials & Equipment",
    "country": "United States"
  },
  {
    "symbol": "TSLA",
    "name": "Tesla, Inc.",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Automobile Manufacturers",
    "country": "United States"
  },
  {
    "symbol": "TXN",
    "name": "Texas Instruments",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Semiconductors",
    "country": "United States"
  },
  {
    "symbol": "TPL",
    "name": "Texas Pacific Land Corporation",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "United States"
  },
  {
    "symbol": "TXT",
    "name": "Textron",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "TMO",
    "name": "Thermo Fisher Scientific",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "TJX",
    "name": "TJX Companies",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Apparel Retail",
    "country": "United States"
  },
  {
    "symbol": "TKO",
    "name": "TKO Group Holdings",
    "exchange": "NYSE",
    "sector": "Communication Services",
    "industry": "Movies & Entertainment",
    "country": "United States"
  },
  {
    "symbol": "TTD",
    "name": "Trade Desk (The)",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Advertising",
    "country": "United States"
  },
  {
    "symbol": "TSCO",
    "name": "Tractor Supply",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Other Specialty Retail",
    "country": "United States"
  },
  {
    "symbol": "TT",
    "name": "Trane Technologies",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Building Products",
    "country": "United States"
  },
  {
    "symbol": "TDG",
    "name": "TransDigm Group",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United States"
  },
  {
    "symbol": "TRV",
    "name": "Travelers Companies (The)",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "TRMB",
    "name": "Trimble Inc.",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "TFC",
    "name": "Truist Financial",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "TYL",
    "name": "Tyler Technologies",
    "exchange": "NYSE",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "TSN",
    "name": "Tyson Foods",
    "exchange": "NYSE",
    "sector": "Consumer Staples",
    "industry": "Packaged Foods & Meats",
    "country": "United States"
  },
  {
    "symbol": "USB",
    "name": "U.S. Bancorp",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "UBER",
    "name": "Uber",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Passenger Ground Transportation",
    "country": "United States"
  },
  {
    "symbol": "UDR",
    "name": "UDR, Inc.",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Multi-Family Residential REITs",
    "country": "United States"
  },
  {
    "symbol": "ULTA",
    "name": "Ulta Beauty",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Other Specialty Retail",
    "country": "United States"
  },
  {
    "symbol": "UNP",
    "name": "Union Pacific Corporation",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Rail Transportation",
    "country": "United States"
  },
  {
    "symbol": "UAL",
    "name": "United Airlines Holdings",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Passenger Airlines",
    "country": "United States"
  },
  {
    "symbol": "UPS",
    "name": "United Parcel Service",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Air Freight & Logistics",
    "country": "United States"
  },
  {
    "symbol": "URI",
    "name": "United Rentals",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Trading Companies & Distributors",
    "country": "United States"
  },
  {
    "symbol": "UNH",
    "name": "UnitedHealth Group",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Managed Health Care",
    "country": "United States"
  },
  {
    "symbol": "UHS",
    "name": "Universal Health Services",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Facilities",
    "country": "United States"
  },
  {
    "symbol": "VLO",
    "name": "Valero Energy",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "country": "United States"
  },
  {
    "symbol": "VEEV",
    "name": "Veeva Systems",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Technology",
    "country": "United States"
  },
  {
    "symbol": "VTR",
    "name": "Ventas",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Health Care REITs",
    "country": "United States"
  },
  {
    "symbol": "VLTO",
    "name": "Veralto",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Environmental & Facilities Services",
    "country": "United States"
  },
  {
    "symbol": "VRSN",
    "name": "Verisign",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Internet Services & Infrastructure",
    "country": "United States"
  },
  {
    "symbol": "VRSK",
    "name": "Verisk Analytics",
    "exchange": "NASDAQ",
    "sector": "Industrials",
    "industry": "Research & Consulting Services",
    "country": "United States"
  },
  {
    "symbol": "VZ",
    "name": "Verizon",
    "exchange": "NYSE",
    "sector": "Communication Services",
    "industry": "Integrated Telecommunication Services",
    "country": "United States"
  },
  {
    "symbol": "VRTX",
    "name": "Vertex Pharmaceuticals",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Biotechnology",
    "country": "United States"
  },
  {
    "symbol": "VRT",
    "name": "Vertiv",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Electrical Components & Equipment",
    "country": "United States"
  },
  {
    "symbol": "VTRS",
    "name": "Viatris",
    "exchange": "NASDAQ",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "VICI",
    "name": "Vici Properties",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Hotel & Resort REITs",
    "country": "United States"
  },
  {
    "symbol": "V",
    "name": "Visa Inc.",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Transaction & Payment Processing Services",
    "country": "United States"
  },
  {
    "symbol": "VST",
    "name": "Vistra Corp.",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "VMC",
    "name": "Vulcan Materials Company",
    "exchange": "NYSE",
    "sector": "Materials",
    "industry": "Construction Materials",
    "country": "United States"
  },
  {
    "symbol": "WRB",
    "name": "W. R. Berkley Corporation",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Property & Casualty Insurance",
    "country": "United States"
  },
  {
    "symbol": "GWW",
    "name": "W. W. Grainger",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "WAB",
    "name": "Wabtec",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Construction Machinery & Heavy Transportation Equipment",
    "country": "United States"
  },
  {
    "symbol": "WMT",
    "name": "Walmart",
    "exchange": "NASDAQ",
    "sector": "Consumer Staples",
    "industry": "Consumer Staples Merchandise Retail",
    "country": "United States"
  },
  {
    "symbol": "DIS",
    "name": "Walt Disney Company (The)",
    "exchange": "NYSE",
    "sector": "Communication Services",
    "industry": "Movies & Entertainment",
    "country": "United States"
  },
  {
    "symbol": "WBD",
    "name": "Warner Bros. Discovery",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Broadcasting",
    "country": "United States"
  },
  {
    "symbol": "WM",
    "name": "Waste Management",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Environmental & Facilities Services",
    "country": "United States"
  },
  {
    "symbol": "WAT",
    "name": "Waters Corporation",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Life Sciences Tools & Services",
    "country": "United States"
  },
  {
    "symbol": "WEC",
    "name": "WEC Energy Group",
    "exchange": "NYSE",
    "sector": "Utilities",
    "industry": "Electric Utilities",
    "country": "United States"
  },
  {
    "symbol": "WFC",
    "name": "Wells Fargo",
    "exchange": "NYSE",
    "sector": "Financials",
    "industry": "Diversified Banks",
    "country": "United States"
  },
  {
    "symbol": "WELL",
    "name": "Welltower",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Health Care REITs",
    "country": "United States"
  },
  {
    "symbol": "WST",
    "name": "West Pharmaceutical Services",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Supplies",
    "country": "United States"
  },
  {
    "symbol": "WDC",
    "name": "Western Digital",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Technology Hardware, Storage & Peripherals",
    "country": "United States"
  },
  {
    "symbol": "WY",
    "name": "Weyerhaeuser",
    "exchange": "NYSE",
    "sector": "Real Estate",
    "industry": "Timber REITs",
    "country": "United States"
  },
  {
    "symbol": "WSM",
    "name": "Williams-Sonoma, Inc.",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Homefurnishing Retail",
    "country": "United States"
  },
  {
    "symbol": "WMB",
    "name": "Williams Companies",
    "exchange": "NYSE",
    "sector": "Energy",
    "industry": "Oil & Gas Storage & Transportation",
    "country": "United States"
  },
  {
    "symbol": "WTW",
    "name": "Willis Towers Watson",
    "exchange": "NASDAQ",
    "sector": "Financials",
    "industry": "Insurance Brokers",
    "country": "United States"
  },
  {
    "symbol": "WDAY",
    "name": "Workday, Inc.",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Application Software",
    "country": "United States"
  },
  {
    "symbol": "WYNN",
    "name": "Wynn Resorts",
    "exchange": "NASDAQ",
    "sector": "Consumer Discretionary",
    "industry": "Casinos & Gaming",
    "country": "United States"
  },
  {
    "symbol": "XEL",
    "name": "Xcel Energy",
    "exchange": "NASDAQ",
    "sector": "Utilities",
    "industry": "Multi-Utilities",
    "country": "United States"
  },
  {
    "symbol": "XYL",
    "name": "Xylem Inc.",
    "exchange": "NYSE",
    "sector": "Industrials",
    "industry": "Industrial Machinery & Supplies & Components",
    "country": "United States"
  },
  {
    "symbol": "YUM",
    "name": "Yum! Brands",
    "exchange": "NYSE",
    "sector": "Consumer Discretionary",
    "industry": "Restaurants",
    "country": "United States"
  },
  {
    "symbol": "ZBRA",
    "name": "Zebra Technologies",
    "exchange": "NASDAQ",
    "sector": "Information Technology",
    "industry": "Electronic Equipment & Instruments",
    "country": "United States"
  },
  {
    "symbol": "ZBH",
    "name": "Zimmer Biomet",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Health Care Equipment",
    "country": "United States"
  },
  {
    "symbol": "ZTS",
    "name": "Zoetis",
    "exchange": "NYSE",
    "sector": "Health Care",
    "industry": "Pharmaceuticals",
    "country": "United States"
  },
  {
    "symbol": "BP.L",
    "name": "BP p.l.c.",
    "exchange": "LSE",
    "sector": "Energy",
    "industry": "Oil & Gas Integrated",
    "country": "United Kingdom"
  },
  {
    "symbol": "HSBA.L",
    "name": "HSBC Holdings plc",
    "exchange": "LSE",
    "sector": "Financial",
    "industry": "Banks—Diversified",
    "country": "United Kingdom"
  },
  {
    "symbol": "AZN.L",
    "name": "AstraZeneca plc",
    "exchange": "LSE",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "United Kingdom"
  },
  {
    "symbol": "GSK.L",
    "name": "GSK plc",
    "exchange": "LSE",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "United Kingdom"
  },
  {
    "symbol": "VOD.L",
    "name": "Vodafone Group Plc",
    "exchange": "LSE",
    "sector": "Communication Services",
    "industry": "Telecom Services",
    "country": "United Kingdom"
  },
  {
    "symbol": "BARC.L",
    "name": "Barclays PLC",
    "exchange": "LSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "United Kingdom"
  },
  {
    "symbol": "LLOY.L",
    "name": "Lloyds Banking Group plc",
    "exchange": "LSE",
    "sector": "Financial Services",
    "industry": "Banks—Regional",
    "country": "United Kingdom"
  },
  {
    "symbol": "TSCO.L",
    "name": "Tesco PLC",
    "exchange": "LSE",
    "sector": "Consumer Defensive",
    "industry": "Grocery Stores",
    "country": "United Kingdom"
  },
  {
    "symbol": "SHEL.L",
    "name": "Shell plc",
    "exchange": "LSE",
    "sector": "Energy",
    "industry": "Oil & Gas Integrated",
    "country": "United Kingdom"
  },
  {
    "symbol": "BATS.L",
    "name": "British American Tobacco p.l.c.",
    "exchange": "LSE",
    "sector": "Consumer Defensive",
    "industry": "Tobacco",
    "country": "United Kingdom"
  },
  {
    "symbol": "ULVR.L",
    "name": "Unilever PLC",
    "exchange": "LSE",
    "sector": "Consumer Defensive",
    "industry": "Household & Personal Products",
    "country": "United Kingdom"
  },
  {
    "symbol": "DGE.L",
    "name": "Diageo plc",
    "exchange": "LSE",
    "sector": "Consumer Defensive",
    "industry": "Beverages—Brewers",
    "country": "United Kingdom"
  },
  {
    "symbol": "RR.L",
    "name": "Rolls-Royce Holdings plc",
    "exchange": "LSE",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "United Kingdom"
  },
  {
    "symbol": "RIO.L",
    "name": "Rio Tinto Group",
    "exchange": "LSE",
    "sector": "Basic Materials",
    "industry": "Other Industrial Metals & Mining",
    "country": "United Kingdom"
  },
  {
    "symbol": "UU.L",
    "name": "United Utilities Group PLC",
    "exchange": "LSE",
    "sector": "Utilities",
    "industry": "Utilities—Regulated Water",
    "country": "United Kingdom"
  },
  {
    "symbol": "NG.L",
    "name": "National Grid plc",
    "exchange": "LSE",
    "sector": "Utilities",
    "industry": "Utilities—Regulated Electric",
    "country": "United Kingdom"
  },
  {
    "symbol": "PRU.L",
    "name": "Prudential plc",
    "exchange": "LSE",
    "sector": "Financial Services",
    "industry": "Insurance—Life",
    "country": "United Kingdom"
  },
  {
    "symbol": "NWG.L",
    "name": "NatWest Group plc",
    "exchange": "LSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "United Kingdom"
  },
  {
    "symbol": "AV.L",
    "name": "Aviva plc",
    "exchange": "LSE",
    "sector": "Financial Services",
    "industry": "Insurance—Diversified",
    "country": "United Kingdom"
  },
  {
    "symbol": "STAN.L",
    "name": "Standard Chartered PLC",
    "exchange": "LSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "United Kingdom"
  },
  {
    "symbol": "REL.L",
    "name": "RELX PLC",
    "exchange": "LSE",
    "sector": "Technology",
    "industry": "Publishing",
    "country": "United Kingdom"
  },
  {
    "symbol": "WTB.L",
    "name": "Whitbread PLC",
    "exchange": "LSE",
    "sector": "Consumer Cyclical",
    "industry": "Restaurants",
    "country": "United Kingdom"
  },
  {
    "symbol": "AAL.L",
    "name": "Anglo American plc",
    "exchange": "LSE",
    "sector": "Basic Materials",
    "industry": "Other Industrial Metals & Mining",
    "country": "United Kingdom"
  },
  {
    "symbol": "GLEN.L",
    "name": "Glencore plc",
    "exchange": "LSE",
    "sector": "Basic Materials",
    "industry": "Other Industrial Metals & Mining",
    "country": "United Kingdom"
  },
  {
    "symbol": "INF.L",
    "name": "Informa plc",
    "exchange": "LSE",
    "sector": "Communication Services",
    "industry": "Publishing",
    "country": "United Kingdom"
  },
  {
    "symbol": "IAG.L",
    "name": "International Consolidated Airlines",
    "exchange": "LSE",
    "sector": "Industrials",
    "industry": "Airlines",
    "country": "United Kingdom"
  },
  {
    "symbol": "IMT.L",
    "name": "Imperial Brands PLC",
    "exchange": "LSE",
    "sector": "Consumer Defensive",
    "industry": "Tobacco",
    "country": "United Kingdom"
  },
  {
    "symbol": "HLMA.L",
    "name": "Halma plc",
    "exchange": "LSE",
    "sector": "Technology",
    "industry": "Scientific & Technical Instruments",
    "country": "United Kingdom"
  },
  {
    "symbol": "LAND.L",
    "name": "Land Securities Group PLC",
    "exchange": "LSE",
    "sector": "Real Estate",
    "industry": "REIT—Office",
    "country": "United Kingdom"
  },
  {
    "symbol": "AHT.L",
    "name": "Ashtead Group plc",
    "exchange": "LSE",
    "sector": "Industrials",
    "industry": "Rental & Leasing Services",
    "country": "United Kingdom"
  },
  {
    "symbol": "SAP.DE",
    "name": "SAP SE",
    "exchange": "XETRA",
    "sector": "Technology",
    "industry": "Software—Application",
    "country": "Germany"
  },
  {
    "symbol": "MBG.DE",
    "name": "Mercedes-Benz Group AG",
    "exchange": "XETRA",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "Germany"
  },
  {
    "symbol": "BAS.DE",
    "name": "BASF SE",
    "exchange": "XETRA",
    "sector": "Basic Materials",
    "industry": "Chemicals",
    "country": "Germany"
  },
  {
    "symbol": "BAYN.DE",
    "name": "Bayer Aktiengesellschaft",
    "exchange": "XETRA",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "Germany"
  },
  {
    "symbol": "ALV.DE",
    "name": "Allianz SE",
    "exchange": "XETRA",
    "sector": "Financial Services",
    "industry": "Insurance—Diversified",
    "country": "Germany"
  },
  {
    "symbol": "BMW.DE",
    "name": "Bayerische Motoren Werke AG",
    "exchange": "XETRA",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "Germany"
  },
  {
    "symbol": "DB1.DE",
    "name": "Deutsche Börse AG",
    "exchange": "XETRA",
    "sector": "Financial Services",
    "industry": "Financial Data & Stock Exchanges",
    "country": "Germany"
  },
  {
    "symbol": "DTE.DE",
    "name": "Deutsche Telekom AG",
    "exchange": "XETRA",
    "sector": "Communication Services",
    "industry": "Telecom Services",
    "country": "Germany"
  },
  {
    "symbol": "MC.PA",
    "name": "LVMH Moët Hennessy",
    "exchange": "Euronext Paris",
    "sector": "Consumer Cyclical",
    "industry": "Luxury Goods",
    "country": "France"
  },
  {
    "symbol": "OR.PA",
    "name": "L'Oréal S.A.",
    "exchange": "Euronext Paris",
    "sector": "Consumer Defensive",
    "industry": "Household & Personal Products",
    "country": "France"
  },
  {
    "symbol": "RMS.PA",
    "name": "Hermes International SCA",
    "exchange": "Euronext Paris",
    "sector": "Consumer Cyclical",
    "industry": "Luxury Goods",
    "country": "France"
  },
  {
    "symbol": "KER.PA",
    "name": "Kering SA",
    "exchange": "Euronext Paris",
    "sector": "Consumer Cyclical",
    "industry": "Luxury Goods",
    "country": "France"
  },
  {
    "symbol": "AIR.PA",
    "name": "Airbus SE",
    "exchange": "Euronext Paris",
    "sector": "Industrials",
    "industry": "Aerospace & Defense",
    "country": "France"
  },
  {
    "symbol": "TTE.PA",
    "name": "TotalEnergies SE",
    "exchange": "Euronext Paris",
    "sector": "Energy",
    "industry": "Oil & Gas Integrated",
    "country": "France"
  },
  {
    "symbol": "SAN.MC",
    "name": "Banco Santander, S.A.",
    "exchange": "Bolsa de Madrid",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "Spain"
  },
  {
    "symbol": "BBVA.MC",
    "name": "Banco Bilbao Vizcaya Argentaria",
    "exchange": "Bolsa de Madrid",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "Spain"
  },
  {
    "symbol": "ING.AS",
    "name": "ING Groep N.V.",
    "exchange": "Euronext Amsterdam",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "Netherlands"
  },
  {
    "symbol": "ASML.AS",
    "name": "ASML Holding N.V.",
    "exchange": "Euronext Amsterdam",
    "sector": "Technology",
    "industry": "Semiconductor Equipment & Materials",
    "country": "Netherlands"
  },
  {
    "symbol": "NESN.SW",
    "name": "Nestlé S.A.",
    "exchange": "SIX Swiss Exchange",
    "sector": "Consumer Defensive",
    "industry": "Packaged Foods",
    "country": "Switzerland"
  },
  {
    "symbol": "ROG.SW",
    "name": "Roche Holding AG",
    "exchange": "SIX Swiss Exchange",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "Switzerland"
  },
  {
    "symbol": "NOVN.SW",
    "name": "Novartis AG",
    "exchange": "SIX Swiss Exchange",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "Switzerland"
  },
  {
    "symbol": "ADYEN.AS",
    "name": "Adyen N.V.",
    "exchange": "Euronext Amsterdam",
    "sector": "Technology",
    "industry": "Software—Infrastructure",
    "country": "Netherlands"
  },
  {
    "symbol": "SANOFI.PA",
    "name": "Sanofi S.A.",
    "exchange": "Euronext Paris",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "France"
  },
  {
    "symbol": "VOW3.DE",
    "name": "Volkswagen AG",
    "exchange": "XETRA",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "Germany"
  },
  {
    "symbol": "DHL.DE",
    "name": "DHL Group",
    "exchange": "XETRA",
    "sector": "Industrials",
    "industry": "Integrated Freight & Logistics",
    "country": "Germany"
  },
  {
    "symbol": "CRH.L",
    "name": "CRH plc",
    "exchange": "LSE",
    "sector": "Basic Materials",
    "industry": "Building Materials",
    "country": "Ireland"
  },
  {
    "symbol": "BNP.PA",
    "name": "BNP Paribas SA",
    "exchange": "Euronext Paris",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "France"
  },
  {
    "symbol": "ENI.MI",
    "name": "Eni S.p.A.",
    "exchange": "Borsa Italiana",
    "sector": "Energy",
    "industry": "Oil & Gas Integrated",
    "country": "Italy"
  },
  {
    "symbol": "IBE.MC",
    "name": "Iberdrola, S.A.",
    "exchange": "Bolsa de Madrid",
    "sector": "Utilities",
    "industry": "Utilities—Regulated Electric",
    "country": "Spain"
  },
  {
    "symbol": "RWE.DE",
    "name": "RWE AG",
    "exchange": "XETRA",
    "sector": "Utilities",
    "industry": "Utilities—Diversified",
    "country": "Germany"
  },
  {
    "symbol": "9984.T",
    "name": "SoftBank Group Corp.",
    "exchange": "Tokyo",
    "sector": "Financial Services",
    "industry": "Telecom Services",
    "country": "Japan"
  },
  {
    "symbol": "7203.T",
    "name": "Toyota Motor Corporation",
    "exchange": "Tokyo",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "Japan"
  },
  {
    "symbol": "6758.T",
    "name": "Sony Group Corporation",
    "exchange": "Tokyo",
    "sector": "Consumer Cyclical",
    "industry": "Consumer Electronics",
    "country": "Japan"
  },
  {
    "symbol": "9983.T",
    "name": "Fast Retailing Co. Ltd.",
    "exchange": "Tokyo",
    "sector": "Consumer Cyclical",
    "industry": "Apparel Retail",
    "country": "Japan"
  },
  {
    "symbol": "8035.T",
    "name": "Tokyo Electron Limited",
    "exchange": "Tokyo",
    "sector": "Technology",
    "industry": "Semiconductor Equipment & Materials",
    "country": "Japan"
  },
  {
    "symbol": "7751.T",
    "name": "Canon Inc.",
    "exchange": "Tokyo",
    "sector": "Technology",
    "industry": "Computer Hardware",
    "country": "Japan"
  },
  {
    "symbol": "6954.T",
    "name": "Fanuc Corporation",
    "exchange": "Tokyo",
    "sector": "Industrials",
    "industry": "Industrial Machinery",
    "country": "Japan"
  },
  {
    "symbol": "7267.T",
    "name": "Honda Motor Co., Ltd.",
    "exchange": "Tokyo",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "Japan"
  },
  {
    "symbol": "005930.KS",
    "name": "Samsung Electronics Co., Ltd.",
    "exchange": "KRX",
    "sector": "Technology",
    "industry": "Semiconductors",
    "country": "South Korea"
  },
  {
    "symbol": "000660.KS",
    "name": "SK Hynix Inc.",
    "exchange": "KRX",
    "sector": "Technology",
    "industry": "Semiconductors",
    "country": "South Korea"
  },
  {
    "symbol": "035420.KS",
    "name": "NAVER Corporation",
    "exchange": "KRX",
    "sector": "Technology",
    "industry": "Internet Content & Information",
    "country": "South Korea"
  },
  {
    "symbol": "1299.HK",
    "name": "AIA Group Limited",
    "exchange": "HKEX",
    "sector": "Financial Services",
    "industry": "Insurance—Life",
    "country": "Hong Kong"
  },
  {
    "symbol": "0700.HK",
    "name": "Tencent Holdings Limited",
    "exchange": "HKEX",
    "sector": "Technology",
    "industry": "Internet Content & Information",
    "country": "China"
  },
  {
    "symbol": "9988.HK",
    "name": "Alibaba Group Holding",
    "exchange": "HKEX",
    "sector": "Consumer Cyclical",
    "industry": "Internet Retail",
    "country": "China"
  },
  {
    "symbol": "3690.HK",
    "name": "Meituan",
    "exchange": "HKEX",
    "sector": "Consumer Cyclical",
    "industry": "Internet Retail",
    "country": "China"
  },
  {
    "symbol": "1810.HK",
    "name": "Xiaomi Corporation",
    "exchange": "HKEX",
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "country": "China"
  },
  {
    "symbol": "9618.HK",
    "name": "JD.com Inc.",
    "exchange": "HKEX",
    "sector": "Consumer Cyclical",
    "industry": "Internet Retail",
    "country": "China"
  },
  {
    "symbol": "0386.HK",
    "name": "Sinopec Corp.",
    "exchange": "HKEX",
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "country": "China"
  },
  {
    "symbol": "2330.TW",
    "name": "Taiwan Semiconductor Manufacturing",
    "exchange": "TWSE",
    "sector": "Technology",
    "industry": "Semiconductors",
    "country": "Taiwan"
  },
  {
    "symbol": "2454.TW",
    "name": "MediaTek Inc.",
    "exchange": "TWSE",
    "sector": "Technology",
    "industry": "Semiconductors",
    "country": "Taiwan"
  },
  {
    "symbol": "7201.T",
    "name": "Nissan Motor Co., Ltd.",
    "exchange": "Tokyo",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "Japan"
  },
  {
    "symbol": "6501.T",
    "name": "Hitachi, Ltd.",
    "exchange": "Tokyo",
    "sector": "Industrials",
    "industry": "Conglomerates",
    "country": "Japan"
  },
  {
    "symbol": "7974.T",
    "name": "Nintendo Co., Ltd.",
    "exchange": "Tokyo",
    "sector": "Communication Services",
    "industry": "Electronic Gaming & Multimedia",
    "country": "Japan"
  },
  {
    "symbol": "8306.T",
    "name": "Mitsubishi UFJ Financial Group Ltd.",
    "exchange": "Tokyo",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "Japan"
  },
  {
    "symbol": "8316.T",
    "name": "Sumitomo Mitsui Financial Group",
    "exchange": "Tokyo",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "Japan"
  },
  {
    "symbol": "9432.T",
    "name": "Nippon Telegraph and Telephone Corp",
    "exchange": "Tokyo",
    "sector": "Communication Services",
    "industry": "Telecom Services",
    "country": "Japan"
  },
  {
    "symbol": "8001.T",
    "name": "Itochu Corporation",
    "exchange": "Tokyo",
    "sector": "Industrials",
    "industry": "Conglomerates",
    "country": "Japan"
  },
  {
    "symbol": "035720.KS",
    "name": "Kakao Corp.",
    "exchange": "KRX",
    "sector": "Technology",
    "industry": "Internet Content & Information",
    "country": "South Korea"
  },
  {
    "symbol": "051910.KS",
    "name": "LG Chem, Ltd.",
    "exchange": "KRX",
    "sector": "Basic Materials",
    "industry": "Chemicals",
    "country": "South Korea"
  },
  {
    "symbol": "005380.KS",
    "name": "Hyundai Motor Company",
    "exchange": "KRX",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "South Korea"
  },
  {
    "symbol": "2317.TW",
    "name": "Hon Hai Precision Industry",
    "exchange": "TWSE",
    "sector": "Technology",
    "industry": "Electronic Components",
    "country": "Taiwan"
  },
  {
    "symbol": "939.HK",
    "name": "China Construction Bank",
    "exchange": "HKEX",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "China"
  },
  {
    "symbol": "1398.HK",
    "name": "Industrial and Commercial Bank",
    "exchange": "HKEX",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "China"
  },
  {
    "symbol": "3988.HK",
    "name": "Bank of China Limited",
    "exchange": "HKEX",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "China"
  },
  {
    "symbol": "2318.HK",
    "name": "Ping An Insurance Group",
    "exchange": "HKEX",
    "sector": "Financial Services",
    "industry": "Insurance—Diversified",
    "country": "China"
  },
  {
    "symbol": "2628.HK",
    "name": "China Life Insurance",
    "exchange": "HKEX",
    "sector": "Financial Services",
    "industry": "Insurance—Life",
    "country": "China"
  },
  {
    "symbol": "1211.HK",
    "name": "BYD Company Limited",
    "exchange": "HKEX",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "China"
  },
  {
    "symbol": "0968.HK",
    "name": "Xinyi Solar Holdings",
    "exchange": "HKEX",
    "sector": "Technology",
    "industry": "Solar",
    "country": "China"
  },
  {
    "symbol": "1093.HK",
    "name": "CSPC Pharmaceutical Group Ltd.",
    "exchange": "HKEX",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—General",
    "country": "China"
  },
  {
    "symbol": "1177.HK",
    "name": "Sino Biopharmaceutical Limited",
    "exchange": "HKEX",
    "sector": "Healthcare",
    "industry": "Biotechnology",
    "country": "China"
  },
  {
    "symbol": "RELIANCE.NS",
    "name": "Reliance Industries Limited",
    "exchange": "NSE",
    "sector": "Energy",
    "industry": "Oil & Gas Integrated",
    "country": "India"
  },
  {
    "symbol": "TCS.NS",
    "name": "Tata Consultancy Services Limited",
    "exchange": "NSE",
    "sector": "Technology",
    "industry": "Information Technology Services",
    "country": "India"
  },
  {
    "symbol": "HDFCBANK.NS",
    "name": "HDFC Bank Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "India"
  },
  {
    "symbol": "INFY.NS",
    "name": "Infosys Limited",
    "exchange": "NSE",
    "sector": "Technology",
    "industry": "Information Technology Services",
    "country": "India"
  },
  {
    "symbol": "ICICIBANK.NS",
    "name": "ICICI Bank Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "India"
  },
  {
    "symbol": "HINDUNILVR.NS",
    "name": "Hindustan Unilever Limited",
    "exchange": "NSE",
    "sector": "Consumer Defensive",
    "industry": "Household & Personal Products",
    "country": "India"
  },
  {
    "symbol": "BHARTIARTL.NS",
    "name": "Bharti Airtel Limited",
    "exchange": "NSE",
    "sector": "Communication Services",
    "industry": "Telecom Services",
    "country": "India"
  },
  {
    "symbol": "ITC.NS",
    "name": "ITC Limited",
    "exchange": "NSE",
    "sector": "Consumer Defensive",
    "industry": "Tobacco",
    "country": "India"
  },
  {
    "symbol": "SBIN.NS",
    "name": "State Bank of India",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "India"
  },
  {
    "symbol": "LTIM.NS",
    "name": "LTIMindtree Limited",
    "exchange": "NSE",
    "sector": "Technology",
    "industry": "Information Technology Services",
    "country": "India"
  },
  {
    "symbol": "LT.NS",
    "name": "Larsen & Toubro Limited",
    "exchange": "NSE",
    "sector": "Industrials",
    "industry": "Engineering & Construction",
    "country": "India"
  },
  {
    "symbol": "AXISBANK.NS",
    "name": "Axis Bank Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "India"
  },
  {
    "symbol": "BAJFINANCE.NS",
    "name": "Bajaj Finance Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Credit Services",
    "country": "India"
  },
  {
    "symbol": "ASIANPAINT.NS",
    "name": "Asian Paints Limited",
    "exchange": "NSE",
    "sector": "Consumer Cyclical",
    "industry": "Specialty Chemicals",
    "country": "India"
  },
  {
    "symbol": "MARUTI.NS",
    "name": "Maruti Suzuki India Limited",
    "exchange": "NSE",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "India"
  },
  {
    "symbol": "SUNPHARMA.NS",
    "name": "Sun Pharmaceutical Industries",
    "exchange": "NSE",
    "sector": "Healthcare",
    "industry": "Drug Manufacturers—Specialty & Generic",
    "country": "India"
  },
  {
    "symbol": "TITAN.NS",
    "name": "Titan Company Limited",
    "exchange": "NSE",
    "sector": "Consumer Cyclical",
    "industry": "Luxury Goods",
    "country": "India"
  },
  {
    "symbol": "ADANIENT.NS",
    "name": "Adani Enterprises Limited",
    "exchange": "NSE",
    "sector": "Industrials",
    "industry": "Conglomerates",
    "country": "India"
  },
  {
    "symbol": "TATASTEEL.NS",
    "name": "Tata Steel Limited",
    "exchange": "NSE",
    "sector": "Basic Materials",
    "industry": "Steel",
    "country": "India"
  },
  {
    "symbol": "TATAMOTORS.NS",
    "name": "Tata Motors Limited",
    "exchange": "NSE",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "India"
  },
  {
    "symbol": "KOTAKBANK.NS",
    "name": "Kotak Mahindra Bank Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Banks—Diversified",
    "country": "India"
  },
  {
    "symbol": "WIPRO.NS",
    "name": "Wipro Limited",
    "exchange": "NSE",
    "sector": "Technology",
    "industry": "Information Technology Services",
    "country": "India"
  },
  {
    "symbol": "TECHM.NS",
    "name": "Tech Mahindra Limited",
    "exchange": "NSE",
    "sector": "Technology",
    "industry": "Information Technology Services",
    "country": "India"
  },
  {
    "symbol": "ULTRACEMCO.NS",
    "name": "UltraTech Cement Limited",
    "exchange": "NSE",
    "sector": "Basic Materials",
    "industry": "Building Materials",
    "country": "India"
  },
  {
    "symbol": "NESTLEIND.NS",
    "name": "Nestle India Limited",
    "exchange": "NSE",
    "sector": "Consumer Defensive",
    "industry": "Packaged Foods",
    "country": "India"
  },
  {
    "symbol": "ONGC.NS",
    "name": "Oil and Natural Gas Corporation Ltd",
    "exchange": "NSE",
    "sector": "Energy",
    "industry": "Oil & Gas Exploration & Production",
    "country": "India"
  },
  {
    "symbol": "COALINDIA.NS",
    "name": "Coal India Limited",
    "exchange": "NSE",
    "sector": "Energy",
    "industry": "Other Industrial Metals & Mining",
    "country": "India"
  },
  {
    "symbol": "NTPC.NS",
    "name": "NTPC Limited",
    "exchange": "NSE",
    "sector": "Utilities",
    "industry": "Utilities—Regulated Electric",
    "country": "India"
  },
  {
    "symbol": "POWERGRID.NS",
    "name": "Power Grid Corporation of India Ltd",
    "exchange": "NSE",
    "sector": "Utilities",
    "industry": "Utilities—Regulated Electric",
    "country": "India"
  },
  {
    "symbol": "JIOFIN.NS",
    "name": "Jio Financial Services Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Credit Services",
    "country": "India"
  },
  {
    "symbol": "M&M.NS",
    "name": "Mahindra & Mahindra Limited",
    "exchange": "NSE",
    "sector": "Consumer Cyclical",
    "industry": "Auto Manufacturers",
    "country": "India"
  },
  {
    "symbol": "HCLTECH.NS",
    "name": "HCL Technologies Limited",
    "exchange": "NSE",
    "sector": "Technology",
    "industry": "Information Technology Services",
    "country": "India"
  },
  {
    "symbol": "BAJAJFINSV.NS",
    "name": "Bajaj Finserv Limited",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Insurance—Diversified",
    "country": "India"
  },
  {
    "symbol": "ADANIPORTS.NS",
    "name": "Adani Ports and SEZ Limited",
    "exchange": "NSE",
    "sector": "Industrials",
    "industry": "Marine Shipping",
    "country": "India"
  },
  {
    "symbol": "GRASIM.NS",
    "name": "Grasim Industries Limited",
    "exchange": "NSE",
    "sector": "Basic Materials",
    "industry": "Building Materials",
    "country": "India"
  },
  {
    "symbol": "JSWSTEEL.NS",
    "name": "JSW Steel Limited",
    "exchange": "NSE",
    "sector": "Basic Materials",
    "industry": "Steel",
    "country": "India"
  },
  {
    "symbol": "HINDALCO.NS",
    "name": "Hindalco Industries Limited",
    "exchange": "NSE",
    "sector": "Basic Materials",
    "industry": "Aluminum",
    "country": "India"
  },
  {
    "symbol": "TATASTEEL.BO",
    "name": "Tata Steel Limited (BSE)",
    "exchange": "BSE",
    "sector": "Basic Materials",
    "industry": "Steel",
    "country": "India"
  },
  {
    "symbol": "SBILIFE.NS",
    "name": "SBI Life Insurance Company Ltd",
    "exchange": "NSE",
    "sector": "Financial Services",
    "industry": "Insurance—Life",
    "country": "India"
  },
  {
    "symbol": "BPCL.NS",
    "name": "Bharat Petroleum Corporation Ltd",
    "exchange": "NSE",
    "sector": "Energy",
    "industry": "Oil & Gas Refining & Marketing",
    "country": "India"
  }
];
