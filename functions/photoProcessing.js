const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Crear thumbnail cuando se sube una foto
exports.generateThumbnail = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = admin.storage().bucket();

  // Solo procesar fotos en shared-photos
  if (!filePath.startsWith("shared-photos/")) return;
  if (filePath.includes("thumb_")) return;

  try {
    const fileName = path.basename(filePath);
    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.dirname(filePath) + "/" + thumbFileName;

    const tempFilePath = path.join(os.tmpdir(), fileName);
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

    // Descargar archivo original
    await bucket.file(filePath).download({destination: tempFilePath});

    // Crear thumbnail
    await sharp(tempFilePath)
        .resize(300, 300, {fit: "cover"})
        .jpeg({quality: 80})
        .toFile(tempThumbPath);

    // Subir thumbnail
    await bucket.upload(tempThumbPath, {
      destination: thumbFilePath,
      metadata: {
        cacheControl: "public, max-age=31536000",
        contentType: "image/jpeg",
      },
    });

    // Limpiar archivos temporales
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(tempThumbPath);

    console.log("Thumbnail creado:", thumbFilePath);
  } catch (error) {
    console.error("Error creando thumbnail:", error);
  }
});

// Procesar foto subida y crear registro en Firestore
exports.processPhotoUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;

  // Solo procesar fotos principales (no thumbnails)
  if (!filePath.startsWith("shared-photos/")) return;
  if (filePath.includes("thumb_")) return;

  try {
    // Extraer userId del path: shared-photos/userId/fileName
    const pathParts = filePath.split("/");
    const userId = pathParts[1];
    const fileName = pathParts[2];

    // Crear URL pública
    const photoURL = `https://storage.googleapis.com/${object.bucket}/${filePath}`;
    const thumbnailURL = `https://storage.googleapis.com/${object.bucket}/shared-photos/${userId}/thumb_${fileName}`;

    // Crear registro en Firestore
    await admin.firestore().collection("photos").add({
      userId: userId,
      fileName: fileName,
      url: photoURL,
      thumbnail: thumbnailURL,
      caption: "",
      tags: [],
      location: null,
      sharedWith: [],
      likes: [],
      comments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isPublic: false,
      size: object.size,
      contentType: object.contentType,
    });

    // Actualizar estadísticas del usuario
    await admin.firestore().collection("users").doc(userId).update({
      "stats.photosShared": admin.firestore.FieldValue.increment(1),
      "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Foto procesada para usuario:", userId);
  } catch (error) {
    console.error("Error procesando foto:", error);
  }
});

// Limpiar archivos huérfanos cuando se elimina un documento de foto
exports.cleanupPhotoFiles = functions.firestore
    .document("photos/{photoId}")
    .onDelete(async (snap, context) => {
      try {
        const photoData = snap.data();
        const bucket = admin.storage().bucket();

        // Eliminar archivo original
        if (photoData.url) {
          await bucket.file(`shared-photos/${photoData.userId}/${photoData.fileName}`).delete();
        }

        // Eliminar thumbnail
        if (photoData.thumbnail) {
          await bucket.file(`shared-photos/${photoData.userId}/thumb_${photoData.fileName}`).delete();
        }

        console.log("Archivos eliminados para foto:", context.params.photoId);
      } catch (error) {
        console.error("Error eliminando archivos:", error);
      }
    });
