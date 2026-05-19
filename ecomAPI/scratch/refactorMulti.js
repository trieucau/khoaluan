import fs from 'fs';
import path from 'path';

const searchDir = './src/services';
const files = fs.readdirSync(searchDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(searchDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove: xxx = Buffer.from(yyy, 'base64').toString('binary');
    // or: xxx = Buffer.from( \n yyy, \n 'base64' \n ).toString('binary');
    
    // Pattern to match:
    // SomeProperty = Buffer.from(
    //    Something.image,
    //    'base64'
    // ).toString('binary');
    
    // A robust way is to just match `Buffer.from( ... 'base64' ... ).toString('binary')` and replace it with just the first argument (or completely remove the assignment).
    // Actually, in the frontend, they just want the URL now, which is directly stored in `xxx.image`.
    // So we should remove the whole assignment statement if it's assigning to itself or similar, OR we replace it with just `item.image = item.image;` which is a no-op, or just delete it.
    
    // Regex to match: any assignment ending with `.toString('binary')` or `.toString(\n 'binary'\n)`
    const regex1 = /.*Buffer\.from\([\s\S]*?,\s*'base64'\s*\)\.toString\([\s\S]*?'binary'[\s\S]*?\);?/g;
    content = content.replace(regex1, '');
    
    const regex2 = /\?\s*Buffer\.from\([\s\S]*?,\s*'base64'\s*\)\.toString\([\s\S]*?'binary'[\s\S]*?\)/g;
    content = content.replace(regex2, '? res[i].image');

    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('done multiline');
