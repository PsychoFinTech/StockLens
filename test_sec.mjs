import * as cheerio from 'cheerio';
const htmlUrl = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=' + encodeURIComponent('citadel');
fetch(htmlUrl, { headers: { 'User-Agent': 'Stocklens Research Agent stocklens-admin@gmail.com' } })
  .then(res => res.text())
  .then(html => {
    const $ = cheerio.load(html);
    const results = [];
    $('table[summary="Results"] tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length >= 2) {
        const cik = $(tds[0]).text().trim();
        const name = $(tds[1]).text().trim();
        if (cik && name) results.push({ cik, name });
      }
    });
    console.log(results.slice(0, 10));
  });
