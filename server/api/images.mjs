import { upload, uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.mjs';

// Upload une seule image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const result = await uploadToCloudinary(req.file, 'pawfect-match/animals');

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Image uploadée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
  }
};

// Upload plusieurs images
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file, 'pawfect-match/animals')
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    res.status(200).json({
      images,
      message: `${images.length} image(s) uploadée(s) avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des images' });
  }
};

// Supprimer une image
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
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
  }
};

export { upload };
