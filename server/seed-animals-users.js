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
            {
                name: 'Daxon', species: 'chien', race: 'Autre / Croisé', age: '0-1', sex: 'male', size: 'moyen', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619478/Daxon_Puppy_y0mhst.jpg'],
                desc: 'Un petit aventurier très attentif qui adore porter son harnais pour partir en promenade.',
                env: ['enfant', 'autre animaux', 'voiture'], dress: ['facile à dresser'], pers: ['curieux', 'sociable', 'énergique']
            },
            {
                name: 'Cute', species: 'chien', race: 'Autre / Croisé', age: '0-1', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619481/Cute_Puppy_-_panoramio_kdpaj7.jpg'],
                desc: 'Une petite boule de poils noire très calme qui aime se blottir dans des endroits douillets.',
                env: ['appartement', 'enfant'], dress: ['éduqué'], pers: ['calme', 'affectueux', 'timide']
            },
            {
                name: 'Blacky', species: 'chien', race: 'Autre / Croisé', age: '0-1', sex: 'male', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619481/Black_puppy_in_Bhutan_jg33fp.jpg'],
                desc: 'Un chiot courageux qui n’a pas peur de se salir les pattes lors des explorations en extérieur.',
                env: ['autre animaux', 'chien'], dress: ['têtu'], pers: ['explorateur', 'énergique', 'curieux']
            },
            {
                name: 'Zar', species: 'chien', race: 'Borzoi', age: '0-1', sex: 'male', size: 'grand', weight: '10-20',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619519/Borzoi_puppy_on_sofa_0293_zbrrxw.jpg'],
                desc: 'Très élégant avec son long museau, il est déjà très calme et posé pour son jeune âge.',
                env: ['appartement', 'enfant'], dress: ['éduqué'], pers: ['calme', 'indépendant', 'câlin']
            },
            {
                name: 'Shorty', species: 'chien', race: 'Welsh Corgi', age: '0-1', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619480/Corgi_Puppy_wgmo4p.jpg'],
                desc: 'Petite par la taille mais grande par le caractère, elle saura vous faire rire avec ses expressions.',
                env: ['appartement', 'enfant', 'voiture'], dress: ['facile à dresser'], pers: ['joueur', 'sociable', 'curieux']
            },
            {
                name: 'Barbarella', species: 'chien', race: 'Chien Chinois à Crête', age: '0-1', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619482/Barbarella_the_Chinese_crested_puppy__72353_vydrjd.jpg'],
                desc: 'Une petite chienne au look unique et exotique, extrêmement attachée à ses maîtres.',
                env: ['appartement', 'autre animaux'], dress: ['facile à dresser'], pers: ['affectueux', 'câlin', 'sociable']
            },
            {
                name: 'Cloudy', species: 'chien', race: 'Samoyède', age: '0-1', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619479/Cloudy_puppy_u4vlix.jpg'],
                desc: 'Aussi blanc et doux qu’un nuage, il est toujours en quête d’une nouvelle bêtise à faire.',
                env: ['appartement', 'chien'], dress: ['têtu'], pers: ['énergique', 'joueur', 'curieux']
            },
            {
                name: 'Reggie', species: 'chien', race: 'Autre / Croisé', age: '3-7', sex: 'female', size: 'petit', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619520/Sitting_dogs_in_Philippines__Region_3__2023-07-26__E911a_13_c7ytn8.jpg'],
                desc: 'Une petite lady très bien éduquée qui adore porter ses vêtements d’hiver pour rester au chaud.',
                env: ['appartement', 'enfant', 'voiture'], dress: ['éduqué'], pers: ['sociable', 'calme', 'affectueux']
            },
            {
                name: 'Polux', species: 'chien', race: 'Bouvier d’Entlebuch', age: '0-1', sex: 'male', size: 'moyen', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619483/Entlebucher_Puppy_on_lawn_f13jfr.jpg'],
                desc: 'Un regard irrésistible et une loyauté sans faille. Il apprend très vite les nouveaux ordres.',
                env: ['enfant', 'chien', 'autre animaux'], dress: ['facile à dresser'], pers: ['protecteur', 'affectueux', 'énergique']
            },
            {
                name: 'Bayka', species: 'chien', race: 'Autre / Croisé', age: '0-1', sex: 'female', size: 'moyen', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619479/Bayka_2_yvdzln.jpg'],
                desc: 'Une magnifique chienne aux yeux clairs, très vive et prête à découvrir le monde.',
                env: ['voiture', 'chien', 'enfant'], dress: ['habitué à la laisse'], pers: ['explorateur', 'curieux', 'énergique']
            },
            {
                name: 'Sherpa', species: 'chien', race: "Berger de l'Himalaya", age: '7+', sex: 'male', size: 'grand', weight: '30+',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619521/Gaddi_dogs_of_Himachal_s5pftv.jpg'],
                desc: 'Un vieux sage à la fourrure épaisse, habitué au grand air et aux climats frais.',
                env: ['autre animaux', 'chien'], dress: ['têtu'], pers: ['indépendant', 'calme', 'territorial']
            },
            {
                name: 'Woof', species: 'chien', race: 'Alaskan Malamute', age: '3-7', sex: 'female', size: 'grand', weight: '30+',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619522/Alaskan_Malamute_R_Bartz_mwriaz.jpg'],
                desc: 'Une force de la nature qui ne demande qu’à courir dans de grands espaces. Très fidèle.',
                env: ['enfant', 'chien', 'voiture'], dress: ['habitué à la laisse'], pers: ['énergique', 'explorateur', 'sociable']
            },
            {
                name: 'Tyson', species: 'chien', race: 'Boxer', age: '3-7', sex: 'male', size: 'moyen', weight: '20-30',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767619524/images_2_ulwsw6.jpg'],
                desc: 'Un chien athlétique et fier qui adore passer ses après-midi à surveiller le jardin depuis l’herbe.',
                env: ['enfant', 'voiture'], dress: ['éduqué'], pers: ['calme', 'protecteur', 'affectueux']
            },
            {
                name: 'Praline', species: 'chien', race: 'Caniche', age: '3-7', sex: 'female', size: 'petit', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620620/Dogs_of_Taiwan_-_20180429_-_02_ghptvx.jpg', 'https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620620/Dogs_of_Taiwan_-_20180429_-_03_yobb9r.jpg', 'https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620621/Dogs_of_Taiwan_-_20180429_-_04_qfec9h.jpg'],
                desc: 'Très élégante avec son petit nœud bleu, elle adore être le centre de l’attention lors des grands événements.',
                env: ['appartement', 'enfant', 'voiture'], dress: ['éduqué'], pers: ['sociable', 'affectueux', 'joueur']
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
            {
                name: 'Fuji', species: 'chat', race: 'Siamois', age: '0-1', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617600/Capture_d_%C3%A9cran_2026-01-05_131213_tftnlk.png', 'https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617601/Capture_d_%C3%A9cran_2026-01-05_131205_oc2juh.png'],
                desc: 'Très vocale, elle vous racontera toute sa journée quand vous rentrez.',
                env: ['appartement', 'autre animaux', 'enfant'], dress: ['facile à dresser'], pers: ['sociable', 'affectueux', 'curieux']
            },
            {
                name: 'Simba', species: 'chat', race: 'Maine Coon', age: '3-7', sex: 'male', size: 'grand', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617580/64003442-3412-4284-93B0-F3526B486CAE_1_105_c-r3j5jgsy85l98i9r3dlmakj3jgue9niglgpascfs9e_bivywb.webp'],
                desc: 'Un véritable géant au cœur tendre qui adore observer le jardin depuis son perchoir.',
                env: ['enfant', 'chien', 'autre animaux'], dress: ['éduqué'], pers: ['calme', 'affectueux', 'protecteur']
            },
            {
                name: 'Luna', species: 'chat', race: 'Bengal', age: '1-3', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617580/4089182635_2fac8ab56b_b_kh0mu9.jpg'],
                desc: 'Très active et athlétique, elle a besoin de beaucoup de stimulation et de jeux interactifs.',
                env: ['appartement', 'chat'], dress: ['facile à dresser', 'habitué à la laisse'], pers: ['énergique', 'joueur', 'explorateur']
            },
            {
                name: 'Missou', species: 'chat', race: 'British Shorthair', age: '0-1', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617581/Silver_Classic_Tabby_British_Shorthair_Kitten_owgvag.jpg'],
                desc: 'Toujours à la recherche de chaleur, il passera ses journées blotti contre vous ou sous un plaid.',
                env: ['appartement', 'enfant'], dress: ['facile à dresser'], pers: ['sociable', 'câlin', 'curieux']
            },
            {
                name: 'Bobine', species: 'chat', race: 'Bleu Russe', age: '7+', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617579/12971548714_b4cbbaf81d_b_fhshld.jpg'],
                desc: 'Une demoiselle discrète qui apprécie le calme. Elle est un peu réservée au premier abord.',
                env: ['appartement'], dress: ['éduqué'], pers: ['calme', 'timide', 'indépendant']
            },
            {
                name: 'Biscuit', species: 'chat', race: 'British Shorthair', age: '1-3', sex: 'male', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617580/British_shorthair_house_cat_Mio_5_months_old_tvhpht.jpg'],
                desc: 'Avec sa bouille ronde et ses beaux yeux, il fait craquer tout le monde. Très zen.',
                env: ['appartement', 'enfant', 'chat'], dress: ['éduqué'], pers: ['calme', 'affectueux', 'sociable']
            },
            {
                name: 'Jack', species: 'chat', race: 'Européen (Gouttière)', age: '3-7', sex: 'male', size: 'moyen', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617579/White_Domestic_Shorthair_Cat_dholdj.jpg'],
                desc: 'Un aventurier qui a son petit caractère. Il sait exactement ce qu’il veut.',
                env: ['autre animaux', 'voiture'], dress: ['têtu'], pers: ['indépendant', 'explorateur', 'territorial']
            },
            {
                name: 'Piplette', species: 'chat', race: 'Maine Coon', age: '1-3', sex: 'female', size: 'grand', weight: '5-10',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767617579/Chat_cr%C3%A8me_yqkg7h.jpg'],
                desc: 'Une petite pile électrique qui grimpe partout. Sa curiosité n’a aucune limite.',
                env: ['appartement', 'chien'], dress: ['facile à dresser'], pers: ['curieux', 'énergique', 'bavard']
            },
            
            // LAPINS
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
                name: 'Dalmatien', species: 'lapin', race: 'Lapin Rex', age: '1-3', sex: 'male', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620853/Dalmatian_Pattern_Mini_Rex_ualm1l.jpg'],
                desc: 'Un lapin magnifique avec un pelage court et extrêmement doux au toucher, rappelant le velours.',
                env: ['appartement', 'enfant'], dress: ['éduqué'], pers: ['calme', 'curieux', 'sociable']
            },
            {
                name: 'Ciurbi', species: 'lapin', race: 'Lapin Tête de Lion', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620854/Ciurbi_dolodc.jpg'],
                desc: 'Un petit compagnon curieux avec une légère crinière de poils plus longs sur le sommet de la tête.',
                env: ['appartement', 'enfant', 'autre animaux'], dress: ['éduqué'], pers: ['curieux', 'sociable', 'calme']
            },
            {
                name: 'Ebène', species: 'lapin', race: 'Lapin Bélier', age: '0-1', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620855/Holland_Lop_Bunny_Standing_On_Her_Back_Feet_jiltth.jpg'],
                desc: 'Une petite boule de poils toute noire avec des oreilles tombantes adorables. Elle aime se tenir debout pour quémander des friandises.',
                env: ['appartement', 'enfant'], dress: ['éduqué'], pers: ['curieux', 'câlin', 'joueur']
            },
            {
                name: 'Yogurt', species: 'lapin', race: 'Lapin Angora', age: '1-3', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620856/Yoghurtkanin25_aq3xdo.jpg'],
                desc: 'Une véritable boule de coton sur pattes qui demande un brossage régulier pour garder son poil soyeux.',
                env: ['appartement', 'autre animaux'], dress: ['éduqué'], pers: ['calme', 'timide', 'affectueux']
            },
            {
                name: 'Caramel', species: 'lapin', race: 'Lapin de Garenne', age: '1-3', sex: 'male', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767620857/Pet_rabbit_in_a_cage_hnae8u.jpg'],
                desc: 'Un lapin vif et alerte qui adore grignoter son foin tout en observant ce qui se passe autour de sa cage.',
                env: ['appartement', 'enfant'], dress: ['éduqué'], pers: ['curieux', 'énergique', 'timide']
            },
            {
                name: 'Panpan', species: 'lapin', race: 'Lapin Nain', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621109/pexels-photo-3820509_injhla.jpg'],
                desc: 'Un petit lapin très vif avec un marquage original en forme de masque. Il est très curieux de son environnement.',
                env: ['appartement', 'enfant'], dress: ['éduqué'], pers: ['énergique', 'curieux', 'joueur']
            },
            {
                name: 'Nougat', species: 'lapin', race: 'Lapin Bélier', age: '1-3', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621180/640px-Pet_Bunny_4_2013-08-22_hcpsjn.jpg', 'https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621178/640px-Pet_Bunny_6_2013-07-27_w12j1v.jpg', 'https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621178/Bunny_4_2013-07-29_lwkmzl.jpg'],
                desc: 'Adorable avec ses taches rousses et ses longues oreilles tombantes, elle est d’un naturel très calme.',
                env: ['appartement', 'autre animaux'], dress: ['éduqué'], pers: ['calme', 'affectueux', 'sociable']
            },

            //OISEAUX
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
            },
            {
                name: 'Pikachu', species: 'oiseau', race: 'Perruche Calopsitte', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621291/images_me0ysp.jpg'],
                desc: 'Reconnaissable à ses joues oranges et sa crête expressive, il adore siffler pour attirer l’attention.',
                env: ['appartement', 'enfant'], dress: ['facile à dresser'], pers: ['sociable', 'curieux', 'bavard']
            },
            {
                name: 'Etoile et Soleil', species: 'oiseau', race: 'Inséparable', age: '1-3', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621447/images_1_ttnria.jpg'],
                desc: 'Un duo inséparable aux couleurs éclatantes qui passera ses journées à bavarder et à prendre soin l’un de l’autre.',
                env: ['appartement'], dress: ['têtu'], pers: ['affectueux', 'énergique', 'territorial']
            },
            {
                name: 'Colette', species: 'oiseau', race: 'Poule / Coq', age: '1-3', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621451/AdobeStock_1840717259_lhzb7n.jpg'],
                desc: 'Une poule rousse très sociable qui adore fouiller le sol à la recherche de petits insectes.',
                env: ['autre animaux', 'enfant'], dress: ['éduqué'], pers: ['calme', 'explorateur', 'sociable']
            },
            {
                name: 'Azur', species: 'oiseau', race: 'Perruche Ondulée', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621449/blue-domestic-parrot-in-cage_ufzf57.jpg'],
                desc: 'Un petit oiseau aux couleurs éclatantes qui adore observer son environnement depuis son perchoir.',
                env: ['appartement', 'autre animaux'], dress: ['facile à dresser'], pers: ['curieux', 'énergique', 'joueur']
            },
            {
                name: 'Bob', species: 'oiseau', race: 'Canari', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621698/AdobeStock_171341824_g5zbcy.jpg', 'https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767621712/AdobeStock_171342063_iwopld.jpg'],
                desc: 'Un petit chanteur joyeux qui adore grignoter ses graines et faire sa toilette le matin.',
                env: ['appartement'], dress: ['éduqué'], pers: ['calme', 'sociable', 'curieux']
            },

            //RONGEURS
            {
                name: 'Chip', species: 'rongeur', race: 'Écureuil de Corée', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767622353/%D0%9A%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82_y0g39d.jpg'],
                desc: 'Un petit rongeur extrêmement vif et agile qui adore stocker ses graines dans ses abajoues.',
                env: ['appartement'], dress: ['têtu'], pers: ['énergique', 'curieux', 'explorateur']
            },
            {
                name: 'Plushka', species: 'rongeur', race: 'Chinchilla', age: '1-3', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767622463/ChinchillaPlushka_cxkjet.jpg'],
                desc: 'Une petite boule de poils incroyablement douce qui adore bondir partout et prendre des bains de poussière.',
                env: ['appartement'], dress: ['têtu'], pers: ['calme', 'timide', 'curieux']
            },
            {
                name: 'Gribouille', species: 'rongeur', race: 'Cochon d’Inde', age: '1-3', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767622602/Animal_Parcours_13_m5w4mk.jpg'],
                desc: 'Une petite gourmande tricolore qui adore se cacher dans le foin et couiner pour réclamer ses légumes.',
                env: ['appartement', 'enfant', 'autre animaux'], dress: ['éduqué'], pers: ['calme', 'sociable', 'peureux']
            },
            {
                name: 'Ratatouille', species: 'rongeur', race: 'Rat Domestique', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767622731/Pet_rat_eating_salad_leaves_n9icue.jpg'],
                desc: 'Un petit compagnon très intelligent et sociable qui adore grignoter des feuilles de salade fraîche.',
                env: ['appartement', 'enfant'], dress: ['facile à dresser'], pers: ['curieux', 'sociable']
            },

            //AUTRES
            {
                name: 'Neo', species: 'autre', race: 'Axolotl', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767622899/Ambystoma_mexicanum_Natural_History_Museum_University_of_Pisa_2_ujdhza.jpg'],
                desc: 'Un petit dragon d’eau fascinant avec ses branchies externes roses. Il passe ses journées à flotter paisiblement au fond de son aquarium.',
                env: ['autre animaux'], dress: ['éduqué'], pers: ['calme', 'curieux', 'timide']
            },
            {
                name: 'Tortue', species: 'autre', race: 'Tortue de Terre', age: '0-1', sex: 'female', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767623005/B%C3%A9b%C3%A9_tortue__tortillon__petit_de_la_tortue__monate__wolof__13_k1qbaz.jpg'],
                desc: 'Un adorable bébé tortue très calme qui adore se balader lentement sur le sable chaud.',
                env: ['autre animaux', 'enfant'], dress: ['éduqué'], pers: ['calme', 'timide', 'indépendant']
            },
            {
                name: 'Leo', species: 'autre', race: 'Gecko Léopard', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767623152/Afghan_Leopard_Gecko_jue8zr.jpg'],
                desc: 'Un petit reptile fascinant aux motifs tachetés rappelant un léopard. Il est très calme et facile à observer dans son terrarium.',
                env: ['autre animaux'], dress: ['éduqué'], pers: ['calme', 'timide', 'indépendant']
            },
            {
                name: 'Berlioz', species: 'autre', race: 'Furet', age: '1-3', sex: 'male', size: 'petit', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767623276/G%C3%B6r%C3%A9ny_m0dde2.jpg'],
                desc: 'Un petit moustachu plein de malice qui adore se faufiler partout et faire des siestes interminables dans des endroits improbables.',
                env: ['appartement', 'autre animaux'], dress: ['facile à dresser'], pers: ['joueur', 'curieux', 'énergique']
            },
            {
                name: 'Sly', species: 'autre', race: 'Python Royal', age: '3-7', sex: 'male', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767623388/Snake_s_nap_twr3cj.jpg'],
                desc: 'Un serpent magnifique et paisible qui passe la majeure partie de son temps enroulé dans son terrarium.',
                env: ['autre animaux'], dress: ['éduqué'], pers: ['calme', 'timide', 'indépendant']
            },
            {
                name: 'Nica', species: 'autre', race: 'Boa Constrictor', age: '0-1', sex: 'female', size: 'moyen', weight: '0-5',
                images: ['https://res.cloudinary.com/dzs3mwpgx/image/upload/v1767623504/Boa_constructor_Nica_de_9_meses_ipkxn0.jpg'],
                desc: 'Une jeune femelle curieuse qui se laisse facilement manipuler et apprécie explorer les bras de ses soigneurs.',
                env: ['autre animaux'], dress: ['éduqué'], pers: ['calme', 'curieux', 'affectueux']
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