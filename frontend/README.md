# ShareIt - Frontend (React Native)

## 📱 Aplicación Móvil React Native

### Estructura del Frontend

```
src/
├── components/
│   └── widgets/
│       ├── ClockWidget.js
│       ├── WeatherWidget.js
│       ├── PhotosWidget.js
│       └── NotesWidget.js
├── navigation/
│   ├── AuthNavigator.js
│   └── MainNavigator.js
├── screens/
│   ├── LoadingScreen.js
│   ├── auth/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   └── WelcomeScreen.js
│   └── main/
│       ├── HomeScreen.js
│       ├── CameraScreen.js
│       ├── GalleryScreen.js
│       ├── FriendsScreen.js
│       ├── ProfileScreen.js
│       ├── ChatScreen.js
│       ├── PhotoDetailScreen.js
│       └── WidgetSettingsScreen.js
└── store/
    ├── index.js
    └── slices/
        ├── authSlice.js
        ├── userSlice.js
        ├── photosSlice.js
        ├── widgetsSlice.js
        └── friendsSlice.js
```

## 🛠 Tecnologías Frontend

- **React Native**: Framework principal
- **Expo**: Plataforma de desarrollo
- **Redux Toolkit**: Manejo del estado
- **React Navigation**: Navegación entre pantallas
- **Firebase SDK**: Conexión con backend
- **Expo Vector Icons**: Iconografía
- **React Native Paper**: Componentes UI

## 🚀 Instalación Frontend

```bash
# Instalar dependencias
npm install

# Ejecutar en iOS
npm run ios

# Ejecutar en Android
npm run android

# Ejecutar en web
npm run web
```

## 📋 Dependencias Principales

```json
{
  "dependencies": {
    "@react-navigation/bottom-tabs": "^7.4.2",
    "@react-navigation/native": "^7.1.14",
    "@react-navigation/stack": "^7.4.2",
    "@reduxjs/toolkit": "^2.8.2",
    "expo": "~53.0.17",
    "expo-camera": "^16.1.10",
    "expo-image-picker": "^16.1.4",
    "expo-location": "^18.1.6",
    "firebase": "^11.10.0",
    "react": "19.0.0",
    "react-native": "0.79.5",
    "react-native-paper": "^5.14.5",
    "react-redux": "^9.2.0"
  }
}
```

## 🎨 Pantallas Implementadas

### ✅ Pantallas Completas
- **HomeScreen**: Pantalla principal con widgets
- **ClockWidget**: Widget de reloj funcional
- **WeatherWidget**: Widget de clima (datos mock)
- **LoadingScreen**: Pantalla de carga
- **AuthNavigator**: Navegación de autenticación
- **MainNavigator**: Navegación principal

### 🚧 Pantallas Pendientes
- **LoginScreen**: Pantalla de inicio de sesión
- **RegisterScreen**: Pantalla de registro
- **WelcomeScreen**: Pantalla de bienvenida
- **CameraScreen**: Funcionalidad de cámara
- **GalleryScreen**: Galería de fotos
- **FriendsScreen**: Gestión de amigos
- **ProfileScreen**: Perfil de usuario
- **ChatScreen**: Chat en tiempo real
- **PhotoDetailScreen**: Detalles de foto
- **WidgetSettingsScreen**: Configuración de widgets

## 🔧 Funcionalidades a Implementar

### Widgets
- [ ] **CalendarWidget**: Widget de calendario
- [ ] **BatteryWidget**: Widget de batería
- [ ] **NotesWidget**: Widget de notas (completar)
- [ ] **PhotosWidget**: Widget de fotos (completar)

### Cámara y Fotos
- [ ] **Tomar fotos**: Integrar expo-camera
- [ ] **Seleccionar de galería**: Usar expo-image-picker
- [ ] **Subir a Firebase Storage**: Almacenamiento de imágenes
- [ ] **Compartir fotos**: Sistema de compartir

### Sistema de Amigos
- [ ] **Buscar usuarios**: Buscar por email/nombre
- [ ] **Enviar solicitudes**: Sistema de solicitudes de amistad
- [ ] **Gestionar amigos**: Aceptar/rechazar solicitudes
- [ ] **Lista de amigos**: Mostrar amigos activos

### Chat
- [ ] **Chat en tiempo real**: Firebase Realtime Database
- [ ] **Mensajes multimedia**: Envío de fotos
- [ ] **Notificaciones**: Push notifications
- [ ] **Estado de mensaje**: Entregado/leído

### Perfil
- [ ] **Editar perfil**: Nombre, foto, bio
- [ ] **Configuraciones**: Privacidad, notificaciones
- [ ] **Tema**: Modo oscuro/claro

## 🔐 Autenticación

El sistema de autenticación se conecta con Firebase Auth:

```javascript
// Ejemplo de uso en componente
const { user, isAuthenticated } = useSelector((state) => state.auth);

// Login
dispatch(loginUser({ email, password }));

// Registro
dispatch(registerUser({ email, password }));

// Logout
dispatch(logoutUser());
```

## 🎯 Estado Global (Redux)

### Slices Implementados
- **authSlice**: Autenticación de usuario
- **userSlice**: Perfil de usuario
- **widgetsSlice**: Gestión de widgets
- **photosSlice**: Gestión de fotos
- **friendsSlice**: Gestión de amigos

### Ejemplo de uso
```javascript
// Obtener widgets del usuario
dispatch(fetchUserWidgets({ userId: user.uid }));

// Crear nuevo widget
dispatch(createWidget({ 
  userId: user.uid, 
  type: 'clock', 
  config: {} 
}));
```

## 📱 Navegación

### Estructura de Navegación
```
App
├── AuthNavigator (No autenticado)
│   ├── WelcomeScreen
│   ├── LoginScreen
│   └── RegisterScreen
└── MainNavigator (Autenticado)
    ├── HomeStack
    ├── GalleryStack
    ├── FriendsStack
    └── ProfileStack
```

## 🎨 Diseño UI

### Paleta de Colores
- **Primary**: #007AFF (Azul)
- **Background**: #F8F9FA (Gris claro)
- **White**: #FFFFFF
- **Text**: #1a1a1a (Negro)
- **Secondary**: #666666 (Gris)
- **Border**: #E1E1E1 (Gris claro)

### Componentes Reutilizables
- **Widget Container**: Contenedor base para widgets
- **Action Cards**: Tarjetas de acciones rápidas
- **Empty States**: Estados vacíos consistentes
- **Loading States**: Indicadores de carga

## 🐛 Debugging

### Herramientas de Desarrollo
```bash
# Abrir React Native Debugger
npx react-native log-android

# Abrir Expo DevTools
npx expo start --dev-client
```

### Logs Comunes
```javascript
// Debug en Redux
console.log('Estado actual:', store.getState());

// Debug en componentes
console.log('Props recibidas:', props);
```

## 🚀 Siguiente Fase de Desarrollo

### Prioridad Alta
1. **Implementar autenticación completa**
2. **Funcionalidad de cámara**
3. **Sistema de amigos básico**
4. **Chat en tiempo real**

### Prioridad Media
1. **Widgets adicionales**
2. **Perfil completo**
3. **Configuraciones**
4. **Tema oscuro**

### Prioridad Baja
1. **Notificaciones push**
2. **Compartir en redes sociales**
3. **Modo offline**
4. **Analíticas**
