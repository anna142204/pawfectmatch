import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

function validateGeoJsonCoordinates(value) {
    return Array.isArray(value) && value.length >= 2 && value.length <= 3 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
}

const adopterSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        maxlength: 254,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 128,
    },
    address: {
        zip: {
            type: String,
            required: true,
            trim: true,
            maxlength: 12,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [Longitude, Latitude]
            validate: {
                validator: validateGeoJsonCoordinates,
                message: '{VALUE} n\'est pas valide.'
            },
            default: [8.2275, 46.8182]
        }
    },
    age: {
        type: Number,
        required: true,
        min: 18,
    },
    about: {
        type: String,
        required: false,
        maxlength: 150,
        trim: true,
    },
    preferences: {
        species: {
            type: [{
                type: String,
                enum: ['chat', 'chien', 'lapin', 'oiseau', 'rongeur', 'autre'],
                maxlength: 50
            }],
            required: false,
            default: [],
        },
        size: {
            type: [{
                type: String,
                maxlength: 10,
                enum: ['petit', 'moyen', 'grand'],
            }],
            required: false,
            default: [],
        },
        age: {
            type: [{
                type: String,
                maxlength: 10,
                enum: ['0-1', '1-3', '3-7', '7+'],
            }],
            required: false,
            default: [],
        },
        weight: {
            type: [{
                type: String,
                maxlength: 10,
                enum: ['0-5', '5-10', '10-20', '20-30', '30+'],
            }],
            required: false,
            default: [],
        },
        sex: {
            type: [{
                type: String,
                maxlength: 10,
                enum: ['male', 'female'],
            }],
            required: false,
            default: [],
        },
        dressage: {
            type: [{
                type: String,
                maxlength: 30,
                enum: ['éduqué', 'facile à dresser', 'habitué à la laisse', 'têtu'],
            }],
            required: false,
            default: [],
        },
        personality: {
            type: [{
                type: String,
                maxlength: 30,
                enum: [
                    'calme', 'énergique', 'indépendant', 'affectueux', 'curieux',
                    'joueur', 'bavard', 'explorateur', 'câlin', 'protecteur',
                    'territorial', 'sociable', 'timide', 'peureux'
                ],
            }],
            required: false,
            default: [],
        },
        environment: {
            type: [{
                type: String,
                maxlength: 30,
                enum: ['appartement', 'voiture', 'enfant', 'chien', 'chat', 'autre animaux'],
            }],
            required: false,
            default: [],
        },
        maxPrice: {
            type: Number,
            required: false,
            min: 0,
        },
        maxDistance: {
            type: Number,
            required: false,
            min: 0,
        },
    },
    image: {
        type: String,
        required: false,
        trim: true,
        maxlength: 500,
        default: '',
    },
}, {
    timestamps: true,
});

adopterSchema.index({ location: '2dsphere' });

// Hash password before saving
adopterSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password for login
adopterSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON responses
adopterSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model('Adopter', adopterSchema);
