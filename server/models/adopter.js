import mongoose from 'mongoose';
const { Schema } = mongoose;

const adopterSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    address: {
        zip: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
    },
    age: {
        type: Number,
        required: true,
        min: 18,
    },
    about: {
        type: String,
        required: true,
        maxlength: 150,
        trim: true,
    },
    preferences: {
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
        species: {
            type: [String],
            required: false,
            trim: true,
        },
        sizePreference: {
            type: [String],
            required: false,
            enum: ['petit', 'moyen', 'grand'],
        },
    },
}, {
    timestamps: true,
});

export default mongoose.model('Adopter', adopterSchema);
