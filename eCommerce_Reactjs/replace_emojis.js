const fs = require('fs');
const path = require('path');

const REPLACEMENTS = {
  '🏷️': '<i className="fa-solid fa-tags" style={{marginRight: 8}}></i>',
  '🎫': '<i className="fa-solid fa-ticket" style={{marginRight: 8}}></i>',
  '🚚': '<i className="fa-solid fa-truck-fast" style={{marginRight: 8}}></i>',
  '🏭': '<i className="fa-solid fa-industry" style={{marginRight: 8}}></i>',
  '📚': '<i className="fa-solid fa-book" style={{marginRight: 8}}></i>',
  '📦': '<i className="fa-solid fa-box" style={{marginRight: 8}}></i>',
  '📋': '<i className="fa-solid fa-list-check" style={{marginRight: 8}}></i>',
  '©️': '<i className="fa-solid fa-copyright" style={{marginRight: 8}}></i>',
  '✍️': '<i className="fa-solid fa-pen-nib" style={{marginRight: 8}}></i>',
  '🖼️': '<i className="fa-solid fa-image" style={{marginRight: 8}}></i>',
  '📊': '<i className="fa-solid fa-file-excel" style={{marginRight: 6}}></i>',
  '✏️': '<i className="fa-solid fa-pen-to-square"></i>',
  '🗑️': '<i className="fa-solid fa-trash"></i>',
  '🔍': '<i className="fa-solid fa-magnifying-glass"></i>',
  '➕': '<i className="fa-solid fa-plus" style={{marginRight: 6}}></i>',
  '📝': '<i className="fa-solid fa-pen-to-square" style={{marginRight: 8}}></i>',
  '👥': '<i className="fa-solid fa-users" style={{marginRight: 8}}></i>',
  '🛍️': '<i className="fa-solid fa-bag-shopping" style={{marginRight: 8}}></i>',
  '👤': '<i className="fa-solid fa-user" style={{marginRight: 8}}></i>',
  '🔒': '<i className="fa-solid fa-lock" style={{marginRight: 8}}></i>',
  '🛒': '<i className="fa-solid fa-cart-shopping" style={{marginRight: 8}}></i>',
};

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
    
    // First, handle places where emojis are inside strings that expect React elements.
    // E.g., title="🏷️ Quản lý mã Voucher" -> title={<><i className="..."></i> Quản lý mã Voucher</>}
    // E.g., title="✍️ Tạo bài đăng" -> title={<><i className="..."></i> Tạo bài đăng</>}
    
    content = content.replace(/title="([^"]+)"/g, (match, p1) => {
        let newTitle = p1;
        let modified = false;
        for (const [emoji, icon] of Object.entries(REPLACEMENTS)) {
            if (newTitle.includes(emoji)) {
                newTitle = newTitle.replace(emoji + " ", icon);
                newTitle = newTitle.replace(emoji, icon);
                modified = true;
            }
        }
        if (modified) {
            return `title={<>${newTitle}</>}`;
        }
        return match;
    });

    // Also handle {isAdd ? '✍️ Tạo bài đăng' : '✏️ Chỉnh sửa bài đăng'}
    // This is harder to regex safely, but let's do a simple string replacement for all emojis.
    // Wait, replacing emojis in strings directly will break if they are just strings (e.g., '📝 Chỉnh sửa thông tin').
    // React allows `<i className="..."></i>` inside JSX directly. But inside strings it will just print the string.
    // If we replace `>✏️ Sửa<` with `><i className="fa-solid fa-pen-to-square"></i> Sửa<`, that's fine.
    
    for (const [emoji, icon] of Object.entries(REPLACEMENTS)) {
        // Replace emojis that are standalone or with text inside JSX text nodes or JSX attributes.
        // It's safer to just replace `>emoji Text<`
        // But what about buttons? `>📊 Xuất Excel<`
        const regex1 = new RegExp(`>\\s*${emoji}\\s*([^<]*)<`, 'g');
        content = content.replace(regex1, `>${icon}$1<`);

        // What if it's `{isAdd ? '✍️ Tạo bài đăng' : '✏️ Chỉnh sửa bài đăng'}`?
        // We'd have to change it to `{isAdd ? <><i ...></i> Tạo bài đăng</> : <><i ...></i> Chỉnh sửa bài đăng</>}`
        // We can do a hacky regex for this specific pattern if we know it exists.
        const regex2 = new RegExp(`'${emoji}\\s*([^']*)'`, 'g');
        content = content.replace(regex2, `<>${icon}$1</>`);
        
        const regex3 = new RegExp(`"${emoji}\\s*([^"]*)"`, 'g');
        content = content.replace(regex3, `<>${icon}$1</>`);

        // Finally, for any remaining loose emojis:
        content = content.replace(new RegExp(emoji, 'g'), icon);
    }

    // Fix possible `<><><i` nested empty tags if the regex overlapped
    content = content.replace(/<><>/g, '<>');
    content = content.replace(/<\/><\/>/g, '</>');
    content = content.replace(/title={<><>/g, 'title={<>');

    if (content !== original) {
      console.log(`Updated ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
