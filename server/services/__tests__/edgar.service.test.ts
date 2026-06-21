import { vi, describe, it, expect, beforeEach } from 'vitest';
import { edgarService } from '../edgar.js';

// Mock DB to prevent actual database write attempts during tests
vi.mock('../db.js', () => {
  return {
    default: {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue(null), // simulate cache miss
        run: vi.fn(),
      }),
    },
  };
});

describe('edgarService - getPayVersusPerformance & Proxy', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should fetch and parse structured Pay versus Performance data', async () => {
    // AAPL's CIK is pre-cached, so no ticker-lookup fetch happens.
    const mockFacts = {
      facts: {
        ecd: {
          PeoTotalCompAmt: {
            label: "PEO Total Compensation Amount",
            units: {
              USD: [
                { val: 99407900, fy: 2022, fp: "FY", accn: "0000320193-23-000006", form: "DEF 14A" }
              ]
            }
          }
        }
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFacts,
    });

    const result = await edgarService.getPayVersusPerformance('AAPL');
    expect(result.available).toBe(true);
    expect(result.symbol).toBe('AAPL');
    expect(result.concepts.length).toBe(1);
    expect(result.concepts[0].tag).toBe('PeoTotalCompAmt');
    expect(result.concepts[0].values[0].val).toBe(99407900);
    expect(result.concepts[0].values[0].fy).toBe(2022);
  });

  it('should handle missing ecd taxonomy gracefully', async () => {
    // MSFT is pre-cached as well, so no ticker-lookup fetch happens.
    const mockFacts = {
      facts: {}
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFacts,
    });

    const result = await edgarService.getPayVersusPerformance('MSFT');
    expect(result.available).toBe(false);
    expect(result.reason).toContain("no 'ecd'");
  });

  it('should return honest empty shareholder proposals (no fabrication fallback) when HTML scraper finds nothing', async () => {
    // Submissions query is the first fetch
    const mockSubmissions = {
      filings: {
        recent: {
          form: ['DEF 14A'],
          accessionNumber: ['0001193125-23-258661'],
          primaryDocument: ['d562329ddef14a.htm'],
          filingDate: ['2023-10-19']
        }
      }
    };

    // Proxy HTML is the second fetch
    const mockHtml = `
      <html>
        <body>
          <h1>Proxy Statement 2023</h1>
          <p>Annual Meeting to be held on November 15, 2023.</p>
        </body>
      </html>
    `;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubmissions,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

    // We use a different pre-cached ticker (GOOGL) to avoid memory cache collision with MSFT/AAPL
    const result = await edgarService.getProxyStatement('GOOGL');
    expect(result.symbol).toBe('GOOGL');
    expect(result.shareholderProposals.length).toBe(0);
  });
});
