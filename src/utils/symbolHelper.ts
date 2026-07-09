/**
 * Resolves standard global flags, symbols, and badges based on equities ticker parameters.
 */

// Simple flag resolver returns flagcdn url or default icon
export const getCountryFlagUrl = (exchange: string): string => {
  const ex = (exchange || '').toUpperCase();
  if (ex.includes('NYSE') || ex.includes('NASDAQ') || ex.includes('US') || ex.includes('OTC')) {
    return 'https://flagcdn.com/16x12/us.png';
  }
  if (ex.includes('LSE') || ex.includes('LONDON')) {
    return 'https://flagcdn.com/16x12/gb.png';
  }
  if (ex.includes('XETRA') || ex.includes('GERMANY')) {
    return 'https://flagcdn.com/16x12/de.png';
  }
  if (ex.includes('EURONEXT PARIS') || ex.includes('FRANCE') || ex === 'PA' || ex === 'PARIS') {
    return 'https://flagcdn.com/16x12/fr.png';
  }
  if (ex.includes('MADRID') || ex.includes('SPAIN') || ex === 'MC') {
    return 'https://flagcdn.com/16x12/es.png';
  }
  if (ex.includes('ITALIANA') || ex.includes('ITALY') || ex === 'MI') {
    return 'https://flagcdn.com/16x12/it.png';
  }
  if (ex.includes('AMSTERDAM') || ex.includes('NETHERLANDS') || ex === 'AS') {
    return 'https://flagcdn.com/16x12/nl.png';
  }
  if (ex.includes('SIX') || ex.includes('SWITZERLAND') || ex.includes('SW')) {
    return 'https://flagcdn.com/16x12/ch.png';
  }
  if (ex.includes('NSE') || ex.includes('BSE') || ex.includes('INDIA')) {
    return 'https://flagcdn.com/16x12/in.png';
  }
  if (ex.includes('TOKYO') || ex.includes('TSE') || ex.includes('JAPAN')) {
    return 'https://flagcdn.com/16x12/jp.png';
  }
  if (ex.includes('KRX') || ex.includes('SOUTH KOREA') || ex.includes('KS')) {
    return 'https://flagcdn.com/16x12/kr.png';
  }
  if (ex.includes('HKEX') || ex.includes('HONG KONG') || ex.includes('HK')) {
    return 'https://flagcdn.com/16x12/hk.png';
  }
  if (ex.includes('TWSE') || ex.includes('TAIWAN') || ex.includes('TW')) {
    return 'https://flagcdn.com/16x12/tw.png';
  }
  // Standard default
  return 'https://flagcdn.com/16x12/us.png';
};

// Formats short exchange badging representations
export const getExchangeBadge = (exchange: string): string => {
  const ex = (exchange || '').toUpperCase();
  if (ex.includes('NASDAQ')) return 'NASDAQ';
  if (ex.includes('NYSE')) return 'NYSE';
  if (ex.includes('LSE') || ex.includes('LONDON')) return 'LSE';
  if (ex.includes('XETRA')) return 'XETRA';
  if (ex.includes('EURONEXT PARIS') || ex.includes('PARIS')) return 'EURONEXT';
  if (ex.includes('MADRID')) return 'BOLSAS';
  if (ex.includes('AMSTERDAM')) return 'AEX';
  if (ex.includes('NSE')) return 'NSE';
  if (ex.includes('BSE')) return 'BSE';
  if (ex.includes('TOKYO')) return 'TSE';
  if (ex.includes('KRX')) return 'KRX';
  if (ex.includes('HKEX')) return 'HKEX';
  if (ex.includes('TWSE')) return 'TWSE';
  if (ex.includes('SIX')) return 'SIX';
  return exchange || 'EQUITY';
};
