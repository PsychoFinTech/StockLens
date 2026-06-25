const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'services', 'edgar.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetContent = `function extractSectionText(html: string, itemName: string): string[] {
  
  // Fallback 1: first candidate if any exists (even if distance is small)
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.distance - a.distance);
    return lines.slice(candidates[0].startIdx + 1, candidates[0].endIdx);
  }
  
  // Fallback 2: if we found start indices but no end index, slice from the latest start index to the end (or up to 1000 lines)
  if (startIndices.length > 0) {
    // Sort start indices descending (latest in document is usually the actual section to bypass TOC)
    startIndices.sort((a, b) => b - a);
    const startIdx = startIndices[0];
    const endIdx = Math.min(startIdx + 1000, lines.length);
    return lines.slice(startIdx + 1, endIdx);
  }
  
  return [];
}`;

const replacement = `function extractSectionText(html: string, itemName: string): string[] {
  const $ = cheerio.load(html, { xmlMode: false });
  
  const anchorBasedResult = extractViaAnchors($, itemName);
  if (anchorBasedResult.length > 0) {
    return formatOutput(anchorBasedResult);
  }

  const heuristicResult = extractViaHeuristics($, itemName);
  if (heuristicResult.length > 0) {
    return formatOutput(heuristicResult);
  }

  return [];
}`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully replaced via JS script.");
} else {
  console.log("Target content not found exactly. Searching dynamically...");
  // Alternative: match via regex to find the start and end
  const startIdx = content.indexOf('function extractSectionText(html: string, itemName: string): string[] {');
  const endIdx = content.indexOf('// ─── LCS Paragraph Diff ───────────────────────────────────────────────────────');
  
  if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);
    content = before + replacement + '\\n\\n' + after;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully replaced via dynamic slicing.");
  } else {
    console.log("Failed to find boundaries.");
  }
}
