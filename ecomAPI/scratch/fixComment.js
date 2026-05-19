import fs from 'fs';
let content = fs.readFileSync('src/services/commentService.js', 'utf8');
content = content.replace(/res\[i\]\.image = res\[i\]\.image\s*:\s*'';/g, '');
fs.writeFileSync('src/services/commentService.js', content, 'utf8');
