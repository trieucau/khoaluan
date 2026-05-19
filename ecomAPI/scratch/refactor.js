import fs from 'fs';

const refactorService = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not present
  if (!content.includes('cloudinary.js')) {
    content = content.replace("import 'dotenv/config';", "import 'dotenv/config';\nimport { uploadImage } from '../utils/cloudinary.js';");
  }

  // Remove buffer conversions
  // Pattern 1: res.rows[i].productDetail[j].productImage[k].image = Buffer.from(..., 'base64').toString('binary');
  // Or similar.
  const regexBuffer = /([\w\.\[\]]+)\.image\s*=\s*Buffer\.from\(\s*([\w\.\[\]]+)\.image\s*,\s*'base64'\s*\)\.toString\('binary'\);/g;
  content = content.replace(regexBuffer, '');

  const regexBuffer2 = /\(item\)\s*=>\s*\(item\.image\s*=\s*Buffer\.from\(item\.image,\s*'base64'\)\.toString\('binary'\)\)/g;
  content = content.replace(regexBuffer2, '(item) => item');

  // We should also look for specific creates to inject uploadImage
  
  fs.writeFileSync(filePath, content, 'utf8');
};

const processProductService = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('cloudinary.js')) {
    content = content.replace("import 'dotenv/config';", "import 'dotenv/config';\nimport { uploadImage } from '../utils/cloudinary.js';");
  }

  // Remove all buffer conversions
  const regexBuffer = /[ \t]*[^\n]*Buffer\.from\([^\n]*\n*[ \t]*[^\n]*'base64'\n*[ \t]*\)\.toString\('binary'\);\n*/g;
  content = content.replace(regexBuffer, '');
  const regexBuffer2 = /\(item\)\s*=>\s*\(item\.image\s*=\s*Buffer\.from\(item\.image,\s*'base64'\)\.toString\('binary'\)\)/g;
  content = content.replace(regexBuffer2, '(item) => item');


  // Replace createNewProduct image create
  content = content.replace(
    /await db\.ProductImage\.create\(\{\s*productdetailId: productdetail\.id,\s*image: data\.image,\s*\}\);/g,
    `await db.ProductImage.create({
              productdetailId: productdetail.id,
              image: data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image,
            });`
  );

  content = content.replace(
    /await db\.ProductImage\.create\(\{\s*productdetailId: data\.id,\s*caption: data\.caption,\s*image: data\.image,\s*\}\);/g,
    `await db.ProductImage.create({
          productdetailId: data.id,
          caption: data.caption,
          image: data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image,
        });`
  );

  content = content.replace(
    /productImage\.image = data\.image;/g,
    `productImage.image = data.image && data.image.startsWith('data:image/') ? await uploadImage(data.image) : data.image;`
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

processProductService('./src/services/productService.js');
console.log('done productService');
