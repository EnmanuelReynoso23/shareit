# 🔥 Firebase MCP Server Configuration para ShareIt

## 📋 Resumen

El servidor MCP (Model Context Protocol) de Firebase está configurado y funcionando para el proyecto ShareIt. Esto permite a las herramientas de IA trabajar directamente con Firebase.

## ⚙️ Configuración Actual

### VS Code Copilot MCP Configuration

```json
{
  "servers": {
    "firebase": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "firebase-tools@latest",
        "experimental:mcp",
        "--dir",
        "/workspaces/shareit",
        "--only",
        "auth,firestore,storage,functions,hosting"
      ]
    }
  }
}

```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": [
        "-y",
        "firebase-tools@latest",
        "experimental:mcp",
        "--dir",
        "/workspaces/shareit",
        "--only",
        "auth,firestore,storage,functions,hosting"
      ]
    }
  }
}

```

## 🛠 Herramientas Disponibles

El servidor MCP de Firebase proporciona las siguientes herramientas:

### Core Tools

- `firebase_get_project` - Información del proyecto actual

- `firebase_list_apps` - Apps registradas en Firebase
- `firebase_get_admin_sdk_config` - Configuración del Admin SDK

- `firebase_list_projects` - Lista de proyectos disponibles
- `firebase_get_sdk_config` - Configuración del cliente SDK

- `firebase_create_project` - Crear nuevo proyecto
- `firebase_create_app` - Crear nueva app

- `firebase_get_environment` - Información del entorno
- `firebase_update_environment` - Actualizar configuración

- `firebase_init` - Inicializar funciones

### Firestore Tools

- `firestore_delete_document` - Eliminar documentos

- `firestore_get_documents` - Obtener documentos
- `firestore_list_collections` - Listar colecciones

- `firestore_query_collection` - Consultar colecciones
- `firestore_get_rules` - Obtener reglas de seguridad

- `firestore_validate_rules` - Validar reglas

### Authentication Tools

- `auth_get_user` - Obtener usuario

- `auth_disable_user` - Habilitar/deshabilitar usuario
- `auth_list_users` - Listar usuarios

- `auth_set_claim` - Establecer claims personalizados
- `auth_set_sms_region_policy` - Política de SMS

### Storage Tools

- `storage_get_rules` - Obtener reglas de Storage

- `storage_validate_rules` - Validar reglas de Storage
- `storage_get_object_download_url` - URLs de descarga

### Cloud Functions Tools

- Deploy y gestión a través de `firebase_init` y comandos CLI

## 🔧 Configuración del Proyecto

### Firebase Project

- **Project ID**: shareit-fcb52

- **Project Name**: Shareit
- **Region**: nam5 (North America)

### Servicios Configurados

- ✅ **Firestore**: Base de datos con reglas de seguridad

- ✅ **Cloud Functions**: Backend serverless
- ✅ **Storage**: Almacenamiento de archivos

- ✅ **Hosting**: Hosting web
- ✅ **Authentication**: (disponible en consola)

### Estructura de Archivos

```

/workspaces/shareit/
├── .firebaserc              # Configuración del proyecto
├── firebase.json            # Configuración de servicios
├── firestore.rules          # Reglas de Firestore
├── firestore.indexes.json   # Índices de Firestore
├── storage.rules            # Reglas de Storage
├── functions/               # Cloud Functions
│   ├── index.js            # Punto de entrada
│   ├── userTriggers.js     # Triggers de usuario
│   ├── photoProcessing.js  # Procesamiento de fotos
│   ├── notifications.js    # Notificaciones
│   ├── friendsManager.js   # Gestión de amigos
│   └── widgetsManager.js   # Gestión de widgets
├── frontend/               # App React Native
└── backend/               # Documentación y config

```

## 🚀 Comandos Útiles

### Desarrollo Local

```bash

# Iniciar emuladores locales

firebase emulators:start

# Solo Firestore

firebase emulators:start --only firestore

# Solo Functions

firebase emulators:start --only functions

# Solo Storage

firebase emulators:start --only storage

```

### Despliegue

```bash

# Desplegar todo

firebase deploy

# Solo functions

firebase deploy --only functions

# Solo reglas de Firestore

firebase deploy --only firestore:rules

# Solo reglas de Storage

firebase deploy --only storage

```

### Monitoreo

```bash

# Ver logs de functions

firebase functions:log

# Ver logs específicos

firebase functions:log --only createUserProfile

```

## 🎯 Próximos Pasos

1. **Configurar Authentication**
   - Habilitar providers (Email/Password, Google)
   - Configurar dominios autorizados

2. **Desplegar Functions**
   ```bash
   firebase deploy --only functions
   ```

3. **Configurar Firebase en el Frontend**
   - Actualizar variables de entorno
   - Configurar Firebase SDK

4. **Probar MCP Integration**
   - Usar herramientas de IA para gestionar Firestore
   - Crear usuarios de prueba
   - Subir archivos de prueba

## 📱 Uso con IA Tools

### Ejemplos de Comandos

- "Crea un usuario de prueba en Firebase Auth"

- "Lista todos los documentos en la colección users"
- "Valida las reglas de Firestore"

- "Obtén la configuración del SDK"
- "Crea un documento en la colección widgets"

### Best Practices

- Usar el MCP server para desarrollo y testing

- No usar en producción sin autenticación adicional
- Revisar logs regularmente

- Mantener reglas de seguridad actualizadas

## 🔐 Seguridad

- Reglas de Firestore configuradas por colección

- Reglas de Storage por directorios
- Authentication requerida para todas las operaciones

- Claims personalizados para roles

## 📊 Monitoreo

- Firebase Console: https://console.firebase.google.com/project/shareit-fcb52

- Logs de Functions disponibles en tiempo real
- Métricas de uso en la consola

- Alertas configurables para errores

---

**Estado**: ✅ Configurado y Funcionando
**Última actualización**: 10 de Julio, 2025
**Versión Firebase CLI**: 14.10.1
