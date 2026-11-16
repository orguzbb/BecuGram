import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================================');
console.log('  BecuGram - Android Studio & APK Tayyorlash');
console.log('========================================================\n');

const rootDir = path.resolve(__dirname, '..');
const clientDir = __dirname;
const rootNodeModules = path.join(rootDir, 'node_modules');
const clientNodeModules = path.join(clientDir, 'node_modules');

// 1. Ensure client/node_modules/@capacitor is linked or copied
try {
  console.log('[1/4] Monorepo bog\'liqliklari tekshirilmoqda...');
  if (!fs.existsSync(clientNodeModules)) {
    fs.mkdirSync(clientNodeModules, { recursive: true });
  }

  const clientCapacitorDir = path.join(clientNodeModules, '@capacitor');
  const rootCapacitorDir = path.join(rootNodeModules, '@capacitor');

  if (!fs.existsSync(clientCapacitorDir) && fs.existsSync(rootCapacitorDir)) {
    console.log('  Capacitor bog\'lanmoqda: ' + rootCapacitorDir);
    try {
      fs.symlinkSync(rootCapacitorDir, clientCapacitorDir, 'junction');
    } catch {
      // Fallback to recursive copy if junction fails
      fs.cpSync(rootCapacitorDir, clientCapacitorDir, { recursive: true });
    }
  }
  console.log('  [OK] Capacitor bog\'liqliklari tayyor.');
} catch (err) {
  console.warn('  [Ogohlantirish] Bog\'liqliklarni ulashda:', err.message);
}

// 2. Build Web app (Vite dist)
try {
  console.log('\n[2/4] Vite Web loyihasi yig\'ilmoqda (npm run build)...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  console.log('  [OK] dist papkasi muvaffaqiyatli yaratildi.');
} catch (err) {
  console.error('\n[XATOLIK] Web build (npm run build) bajarilmadi!');
  process.exit(1);
}

// 3. Add or Sync Android platform
const androidDir = path.join(clientDir, 'android');
try {
  console.log('\n[3/4] Android Studio loyihasi sinxronizatsiya qilinmoqda...');
  if (!fs.existsSync(androidDir)) {
    console.log('  Native Android loyihasi qo\'shilmoqda (npx cap add android)...');
    execSync('npx cap add android', { cwd: clientDir, stdio: 'inherit' });
  } else {
    console.log('  Native Android loyihasi yangilanmoqda (npx cap sync android)...');
    execSync('npx cap sync android', { cwd: clientDir, stdio: 'inherit' });
  }
} catch (err) {
  console.error('\n[XATOLIK] Capacitor add/sync jarayonida xatolik:');
  console.error(err.message);
  process.exit(1);
}

// 4. Configure local.properties with Android SDK path
try {
  console.log('\n[4/4] Android SDK sozlamalari (local.properties) tekshirilmoqda...');
  const userProfile = process.env.USERPROFILE || 'C:\\Users\\user';
  const defaultSdkDir = path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk');
  const localPropertiesPath = path.join(androidDir, 'local.properties');

  const sdkPathForProperties = defaultSdkDir.replace(/\\/g, '/');
  fs.writeFileSync(localPropertiesPath, `sdk.dir=${sdkPathForProperties}\n`, 'utf-8');
  console.log('  [OK] local.properties yaratildi: sdk.dir=' + sdkPathForProperties);

  // Enable cleartext traffic in AndroidManifest.xml for local HTTP calls
  const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    if (!manifestContent.includes('android:usesCleartextTraffic="true"')) {
      manifestContent = manifestContent.replace(
        '<application',
        '<application\n        android:usesCleartextTraffic="true"'
      );
      fs.writeFileSync(manifestPath, manifestContent, 'utf-8');
      console.log('  [OK] AndroidManifest.xml: HTTP ulanish ruxsat etildi.');
    }
  }
} catch (err) {
  console.warn('  [Ogohlantirish] local.properties yozishda:', err.message);
}

console.log('\n========================================================');
console.log('  MUVAFFAQITYATLI TAYYORLANDI!');
console.log('  Android Studio loyiha manzili: ' + androidDir);
console.log('========================================================\n');

