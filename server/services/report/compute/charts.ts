import QuickChart from 'quickchart-js';

export function generatePriceChartUrl(ticker: string, history: any[]): string {
  const chart = new QuickChart();
  chart.setWidth(600);
  chart.setHeight(250);
  chart.setFormat('png');
  chart.setDevicePixelRatio(2.0);

  // Take 60 data points for a smooth but concise curve
  const step = Math.ceil(history.length / 60) || 1;
  const dataPoints = history.filter((_, i) => i % step === 0).map(h => {
    const d = new Date(h.date);
    return {
      x: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      y: h.close
    };
  });

  chart.setConfig({
    type: 'line',
    data: {
      labels: dataPoints.map(d => d.x),
      datasets: [{
        label: `${ticker} Price`,
        data: dataPoints.map(d => d.y),
        fill: true,
        backgroundColor: 'rgba(15, 23, 42, 0.1)',
        borderColor: '#0f172a',
        borderWidth: 2,
        pointRadius: 0,
        lineTension: 0.4
      }]
    },
    options: {
      title: { display: false },
      legend: { display: false },
      layout: {
        padding: { top: 10, right: 20, bottom: 10, left: 10 }
      },
      scales: {
        xAxes: [{
          gridLines: { display: false, drawBorder: false },
          ticks: {
            maxTicksLimit: 8,
            maxRotation: 0,
            fontColor: '#64748b'
          }
        }],
        yAxes: [{
          gridLines: {
            color: 'rgba(0, 0, 0, 0.05)',
            zeroLineColor: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            fontColor: '#64748b'
          }
        }]
      }
    }
  });

  return chart.getUrl();
}
