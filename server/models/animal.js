import mongoose from 'mongoose';
const { Schema } = mongoose;

const animalSchema = new Schema({
    species: {
        type: String,
        required: true,
        trim: true,
    },
    race: {
        type: String,
        required: false,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    age: {
        type: Number,
        required: true,
        min: 0,
    },
    sex: {
        type: String,
        enum: ['male', 'female'],
        required: true,
    },
    address: {
        city: {
            type: String,
            required: true,
            trim: true,
        },
        zip: {
            type: String,
            required: true,
            trim: true,
        },
    },
    image: {
        type: String,
        required: true, // URL ou chemin d’image obligatoire
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'Owner',
        required: true,
    },
    availability: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 300,
        trim: true,
    },
    characteristics: {
        environment: {
            type: [{
                type: String,
                enum: ['appartement', 'voiture', 'enfant', 'chien', 'chat', 'autre animaux'],
            }],
            required: true,
            validate: {
                validator: v => Array.isArray(v) && v.length > 0,
                message: 'Le tableau environment doit contenir au moins un élément valide.',
            },
        },
        dressage: {
            type: [{
                type: String,
                enum: ['éduqué', 'facile à dresser', 'habitué à la laisse', 'têtu'],
            }],
            required: true,
            validate: {
                validator: v => Array.isArray(v) && v.length > 0,
                message: 'Le tableau dressage doit contenir au moins un élément valide.',
            },
        },
        personality: {
            type: [{
                type: String,
                enum: [
                    'calme', 'énergique', 'indépendant', 'affectueux', 'curieux',
                    'joueur', 'bavard', 'explorateur', 'câlin', 'protecteur',
                    'territorial', 'sociable', 'timide', 'peureux'
                ],
            }],
            required: true,
            validate: {
                validator: v => Array.isArray(v) && v.length > 0,
                message: 'Le tableau personality doit contenir au moins un élément valide.',
            },
        },
    },
}, {
    timestamps: true,
});

export default mongoose.model('Animal', animalSchema);
