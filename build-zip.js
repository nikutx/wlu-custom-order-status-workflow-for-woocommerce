import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginSlug = 'wlu-custom-order-status-workflow';

// 1. Get the current version for the zip filename
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;

const outputZipName = `${pluginSlug}-v${currentVersion}.zip`;
const outputZipPath = path.resolve(__dirname, outputZipName);

console.log('🚀 Starting local zip build process...');

try {
    // 2. Run the Vite build
    console.log('📦 Compiling React assets...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Vite build complete.');

    // 3. Create the Zip archive
    console.log(`🤐 Zipping files into ${outputZipName}...`);
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log('\n🎉 ZIP CREATED SUCCESSFULLY!');
        console.log(`📦 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📁 Saved to: ${outputZipPath}`);
        console.log('💡 You can now upload this directly to your live test site via Plugins > Add New.');
    });

    archive.on('error', (err) => { throw err; });
    archive.pipe(output);

    // 4. Add files to the archive, strictly excluding dev files
    archive.glob('**/*', {
        cwd: __dirname,
        ignore: [
            'node_modules/**',
            'src/**',
            '.git/**',
            '.idea/**',
            '.gitignore',
            'zip.js',
            'build-svn.js',
            'build-zip.js', // Ignore the build scripts
            'vite.config.js',
            'README.md',
            'includes/Admin/AssetsDev.php', // The critical dev file
            '*.zip' // Ignore any previously generated zips
        ]
    }, {
        // Wraps everything inside a main folder named after your plugin slug (WP standard)
        prefix: pluginSlug
    });

    archive.finalize();

} catch (error) {
    console.error('❌ Zip build failed:', error);
}