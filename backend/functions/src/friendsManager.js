const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Enviar solicitud de amistad
exports.sendFriendRequest = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { recipientEmail } = data;
  const requesterId = context.auth.uid;
  
  try {
    // Buscar usuario por email
    const usersQuery = await admin.firestore()
      .collection('users')
      .where('email', '==', recipientEmail)
      .get();
    
    if (usersQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    }
    
    const recipientDoc = usersQuery.docs[0];
    const recipientId = recipientDoc.id;
    
    // Verificar que no sea el mismo usuario
    if (requesterId === recipientId) {
      throw new functions.https.HttpsError('invalid-argument', 'No puedes enviarte una solicitud a ti mismo');
    }
    
    // Verificar si ya existe una amistad
    const existingFriendship = await admin.firestore()
      .collection('friends')
      .where('users', 'array-contains', requesterId)
      .get();
    
    const alreadyFriends = existingFriendship.docs.some(doc => {
      const users = doc.data().users;
      return users.includes(recipientId);
    });
    
    if (alreadyFriends) {
      throw new functions.https.HttpsError('already-exists', 'Ya existe una relación de amistad');
    }
    
    // Crear solicitud de amistad
    const friendshipRef = await admin.firestore().collection('friends').add({
      users: [requesterId, recipientId],
      status: 'pending',
      requestedBy: requesterId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        sharedWidgets: 0,
        sharedPhotos: 0,
        lastInteraction: admin.firestore.FieldValue.serverTimestamp()
      }
    });
    
    return {
      success: true,
      friendshipId: friendshipRef.id,
      message: 'Solicitud de amistad enviada'
    };
    
  } catch (error) {
    console.error('Error enviando solicitud de amistad:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Aceptar solicitud de amistad
exports.acceptFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { friendshipId } = data;
  const userId = context.auth.uid;
  
  try {
    const friendshipDoc = await admin.firestore()
      .collection('friends')
      .doc(friendshipId)
      .get();
    
    if (!friendshipDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Solicitud no encontrada');
    }
    
    const friendshipData = friendshipDoc.data();
    
    // Verificar que el usuario puede aceptar la solicitud
    if (!friendshipData.users.includes(userId) || friendshipData.requestedBy === userId) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para aceptar esta solicitud');
    }
    
    if (friendshipData.status !== 'pending') {
      throw new functions.https.HttpsError('invalid-argument', 'La solicitud ya fue procesada');
    }
    
    // Actualizar solicitud
    await admin.firestore().collection('friends').doc(friendshipId).update({
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Actualizar contador de amigos para ambos usuarios
    const batch = admin.firestore().batch();
    
    friendshipData.users.forEach(uid => {
      const userRef = admin.firestore().collection('users').doc(uid);
      batch.update(userRef, {
        'stats.friendsCount': admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    return {
      success: true,
      message: 'Solicitud de amistad aceptada'
    };
    
  } catch (error) {
    console.error('Error aceptando solicitud de amistad:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Rechazar solicitud de amistad
exports.rejectFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { friendshipId } = data;
  const userId = context.auth.uid;
  
  try {
    const friendshipDoc = await admin.firestore()
      .collection('friends')
      .doc(friendshipId)
      .get();
    
    if (!friendshipDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Solicitud no encontrada');
    }
    
    const friendshipData = friendshipDoc.data();
    
    // Verificar permisos
    if (!friendshipData.users.includes(userId)) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para rechazar esta solicitud');
    }
    
    // Eliminar solicitud
    await admin.firestore().collection('friends').doc(friendshipId).delete();
    
    return {
      success: true,
      message: 'Solicitud de amistad rechazada'
    };
    
  } catch (error) {
    console.error('Error rechazando solicitud de amistad:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Buscar usuarios por email o nombre
exports.searchUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { query } = data;
  const currentUserId = context.auth.uid;
  
  if (!query || query.length < 3) {
    throw new functions.https.HttpsError('invalid-argument', 'La búsqueda debe tener al menos 3 caracteres');
  }
  
  try {
    const usersRef = admin.firestore().collection('users');
    
    // Buscar por email
    const emailQuery = await usersRef
      .where('email', '>=', query)
      .where('email', '<=', query + '\uf8ff')
      .limit(10)
      .get();
    
    // Buscar por nombre
    const nameQuery = await usersRef
      .where('displayName', '>=', query)
      .where('displayName', '<=', query + '\uf8ff')
      .limit(10)
      .get();
    
    // Combinar resultados
    const results = new Map();
    
    emailQuery.docs.forEach(doc => {
      if (doc.id !== currentUserId) {
        results.set(doc.id, {
          uid: doc.id,
          email: doc.data().email,
          displayName: doc.data().displayName,
          photoURL: doc.data().photoURL,
          bio: doc.data().bio
        });
      }
    });
    
    nameQuery.docs.forEach(doc => {
      if (doc.id !== currentUserId) {
        results.set(doc.id, {
          uid: doc.id,
          email: doc.data().email,
          displayName: doc.data().displayName,
          photoURL: doc.data().photoURL,
          bio: doc.data().bio
        });
      }
    });
    
    return {
      users: Array.from(results.values())
    };
    
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Eliminar amistad
exports.removeFriend = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  
  const { friendId } = data;
  const userId = context.auth.uid;
  
  try {
    // Buscar la amistad
    const friendshipsQuery = await admin.firestore()
      .collection('friends')
      .where('users', 'array-contains', userId)
      .where('status', '==', 'accepted')
      .get();
    
    const friendshipDoc = friendshipsQuery.docs.find(doc => {
      const users = doc.data().users;
      return users.includes(friendId);
    });
    
    if (!friendshipDoc) {
      throw new functions.https.HttpsError('not-found', 'Amistad no encontrada');
    }
    
    // Eliminar amistad
    await friendshipDoc.ref.delete();
    
    // Actualizar contador de amigos
    const batch = admin.firestore().batch();
    
    [userId, friendId].forEach(uid => {
      const userRef = admin.firestore().collection('users').doc(uid);
      batch.update(userRef, {
        'stats.friendsCount': admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    
    return {
      success: true,
      message: 'Amistad eliminada'
    };
    
  } catch (error) {
    console.error('Error eliminando amistad:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});
