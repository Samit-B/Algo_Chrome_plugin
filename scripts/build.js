const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const assetsDir = path.join(srcDir, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

async function generateIcons() {
  const sizes = [16, 48, 128];
  const svgPath = path.join(assetsDir, 'icon.jpeg');
  const iconDir = path.join(distAssetsDir, 'icons');

  // Ensure directories exist
  fs.ensureDirSync(iconDir);

  // Generate PNG icons for each size
  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(iconDir, `icon${size}.png`));
  }
}

async function build() {
  try {
    // Ensure dist directory exists
    fs.ensureDirSync(distDir);
    fs.ensureDirSync(distAssetsDir);

    // Generate icons
    await generateIcons();

    // Copy HTML files
    fs.copySync(
      path.join(srcDir, 'popup.html'), 
      path.join(distDir, 'popup.html')
    );
    console.log('Build complete! Files copied to dist/');
  } catch (error) {
    console.error('Build error:', error);
    process.exit(1);
  }
}

build();
