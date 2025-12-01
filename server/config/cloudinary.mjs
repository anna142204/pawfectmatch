import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurer Multer pour stocker les fichiers en mémoire
const storage = multer.memoryStorage();

// Filtrer uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Fonction pour uploader une image vers Cloudinary
export const uploadToCloudinary = (file, folder = 'pawfect-match') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        quality: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Erreur Cloudinary:', error);
          reject(error);
        } else {
          console.log('Upload réussi:', result.public_id);
          resolve(result);
        }
      }
    );

    stream.on('error', (error) => {
      console.error('Erreur stream:', error);
      reject(error);
    });

    stream.end(file.buffer);
  });
};

// Fonction pour supprimer une image depuis Cloudinary
export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId)
    .then(result => {
      console.log('Image supprimée:', publicId);
      return result;
    })
    .catch(error => {
      console.error('Erreur suppression:', error);
      throw error;
    });
};

export default cloudinary;
