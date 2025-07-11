# ShareIt - Aplicación Colaborativa Mejorada

ShareIt es una aplicación móvil innovadora que permite a los usuarios compartir fotos, crear widgets colaborativos y mantenerse conectados con amigos en tiempo real. Esta versión incluye mejoras significativas en UI/UX, sistema de notificaciones y gestión de estado.

## 🚀 Características Principales

### ✨ Nuevas Mejoras UI/UX

- **Sistema de Pantallas de Carga**: Animaciones suaves con indicadores de progreso

- **Notificaciones Visuales**: Sistema de notificaciones interactivas con diferentes tipos (éxito, error, advertencia, info)
- **Transiciones Animadas**: Componentes con animaciones de entrada y transición

- **Tarjetas Mejoradas**: Sistema de tarjetas moderno con gradientes y animaciones
- **Navegación Mejorada**: Tabs animados con mejor feedback visual

### 📱 Funcionalidades Core

- **Galería Inteligente**: Vista en grilla y lista con filtros avanzados

- **Widgets Colaborativos**: Reloj mundial, notas compartidas, galería colaborativa, clima
- **Gestión de Amigos**: Sistema de solicitudes y estado en línea

- **Perfil Personalizable**: Edición completa de perfil con configuraciones avanzadas
- **Cámara Integrada**: Captura de fotos con metadata automática

### 🔧 Mejoras Técnicas

- **Gestión de Estado Global**: Context API personalizado con persistencia

- **Arquitectura Cliente**: Funciones del lado cliente para plan gratuito de Firebase
- **Sistema de Notificaciones**: Notificaciones push y visuales integradas

- **Manejo de Errores**: Pantallas de error mejoradas con opciones de recuperación
- **Estado de Red**: Monitoreo automático de conectividad

## 🏗️ Arquitectura del Proyecto

```

shareit/
├── src/
│   ├── components/
│   │   ├── AnimatedTransitions.js      # Componentes de animación
│   │   ├── EnhancedCard.js            # Sistema de tarjetas mejorado
│   │   ├── ErrorScreen.js             # Pantallas de error
│   │   ├── LoadingScreen.js           # Pantallas de carga
│   │   ├── NotificationSystem.js      # Sistema de notificaciones
│   │   └── widgets/
│   ├── navigation/
│   │   ├── AuthNavigator.js           # Navegación de autenticación
│   │   ├── EnhancedMainNavigator.js   # Navegación principal mejorada
│   │   └── MainNavigator.js
│   ├── screens/
│   │   ├── auth/                      # Pantallas de autenticación
│   │   ├── main/
│   │   │   ├── EnhancedGalleryScreen.js    # Galería mejorada
│   │   │   ├── EnhancedHomeScreen.js       # Inicio mejorado
│   │   │   ├── EnhancedProfileScreen.js    # Perfil mejorado
│   │   │   └── EnhancedWidgetSettingsScreen.js
│   │   └── LoadingScreen.js
│   ├── store/
│   │   ├── AppContext.js              # Gestión de estado global
│   │   ├── index.js
│   │   └── slices/
│   └── utils/
│       └── clientFunctions.js         # Funciones del cliente
├── config/
│   └── firebase.js                    # Configuración Firebase
├── public/
│   └── index.html                     # Dashboard web mejorado
├── App.js                             # Aplicación principal mejorada
├── package.json
└── app.json

```

## 🔥 Configuración Firebase (Plan Gratuito)

### Servicios Utilizados

- **Firestore Database**: Almacenamiento de datos (50K lecturas/día)

- **Authentication**: Autenticación de usuarios (ilimitado)
- **Storage**: Almacenamiento de archivos (5GB total)

- **Hosting**: Hosting web (10GB de ancho de banda)

### Configuración Actual

```javascript
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}

```

## 📱 Componentes Mejorados

### LoadingScreen

```javascript
<LoadingScreen 
  message="Cargando fotos..."
  showProgress={true}
  progress={75}
  gradient={['#667eea', '#764ba2']}
/>

```

### Sistema de Notificaciones

```javascript
const { showSuccess, showError, showWarning } = useNotifications();

showSuccess('Éxito', 'Foto subida correctamente');
showError('Error', 'No se pudo conectar al servidor');
showWarning('Advertencia', 'Conexión inestable');

```

