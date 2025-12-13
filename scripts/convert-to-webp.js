// Script de conversion d'image en WebP
// Usage: node scripts/convert-to-webp.js chemin/vers/image.jpg

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertToWebP(inputPath) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Erreur: Le fichier "${inputPath}" n'existe pas`);
      return;
    }

    // Générer le nom du fichier de sortie
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);

    console.log(`🔄 Conversion en cours...`);
    console.log(`📁 Entrée: ${inputPath}`);
    console.log(`📁 Sortie: ${outputPath}`);

    // Convertir l'image
    const info = await sharp(inputPath)
      .resize(2560, 1440, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log(`✅ Conversion réussie !`);
    console.log(`📊 Dimensions: ${info.width}x${info.height}`);
    console.log(`💾 Taille: ${(info.size / 1024).toFixed(2)} KB`);
    console.log(`\n🎉 Image prête à être utilisée : ${outputPath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion:`, error.message);
  }
}

// Récupérer le chemin depuis les arguments
const inputPath = process.argv[2];

if (!inputPath) {
  console.log(`
📸 Script de conversion WebP pour ReveelBox

Usage:
  node scripts/convert-to-webp.js chemin/vers/votre-image.jpg

Exemples:
  node scripts/convert-to-webp.js public/images/hero.jpg
  node scripts/convert-to-webp.js C:/Users/thoma/Desktop/mon-image.png

Options:
  - Redimensionne automatiquement à 2560x1440px (optimal pour hero)
  - Qualité: 90% (excellent compromis)
  - Format: WebP
  `);
  process.exit(1);
}

convertToWebP(inputPath);
