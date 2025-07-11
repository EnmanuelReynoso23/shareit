# 🔧 Guía de Resolución - Problema de Dependencias ShareIt

## 🚨 Problema Actual

**Error**: `PluginError: Failed to resolve plugin for module "expo-media-library"`
**Causa**: Conflictos de versiones entre React Navigation y dependencias no instaladas correctamente

## 📋 Solución Paso a Paso

### 1. Limpiar Instalación Previa
```bash
rm -rf node_modules package-lock.json yarn.lock
```

### 2. Crear archivo .npmrc
```bash
echo "legacy-peer-deps=true" > .npmrc
```

### 3. Instalar Dependencias Core
```bash
npm install --legacy-peer-deps
```

### 4. Verificar Configuración Expo
```bash
npx expo doctor
```

### 5. Reinstalar Plugins Expo
```bash
npx expo install --fix
```

### 6. Limpiar Cache y Iniciar
```bash
npx expo start --clear
```

## 🔄 Comandos de Recuperación Rápida

Si el problema persiste, ejecutar en orden:

```bash
# Limpieza total
rm -rf node_modules package-lock.json .expo

# Instalación con versiones específicas
npm install expo@~49.0.0 --legacy-peer-deps
npm install react@18.2.0 react-native@0.72.3 --legacy-peer-deps
npm install @react-navigation/native@^6.1.18 --legacy-peer-deps
npm install @react-navigation/bottom-tabs@^6.5.20 --legacy-peer-deps
npm install @react-navigation/stack@^6.3.29 --legacy-peer-deps

# Dependencias de Expo
npx expo install expo-media-library expo-camera expo-image-picker expo-location

# Verificación final
npx expo start --clear
```

## ⚡ Solución Rápida (Una Línea)

```bash
rm -rf node_modules package-lock.json && echo "legacy-peer-deps=true" > .npmrc && npm install --legacy-peer-deps && npx expo install --fix && npx expo start --clear
```

## 🔍 Verificación de Estado

Después de la instalación, verificar:

```bash
# Verificar dependencias
npm ls expo-media-library
npm ls @react-navigation/native

# Verificar configuración Expo
npx expo doctor

# Probar inicio
npx expo start --clear
```

## 📝 Configuración .npmrc Recomendada

```
legacy-peer-deps=true
save-exact=false
fund=false
audit=false
```

## ✅ Problema Resuelto

**Estado**: SOLUCIONADO ✅  
**Fecha**: Julio 10, 2025  
**Solución aplicada**: 
1. Limpieza completa de node_modules y package-lock.json
2. Creación de archivo .npmrc con legacy-peer-deps=true
3. Instalación con npm install --legacy-peer-deps
4. Corrección de dependencias con npx expo install --fix
5. Instalación de dependencias web faltantes (react-native-web, react-dom)
6. Inicio exitoso con npx expo start --clear

**Resultado**: La aplicación ShareIt ahora inicia correctamente en:
- Metro Bundler: ✅ Running
- QR Code: ✅ Disponible para Expo Go
- Web: ✅ http://localhost:8081
- Todas las dependencias: ✅ Compatibles

---

**Nota**: Para futuros problemas de dependencias, seguir la guía de DEPENDENCY_MATRIX.md
