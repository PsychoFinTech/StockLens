import * as cheerio from 'cheerio';
async function searchCikByName(name) {
  const url = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=' + encodeURIComponent(name) + '&output=atom';
  const response = await fetch(url, { headers: { 'User-Agent': 'Stocklens Research Agent stocklens-admin@gmail.com' } });
  const xml = await response.text();
  const cikMatch = xml.match(/<title>([^<]+)\s+\(CIK\s+(\d{10})\)<\/title>/);
  if (cikMatch) return cikMatch[2];
  
  const htmlUrl = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=' + encodeURIComponent(name);
  const htmlResponse = await fetch(htmlUrl, { headers: { 'User-Agent': 'Stocklens Research Agent stocklens-admin@gmail.com' } });
  const html = await htmlResponse.text();
  
  const $ = cheerio.load(html);
  const results = [];
  $('table[summary="Results"] tr').each((i, el) => {
    const tds = $(el).find('td');
    if (tds.length >= 2) {
      const cik = $(tds[0]).text().trim();
      const companyName = $(tds[1]).text().trim();
      if (cik && companyName) results.push({ cik, name: companyName });
    }
  });

  if (results.length > 0) {
    const exactMatch = results.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (exactMatch) return exactMatch.cik;

    const keywords = ['ADVISORS', 'MANAGEMENT', 'CAPITAL', 'FUND', 'ASSET', 'PARTNERS', 'INVESTMENT'];
    for (const kw of keywords) {
      const keywordMatch = results.find(r => r.name.toUpperCase().includes(kw));
      if (keywordMatch) return keywordMatch.cik;
    }
    return results[0].cik;
  }
  const htmlCikMatch = html.match(/CIK=(\d{10})/);
  if (htmlCikMatch) return htmlCikMatch[1];
  throw new Error('Could not resolve CIK for name ' + name);
}

searchCikByName('citadel').then(console.log).catch(console.error);
