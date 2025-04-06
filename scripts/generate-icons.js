const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const sourceIcon = path.join(__dirname, '..', 'src', 'assets', 'icon.jpeg');
const outputDirs = [
  path.join(__dirname, '..', 'dist', 'chrome', 'assets'),
  path.join(__dirname, '..', 'dist', 'firefox', 'assets')
];

async function generateIcons() {
  // Check if source icon exists
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon not found:', sourceIcon);
    process.exit(1);
  }

  // Create output directories
  outputDirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  // Generate icons for each size and directory
  await Promise.all(
    outputDirs.flatMap(dir =>
      sizes.map(size =>
        sharp(sourceIcon)
          .resize(size, size)
          .png()
          .toFile(path.join(dir, `icon${size}.png`))
          .then(() => console.log(`Generated ${size}x${size} icon in ${dir}`))
      )
    )
  );

  console.log('Icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
