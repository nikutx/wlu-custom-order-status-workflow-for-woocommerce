import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// Setup paths (Assuming this script is in assets/admin-app/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginDir = path.resolve(__dirname, '../../'); // Goes up to the main plugin folder
const outputZip = path.resolve(pluginDir, 'wlu-custom-order-status-for-woocommerce.zip');

const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', { zlib: { level: 9 } }); // Max compression

output.on('close', () => {
    console.log(`✅ Plugin packaged successfully!`);
    console.log(`📦 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Saved to: ${outputZip}`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

// Define exactly what to include and ignore in the main plugin folder
archive.glob('**/*', {
    cwd: pluginDir,
    ignore: [
        'assets/admin-app/node_modules/**',
        'assets/admin-app/zip.js',
        '**/.git/**',
        '**/.gitignore',
        '**/.idea/**',
        '**/.DS_Store',
        '*.zip',
        'includes/Admin/AssetsDev.php'
    ]
});

archive.finalize();