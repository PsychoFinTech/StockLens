export const cleanText = (txt: string): string => {
  return txt ? txt.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '') : '';
};

export const parseMoney = (val: string): number | null => {
  if (!val) return null;
  const isNegative = val.trim().startsWith('-') || val.includes('(');
  const cleaned = val.replace(/[$,\(\)\s—\-]/g, '').trim();
  if (!cleaned || isNaN(Number(cleaned))) return null;
  const num = parseFloat(cleaned);
  return isNegative ? -num : num;
};

export const isFootnote = (txt: string): boolean => {
  const cleaned = cleanText(txt);
  if (!cleaned) return false;
  return /^\s*[\*†‡§#]x?\s*$/i.test(cleaned) || /^\s*\(\s*\d+\s*\)(?:\s*\(\s*\d+\s*\))*\s*$/.test(cleaned);
};
