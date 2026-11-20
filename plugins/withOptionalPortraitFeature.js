// Google Play: `orientation: "portrait"` faz o Expo gerar
// screenOrientation="portrait", e a loja passa a tratar
// android.hardware.screen.portrait como hardware OBRIGATÓRIO, o que bloqueia o
// envio para revisão e restringe a disponibilidade do app. A app continua em
// retrato; só declaramos a feature como opcional.
const { withAndroidManifest } = require("expo/config-plugins");

const FEATURE = "android.hardware.screen.portrait";

function addOptionalPortraitFeature(manifest) {
  const features = manifest["uses-feature"] || [];
  const existing = features.find((item) => item?.$?.["android:name"] === FEATURE);

  if (existing) {
    existing.$["android:required"] = "false";
  } else {
    features.push({ $: { "android:name": FEATURE, "android:required": "false" } });
  }

  manifest["uses-feature"] = features;
  return manifest;
}

module.exports = function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (modConfig) => {
    addOptionalPortraitFeature(modConfig.modResults.manifest);
    return modConfig;
  });
};

module.exports.addOptionalPortraitFeature = addOptionalPortraitFeature;
