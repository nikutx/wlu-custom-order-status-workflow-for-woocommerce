import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginDir = __dirname; // FIXED: Now runs from the root directory

const pluginSlug = 'wlu-custom-order-status-workflow';
const outputZip = path.resolve(pluginDir, `${pluginSlug}.zip`);

const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`✅ Plugin packaged successfully!`);
    console.log(`📦 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Saved to: ${outputZip}`);
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

archive.glob('**/*', {
    cwd: pluginDir,
    ignore: [
        'node_modules/**',             // FIXED: Root level node_modules
        'zip.js',                      // FIXED: Root level zip script
        '**/.git/**',
        '**/.gitignore',
        '**/.idea/**',
        '**/.idea',
        '**/.DS_Store',
        '*.zip',
        'includes/Admin/AssetsDev.php' // Keeping your dev asset exclusion
    ]
}, {
    // Wraps all files inside a root folder matching your slug
    prefix: pluginSlug
});

archive.finalize();