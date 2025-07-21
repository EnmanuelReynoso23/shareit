# ShareIt - Widget & Photo Sharing App

**ShareIt** es una aplicación móvil desarrollada en React Native que permite a los usuarios crear widgets personalizados y compartir fotos con amigos en tiempo real.

## 🏗️ Arquitectura del Proyecto

```text
shareit/
├── frontend/          # Aplicación React Native
│   ├── src/
│   ├── assets/
│   ├── App.js
│   ├── package.json
│   └── README.md
├── backend/           # Servicios Firebase
│   ├── functions/     # Cloud Functions
│   ├── firestore/     # Reglas y índices
│   ├── storage/       # Reglas de Storage
│   ├── config/        # Configuración Firebase
│   ├── firebase.json
│   └── README.md
└── README.md         # Este archivo

```

## 🚀 Características Principales

### Frontend (React Native)

- **Widgets Personalizables**: Reloj, clima, fotos, notas

- **Compartir Fotos**: Galería con funciones de compartir
- **Sistema de Amigos**: Agregar y gestionar amigos

- **Chat en Tiempo Real**: Mensajería instantánea
- **Navegación Intuitiva**: Interfaz moderna con React Navigation

- **Estado Global**: Manejo con Redux Toolkit

### Backend (Firebase)

- **Autenticación**: Firebase Auth con email/password

- **Base de Datos**: Firestore para datos en tiempo real
- **Almacenamiento**: Cloud Storage para fotos

- **Funciones**: Cloud Functions para lógica del servidor
- **Notificaciones**: Push notifications

- **Seguridad**: Reglas de Firestore y Storage

## 🛠 Tecnologías Utilizadas

### Frontend

- React Native 0.79.5

- Expo SDK 53
- Redux Toolkit

- React Navigation 7
- Firebase SDK

- Expo Camera
- Expo Image Picker

### Backend

- Firebase Auth

- Cloud Firestore
- Cloud Storage

- Cloud Functions
- Cloud Messaging

- Firebase Analytics

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/EnmanuelReynoso23/shareit.git
cd shareit

```

### 2. Configurar Backend

```bash
cd backend
npm install -g firebase-tools
firebase login
firebase init

```

### 3. Configurar Frontend

```bash
cd frontend
npm install

```

### 4. Configurar Variables de Entorno

```bash

# Crear archivo .env en frontend/

EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

```

### 5. Ejecutar la Aplicación

```bash

# Ejecutar emuladores de Firebase

cd backend
firebase emulators:start

# En otra terminal, ejecutar el frontend

cd frontend
npm start

