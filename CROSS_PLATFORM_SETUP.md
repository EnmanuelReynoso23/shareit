# ShareIt - Cross-Platform Setup

Esta aplicación ha sido convertida a TypeScript y configurada para funcionar en múltiples plataformas:

- **React Native**: iOS y Android (móvil)
- **React Native Web**: Navegadores web
- **Electron**: Aplicaciones de escritorio (Windows, macOS, Linux)

## 🚀 Configuración de Desarrollo

### Prerrequisitos

1. **Node.js** (v18 o superior)
2. **npm** o **yarn**
3. **Expo CLI** (`npm install -g @expo/cli`)
4. **Electron** (incluido en devDependencies)

### Instalación

```bash
# Instalar dependencias
npm install

# Construir Electron la primera vez
npm run build:electron
```

## 📱 Desarrollo Mobile (React Native)

### iOS y Android

```bash
# Iniciar el servidor de desarrollo
npm start
# o
npm run dev

# Para iOS específicamente
npm run ios

# Para Android específicamente
npm run android
```

### Requisitos adicionales para móvil:
- **iOS**: Xcode y iOS Simulator
- **Android**: Android Studio y Android Emulator

## 🌐 Desarrollo Web

```bash
# Iniciar en modo web
npm run web
```

La aplicación estará disponible en `http://localhost:19006`

## 🖥️ Desarrollo Desktop (Electron)

### Modo desarrollo

```bash
# Iniciar Electron en modo desarrollo
npm run electron:dev
```

Esto iniciará:
1. El servidor web de Expo en `http://localhost:19006`
2. La aplicación Electron que carga desde localhost

### Construcción para producción

```bash
# Construir la versión web
npm run build:web

# Construir Electron
npm run build:electron

# Empaquetar la aplicación de escritorio
npm run package:electron
```

## 📁 Estructura del Proyecto

```
├── src/                      # Código fuente principal
│   ├── components/          # Componentes React Native
│   ├── screens/            # Pantallas de la aplicación
│   ├── store/              # Redux store (TypeScript)
│   │   ├── slices/         # Redux slices
│   │   ├── hooks.ts        # Hooks tipados
│   │   └── index.ts        # Configuración del store
│   ├── types/              # Definiciones de tipos TypeScript
│   ├── utils/              # Utilidades
│   │   └── platform.ts     # Detección de plataforma
│   └── services/           # Servicios de API
├── electron/               # Código específico de Electron
│   ├── main.ts            # Proceso principal
│   ├── preload.ts         # Script de preload
│   └── tsconfig.json      # Config TypeScript para Electron
├── config/                 # Configuración (Firebase, etc.)
├── assets/                # Recursos estáticos
├── App.tsx                # Componente raíz (TypeScript)
├── tsconfig.json          # Configuración principal de TypeScript
└── package.json           # Dependencias y scripts
```

## 🔧 Scripts Disponibles

### Desarrollo
- `npm start` - Inicia Expo
- `npm run dev` - Alias para start
- `npm run web` - Modo web
- `npm run electron:dev` - Electron en desarrollo

### Construcción
- `npm run build:web` - Construir para web
- `npm run build:electron` - Compilar TypeScript de Electron
- `npm run package:electron` - Empaquetar aplicación de escritorio

### Desarrollo móvil
- `npm run android` - Android
- `npm run ios` - iOS

### Linting y tipos
- `npm run lint` - ESLint
- `npm run type-check` - Verificar tipos TypeScript

## 🎯 Características Específicas por Plataforma

### Detección de Plataforma

```typescript
import { getPlatformInfo, isElectron, isMobile } from './src/utils/platform';

const platformInfo = getPlatformInfo();
console.log(platformInfo.platform); // 'ios' | 'android' | 'web' | 'desktop'

if (isElectron()) {
  // Código específico para Electron
}

if (isMobile()) {
  // Código específico para móvil
}
```

### API de Electron

```typescript
// En el renderer process (componentes React)
if (window.electronAPI) {
  const version = await window.electronAPI.getAppVersion();
  console.log('Electron version:', version);
}
```

### Estilos Específicos por Plataforma

```typescript
import { platformSelect } from './src/utils/platform';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...platformSelect({
      web: {
        maxWidth: 800,
        alignSelf: 'center',
      },
      desktop: {
        padding: 20,
      },
      mobile: {
        padding: 10,
      },
      default: {
        backgroundColor: '#f0f0f0',
      },
    }),
  },
});
```

## 🔐 Seguridad (Electron)

- **Context Isolation**: Habilitado
- **Node Integration**: Deshabilitado
- **Preload Script**: Para comunicación segura IPC
- **CSP**: Content Security Policy aplicado

## 📦 Distribución

### Web
- Deploy en Netlify, Vercel, o servidor web estático
- Usar `npm run build:web`

### Mobile
- **iOS**: App Store Connect
- **Android**: Google Play Store
- Usar Expo Application Services (EAS)

### Desktop
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package
- **Linux**: AppImage
- Los archivos se generan en `dist/packages/`

## 🛠️ Troubleshooting

### Error de TypeScript
```bash
# Verificar tipos
npm run type-check

# Limpiar y reconstruir
rm -rf node_modules package-lock.json
npm install
npm run build:electron
```

### Electron no inicia
```bash
# Asegurar que está construido
npm run build:electron

# Verificar que el servidor web esté corriendo
npm run web
```

### Errores de Metro (React Native)
```bash
# Limpiar caché
npx expo start --clear
```

## 📖 Recursos Adicionales

- [Expo Documentation](https://docs.expo.dev/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.