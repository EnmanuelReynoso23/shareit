# ShareIt Backend

## Configuración y Despliegue

### 1. Configuración Inicial

```bash

# Instalar Firebase CLI

npm install -g firebase-tools

# Autenticarse con Firebase

firebase login

# Inicializar proyecto (si no está inicializado)

firebase init

```

### 2. Configurar Variables de Entorno

```bash

# Configurar variables de entorno para functions

firebase functions:config:set app.name="ShareIt"
firebase functions:config:set app.version="1.0.0"

# Configurar claves de APIs externas

firebase functions:config:set weather.api_key="your-weather-api-key"
firebase functions:config:set notifications.vapid_key="your-vapid-key"

```

### 3. Instalar Dependencias

```bash

# Instalar dependencias de Cloud Functions

cd functions
npm install

```

### 4. Ejecutar Emuladores Locales

```bash

# Ejecutar todos los emuladores

firebase emulators:start

# Solo emulador de Functions

firebase emulators:start --only functions

# Solo emulador de Firestore

firebase emulators:start --only firestore

```

### 5. Desplegar a Producción

```bash

# Desplegar todo

firebase deploy

# Desplegar solo Functions

firebase deploy --only functions

# Desplegar solo reglas de Firestore

firebase deploy --only firestore:rules

# Desplegar solo reglas de Storage

firebase deploy --only storage

```

### 6. Monitoreo y Logs

```bash

# Ver logs de Functions

firebase functions:log

# Ver logs de una función específica

firebase functions:log --only createUserProfile

# Ver logs en tiempo real

firebase functions:log --tail

```

## Estructura del Proyecto

```

backend/
├── functions/
│   ├── src/
│   │   ├── userTriggers.js
│   │   ├── photoProcessing.js
│   │   ├── notifications.js
│   │   ├── friendsManager.js
│   │   └── widgetsManager.js
│   ├── index.js
│   └── package.json
├── firestore/
│   ├── firestore.rules
│   └── firestore.indexes.json
├── storage/
│   └── storage.rules
├── config/
│   └── firebase.js
├── firebase.json
└── README.md

```

## Funciones Implementadas

### User Management

- ✅ createUserProfile

- ✅ deleteUserData
- ✅ updateUserStatus

### Photo Processing

- ✅ generateThumbnail

- ✅ processPhotoUpload
- ✅ cleanupPhotoFiles

### Notifications

- ✅ sendWidgetShareNotification

- ✅ sendFriendRequestNotification
- ✅ sendChatNotification

- ✅ sendFriendAcceptedNotification

### Friends Management

- ✅ sendFriendRequest

- ✅ acceptFriendRequest
- ✅ rejectFriendRequest

- ✅ searchUsers
- ✅ removeFriend

### Widgets Management

- ✅ shareWidget

- ✅ updateWidgetSharing
- ✅ unshareWidget

- ✅ cleanupInactiveWidgets
- ✅ getSharedWidgets

- ✅ duplicateSharedWidget

## Reglas de Seguridad

### Firestore Rules

- ✅ Control de acceso por usuario

- ✅ Validación de datos
- ✅ Restricciones de sharing

- ✅ Protección de datos sensibles

### Storage Rules

- ✅ Control de acceso por archivo

- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño

- ✅ Protección de directorios

## Índices de Base de Datos

### Optimizaciones implementadas

- ✅ Búsqueda de usuarios

- ✅ Consultas de widgets
- ✅ Consultas de fotos

- ✅ Consultas de amistades
- ✅ Consultas de chats

- ✅ Consultas de notificaciones

## Configuración del Frontend

Actualizar el archivo de configuración en el frontend:

```javascript
// frontend/src/config/firebase.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

```

## Próximos Pasos

1. **Configurar proyecto Firebase**
2. **Actualizar configuración en el frontend**
3. **Desplegar Functions**
4. **Configurar reglas de seguridad**
5. **Probar funcionalidad completa**
