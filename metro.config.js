const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignorar carpetas que causan conflictos
config.resolver.blockList = [
  /frontend\/.*/, // Ignorar toda la carpeta frontend
  /backend\/.*/, // Ignorar la carpeta backend si es necesario
];

// Configurar el watchFolders para incluir solo las carpetas necesarias
config.watchFolders = [
  __dirname,
];

module.exports = config;
