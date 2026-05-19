import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
lines.forEach(line => {
  if (line.includes('CLOUDINARY')) {
    if (line.trim() !== line.replace('\r', '')) {
      console.log('Trailing space found in:', line.split('=')[0]);
    }
    const val = line.split('=')[1] || '';
    if (val.trim() !== val.replace('\r', '')) {
       console.log('Trailing space in value of:', line.split('=')[0]);
    }
  }
});
console.log('check done');
