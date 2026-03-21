import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- EXACT PATH TO YOUR LIVE SVN TRUNK ---
const svnTrunkDir = 'C:/WordPressORGLive/wlu-custom-order-status-workflow/trunk';

// --- THE STRICT ALLOWLIST (No assets, just the core plugin) ---
const allowedItems = [
    'dist',
    'includes',
    'vendor',
    'wlu-custom-order-status-workflow.php',
    'readme.txt'
];

console.log('🚀 Starting production build process...');

try {
    // --- 1. AUTO-VERSIONING SYSTEM ---
    console.log('🔄 Bumping version numbers...');

    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let [major, minor, patch] = pkg.version.split('.').map(Number);
    patch += 1;
    const newVersion = `${major}.${minor}.${patch}`;
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    console.log(`🆙 Version bumped to ${newVersion}`);

    const assetsPath = path.join(__dirname, 'includes/Admin/Assets.php');
    if (fs.existsSync(assetsPath)) {
        let assetsContent = fs.readFileSync(assetsPath, 'utf8');
        assetsContent = assetsContent.replace(/\$version\s*=\s*['"]\d+\.\d+\.\d+['"];/, `$version = '${newVersion}';`);
        fs.writeFileSync(assetsPath, assetsContent);
    }

    const mainPluginPath = path.join(__dirname, 'wlu-custom-order-status-workflow.php');
    if (fs.existsSync(mainPluginPath)) {
        let mainContent = fs.readFileSync(mainPluginPath, 'utf8');
        mainContent = mainContent.replace(/Version:\s*\d+\.\d+\.\d+/, `Version: ${newVersion}`);
        fs.writeFileSync(mainPluginPath, mainContent);
    }

    const readmePath = path.join(__dirname, 'readme.txt');
    if (fs.existsSync(readmePath)) {
        let readmeContent = fs.readFileSync(readmePath, 'utf8');
        readmeContent = readmeContent.replace(/Stable tag:\s*\d+\.\d+\.\d+/, `Stable tag: ${newVersion}`);

        const newChangelogEntry = `== Changelog ==\n\n= ${newVersion} =\n* Small Changes / Bug Fixes\n`;
        readmeContent = readmeContent.replace(/== Changelog ==/, newChangelogEntry);
        fs.writeFileSync(readmePath, readmeContent);
    }

    // --- 2. RUN VITE BUILD ---
    console.log('📦 Compiling React assets...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Vite build complete.');

    // --- 3. CLEAR OLD SVN TRUNK ---
    if (fs.existsSync(svnTrunkDir)) {
        fs.readdirSync(svnTrunkDir).forEach(file => {
            if (file !== '.svn') {
                const curPath = path.join(svnTrunkDir, file);
                fs.rmSync(curPath, { recursive: true, force: true });
            }
        });
        console.log('🗑️ Cleared old SVN trunk.');
    } else {
        fs.mkdirSync(svnTrunkDir, { recursive: true });
    }

    // --- 4. COPY ONLY ALLOWED FILES ---
    const copyRecursiveSync = (src, dest) => {
        if (!fs.existsSync(src)) return;

        // The single strict exclusion for our Dev File
        if (src.replace(/\\/g, '/').endsWith('includes/Admin/AssetsDev.php')) {
            return;
        }

        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach((child) => {
                copyRecursiveSync(path.join(src, child), path.join(dest, child));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    };

    console.log(`📂 Copying allowed files to: ${svnTrunkDir}`);
    allowedItems.forEach(item => {
        const srcPath = path.join(__dirname, item);
        const destPath = path.join(svnTrunkDir, item);
        if (fs.existsSync(srcPath)) {
            copyRecursiveSync(srcPath, destPath);
        }
    });

    console.log('\n🎉 ALL DONE! Your clean SVN trunk is updated, version bumped, and ready to be committed.');

} catch (error) {
    console.error('❌ Build script failed:', error);
}