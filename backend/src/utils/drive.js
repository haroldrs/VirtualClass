const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

// Definimos los permisos (scopes) que necesitamos
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let auth;

if (process.env.GOOGLE_CREDENTIALS) {
  // Si estamos en Render, usamos la variable de entorno con el JSON pegado
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
} else {
  // Si estamos en local, usamos el archivo
  const KEYFILEPATH = path.join(__dirname, '../config/google-credentials.json');
  auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
}

const drive = google.drive({ version: 'v3', auth });

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

module.exports = {
  uploadFileToDrive,
};
