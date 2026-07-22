const fs = require('fs');
const path = require('path');

// Simple PDF text extractor - extracts text between parentheses in PDF streams
function extractTextFromPDF(pdfPath) {
    const buffer = fs.readFileSync(pdfPath);
    const content = buffer.toString('latin1');
    
    // Find text between BT and ET (text blocks)
    const textBlocks = [];
    const tjRegex = /\(([^)]*)\)/g;
    let match;
    
    // Extract all text strings from PDF
    while ((match = tjRegex.exec(content)) !== null) {
        const text = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"');
        if (text.trim().length > 0) {
            textBlocks.push(text);
        }
    }
    
    return textBlocks.join(' ');
}

const docsDir = path.join(__dirname, '..', 'documents');
const files = ['guia_expo.pdf', 'Informe Final_Definitivo.pdf', 'DATOS.pdf'];

for (const file of files) {
    const filepath = path.join(docsDir, file);
    if (fs.existsSync(filepath)) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📄 ${file}`);
        console.log(`${'='.repeat(80)}`);
        try {
            const text = extractTextFromPDF(filepath);
            // Output first 15000 chars per file 
            console.log(text.substring(0, 15000));
            if (text.length > 15000) console.log(`\n... [truncated, total ${text.length} chars]`);
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    } else {
        console.log(`File not found: ${filepath}`);
    }
}
