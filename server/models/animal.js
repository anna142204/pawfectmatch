import mongoose from 'mongoose';
const { Schema } = mongoose;

const animalSchema = new Schema({
    species: {
        type: String,
        required: true,
        enum: ['chat', 'chien', 'lapin', 'oiseau', 'rongeur', 'autre'],
        trim: true,
        maxlength: 50,
    },
    race: {
        type: String,
        required: false,
        trim: true,
        maxlength: 80,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
    },
    age: {
        type: String,
        required: true,
        enum: ['0-1', '1-3', '3-7', '7+'],
    },
    sex: {
        type: String,
        enum: ['male', 'female'],
        required: true,
        maxlength: 10,
    },
    size: {
        type: String,
        enum: ['petit', 'moyen', 'grand'],
        required: false,
        maxlength: 10,
    },
    weight: {
        type: String,
        enum: ['0-5', '5-10', '10-20', '20-30', '30+'],
        required: false,
        maxlength: 10,
    },
    address: {
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        zip: {
            type: String,
            required: true,
            trim: true,
            maxlength: 12,
        },
    },
    images: {
    type: [String],
    required: true,
    validate: {
        validator: function(v) {
            return v && v.length > 0;
        },
        message: 'Vous devez ajouter au moins une image.'
    }
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
                maxlength: 30,
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
                maxlength: 30,
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
                maxlength: 30,
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
