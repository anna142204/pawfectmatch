
import mongoose from 'mongoose';
import Animal from './models/animal.js';
import { fetchJson } from '../src/utils/fetchJson.js';

// Connect to MongoDB (modifiez l'URL si besoin)
mongoose.connect('mongodb://localhost:27017/pawfect_match', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const animals = [
  {
    species: 'chat', race: 'Européen', name: 'Mimi', age: '1-3', sex: 'female', size: 'petit', weight: '0-5', address: { city: 'Lausanne', zip: '1000' }, image: '', price: 50, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Chatte très câline et joueuse.', characteristics: { environment: ['appartement', 'enfant'], dressage: ['éduqué'], personality: ['câlin', 'joueur', 'sociable'] } },
  { species: 'chien', race: 'Labrador', name: 'Rex', age: '3-7', sex: 'male', size: 'grand', weight: '20-30', address: { city: 'Genève', zip: '1200' }, image: '', price: 100, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Chien joueur, adore les enfants et les balades.', characteristics: { environment: ['enfant', 'voiture'], dressage: ['facile à dresser', 'habitué à la laisse'], personality: ['énergique', 'protecteur', 'affectueux'] } },
  { species: 'chien', race: 'Berger Australien', name: 'Blue', age: '1-3', sex: 'male', size: 'moyen', weight: '10-20', address: { city: 'Fribourg', zip: '1700' }, image: '', price: 120, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Très intelligent, adore courir.', characteristics: { environment: ['voiture', 'enfant'], dressage: ['facile à dresser'], personality: ['énergique', 'curieux'] } },
  { species: 'chat', race: 'Siamois', name: 'Luna', age: '3-7', sex: 'female', size: 'petit', weight: '0-5', address: { city: 'Neuchâtel', zip: '2000' }, image: '', price: 60, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Très bavarde et affectueuse.', characteristics: { environment: ['appartement'], dressage: ['éduqué'], personality: ['bavard', 'affectueux'] } },
  { species: 'chien', race: 'Bouledogue', name: 'Oscar', age: '7+', sex: 'male', size: 'moyen', weight: '10-20', address: { city: 'Sion', zip: '1950' }, image: '', price: 80, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Calme, aime les longues siestes.', characteristics: { environment: ['appartement'], dressage: ['têtu'], personality: ['calme', 'indépendant'] } },
  { species: 'chat', race: 'Maine Coon', name: 'Simba', age: '1-3', sex: 'male', size: 'grand', weight: '10-20', address: { city: 'Montreux', zip: '1820' }, image: '', price: 90, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Très sociable, adore l’eau.', characteristics: { environment: ['enfant', 'autre animaux'], dressage: ['éduqué'], personality: ['sociable', 'explorateur'] } },
  { species: 'chien', race: 'Teckel', name: 'Fritz', age: '3-7', sex: 'male', size: 'petit', weight: '5-10', address: { city: 'Bienne', zip: '2500' }, image: '', price: 70, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Têtu mais très loyal.', characteristics: { environment: ['voiture'], dressage: ['têtu'], personality: ['protecteur', 'territorial'] } },
  { species: 'chat', race: 'Chartreux', name: 'Grisou', age: '3-7', sex: 'male', size: 'moyen', weight: '5-10', address: { city: 'Yverdon', zip: '1400' }, image: '', price: 70, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Chat calme et doux.', characteristics: { environment: ['appartement'], dressage: ['éduqué'], personality: ['calme', 'câlin'] } },
  { species: 'chien', race: 'Shiba Inu', name: 'Yuki', age: '1-3', sex: 'female', size: 'petit', weight: '5-10', address: { city: 'Vevey', zip: '1800' }, image: '', price: 110, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Chienne vive et joueuse.', characteristics: { environment: ['enfant'], dressage: ['facile à dresser'], personality: ['énergique', 'joueur'] } },
  { species: 'chat', race: 'Persan', name: 'Perle', age: '7+', sex: 'female', size: 'petit', weight: '0-5', address: { city: 'Delémont', zip: '2800' }, image: '', price: 80, ownerId: '6942ab8b75cae86441c70243', availability: true, description: 'Chatte très douce et tranquille.', characteristics: { environment: ['appartement'], dressage: ['éduqué'], personality: ['calme', 'timide'] } },
];
async function getCatImageUrl() {
  try {
    const { request } = fetchJson({ url: 'https://api.thecatapi.com/v1/images/search', method: 'GET', timeout: 5000 });
    const data = await request;
    return data[0]?.url || '';
  } catch (e) {
    return '';
  }
}
async function getDogImageUrl() {
  try {
    const { request } = fetchJson({ url: 'https://api.thedogapi.com/v1/images/search', method: 'GET', timeout: 5000 });
    const data = await request;
    return data[0]?.url || '';
  } catch (e) {
    return '';
  }
}

async function seedAnimals() {
  try {
    // Pour chaque animal de type chat ou chien, on récupère une image dynamique
    for (const animal of animals) {
      if (animal.species === 'chat') {
        const url = await getCatImageUrl();
        if (url) animal.image = url;
      }
      if (animal.species === 'chien') {
        const url = await getDogImageUrl();
        if (url) animal.image = url;
      }
    }
    await Animal.deleteMany({});
    await Animal.insertMany(animals);
    console.log('Animaux insérés avec succès !');
  } catch (err) {
    console.error('Erreur lors de l’insertion des animaux :', err);
  } finally {
    mongoose.connection.close();
  }
}

seedAnimals();
