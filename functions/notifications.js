const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Enviar notificación cuando se comparte un widget
exports.sendWidgetShareNotification = functions.firestore
    .document("widgets/{widgetId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      const newShares = after.sharedWith.filter((uid) => !before.sharedWith.includes(uid));

      if (newShares.length === 0) return;

      try {
        const ownerDoc = await admin.firestore().collection("users").doc(after.userId).get();
        const ownerName = ownerDoc.data().displayName;

        const notifications = newShares.map(async (uid) => {
          const userDoc = await admin.firestore().collection("users").doc(uid).get();
          const userData = userDoc.data();

          if (userData.fcmToken && userData.preferences.notifications) {
            return admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: "Widget Compartido",
                body: `${ownerName} compartió un widget ${after.type} contigo`,
              },
              data: {
                type: "widget_share",
                widgetId: context.params.widgetId,
                senderId: after.userId,
                widgetType: after.type,
              },
            });
          }
        });

        await Promise.all(notifications);
        console.log("Notificaciones enviadas para widget:", context.params.widgetId);
      } catch (error) {
        console.error("Error enviando notificaciones:", error);
      }
    });

// Enviar notificación de solicitud de amistad
exports.sendFriendRequestNotification = functions.firestore
    .document("friends/{friendshipId}")
    .onCreate(async (snap, context) => {
      try {
        const friendshipData = snap.data();

        if (friendshipData.status !== "pending") return;

        const requesterDoc = await admin.firestore()
            .collection("users")
            .doc(friendshipData.requestedBy)
            .get();

        const requesterName = requesterDoc.data().displayName;

        const recipientId = friendshipData.users.find((uid) => uid !== friendshipData.requestedBy);
        const recipientDoc = await admin.firestore()
            .collection("users")
            .doc(recipientId)
            .get();

        const recipientData = recipientDoc.data();

        if (recipientData.fcmToken && recipientData.preferences.notifications) {
          await admin.messaging().send({
            token: recipientData.fcmToken,
            notification: {
              title: "Solicitud de Amistad",
              body: `${requesterName} te envió una solicitud de amistad`,
            },
            data: {
              type: "friend_request",
              friendshipId: context.params.friendshipId,
              requesterId: friendshipData.requestedBy,
            },
          });
        }

        console.log("Notificación de amistad enviada:", context.params.friendshipId);
      } catch (error) {
        console.error("Error enviando notificación de amistad:", error);
      }
    });

// Enviar notificación de mensaje de chat
exports.sendChatNotification = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
      try {
        const messageData = snap.data();
        const chatId = context.params.chatId;

        // Obtener información del chat
        const chatDoc = await admin.firestore().collection("chats").doc(chatId).get();
        const chatData = chatDoc.data();

        // Obtener información del remitente
        const senderDoc = await admin.firestore()
            .collection("users")
            .doc(messageData.senderId)
            .get();

        const senderName = senderDoc.data().displayName;

        // Enviar notificación a todos los participantes excepto al remitente
        const recipients = chatData.participants.filter((uid) => uid !== messageData.senderId);

        const notifications = recipients.map(async (uid) => {
          const userDoc = await admin.firestore().collection("users").doc(uid).get();
          const userData = userDoc.data();

          if (userData.fcmToken && userData.preferences.notifications && userData.isOnline === false) {
            let notificationBody = messageData.text;

            // Personalizar mensaje según el tipo
            if (messageData.type === "image") {
              notificationBody = "📷 Envió una foto";
            } else if (messageData.type === "widget") {
              notificationBody = "🔧 Compartió un widget";
            }

            return admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: senderName,
                body: notificationBody,
              },
              data: {
                type: "chat_message",
                chatId: chatId,
                senderId: messageData.senderId,
                messageType: messageData.type,
              },
            });
          }
        });

        await Promise.all(notifications);
        console.log("Notificaciones de chat enviadas:", chatId);
      } catch (error) {
        console.error("Error enviando notificaciones de chat:", error);
      }
    });

// Enviar notificación cuando se acepta una solicitud de amistad
exports.sendFriendAcceptedNotification = functions.firestore
    .document("friends/{friendshipId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      // Solo procesar si cambió de pending a accepted
      if (before.status !== "pending" || after.status !== "accepted") return;

      try {
        const acceptedByDoc = await admin.firestore()
            .collection("users")
            .doc(after.acceptedBy)
            .get();

        const acceptedByName = acceptedByDoc.data().displayName;

        const requesterId = after.requestedBy;
        const requesterDoc = await admin.firestore()
            .collection("users")
            .doc(requesterId)
            .get();

        const requesterData = requesterDoc.data();

        if (requesterData.fcmToken && requesterData.preferences.notifications) {
          await admin.messaging().send({
            token: requesterData.fcmToken,
            notification: {
              title: "Solicitud Aceptada",
              body: `${acceptedByName} aceptó tu solicitud de amistad`,
            },
            data: {
              type: "friend_accepted",
              friendshipId: context.params.friendshipId,
              friendId: after.acceptedBy,
            },
          });
        }

        console.log("Notificación de amistad aceptada enviada:", context.params.friendshipId);
      } catch (error) {
        console.error("Error enviando notificación de amistad aceptada:", error);
      }
    });
