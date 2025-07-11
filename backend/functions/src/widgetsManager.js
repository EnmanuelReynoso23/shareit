const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Compartir widget con amigos
exports.shareWidget = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { widgetId, friendIds } = data;
  const userId = context.auth.uid;
  
  try {
    const widgetDoc = await admin.firestore()
      .collection('widgets')
      .doc(widgetId)
      .get();
    
    if (!widgetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Widget no encontrado');
    }
    
    const widgetData = widgetDoc.data();
    
    // Verificar que el usuario es el propietario
    if (widgetData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para compartir este widget');
    }
    
    // Verificar que todos los IDs son amigos
    const friendsQuery = await admin.firestore()
      .collection('friends')
      .where('users', 'array-contains', userId)
      .where('status', '==', 'accepted')
      .get();
    
    const friendsList = [];
    friendsQuery.docs.forEach(doc => {
      const users = doc.data().users;
      const friendId = users.find(uid => uid !== userId);
      if (friendId) friendsList.push(friendId);
    });
    
    // Filtrar solo amigos válidos
    const validFriends = friendIds.filter(id => friendsList.includes(id));
    
    if (validFriends.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'No hay amigos válidos para compartir');
    }
    
    // Actualizar widget con nuevos shares
    const currentShares = widgetData.sharedWith || [];
    const newShares = [...new Set([...currentShares, ...validFriends])];
    
    await admin.firestore().collection('widgets').doc(widgetId).update({
      sharedWith: newShares,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      sharedWith: newShares,
      message: `Widget compartido con ${validFriends.length} amigos`
    };
    
  } catch (error) {
    console.error('Error compartiendo widget:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Actualizar configuración de compartir widget
exports.updateWidgetSharing = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { widgetId, shareSettings } = data;
  const userId = context.auth.uid;
  
  try {
    const widgetDoc = await admin.firestore()
      .collection('widgets')
      .doc(widgetId)
      .get();
    
    if (!widgetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Widget no encontrado');
    }
    
    const widgetData = widgetDoc.data();
    
    // Verificar permisos
    if (widgetData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para modificar este widget');
    }
    
    // Validar shareSettings
    const validSettings = {
      public: shareSettings.public || false,
      friendsOnly: shareSettings.friendsOnly || false,
      specificUsers: shareSettings.specificUsers || []
    };
    
    // Actualizar widget
    await admin.firestore().collection('widgets').doc(widgetId).update({
      shareSettings: validSettings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      shareSettings: validSettings,
      message: 'Configuración de compartir actualizada'
    };
    
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Dejar de compartir widget
exports.unshareWidget = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { widgetId, friendIds } = data;
  const userId = context.auth.uid;
  
  try {
    const widgetDoc = await admin.firestore()
      .collection('widgets')
      .doc(widgetId)
      .get();
    
    if (!widgetDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Widget no encontrado');
    }
    
    const widgetData = widgetDoc.data();
    
    // Verificar permisos
    if (widgetData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para modificar este widget');
    }
    
    // Remover amigos de la lista de compartidos
    const currentShares = widgetData.sharedWith || [];
    const newShares = currentShares.filter(id => !friendIds.includes(id));
    
    await admin.firestore().collection('widgets').doc(widgetId).update({
      sharedWith: newShares,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      sharedWith: newShares,
      message: 'Widget dejado de compartir'
    };
    
  } catch (error) {
    console.error('Error dejando de compartir widget:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Limpiar widgets inactivos (ejecutar diariamente)
exports.cleanupInactiveWidgets = functions.pubsub
  .schedule('0 2 * * *') // Ejecutar a las 2 AM todos los días
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Buscar widgets inactivos
      const inactiveWidgets = await admin.firestore()
        .collection('widgets')
        .where('isActive', '==', false)
        .where('updatedAt', '<=', thirtyDaysAgo)
        .get();
      
      if (inactiveWidgets.empty) {
        console.log('No hay widgets inactivos para limpiar');
        return;
      }
      
      const batch = admin.firestore().batch();
      
      inactiveWidgets.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`Limpiados ${inactiveWidgets.docs.length} widgets inactivos`);
      
    } catch (error) {
      console.error('Error limpiando widgets inactivos:', error);
    }
  });

// Función para obtener widgets compartidos con el usuario
exports.getSharedWidgets = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const userId = context.auth.uid;
  
  try {
    const sharedWidgets = await admin.firestore()
      .collection('widgets')
      .where('sharedWith', 'array-contains', userId)
      .where('isActive', '==', true)
      .get();
    
    const widgets = [];
    
    for (const doc of sharedWidgets.docs) {
      const widgetData = doc.data();
      
      // Obtener información del propietario
      const ownerDoc = await admin.firestore()
        .collection('users')
        .doc(widgetData.userId)
        .get();
      
      widgets.push({
        id: doc.id,
        ...widgetData,
        owner: {
          uid: ownerDoc.id,
          displayName: ownerDoc.data().displayName,
          photoURL: ownerDoc.data().photoURL
        }
      });
    }
    
    return {
      widgets: widgets
    };
    
  } catch (error) {
    console.error('Error obteniendo widgets compartidos:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Duplicar widget compartido
exports.duplicateSharedWidget = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { widgetId } = data;
  const userId = context.auth.uid;
  
  try {
    const originalWidget = await admin.firestore()
      .collection('widgets')
      .doc(widgetId)
      .get();
    
    if (!originalWidget.exists) {
      throw new functions.https.HttpsError('not-found', 'Widget no encontrado');
    }
    
    const originalData = originalWidget.data();
    
    // Verificar que el widget está compartido con el usuario
    if (!originalData.sharedWith.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes acceso a este widget');
    }
    
    // Crear copia del widget
    const newWidget = {
      userId: userId,
      type: originalData.type,
      config: { ...originalData.config },
      sharedWith: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      shareSettings: {
        public: false,
        friendsOnly: false,
        specificUsers: []
      },
      duplicatedFrom: widgetId
    };
    
    const newWidgetRef = await admin.firestore().collection('widgets').add(newWidget);
    
    // Actualizar estadísticas del usuario
    await admin.firestore().collection('users').doc(userId).update({
      'stats.widgetsCreated': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      widgetId: newWidgetRef.id,
      message: 'Widget duplicado exitosamente'
    };
    
  } catch (error) {
    console.error('Error duplicando widget:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});
