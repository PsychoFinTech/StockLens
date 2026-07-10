import { edgarService } from './server/services/edgar.js';

async function run() {
  try {
    console.log("Testing TSLA Item 7...");
    const tsla = await edgarService.getSection('TSLA', '7');
    console.log("TSLA Item 7 parsed. Paragraphs count:", tsla.paragraphs.length);
    if (tsla.paragraphs.length === 0) {
      console.log("PARAGRAPHS EMPTY!");
    } else {
      console.log("First paragraph snippet:", tsla.paragraphs[0]?.substring(0, 50));
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
