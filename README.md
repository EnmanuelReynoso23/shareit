# ShareIt - Widget & Photo Sharing App

ShareIt is a React Native mobile application that allows users to create custom widgets and share photos with friends. Built with Expo, Firebase, and Redux Toolkit.

## 🚀 Features

### Core Features

- **Custom Widgets**: Create and customize various widgets (Clock, Weather, Photos, Notes, Calendar, Battery)
- **Photo Sharing**: Share photos with friends in real-time
- **Friend System**: Add friends and manage connections
- **User Authentication**: Secure login and registration with Firebase Auth
- **Real-time Sync**: All data syncs across devices using Firebase Firestore
- **Profile Management**: Customize your profile and preferences

### Widget Types

- **Clock Widget**: Real-time clock with date display
- **Weather Widget**: Current weather information
- **Photos Widget**: Display shared photos count
- **Notes Widget**: Quick notes and reminders
- **Calendar Widget**: Upcoming events (coming soon)
- **Battery Widget**: Device battery status (coming soon)

## 📱 Screenshots

*Screenshots will be available once the app is fully developed*

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **State Management**: Redux Toolkit
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Navigation**: React Navigation 6
- **UI Components**: React Native Elements, Expo Vector Icons
- **Development**: Expo CLI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- iOS Simulator (for Mac) or Android Emulator

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shareit.git
   cd shareit
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**

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

4. **Firestore Security Rules**

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
