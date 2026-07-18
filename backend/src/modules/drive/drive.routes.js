const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFileToDrive, streamFileFromDrive } = require('../../utils/drive');

// Usamos multer en memoria para no guardar archivos temporales en el disco
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo' });
    }

    // Usamos carpeta de anuncios si está, si no fallback
    const folderId = process.env.GOOGLE_DRIVE_ANUNCIOS_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return res.status(500).json({ success: false, message: 'Falta configurar GOOGLE_DRIVE_FOLDER_ID en Render' });
    }
    
    // Subimos a Drive
    const driveResponse = await uploadFileToDrive(req.file, folderId);

    return res.status(200).json({
      success: true,
      message: 'Archivo subido correctamente a Google Drive',
      data: {
        id: driveResponse.id,
        webViewLink: driveResponse.webViewLink,
        webContentLink: driveResponse.webContentLink
      }
    });
  } catch (error) {
    console.error('Error en /upload:', error);
    return res.status(500).json({ success: false, message: 'Error interno al subir archivo' });
  }
});

// Proxy para ver/descargar imágenes desde frontend esquivando restricciones de iframe/CORS de Google Drive
router.get('/view/:fileId', async (req, res) => {
    try {
        await streamFileFromDrive(req.params.fileId, res);
    } catch (e) {
        res.status(500).send('Error');
    }
});

module.exports = router;
