# ShareIt - Backend (Firebase)

## 🔥 Servicios Backend con Firebase

### Arquitectura Backend

```text
Firebase Services/
├── Authentication/
│   ├── Email/Password
│   ├── Google OAuth
│   └── User Management
├── Firestore Database/
│   ├── users/
│   ├── widgets/
│   ├── photos/
│   ├── friends/
│   └── chats/
├── Cloud Storage/
│   ├── profile-pictures/
│   ├── shared-photos/
│   └── widget-assets/
├── Cloud Functions/
│   ├── userTriggers/
│   ├── photoProcessing/
│   └── notifications/
└── Realtime Database/
    └── chat-messages/
```

## 🛠 Tecnologías Backend

- **Firebase Authentication**: Autenticación de usuarios
- **Cloud Firestore**: Base de datos NoSQL
- **Cloud Storage**: Almacenamiento de archivos
- **Cloud Functions**: Funciones serverless
- **Firebase Realtime Database**: Chat en tiempo real
- **Cloud Messaging**: Notificaciones push
- **Firebase Analytics**: Análisis de uso

## 🔧 Configuración Firebase

### 1. Configuración Inicial

```javascript
// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 2. Variables de Entorno

```bash
# .env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 📊 Estructura de Base de Datos

### Colección: users

```javascript
// /users/{userId}
{
  uid: "user123",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://storage.googleapis.com/...",
  bio: "Hello, I'm John!",
  createdAt: timestamp,
  updatedAt: timestamp,
  preferences: {
    theme: "light",
    notifications: true,
    privacy: "friends"
  },
  stats: {
    widgetsCreated: 5,
    photosShared: 12,
    friendsCount: 8
  }
}
```

### Colección: widgets

```javascript
// /widgets/{widgetId}
{
  id: "widget123",
  userId: "user123",
  type: "clock", // clock, weather, photos, notes, calendar, battery
  config: {
    theme: "dark",
    size: "medium",
    showSeconds: true,
    timezone: "America/New_York"
  },
  sharedWith: ["user456", "user789"],
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
  shareSettings: {
    public: false,
    friendsOnly: true,
    specificUsers: ["user456"]
  }
}
```

### Colección: photos

```javascript
// /photos/{photoId}
{
  id: "photo123",
  userId: "user123",
  url: "https://storage.googleapis.com/...",
  thumbnail: "https://storage.googleapis.com/...",
  caption: "Beautiful sunset!",
  tags: ["sunset", "nature", "photography"],
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: "New York"
  },
  sharedWith: ["user456", "user789"],
  likes: ["user456", "user789"],
  comments: [
    {
      userId: "user456",
      text: "Amazing photo!",
      timestamp: timestamp
    }
  ],
  createdAt: timestamp,
  isPublic: false
}
```

### Colección: friends

```javascript
// /friends/{friendshipId}
{
  id: "friendship123",
  users: ["user123", "user456"],
  status: "accepted", // pending, accepted, blocked
  requestedBy: "user123",
  createdAt: timestamp,
  acceptedAt: timestamp,
  metadata: {
    sharedWidgets: 3,
    sharedPhotos: 8,
    lastInteraction: timestamp
  }
}
```

### Colección: chats

```javascript
// /chats/{chatId}
{
  id: "chat123",
  participants: ["user123", "user456"],
  lastMessage: {
    text: "Hello!",
    senderId: "user123",
    timestamp: timestamp,
    type: "text" // text, image, widget
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  settings: {
    notifications: true,
    archived: false
  }
}

// /chats/{chatId}/messages/{messageId}
{
  id: "message123",
  senderId: "user123",
  text: "Hello there!",
  type: "text", // text, image, widget, system
  timestamp: timestamp,
  readBy: ["user456"],
  attachments: [
    {
      type: "image",
      url: "https://storage.googleapis.com/...",
      name: "photo.jpg"
    }
  ]
}
```

## 🔐 Reglas de Seguridad

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Widgets can be read by owner and shared users
    match /widgets/{widgetId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        request.auth.uid in resource.data.sharedWith
      );
    }
    
    // Photos can be read by owner and shared users
    match /photos/{photoId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.userId ||
        request.auth.uid in resource.data.sharedWith ||
        resource.data.isPublic == true
      );
    }
    
    // Friends can be read by both users
    match /friends/{friendshipId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.users;
    }
    
    // Chats can be read by participants
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
        
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

### Storage Security Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures
    match /profile-pictures/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Shared photos
    match /shared-photos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Widget assets
    match /widget-assets/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ☁️ Cloud Functions

### Funciones Principales a Implementar

#### 1. Trigger de Usuario

```javascript
// functions/userTriggers.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Crear perfil cuando se registra un usuario
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Usuario',
      photoURL: user.photoURL || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true,
        privacy: 'friends'
      },
      stats: {
        widgetsCreated: 0,
        photosShared: 0,
        friendsCount: 0
      }
    });
    console.log('Perfil creado para:', user.uid);
  } catch (error) {
    console.error('Error creando perfil:', error);
  }
});

// Limpiar datos cuando se elimina un usuario
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  try {
    const batch = admin.firestore().batch();
    
    // Eliminar perfil
    batch.delete(admin.firestore().collection('users').doc(user.uid));
    
    // Eliminar widgets
    const widgets = await admin.firestore()
      .collection('widgets')
      .where('userId', '==', user.uid)
      .get();
    
    widgets.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log('Datos eliminados para:', user.uid);
  } catch (error) {
    console.error('Error eliminando datos:', error);
  }
});
```