```

## 📱 Capturas de Pantalla

*Las capturas de pantalla se agregarán una vez que la aplicación esté completamente desarrollada*

## � Estado de Desarrollo

### ✅ Completado

- Estructura base del proyecto

- Configuración de Firebase
- Navegación principal

- Widgets básicos (Reloj, Clima)
- Sistema de autenticación

- Cloud Functions básicas
- Reglas de seguridad

### 🔄 En Progreso

- Pantallas de autenticación

- Funcionalidad de cámara
- Sistema de amigos

- Chat en tiempo real
- Galería de fotos

### 📋 Pendiente

- Widgets adicionales

- Notificaciones push
- Modo offline

- Optimización de rendimiento
- Pruebas unitarias

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Enmanuel Reynoso** - *Desarrollador Principal* - [@EnmanuelReynoso23](https://github.com/EnmanuelReynoso23)

## 🆘 Soporte

Si tienes preguntas o necesitas ayuda, puedes:

- Abrir un [issue](https://github.com/EnmanuelReynoso23/shareit/issues)
- Contactar al desarrollador

## � Documentación Adicional

- [Documentación del Frontend](frontend/README.md)

- [Documentación del Backend](backend/README.md)
- [Guía de Configuración](backend/SETUP.md)

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

   ```bash
   git clone https://github.com/yourusername/shareit.git
   cd shareit
   ```

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Firebase Setup**

   a. Go to [Firebase Console](https://console.firebase.google.com)

   b. Create a new project

   c. Enable the following services:
      - Authentication (Email/Password)
      - Firestore Database
      - Storage

   d. Get your Firebase configuration from Project Settings

   e. Update `config/firebase.js` with your Firebase config:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

3. **Firestore Security Rules**

   Add these rules to your Firestore database:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Photos can be read by shared users
       match /photos/{photoId} {
         allow read: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || 
                     request.auth.uid in resource.data.sharedWith);
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       // Widgets can be read by owner and shared users
       match /widgets/{widgetId} {
         allow read: if request.auth != null && 
                    (resource.data.userId == request.auth.uid || 
                     request.auth.uid in resource.data.sharedWith);
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       // Friend requests
       match /friendRequests/{requestId} {
         allow read, write: if request.auth != null;
       }
       
       // Friendships
       match /friendships/{friendshipId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🚀 Running the App

1. **Start the Expo development server**

   ```bash
   npm start
   ```

2. **Run on iOS Simulator** (Mac only)

   ```bash
   npm run ios
   ```

3. **Run on Android Emulator**

   ```bash
   npm run android
   ```

4. **Run on Web**

   ```bash
   npm run web
   ```

5. **Run on Physical Device**
   - Install Expo Go app from App Store/Google Play
   - Scan the QR code from the terminal/browser

## 📁 Project Structure

```text
shareit/
├── src/
│   ├── components/
│   │   ├── widgets/           # Widget components
│   │   └── ui/                # Reusable UI components
│   ├── screens/
│   │   ├── auth/              # Authentication screens
│   │   └── main/              # Main app screens
│   ├── navigation/            # Navigation configuration
│   ├── services/              # API services
│   ├── store/
│   │   └── slices/            # Redux slices
│   └── utils/                 # Utility functions
├── config/
│   └── firebase.js            # Firebase configuration
├── assets/                    # Images, fonts, etc.
├── App.js                     # Root component
└── package.json

```

## 🔑 Key Components

### Authentication Flow

- Welcome Screen with app introduction

- Login/Register with email and password
- Automatic authentication state management

### Main Features

- **Home Screen**: Dashboard with active widgets

- **Gallery Screen**: Shared photos management
- **Friends Screen**: Friend requests and connections

- **Profile Screen**: User settings and preferences

### Widget System

- Modular widget architecture

- Easy to add new widget types
- Real-time updates and synchronization

- Customizable widget configurations

## 🔮 Future Enhancements

- [ ] Real-time messaging system

- [ ] Push notifications
- [ ] Advanced photo editing

- [ ] Widget animations and interactions
- [ ] Dark mode support

- [ ] Offline functionality
- [ ] Widget marketplace

- [ ] Group widget sharing
- [ ] Advanced friend discovery

- [ ] Widget templates

- [ ] Oskerrss

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Notes

### Adding New Widgets

1. Create a new component in `src/components/widgets/`
2. Add the widget type to `WIDGET_TYPES` in `widgetsSlice.js`
3. Update the widget renderer in `HomeScreen.js`
4. Add the widget option to `WidgetSettingsScreen.js`

### Firebase Integration

- All data is stored in Firestore with real-time synchronization

- Images are stored in Firebase Storage
- Authentication is handled by Firebase Auth

- Security rules ensure data privacy

### State Management

- Redux Toolkit for predictable state management

- Separate slices for different features
- Async thunks for Firebase operations

## 🐛 Troubleshooting

### Common Issues

1. **Firebase not connecting**
   - Check your Firebase configuration in `config/firebase.js`
   - Ensure Firebase services are enabled in console

2. **Metro bundler issues**

   ```bash
   npx expo start --clear
   ```

3. **Dependencies issues**

   ```bash
   rm -rf node_modules
   npm install
   ```

4. **iOS build issues**

   ```bash
   cd ios && pod install && cd ..
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created with ❤️ by [Your Name]

## 🙏 Acknowledgments

- Expo team for the amazing development platform

- Firebase for backend services
- React Native community for excellent libraries

- All contributors who help improve this project

---

**Happy Sharing! 🎉**
