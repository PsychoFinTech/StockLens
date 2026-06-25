import { yahooService } from '../../yahoo.js';
import db from '../../db.js';

export interface PeerMetric {
  symbol: string;
  name: string;
  price: number | null;
  mcap: number | null;
  pe: string | null;
  evEbitda: string | null;
  grossMargin: string | null;
  revGrowth: string | null;
  exchange: string | null;
}

const KNOWN_COMPETITOR_MAP: Record<string, string[]> = {
  'AAPL': ['MSFT', 'GOOGL', 'AMZN', 'META', 'DELL', 'HPQ'],
  'MSFT': ['AAPL', 'GOOGL', 'AMZN', 'ORCL', 'IBM', 'META'],
  'GOOGL': ['META', 'MSFT', 'AAPL', 'AMZN', 'PINS', 'SNAP'],
  'META': ['GOOGL', 'SNAP', 'PINS', 'AAPL', 'AMZN'],
  'AMZN': ['WMT', 'TGT', 'EBAY', 'BABA', 'AAPL', 'GOOGL', 'MSFT'],
  'NVDA': ['AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU'],
  'AMD': ['NVDA', 'INTC', 'QCOM', 'TXN', 'MU'],
  'INTC': ['AMD', 'NVDA', 'QCOM', 'TXN'],
  'TSLA': ['F', 'GM', 'RIVN', 'LCID', 'TM', 'HMC'],
  'JPM': ['BAC', 'C', 'WFC', 'GS', 'MS'],
  'BAC': ['JPM', 'C', 'WFC', 'GS', 'MS'],
  'V': ['MA', 'AXP', 'PYPL', 'DFS'],
  'MA': ['V', 'AXP', 'PYPL', 'DFS'],
  'JNJ': ['PFE', 'MRK', 'ABBV', 'LLY', 'UNH'],
  'PFE': ['JNJ', 'MRK', 'ABBV', 'LLY', 'BMY'],
  'WMT': ['TGT', 'AMZN', 'COST', 'KR', 'DG'],
  'DIS': ['NFLX', 'CMCSA', 'WBD', 'PARA', 'FOXA'],
  'NFLX': ['DIS', 'WBD', 'CMCSA', 'PARA', 'ROKU', 'AAPL', 'AMZN']
};

export async function fetchPeersForReport(symbol: string): Promise<PeerMetric[]> {
  const sym = symbol.toUpperCase();
  let peers: string[] = [];

  try {
    const yahooPeers = await yahooService.getPeers(sym);
    if (yahooPeers && yahooPeers.length > 0) {
      peers = yahooPeers.filter((p: string) => p !== sym).slice(0, 5);
    }
  } catch (err) {
    console.warn(`[PeerService] Yahoo peers query fail for ${sym}:`, err);
  }

  if (peers.length === 0 && KNOWN_COMPETITOR_MAP[sym]) {
    peers = KNOWN_COMPETITOR_MAP[sym].slice(0, 5);
  }

  if (peers.length === 0) {
    try {
      const metaStmt = db.prepare('SELECT sector, industry FROM stocks WHERE symbol = ?');
      const stockMeta = metaStmt.get(sym) as { sector: string; industry: string } | undefined;

      if (stockMeta?.industry) {
        const industryPeersStmt = db.prepare('SELECT symbol FROM stocks WHERE industry = ? AND symbol != ? LIMIT 5');
        const industryPeersList = industryPeersStmt.all(stockMeta.industry, sym) as Array<{ symbol: string }>;
        peers = industryPeersList.map(p => p.symbol);
      }

      if (peers.length < 3 && stockMeta?.sector) {
        const sectorPeersStmt = db.prepare('SELECT symbol FROM stocks WHERE sector = ? AND symbol != ? LIMIT 5');
        const sectorPeersList = sectorPeersStmt.all(stockMeta.sector, sym) as Array<{ symbol: string }>;
        const extra = sectorPeersList.map(p => p.symbol).filter(s => !peers.includes(s));
        peers = [...peers, ...extra].slice(0, 5);
      }
    } catch (dbErr) {
      console.error('[PeerService] SQLITE FALLBACK ERROR', dbErr);
    }
  }

  // Fetch metrics for these peers
  const peersMetrics = await Promise.all(
    peers.map(async (peerSymbol) => {
      let name = `${peerSymbol} Corp`;
      let exchange = 'NYSE';
      try {
        const profileStmt = db.prepare('SELECT name, exchange FROM stocks WHERE symbol = ?').get(peerSymbol) as any;
        if (profileStmt) {
          name = profileStmt.name;
          exchange = profileStmt.exchange;
        }
      } catch (e) {}

      let price: number | null = null;
      try {
        const q = await yahooService.getQuote(peerSymbol);
        price = q?.price ?? null;
      } catch (e) {}

      let cachedRatios: any = null;
      try {
        cachedRatios = await yahooService.getBasicFinancials(peerSymbol);
      } catch (e) {}

      const pe = cachedRatios?.metric?.peAnnual ?? null;
      const evEbitda = cachedRatios?.metric?.evEbitda ?? null;
      const grossMargin = cachedRatios?.metric?.grossMargins ? `${Number(cachedRatios.metric.grossMargins).toFixed(1)}%` : null;
      const revGrowth = cachedRatios?.metric?.revenueGrowth ? `${Number(cachedRatios.metric.revenueGrowth).toFixed(1)}%` : null;
      const mcap = cachedRatios?.metric?.marketCapitalization ? cachedRatios.metric.marketCapitalization * 1000000 : null;

      return {
        symbol: peerSymbol,
        name: name,
        price: price,
        mcap: mcap,
        pe: pe ? Number(pe).toFixed(2) : null,
        evEbitda: evEbitda ? Number(evEbitda).toFixed(2) : null,
        grossMargin: grossMargin || null,
        revGrowth: revGrowth || null,
        exchange: exchange
      };
    })
  );

  return peersMetrics;
}
