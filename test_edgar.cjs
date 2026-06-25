const { edgarService } = require('./server/services/edgar');

async function run() {
  try {
    console.log("Testing TSLA Item 1...");
    const tsla = await edgarService.getSection('TSLA', '1');
    console.log("TSLA Item 1 parsed. Paragraphs count:", tsla.paragraphs.length);
    console.log("First paragraph snippet:", tsla.paragraphs[0]?.substring(0, 50));
    
    console.log("\\nTesting AAPL Item 1A...");
    const aapl = await edgarService.getSection('AAPL', '1A');
    console.log("AAPL Item 1A parsed. Paragraphs count:", aapl.paragraphs.length);
    console.log("First paragraph snippet:", aapl.paragraphs[0]?.substring(0, 50));
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
