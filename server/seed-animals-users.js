import 'dotenv/config';
import mongoose from 'mongoose';
import Adopter from './models/adopter.js';
import Owner from './models/owner.js';
import Admin from './models/admin.js';
import Animal from './models/animal.js';
import { fetchJson } from '../src/utils/fetchJson.js';

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/pawfect_match';

const getAnimalImage = async (species) => {
    const url = species === 'chat' 
        ? 'https://api.thecatapi.com/v1/images/search' 
        : 'https://api.thedogapi.com/v1/images/search';
    try {
        const res = fetchJson(url);
        const data = await res.json();
        return data[0]?.url || '';
    } catch (e) {
        return species === 'chat' ? 'https://placekitten.com/400/400' : 'https://placedog.net/400/400';
    }
};

const seed = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('--- Connexion MongoDB réussie ---');

        // Nettoyage
        await Promise.all([
            Adopter.deleteMany({}),
            Owner.deleteMany({}),
            Admin.deleteMany({}),
            Animal.deleteMany({})
        ]);

        // // 1. Seed Admin
        // await Admin.create({
        //     name: 'Pawfect Admin',
        //     email: 'admin@pawfectmatch.ch',
        //     password: 'password123',
        //     role: 'admin'
        // });

        // 2. Seed 5 Owners (Mélange société / particuliers)
        const ownersData = [
            { firstName: 'Marc', lastName: 'Vaud', email: 'marc@refuge.ch', societyName: 'Refuge de Cossonay', city: 'Cossonay', zip: '1304', imgId: 'marc' },
            { firstName: 'Julie', lastName: 'Geneva', email: 'julie@asso.ch', societyName: 'Pattes Genevoises', city: 'Genève', zip: '1201', imgId: 'julie' },
            { firstName: 'Thomas', lastName: 'Neuch', email: 'thomas@particulier.ch', societyName: null, city: 'Neuchâtel', zip: '2000', imgId: 'thomas' },
            { firstName: 'Elena', lastName: 'Frib', email: 'elena@paws.ch', societyName: 'Fribourg Animaux', city: 'Fribourg', zip: '1700', imgId: 'elena' },
            { firstName: 'Sébastien', lastName: 'Sion', email: 'seb@particulier.ch', societyName: null, city: 'Sion', zip: '1950', imgId: 'seb' }
        ].map(o => ({
            ...o,
            password: 'password123',
            address: { zip: o.zip, city: o.city },
            phoneNumber: '079' + Math.floor(1000000 + Math.random() * 9000000),
            image: `https://i.pravatar.cc/150?u=${o.imgId}`,
            about: o.societyName ? `Structure professionnelle : ${o.societyName}.` : `Particulier passionné d'animaux.`
        }));

        const createdOwners = await Owner.create(ownersData);
        console.log('✓ 5 Owners créés');

        // 3. Seed 5 Adopters
        const adoptersData = [
            { firstName: 'Alice', lastName: 'Vaud', email: 'alice@adopter.ch', city: 'Lausanne', zip: '1003', age: 24, env: ['appartement'] },
            { firstName: 'Benoit', lastName: 'Jura', email: 'ben@adopter.ch', city: 'Delémont', zip: '2800', age: 35, env: ['voiture', 'chien'] },
            { firstName: 'Chloé', lastName: 'Riviera', email: 'chloe@adopter.ch', city: 'Montreux', zip: '1820', age: 29, env: ['enfant', 'appartement'] },
            { firstName: 'David', lastName: 'Bienne', email: 'david@adopter.ch', city: 'Bienne', zip: '2500', age: 42, env: ['voiture'] },
            { firstName: 'Emma', lastName: 'Gruyère', email: 'emma@adopter.ch', city: 'Bulle', zip: '1630', age: 31, env: ['chat', 'enfant'] }
        ].map(a => ({
            ...a,
            password: 'password123',
            address: { zip: a.zip, city: a.city },
            about: 'Je cherche un nouveau membre pour ma famille.',
            image: `https://i.pravatar.cc/150?u=${a.firstName}`,
            preferences: { environment: a.env, species: ['chien', 'chat'], sizePreference: ['petit', 'moyen'] }
        }));

        await Adopter.create(adoptersData);
        console.log('✓ 5 Adopters créés');

        // 4. Seed 10 Animaux avec variations
        const animalsMeta = [
            { name: 'Mimi', species: 'chat', age: '1-3', sex: 'female', race: 'Européen', size: 'petit', weight: '0-5', env: ['appartement'], dress: ['éduqué'], pers: ['calme', 'câlin'] },
            { name: 'Rex', species: 'chien', age: '3-7', sex: 'male', race: 'Labrador', size: 'grand', weight: '20-30', env: ['enfant', 'voiture'], dress: ['habitué à la laisse'], pers: ['protecteur', 'affectueux'] },
            { name: 'Luna', species: 'chat', age: '1-3', sex: 'female', race: 'Siamois', size: 'petit', weight: '0-5', env: ['appartement'], dress: ['éduqué'], pers: ['bavard', 'joueur'] },
            { name: 'Simba', species: 'chat', age: '0-1', sex: 'male', race: 'Maine Coon', size: 'grand', weight: '5-10', env: ['enfant', 'autre animaux'], dress: ['facile à dresser'], pers: ['explorateur', 'sociable'] },
            { name: 'Oscar', species: 'chien', age: '7+', sex: 'male', race: 'Bouledogue', size: 'moyen', weight: '10-20', env: ['appartement'], dress: ['têtu'], pers: ['calme', 'indépendant'] },
            { name: 'Fritz', species: 'chien', age: '3-7', sex: 'male', race: 'Teckel', size: 'petit', weight: '5-10', env: ['voiture'], dress: ['têtu'], pers: ['territorial', 'protecteur'] },
            { name: 'Yuki', species: 'chien', age: '1-3', sex: 'female', race: 'Shiba Inu', size: 'moyen', weight: '5-10', env: ['chien'], dress: ['facile à dresser'], pers: ['énergique', 'curieux'] },
            { name: 'Perle', species: 'chat', age: '7+', sex: 'female', race: 'Persan', size: 'petit', weight: '0-5', env: ['appartement'], dress: ['éduqué'], pers: ['timide', 'calme'] },
            { name: 'Blue', species: 'chien', age: '1-3', sex: 'male', race: 'Berger Australien', size: 'grand', weight: '20-30', env: ['enfant', 'voiture'], dress: ['facile à dresser'], pers: ['énergique', 'joueur'] },
            { name: 'Grisou', species: 'chat', age: '3-7', sex: 'male', race: 'Chartreux', size: 'moyen', weight: '5-10', env: ['appartement'], dress: ['éduqué'], pers: ['calme', 'affectueux'] }
        ];

        console.log('Chargement des images d\'animaux...');
        for (let i = 0; i < animalsMeta.length; i++) {
            const meta = animalsMeta[i];
            const img = await getAnimalImage(meta.species);
            const owner = createdOwners[i % createdOwners.length];

            await Animal.create({
                ...meta,
                address: owner.address,
                price: 50 + (i * 10),
                ownerId: owner._id,
                image: img,
                description: `Un merveilleux ${meta.species} qui cherche son foyer pour la vie.`,
                availability: i % 4 !== 0, // Certains sont marqués comme non disponibles
                characteristics: {
                    environment: meta.env,
                    dressage: meta.dress,
                    personality: meta.pers
                }
            });
        }

        console.log('✓ 10 Animaux créés avec caractéristiques variées');
        console.log('--- SEEDING TERMINÉ ---');
        process.exit(0);
    } catch (err) {
        console.error('Erreur Seeding:', err);
        process.exit(1);
    }
};

seed();