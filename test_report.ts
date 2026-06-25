import { fetchYahooData } from './server/services/report/data/yahooFinanceService.js';
import { fetchSecData } from './server/services/report/data/secEdgarService.js';
import { fetchFredData } from './server/services/report/data/fredService.js';
import { computeRatios } from './server/services/report/compute/ratios.js';
import { generatePriceChartUrl } from './server/services/report/compute/charts.js';
import { generateReportContent } from './server/services/report/render/templates.js';
import { generatePdf } from './server/services/report/output/pdfGenerator.js';
import fs from 'fs/promises';

async function test() {
  console.log('Fetching data...');
  const ticker = 'MSFT';
  const yfData = await fetchYahooData(ticker);
  const secData = await fetchSecData(ticker);
  const fredData = await fetchFredData();
  
  console.log('Computing metrics...');
  const metrics = computeRatios(yfData.profile?.financialData, yfData.profile?.defaultKeyStatistics);
  const chartUrl = generatePriceChartUrl(ticker, yfData.history);

  console.log('Rendering content...');
  const content = generateReportContent(ticker, yfData, secData, fredData, metrics, chartUrl);

  console.log('Generating PDF...');
  const pdfBuffer = await generatePdf(content);
  await fs.writeFile('test_report.pdf', pdfBuffer);
  console.log('Successfully wrote test_report.pdf');

  console.log('Generating Word...');
  const { generateWord } = await import('./server/services/report/output/wordGenerator.js');
  const wordBuffer = await generateWord(content);
  await fs.writeFile('test_report.docx', wordBuffer);
  console.log('Successfully wrote test_report.docx');
}

test().catch(console.error);
