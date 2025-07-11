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
      bio: '',
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
      },
      isOnline: true,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
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
    
    // Eliminar widgets del usuario
    const widgets = await admin.firestore()
      .collection('widgets')
      .where('userId', '==', user.uid)
      .get();
    
    widgets.forEach(doc => batch.delete(doc.ref));
    
    // Eliminar fotos del usuario
    const photos = await admin.firestore()
      .collection('photos')
      .where('userId', '==', user.uid)
      .get();
    
    photos.forEach(doc => batch.delete(doc.ref));
    
    // Eliminar amistades
    const friendships = await admin.firestore()
      .collection('friends')
      .where('users', 'array-contains', user.uid)
      .get();
    
    friendships.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log('Datos eliminados para:', user.uid);
  } catch (error) {
    console.error('Error eliminando datos:', error);
  }
});

// Actualizar estado online del usuario
exports.updateUserStatus = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Si cambió el estado online
    if (before.isOnline !== after.isOnline) {
      try {
        // Actualizar lastSeen si se desconectó
        if (!after.isOnline) {
          await change.after.ref.update({
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        console.log(`Usuario ${context.params.userId} cambió estado: ${after.isOnline ? 'online' : 'offline'}`);
      } catch (error) {
        console.error('Error actualizando estado:', error);
      }
    }
  });
