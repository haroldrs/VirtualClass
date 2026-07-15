const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // URL de redirección usada para sacar el token
);

// Configuramos las credenciales pasándole el Refresh Token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Sube un archivo a Google Drive
 * @param {Object} fileOb - El archivo proveniente de multer (req.file)
 * @param {String} folderId - (Opcional) El ID de la carpeta donde se guardará
 */
const uploadFileToDrive = async (fileOb, folderId = null) => {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileOb.buffer);

    const fileMetadata = {
      name: fileOb.originalname,
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: fileOb.mimetype,
      body: bufferStream,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true
    });

    // Cambiamos los permisos para que cualquiera con el enlace pueda leerlo
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo a Drive:', error);
    throw error;
  }
};

/**
 * Crea una nueva carpeta en Google Drive
 * @param {String} folderName - Nombre de la carpeta a crear
 * @param {String} parentFolderId - (Opcional) ID de la carpeta padre donde se creará
 */
const createFolderInDrive = async (folderName, parentFolderId = null) => {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, webViewLink',
      supportsAllDrives: true
    });

    // Dar permisos de lectura a la carpeta
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creando carpeta en Drive:', error);
    throw error;
  }
};

/**
 * Elimina un archivo o carpeta de Google Drive
 * @param {String} fileId - ID del archivo o carpeta a eliminar
 */
const deleteFileFromDrive = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId,
      supportsAllDrives: true
    });
    return true;
  } catch (error) {
    console.error('Error eliminando archivo de Drive:', error);
    throw error;
  }
};

module.exports = {
  uploadFileToDrive,
  createFolderInDrive,
  deleteFileFromDrive
};
