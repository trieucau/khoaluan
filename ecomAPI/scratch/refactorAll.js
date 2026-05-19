import fs from 'fs';

const services = [
  'shopCartService.js',
  'receiptService.js',
  'commentService.js',
  'blogService.js',
  'bannerService.js',
  'orderService.js',
  'messageService.js',
];

services.forEach((service) => {
  const filePath = `./src/services/${service}`;
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject cloudinary
  if (!content.includes('cloudinary.js') && content.includes('import db')) {
    content = content.replace("import db from '../models/index.js';", "import db from '../models/index.js';\nimport { uploadImage } from '../utils/cloudinary.js';");
  }

  // Remove all buffer conversions
  const regexBuffer = /[ \t]*[^\n]*Buffer\.from\([^\n]*\n*[ \t]*[^\n]*'base64'[^\n]*\)\.toString\('binary'\);\n*/g;
  content = content.replace(regexBuffer, '');

  const regexBuffer2 = /\(item\)\s*=>\s*\(\s*item\.image\s*=\s*Buffer\.from\(\s*item\.image\s*,\s*'base64'\s*\)\.toString\(\s*'binary'\s*\)\s*\)/g;
  content = content.replace(regexBuffer2, '(item) => item');

  // Handle specific creates/updates with uploadImage
  
  // commentService
  content = content.replace(
    /image:\s*data\.image,/g,
    `image: data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image,`
  );
  
  // blogService
  content = content.replace(
    /image:\s*data\.image,/g,
    `image: data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image,`
  );
  
  content = content.replace(
    /blog\.image = data\.image;/g,
    `blog.image = data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image;`
  );
  
  // bannerService
  content = content.replace(
    /image:\s*data\.image,/g,
    `image: data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image,`
  );

  content = content.replace(
    /banner\.image = data\.image;/g,
    `banner.image = data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image;`
  );
  
  // orderService
  content = content.replace(
    /order\.image = data\.image;/g,
    `order.image = data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image;`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`done ${service}`);
});
