const fs = require('fs');
const path = require('path');

const dirsToScan = ['e:\\clone\\ecomFullStack\\eCommerce_Reactjs\\src\\container\\System'];

const emojiRegex = /\p{Extended_Pictographic}/gu;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(emojiRegex);
        if (match) {
          console.log(`File: ${fullPath}, Line: ${i + 1}, Match: ${match.join('')}`);
        }
      }
    }
  }
}

dirsToScan.forEach(scanDir);
