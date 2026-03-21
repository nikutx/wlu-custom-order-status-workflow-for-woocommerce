import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Bumping version numbers...');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
let [major, minor, patch] = pkg.version.split('.').map(Number);
patch += 1;
const newVersion = `${major}.${minor}.${patch}`;
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log(`🆙 Version bumped to ${newVersion}`);

// Update Assets.php
const assetsPath = path.join(__dirname, 'includes/Admin/Assets.php');
if (fs.existsSync(assetsPath)) {
    let assetsContent = fs.readFileSync(assetsPath, 'utf8');
    assetsContent = assetsContent.replace(/\$version\s*=\s*['"]\d+\.\d+\.\d+['"];/, `$version = '${newVersion}';`);
    fs.writeFileSync(assetsPath, assetsContent);
}

// Update main plugin file
const mainPluginPath = path.join(__dirname, 'wlu-custom-order-status-workflow.php');
if (fs.existsSync(mainPluginPath)) {
    let mainContent = fs.readFileSync(mainPluginPath, 'utf8');
    mainContent = mainContent.replace(/Version:\s*\d+\.\d+\.\d+/, `Version: ${newVersion}`);
    fs.writeFileSync(mainPluginPath, mainContent);
}

// Update readme.txt
const readmePath = path.join(__dirname, 'readme.txt');
if (fs.existsSync(readmePath)) {
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    readmeContent = readmeContent.replace(/Stable tag:\s*\d+\.\d+\.\d+/, `Stable tag: ${newVersion}`);
    readmeContent = readmeContent.replace(/== Changelog ==/, `== Changelog ==\n\n= ${newVersion} =\n* Automated release update.\n`);
    fs.writeFileSync(readmePath, readmeContent);
}

console.log('✅ All files updated! Ready to commit and push.');