### Tarjetas Mejoradas

```javascript
<EnhancedCard
  title="Galería Personal"
  subtitle="120 fotos • Última actualización: Hoy"
  icon="📸"
  cardType="feature"
  gradient={['#ff6b6b', '#ee5a52']}
  onPress={() => navigate('Gallery')}
/>

```

## 🎨 Sistema de Diseño

### Colores Principales

```javascript
const colors = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196F3',
  background: '#f8fafe',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
};

```

### Gradientes

- **Principal**: `['#667eea', '#764ba2']`

- **Éxito**: `['#4CAF50', '#45a049']`
- **Error**: `['#f44336', '#da190b']`

- **Advertencia**: `['#ff9800', '#f57c00']`

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 16+

- Expo CLI
- Cuenta de Firebase (plan gratuito)

- React Native development environment

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/shareit.git
   cd shareit
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   ```bash
   # Instalar Firebase CLI
   npm install -g firebase-tools
   
   # Iniciar sesión
   firebase login
   
   # Desplegar reglas y configuración
   firebase deploy
   ```

4. **Configurar variables de entorno**
   ```bash
   # Crear config/firebase.js con tus credenciales
   ```

5. **Ejecutar la aplicación**
   ```bash
   # Desarrollo
   npm start
   
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## 📋 Scripts Disponibles

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios", 
  "web": "expo start --web",
  "build:android": "expo build:android",
  "build:ios": "expo build:ios",
  "test": "jest",
  "lint": "eslint src/"
}

```

## 🔧 Configuración de Desarrollo

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: ['expo', '@react-native-community'],
  rules: {
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'warn',
  },
};

```

### Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;

```

## 🎯 Próximas Mejoras

### Funcionalidades Planificadas

- [ ] Chat en tiempo real con Socket.io

- [ ] Widgets personalizados por el usuario
- [ ] Integración con redes sociales

- [ ] Modo offline con sincronización
- [ ] Temas personalizables

- [ ] Geolocalización en widgets
- [ ] Notificaciones push nativas

- [ ] Compartir fuera de la app

### Mejoras de Performance

- [ ] Lazy loading de imágenes

- [ ] Caché inteligente
- [ ] Compresión de imágenes

- [ ] Optimización de bundle
- [ ] Code splitting

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de autenticación Firebase**
   ```bash
   # Verificar configuración en config/firebase.js
   # Asegurar que el proyecto Firebase esté activo
   ```

2. **Problemas de permisos en Android**
   ```bash
   # Verificar permisos en app.json
   # Reinstalar la aplicación
   ```

3. **Errores de dependencias**
   ```bash
   # Limpiar caché
   npm start -- --clear
   
   # Reinstalar node_modules
   rm -rf node_modules && npm install
   ```

## 📊 Métricas y Analytics

### Firebase Analytics (Opcional)

- Seguimiento de eventos de usuario

- Métricas de rendimiento
- Crashlytics para errores

### Métricas Clave

- Tiempo de carga de la aplicación

- Tasa de retención de usuarios
- Errores de red y recuperación

- Uso de funcionalidades

## 🔐 Seguridad

### Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios solo pueden acceder a sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Fotos compartidas según permisos
    match /photos/{photoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}

```

### Reglas de Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

```

## 📚 Documentación Adicional

- [Guía de Desarrollo](./docs/DEVELOPMENT.md)

- [API Reference](./docs/API.md)
- [Guía de Despliegue](./docs/DEPLOYMENT.md)

- [Contribuir al Proyecto](./docs/CONTRIBUTING.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 👥 Equipo

- **Desarrollo Frontend**: React Native + Expo

- **Backend**: Firebase (Firestore, Auth, Storage, Hosting)
- **UI/UX**: Sistema de diseño personalizado

- **Estado Global**: Context API + Persistencia

## 🌟 Agradecimientos

- Firebase por el backend gratuito y robusto

- Expo por el framework de desarrollo
- React Native community por las librerías

- Usuarios beta por el feedback

---

**ShareIt v1.0.0** - Conectando personas a través de fotos y widgets colaborativos 📸✨