#### 2. Procesamiento de Fotos

```javascript
// functions/photoProcessing.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sharp = require('sharp');

// Crear thumbnail cuando se sube una foto
exports.generateThumbnail = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = admin.storage().bucket();
  
  if (!filePath.startsWith('shared-photos/')) return;
  if (filePath.includes('thumb_')) return;
  
  try {
    const fileName = filePath.split('/').pop();
    const thumbFilePath = filePath.replace(fileName, `thumb_${fileName}`);
    
    const tempFilePath = `/tmp/${fileName}`;
    const tempThumbPath = `/tmp/thumb_${fileName}`;
    
    await bucket.file(filePath).download({ destination: tempFilePath });
    
    await sharp(tempFilePath)
      .resize(300, 300)
      .jpeg({ quality: 80 })
      .toFile(tempThumbPath);
    
    await bucket.upload(tempThumbPath, {
      destination: thumbFilePath,
      metadata: { cacheControl: 'public, max-age=31536000' }
    });
    
    console.log('Thumbnail creado:', thumbFilePath);
  } catch (error) {
    console.error('Error creando thumbnail:', error);
  }
});
```

#### 3. Notificaciones

```javascript
// functions/notifications.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Enviar notificación cuando se comparte un widget
exports.sendWidgetShareNotification = functions.firestore
  .document('widgets/{widgetId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    const newShares = after.sharedWith.filter(uid => !before.sharedWith.includes(uid));
    
    if (newShares.length === 0) return;
    
    try {
      const ownerDoc = await admin.firestore().collection('users').doc(after.userId).get();
      const ownerName = ownerDoc.data().displayName;
      
      const notifications = newShares.map(async (uid) => {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        const fcmToken = userDoc.data().fcmToken;
        
        if (fcmToken) {
          return admin.messaging().send({
            token: fcmToken,
            notification: {
              title: 'Widget Compartido',
              body: `${ownerName} compartió un widget contigo`
            },
            data: {
              type: 'widget_share',
              widgetId: context.params.widgetId,
              senderId: after.userId
            }
          });
        }
      });
      
      await Promise.all(notifications);
      console.log('Notificaciones enviadas para widget:', context.params.widgetId);
    } catch (error) {
      console.error('Error enviando notificaciones:', error);
    }
  });
```

## 🚀 Despliegue Backend

### 1. Instalación Firebase CLI

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Inicializar proyecto
firebase init

# Seleccionar servicios:
# - Firestore
# - Functions
# - Storage
# - Hosting (opcional)
```

### 2. Desplegar Functions

```bash
# Desplegar todas las funciones
firebase deploy --only functions

# Desplegar función específica
firebase deploy --only functions:createUserProfile
```

### 3. Configurar Firestore

```bash
# Desplegar reglas de Firestore
firebase deploy --only firestore:rules

# Desplegar índices
firebase deploy --only firestore:indexes
```

### 4. Configurar Storage

```bash
# Desplegar reglas de Storage
firebase deploy --only storage
```

## 📊 Monitoreo y Analytics

### Métricas Importantes

- **Usuarios activos**: DAU/MAU
- **Widgets creados**: Por tipo y usuario
- **Fotos compartidas**: Engagement
- **Uso de chat**: Mensajes enviados
- **Errores**: Crashes y errores de función

### Alertas

```javascript
// Configurar alertas en Firebase Console
- Picos de errores en Functions
- Uso excesivo de Storage
- Fallos de autenticación
- Latencia alta en Firestore
```

## 🔄 Funciones Pendientes

### Prioridad Alta

1. **Crear todas las Cloud Functions**
2. **Configurar reglas de seguridad**
3. **Implementar sistema de notificaciones**
4. **Procesar imágenes automáticamente**

### Prioridad Media

1. **Backup automático de datos**
2. **Análisis de uso avanzado**
3. **Moderación de contenido**
4. **Optimización de consultas**

### Prioridad Baja

1. **Integración con APIs externas**
2. **Machine Learning para recomendaciones**
3. **Exportación de datos**
4. **Múltiples regiones**

## 🐛 Debugging Backend

### Logs de Functions

```bash
# Ver logs en tiempo real
firebase functions:log

# Ver logs específicos
firebase functions:log --only createUserProfile
```

### Emulador Local

```bash
# Ejecutar emuladores
firebase emulators:start

# Solo Firestore
firebase emulators:start --only firestore

# Solo Functions
firebase emulators:start --only functions
```

## 💰 Costos Estimados

### Firebase Spark (Gratuito)

- Firestore: 50k lecturas/día
- Storage: 1GB
- Functions: 125k invocaciones/mes
- Auth: Usuarios ilimitados

### Firebase Blaze (Pago por uso)

- Firestore: $0.18/100k operaciones
- Storage: $0.026/GB/mes
- Functions: $0.40/millón invocaciones
- Bandwidth: $0.12/GB

### Estimación para 1000 usuarios activos/mes

- Firestore: ~$10-20
- Storage: ~$5-10
- Functions: ~$5-15
- **Total: ~$20-45/mes**
