const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-voice',
  'voice',
  'android',
  'build.gradle'
);

const patchedGradle = `apply plugin: 'com.android.library'

def resolvedCompileSdk = rootProject.ext.has('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 36
def resolvedMinSdk = rootProject.ext.has('minSdkVersion') ? rootProject.ext.minSdkVersion : 24
def resolvedTargetSdk = rootProject.ext.has('targetSdkVersion') ? rootProject.ext.targetSdkVersion : resolvedCompileSdk

android {
    namespace "com.wenkesj.voice"
    compileSdk resolvedCompileSdk

    defaultConfig {
        minSdk resolvedMinSdk
        targetSdk resolvedTargetSdk
        consumerProguardFiles 'proguard-rules.pro'
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    testImplementation 'junit:junit:4.13.2'
    implementation 'androidx.appcompat:appcompat:1.7.1'
    implementation 'com.facebook.react:react-android'
}
`;

if (!fs.existsSync(targetPath)) {
  console.warn('[fix-react-native-voice-gradle] Skipped: dependency file not found.');
  process.exit(0);
}

const current = fs.readFileSync(targetPath, 'utf8');
if (current === patchedGradle) {
  console.log('[fix-react-native-voice-gradle] Already patched.');
  process.exit(0);
}

fs.writeFileSync(targetPath, patchedGradle, 'utf8');
console.log('[fix-react-native-voice-gradle] Patched react-native-voice Android Gradle config.');
