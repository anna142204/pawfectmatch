import 'dotenv/config';
import mongoose from 'mongoose';
import Adopter from './models/adopter.js';
import Owner from './models/owner.js';
import Admin from './models/admin.js';
import Animal from './models/animal.js';
import Match from './models/match.js';
import { getGeoJSON } from './utils/geocoder.mjs';

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/pawfect_match';

const seed = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('--- Connexion MongoDB réussie ---');

        // Nettoyage
        console.log('Nettoyage de la base de données...');
        await Promise.all([
            Adopter.deleteMany({}),
            Owner.deleteMany({}),
            Admin.deleteMany({}),
            Animal.deleteMany({}),
            Match.deleteMany({})
        ]);

        // --- 1. CRÉATION DES OWNERS ---
        console.log('Création des Owners...');
        
        const ownersSource = [
            { firstName: 'Marc', lastName: 'Rochat', email: 'marc@refuge.ch', societyName: 'Refuge de Cossonay', city: 'Cossonay', zip: '1304', imgId: 'marc' },
            { firstName: 'Julie', lastName: 'Bernasconi', email: 'julie@asso.ch', societyName: 'Pattes Genevoises', city: 'Genève', zip: '1201', imgId: 'julie' },
            { firstName: 'Thomas', lastName: 'Dubois', email: 'thomas@particulier.ch', societyName: null, city: 'Neuchâtel', zip: '2000', imgId: 'thomas' },
            { firstName: 'Elena', lastName: 'Monnier', email: 'elena@paws.ch', societyName: 'Fribourg Animaux', city: 'Fribourg', zip: '1700', imgId: 'elena' },
            { firstName: 'Sébastien', lastName: 'Fournier', email: 'seb@particulier.ch', societyName: null, city: 'Sion', zip: '1950', imgId: 'seb' }
        ];

        const ownersToCreate = [];

        for (const o of ownersSource) {
            const location = await getGeoJSON(o.zip, o.city);
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            ownersToCreate.push({
                ...o,
                password: 'password123',
                address: { zip: o.zip, city: o.city },
                location: location, 
                phoneNumber: '079' + Math.floor(1000000 + Math.random() * 9000000),
                image: `https://ui-avatars.com/api/?name=${o.firstName}+${o.lastName}&background=random&size=200`,
                about: o.societyName ? `Structure professionnelle : ${o.societyName}.` : `Particulier passionné d'animaux.`
            });
            console.log(`> Préparé: ${o.firstName} (${o.city})`);
        }

        const createdOwners = await Owner.create(ownersToCreate);
        console.log(`✓ ${createdOwners.length} Owners créés avec succès`);


        // --- 2. CRÉATION DES ADOPTERS ---
        console.log('Création des Adopters...');

        const adoptersSource = [
            { firstName: 'Alice', lastName: 'Martin', email: 'alice@adopter.ch', city: 'Lausanne', zip: '1003', age: 24, env: ['appartement'] },
            { firstName: 'Benoit', lastName: 'Favre', email: 'ben@adopter.ch', city: 'Delémont', zip: '2800', age: 35, env: ['voiture', 'chien'] },
            { firstName: 'Chloé', lastName: 'Blanc', email: 'chloe@adopter.ch', city: 'Montreux', zip: '1820', age: 29, env: ['enfant', 'appartement'] },
            { firstName: 'David', lastName: 'Girard', email: 'david@adopter.ch', city: 'Bienne', zip: '2500', age: 42, env: ['voiture'] },
            { firstName: 'Emma', lastName: 'Schneider', email: 'emma@adopter.ch', city: 'Bulle', zip: '1630', age: 31, env: ['chat', 'enfant'] }
        ];

        const adoptersToCreate = [];

        for (const a of adoptersSource) {
            const location = await getGeoJSON(a.zip, a.city);
            await new Promise(resolve => setTimeout(resolve, 1000)); 

            adoptersToCreate.push({
                ...a,
                password: 'password123',
                address: { zip: a.zip, city: a.city },
                location: location,
                about: 'Je cherche un nouveau membre pour ma famille.',
                image: `https://ui-avatars.com/api/?name=${a.firstName}+${a.lastName}&background=random&size=200`,
                preferences: { environment: a.env, species: ['chien', 'chat'], sizePreference: ['petit', 'moyen'] }
            });
            console.log(`> Préparé: ${a.firstName} (${a.city})`);
        }

        await Adopter.create(adoptersToCreate);
        console.log(`✓ ${adoptersToCreate.length} Adopters créés avec succès`);


        // --- 3. CRÉATION DES ANIMAUX (Liés aux Owners existants) ---
        const animalsSource = [
            // CHIENS
            {
                name: 'Rocky', species: 'chien', race: 'Golden Retriever', age: '1-3', sex: 'male', size: 'grand', weight: '20-30',
                images: ['https://images.unsplash.com/photo-1633722715463-d30f4f325e24?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un Golden Retriever plein d\'énergie, adore les balades en forêt et nager.',
                env: ['enfant', 'voiture', 'chien'], dress: ['éduqué'], pers: ['énergique', 'joueur', 'sociable']
            },
            {
                name: 'Bella', species: 'chien', race: 'Bulldog Français', age: '3-7', sex: 'female', size: 'petit', weight: '10-20',
                images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'],
                desc: 'Une petite boule d\'amour qui préfère le canapé aux longues randonnées.',
                env: ['appartement'], dress: ['têtu'], pers: ['calme', 'câlin', 'timide']
            },
            {
                name: 'Max', species: 'chien', race: 'Berger Allemand', age: '3-7', sex: 'male', size: 'grand', weight: '30+',
                images: ['https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=80'],
                desc: 'Chien très intelligent et loyal. Il a besoin d\'un maître expérimenté.',
                env: ['voiture', 'autre animaux'], dress: ['éduqué', 'habitué à la laisse'], pers: ['protecteur', 'curieux', 'territorial']
            },
            {
                name: 'Daisy', species: 'chien', race: 'Corgi', age: '1-3', sex: 'female', size: 'petit', weight: '10-20',
                images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80'],
                desc: 'Toujours joyeuse, Daisy adore tout le monde. Parfaite pour une première adoption.',
                env: ['appartement', 'enfant'], dress: ['facile à dresser'], pers: ['joueur', 'sociable', 'curieux']
            },
            {
                name: 'Thor', species: 'chien', race: 'Husky', age: '1-3', sex: 'male', size: 'grand', weight: '20-30',
                images: ['https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un grand sportif ! Il a besoin de courir tous les jours. Très bavard.',
                env: ['voiture', 'chien'], dress: ['têtu'], pers: ['énergique', 'bavard', 'indépendant']
            },
            {
                name: 'Ruby', species: 'chien', race: 'Cavalier King Charles', age: '7+', sex: 'female', size: 'petit', weight: '5-10',
                images: ['https://images.unsplash.com/photo-1599889959407-598566c6e1f1?auto=format&fit=crop&w=800&q=80'],
                desc: 'Une dame âgée très douce qui cherche un panier retraite confortable.',
                env: ['appartement', 'chat'], dress: ['éduqué'], pers: ['calme', 'affectueux', 'timide']
            },
            {
                name: 'Cooper', species: 'chien', race: 'Labrador', age: '0-1', sex: 'male', size: 'grand', weight: '20-30',
                images: ['https://images.unsplash.com/photo-1605897472359-8d6d60a95d13?auto=format&fit=crop&w=800&q=80'],
                desc: 'Encore un chiot dans sa tête, il fait quelques bêtises mais est adorable.',
                env: ['enfant', 'chien'], dress: ['facile à dresser'], pers: ['joueur', 'curieux', 'sociable']
            },
            {
                name: 'Lola', species: 'chien', race: 'Beagle', age: '3-7', sex: 'female', size: 'moyen', weight: '10-20',
                images: ['https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un nez incroyable ! Attention à ne pas laisser traîner de nourriture.',
                env: ['voiture', 'enfant'], dress: ['têtu', 'habitué à la laisse'], pers: ['curieux', 'indépendant', 'sociable']
            },

            // CHATS
            {
                name: 'Misty', species: 'chat', race: 'Européen', age: '1-3', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80'],
                desc: 'Une chatte tigrée très indépendante mais qui vient réclamer des câlins le soir.',
                env: ['appartement', 'chat'], dress: ['éduqué'], pers: ['indépendant', 'calme']
            },
            {
                name: 'Garfield', species: 'chat', race: 'Roux', age: '7+', sex: 'male', size: 'grand', weight: '5-10',
                images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un gros pépère qui passe ses journées à dormir au soleil.',
                env: ['appartement'], dress: ['éduqué'], pers: ['calme', 'affectueux']
            },
            {
                name: 'Salem', species: 'chat', race: 'Noir', age: '0-1', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un petit diable noir, très joueur et parfois un peu griffu quand il s\'excite.',
                env: ['appartement'], dress: ['têtu'], pers: ['énergique', 'joueur', 'curieux']
            },
            {
                name: 'Duchesse', species: 'chat', race: 'Persan', age: '3-7', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1610996872580-c24430e3714b?auto=format&fit=crop&w=800&q=80'],
                desc: 'Une princesse qui demande beaucoup d\'entretien pour son pelage.',
                env: ['appartement'], dress: ['éduqué'], pers: ['calme', 'indépendant']
            },
            {
                name: 'Leo', species: 'chat', race: 'Maine Coon', age: '1-3', sex: 'male', size: 'grand', weight: '10-20',
                images: ['https://images.unsplash.com/photo-1587132924196-85750d5272c7?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un géant doux. Il s\'entend bien avec les chiens et adore l\'eau.',
                env: ['chien', 'autre animaux'], dress: ['facile à dresser'], pers: ['sociable', 'affectueux', 'bavard']
            },
            {
                name: 'Nala', species: 'chat', race: 'Siamois', age: '3-7', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=800&q=80'],
                desc: 'Très vocale, elle vous racontera toute sa journée quand vous rentrez.',
                env: ['appartement'], dress: ['éduqué'], pers: ['bavard', 'affectueux', 'curieux']
            },
            
            // AUTRES
            {
                name: 'Panpan', species: 'lapin', race: 'Bélier', age: '0-1', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1589952283406-b53a7d1347e8?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un lapin bélier adorable. Il vit en liberté dans l\'appartement (propre).',
                env: ['appartement'], dress: ['éduqué'], pers: ['timide', 'curieux']
            },
            {
                name: 'Bugs', species: 'lapin', race: 'Nain', age: '1-3', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1591382386627-349b692688ff?auto=format&fit=crop&w=800&q=80'],
                desc: 'Elle adore grignoter les carottes et faire des bonds dans l\'appartement.',
                env: ['appartement', 'enfant'], dress: ['têtu'], pers: ['énergique', 'joueur']
            },
            {
                name: 'Coco', species: 'oiseau', race: 'Perroquet', age: '7+', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1549402636-c60317e0828e?auto=format&fit=crop&w=800&q=80'],
                desc: 'Un perroquet qui sait dire "Bonjour" et siffler la Marseillaise.',
                env: ['appartement'], dress: ['facile à dresser'], pers: ['bavard', 'curieux']
            },
            {
                name: 'Rio', species: 'oiseau', race: 'Ara', age: '7+', sex: 'male', size: 'moyen', weight: '0-5',
                images: ['https://images.unsplash.com/photo-1552071379-05006b5276e0?auto=format&fit=crop&w=800&q=80'],
                desc: 'Magnifique plumage. Il a besoin de beaucoup d\'attention et d\'espace.',
                env: ['autre animaux'], dress: ['têtu'], pers: ['bavard', 'territorial']
            }
        ];

        console.log('Création des animaux...');
        
        for (let i = 0; i < animalsSource.length; i++) {
            const data = animalsSource[i];
            const owner = createdOwners[i % createdOwners.length];

            await Animal.create({
                name: data.name,
                species: data.species,
                race: data.race,
                age: data.age,
                sex: data.sex,
                size: data.size,
                weight: data.weight,
                images: data.images,
                description: data.desc,
                address: owner.address,
                price: Math.floor(Math.random() * 200) + 50,
                ownerId: owner._id,
                availability: true,
                characteristics: {
                    environment: data.env,
                    dressage: data.dress,
                    personality: data.pers
                }
            });
        }

        console.log(`✓ ${animalsSource.length} Animaux créés avec succès`);
        console.log('--- SEEDING TERMINÉ ---');
        process.exit(0);
    } catch (err) {
        console.error('Erreur Seeding:', err);
        process.exit(1);
    }
};

seed();