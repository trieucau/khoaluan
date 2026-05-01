const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/container/System', (filePath) => {
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix `icon=<><i ...></i></>` to `icon={<><i ...></i></>}`
    // We match `icon=<>` and replace with `icon={<>`
    // Then we need to add `}` after `</>`.
    // The pattern is `icon=<> ... </>`
    content = content.replace(/icon=<>/g, 'icon={<>');
    // The closing tag `</>` that belongs to icon needs a `}`.
    // It's usually followed by ` title=` or ` />` or ` `
    // e.g. `icon={<><i ...></i></> title=` -> `icon={<><i ...></i></>} title=`
    content = content.replace(/<\/i><\/>/g, '</i></>}');

    // Also fix title={<><><i -> title={<><i
    content = content.replace(/title={<><><i/g, 'title={<><i');
    content = content.replace(/<\/i><\/><\/>}/g, '</i></>}');

    if (content !== original) {
      console.log(`Fixed ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
