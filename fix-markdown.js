#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixMarkdownFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix MD022: Add blank lines around headings
    content = content.replace(/^(.*\n)(#{1,6}\s+.+)$/gm, '$1\n$2');
    content = content.replace(/^(#{1,6}\s+.+)(\n(?!#{1,6}\s+).+)$/gm, '$1\n$2');

    // Fix MD031: Add blank lines around fenced code blocks
    content = content.replace(/^(.*[^\n])(\n```)/gm, '$1\n$2');
    content = content.replace(/^(```.*\n)/gm, '\n$1');
    content = content.replace(/^(```)(\n[^`])/gm, '$1\n$2');

    // Fix MD032: Add blank lines around lists
    content = content.replace(/^(.*[^\n])(\n[-*+]\s+)/gm, '$1\n$2');
    content = content.replace(/^([-*+]\s+.*\n)([^\-\*\+\s])/gm, '$1\n$2');

    // Fix MD026: Remove trailing punctuation from headings
    content = content.replace(/^(#{1,6}\s+.+)[:.!]$/gm, '$1');

    // Clean up extra blank lines (max 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');

    // Clean up beginning and end
    content = content.replace(/^\n+/, '');
    content = content.replace(/\n+$/, '\n');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed: ${filePath}`);
    } else {
        console.log(`No changes needed: ${filePath}`);
    }
}

// Get file paths from command line arguments
const filesToFix = process.argv.slice(2);

if (filesToFix.length === 0) {
    console.log('Usage: node fix-markdown.js <file1.md> [file2.md] ...');
    process.exit(1);
}

filesToFix.forEach(fixMarkdownFile);
