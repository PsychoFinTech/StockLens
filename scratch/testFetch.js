import https from 'https';

const url = 'https://raw.githubusercontent.com/Ate329/top-us-stock-tickers/main/tickers/all.csv';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    console.log('Headers:', lines[0]);
    console.log('Sample rows:', lines.slice(1, 5));
    console.log('Total rows:', lines.length);
  });
}).on('error', err => console.error(err));
