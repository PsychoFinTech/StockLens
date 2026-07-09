import { describe, it, expect, beforeAll, vi } from 'vitest';
import axios from 'axios';
import { alphaVantageService } from '../alphaVantage.js';

vi.mock('axios');
const mockedGet = vi.mocked(axios.get);

describe('alphaVantageService', () => {
  beforeAll(() => {
    process.env.ALPHAVANTAGE_API_KEY = 'TEST_KEY';
  });

  it('reports configured when a key is present', () => {
    expect(alphaVantageService.isConfigured()).toBe(true);
  });

  it('maps GLOBAL_QUOTE into the shared quote shape', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        'Global Quote': {
          '02. open': '100.0',
          '03. high': '105.0',
          '04. low': '99.0',
          '05. price': '104.5',
          '06. volume': '1000000',
          '08. previous close': '101.0',
          '09. change': '3.5',
          '10. change percent': '3.4653%'
        }
      }
    });

    const q = await alphaVantageService.getQuote('AVTEST1');
    expect(q.price).toBe(104.5);
    expect(q.change).toBe(3.5);
    expect(q.change_pct).toBeCloseTo(3.4653, 3);
    expect(q.high).toBe(105.0);
    expect(q.prev_close).toBe(101.0);
    expect(q.source).toBe('ALPHAVANTAGE');
  });

  it('throws when a rate-limit envelope is returned', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { Note: 'Thank you for using Alpha Vantage! Our standard API rate limit is...' }
    });
    await expect(alphaVantageService.getQuote('AVTEST2')).rejects.toThrow(/throttled/i);
  });

  it('maps SYMBOL_SEARCH into the shared search shape', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        bestMatches: [
          { '1. symbol': 'TSCO.LON', '2. name': 'Tesco PLC', '3. type': 'Equity', '4. region': 'United Kingdom' },
          { '1. symbol': 'TSCDF', '2. name': 'Tesco plc', '3. type': 'Equity', '4. region': 'United States' }
        ]
      }
    });

    const res = await alphaVantageService.searchSymbol('tesco');
    expect(res.result).toHaveLength(2);
    expect(res.result[0].symbol).toBe('TSCO.LON');
    expect(res.result[0].description).toBe('Tesco PLC');
    expect(res.result[0].exchange).toBe('United Kingdom');
  });
});
