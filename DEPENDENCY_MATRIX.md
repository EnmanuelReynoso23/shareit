# 📊 Matriz de Dependencias y Versiones Compatibles - ShareIt

## 🎯 Arquitectura Base

### Stack Principal
- **Framework**: Expo SDK 49.0.0 (React Native 0.72.3)
- **React**: 18.2.0
- **Node.js**: >= 16.x.x (Recomendado: 18.x.x)
- **npm**: >= 8.x.x
- **Expo CLI**: >= 6.x.x

## 📱 Frontend Mobile (React Native + Expo)

### Core Dependencies
```json
{
  "expo": "~49.0.0",
  "react": "18.2.0",
  "react-native": "0.72.3"
}
```

### Navigation Stack
```json
{
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/stack": "^6.3.29",
  "@react-navigation/bottom-tabs": "^6.5.20",
  "react-native-screens": "~3.22.0",
  "react-native-safe-area-context": "4.6.3",
  "react-native-gesture-handler": "~2.12.0"
}
```

### State Management
```json
{
  "@reduxjs/toolkit": "^1.9.5",
  "react-redux": "^8.1.2"
}
```

### UI Components
```json
{
  "react-native-paper": "^5.10.0",
  "react-native-vector-icons": "^10.0.0",
  "@expo/vector-icons": "^13.0.0",
  "react-native-linear-gradient": "^2.8.3",
  "react-native-svg": "13.9.0"
}
```

### Media & Camera
```json
{
  "expo-camera": "~13.4.2",
  "expo-image-picker": "~14.3.2",
  "expo-media-library": "~15.4.1",
  "expo-permissions": "~14.2.1"
}
```

### Storage & Network
```json
{
  "@react-native-async-storage/async-storage": "^1.19.0",
  "@react-native-community/netinfo": "^9.4.1"
}
```

### Location Services
```json
{
  "expo-location": "~16.1.0"
}
```

### Animations
```json
{
  "react-native-reanimated": "~3.3.0"
}
```

## 🔥 Backend (Firebase)

### Firebase SDK
```json
{
  "firebase": "^10.1.0"
}
```

### Firebase Functions
```json
{
  "firebase-functions": "^4.4.1",
  "firebase-admin": "^11.10.1"
}
```

## 🛠️ Development Tools

### Build & Testing
```json
{
  "@babel/core": "^7.20.0",
  "jest": "^29.6.2",
  "eslint": "^8.45.0",
  "eslint-config-expo": "^7.0.0",
  "metro-config": "^0.76.8"
}
```

### TypeScript Support
```json
{
  "@types/react": "~18.2.14",
  "@types/react-native": "~0.72.2",
  "typescript": "^5.1.3"
}
```

## ⚠️ Conflictos Conocidos y Soluciones

### 1. React Navigation Version Conflicts
**Problema**: Incompatibilidad entre versiones de @react-navigation
**Solución**:
```bash
npm install --legacy-peer-deps
```

### 2. Expo Media Library Plugin Error
**Problema**: Plugin no resuelto para expo-media-library
**Solución**:
```bash
npx expo install --fix
expo prebuild --clean
```

### 3. Metro Bundle Issues
**Problema**: Cache corrupto de Metro
**Solución**:
```bash
npx expo start --clear
```

## 🏗️ Comandos de Instalación Recomendados

### Instalación Inicial
```bash
# Limpiar instalación previa
rm -rf node_modules package-lock.json

# Instalar dependencias con resolución legacy
npm install --legacy-peer-deps

# Configurar Expo
npx expo install --fix
```

### Instalación de Nuevas Dependencias
```bash
# Para dependencias de Expo
npx expo install [package-name]

# Para dependencias estándar de npm
npm install [package-name] --legacy-peer-deps
```

## 📋 Scripts de Package.json Recomendados

```json
{
  "scripts": {
    "start": "expo start",
    "start:clear": "expo start --clear",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "prebuild": "expo prebuild",
    "prebuild:clean": "expo prebuild --clean",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "deps:check": "npm outdated",
    "deps:update": "npx expo install --fix"
  }
}
```

## 🔧 Configuración de Desarrollo

### .npmrc (Recomendado)
```
legacy-peer-deps=true
save-exact=false
```

### Expo Configuration
```json
{
  "expo": {
    "sdkVersion": "49.0.0",
    "platforms": ["ios", "android", "web"],
    "version": "1.0.0"
  }
}
```

## 🚀 Pasos para Resolver Problemas Actuales

1. **Limpiar Instalación**:
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. **Instalar con Legacy Peer Deps**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Verificar Configuración de Expo**:
   ```bash
   npx expo doctor
   ```

4. **Reinstalar Plugins de Expo**:
   ```bash
   npx expo install --fix
   ```

5. **Iniciar con Cache Limpio**:
   ```bash
   npx expo start --clear
   ```

## 📝 Notas Importantes

- **Siempre usar `--legacy-peer-deps`** para instalaciones de npm
- **Versiones de Expo** deben coincidir con el SDK especificado
- **React Navigation** v6 requiere configuración específica de dependencias
- **Firebase v10** es compatible con React Native 0.72.x
- **Metro config** debe estar sincronizado con Expo SDK 49

## 🔄 Matriz de Compatibilidad

| Expo SDK | React Native | React | Node.js | npm |
|----------|-------------|--------|---------|-----|
| 49.0.0   | 0.72.3     | 18.2.0 | >=16.x  | >=8.x |
| 50.0.0   | 0.73.x     | 18.2.0 | >=18.x  | >=9.x |
| 51.0.0   | 0.74.x     | 18.3.0 | >=18.x  | >=9.x |

---

**Última actualización**: Julio 2025  
**Mantenido por**: ShareIt Team
