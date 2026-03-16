import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginDir = path.resolve(__dirname, '../../');

// 1. FIXED: Pointing to the new, approved slug!
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
        'assets/admin-app/node_modules/**',
        'assets/admin-app/zip.js',
        '**/.git/**',
        '**/.gitignore',
        '**/.idea/**',
        '**/.DS_Store',
        '*.zip',
        'includes/Admin/AssetsDev.php'
    ]
}, {
    // 2. FIXED: Wraps all files inside a root folder matching your slug
    prefix: pluginSlug
});

archive.finalize();