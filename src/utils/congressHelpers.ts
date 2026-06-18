import { COMMITTEE_LABELS } from '../constants/committeeLabels.js';
import { SECTOR_COMMITTEE_MAP } from '../constants/sectorCommitteeMap.js';

// FMP response item shape
export interface FMPTrade {
  symbol: string;
  senateID: string;
  disclosureDate: string;
  transactionDate: string;
  firstName: string;
  lastName: string;
  office: string;
  district: string;
  owner: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  comment: string;
  link: string;
}

// Unified enriched trade used by UI components
export interface EnrichedTrade {
  senator: string;
  office: string;
  ptr_link: string;
  date_recieved: string;
  transaction_date: string;
  ticker: string;
  asset_description: string;
  asset_type: string;
  type: string;
  amount: string;
  owner: string;
  committees: string[];
  isRelevant: boolean;
  lagDays: number;
}

// 1. Convert FMP flat trades to the EnrichedTrade format the UI expects
export function convertFMPTrades(
  fmpTrades: FMPTrade[],
  committeeMemberships: Record<string, any[]>,
  ticker: string
): EnrichedTrade[] {
  if (!Array.isArray(fmpTrades)) return [];

  const upperTicker = ticker.toUpperCase().trim();
  const committeeMap = buildCommitteeMap(committeeMemberships);

  const filtered = fmpTrades.filter(trade => {
    if (!trade.symbol) return false;
    return trade.symbol.toUpperCase().trim() === upperTicker;
  });

  const enriched: EnrichedTrade[] = filtered.map(trade => {
    const senatorName = `${trade.firstName || ''} ${trade.lastName || ''}`.trim();
    const senatorKey = senatorName.toLowerCase().trim();
    const committees = committeeMap[senatorKey] || [];
    const isRelevant = isRelevantCommittee(upperTicker, committees);
    const lagDays = calcLag(trade.transactionDate, trade.disclosureDate);

    return {
      senator: senatorName,
      office: trade.office || '',
      ptr_link: trade.link || '',
      date_recieved: trade.disclosureDate || '',
      transaction_date: trade.transactionDate || '',
      ticker: trade.symbol || '',
      asset_description: trade.assetDescription || '',
      asset_type: trade.assetType || '',
      type: trade.type || '',
      amount: trade.amount || '',
      owner: trade.owner || '',
      committees,
      isRelevant,
      lagDays
    };
  });

  // Sort by transaction_date descending (most recent first)
  return enriched.sort((a, b) => {
    const dateA = new Date(a.transaction_date).getTime();
    const dateB = new Date(b.transaction_date).getTime();
    return dateB - dateA;
  });
}

// Build committee lookup map: name -> committee labels
export function buildCommitteeMap(committeeMemberships: Record<string, any[]>): Record<string, string[]> {
  const committeeMap: Record<string, string[]> = {};
  if (!committeeMemberships || typeof committeeMemberships !== 'object') return committeeMap;

  for (const [committeeCode, members] of Object.entries(committeeMemberships)) {
    const label = COMMITTEE_LABELS[committeeCode];
    if (!label) continue;
    if (!Array.isArray(members)) continue;

    for (const member of members) {
      if (!member || !member.name) continue;
      const key = member.name.toLowerCase().trim();
      if (!committeeMap[key]) {
        committeeMap[key] = [];
      }
      if (!committeeMap[key].includes(label)) {
        committeeMap[key].push(label);
      }
    }
  }
  return committeeMap;
}

// Get relevant committee for ticker based on sector mapping
export function getRelevantCommitteeForTicker(ticker: string): string | null {
  const upperTicker = ticker.toUpperCase().trim();
  for (const [tickersStr, committee] of Object.entries(SECTOR_COMMITTEE_MAP)) {
    const tickers = tickersStr.split(',').map(t => t.trim().toUpperCase());
    if (tickers.includes(upperTicker)) {
      return committee;
    }
  }
  return null;
}

// Check if senator is in a committee relevant to this stock
export function isRelevantCommittee(ticker: string, senatorCommittees: string[]): boolean {
  const relevantCommittee = getRelevantCommitteeForTicker(ticker);
  if (!relevantCommittee) return false;
  return senatorCommittees.includes(relevantCommittee);
}

// Calculate lag days between transaction date and disclosure date
export function calcLag(transactionDateStr: string, disclosureDateStr: string): number {
  if (!transactionDateStr || !disclosureDateStr) return 0;
  try {
    const tDate = new Date(transactionDateStr);
    const rDate = new Date(disclosureDateStr);
    if (isNaN(tDate.getTime()) || isNaN(rDate.getTime())) return 0;
    const diffTime = rDate.getTime() - tDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  } catch (e) {
    return 0;
  }
}

