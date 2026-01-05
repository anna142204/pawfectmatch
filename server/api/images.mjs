import { upload, uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.mjs';

// Configuration des dossiers autorisés
const UPLOAD_FOLDERS = {
  owner: 'pawfect-match/owners',
  adopter: 'pawfect-match/adopters',
  animal: 'pawfect-match/animals'
};

/**
 * Upload générique pour Owner, Adopter ou Animal
 * Gère automatiquement un ou plusieurs fichiers.
 * Route : POST /api/images/:type (ex: /api/images/animal)
 */
export const uploadEntityImages = async (req, res) => {
  try {
    const { type } = req.params; // On récupère 'owner', 'adopter' ou 'animal' de l'URL

    const targetFolder = UPLOAD_FOLDERS[type];
    if (!targetFolder) {
      return res.status(400).json({ error: `Type d'upload invalide: ${type}` });
    }

    let filesToUpload = [];
    if (req.files && req.files.length > 0) {
      filesToUpload = req.files;
    } else if (req.file) {
      filesToUpload = [req.file];
    } else {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const uploadPromises = filesToUpload.map(file => 
      uploadToCloudinary(file, targetFolder)
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    const responsePayload = filesToUpload.length === 1 ? images[0] : { images };

    res.status(200).json({
      data: responsePayload,
      message: 'Upload réussi'
    });

  } catch (error) {
    console.error(`Erreur upload (${req.params.type}):`, error);
    res.status(500).json({ error: "Erreur lors de l'upload vers Cloudinary" });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId requis' });
    }

    await deleteFromCloudinary(publicId);

    res.status(200).json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'image" });
  }
};

export { upload };