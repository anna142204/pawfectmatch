import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

function validateGeoJsonCoordinates(value) {
    return Array.isArray(value) && 
           value.length >= 2 && 
           value.length <= 3 && 
           value[0] >= -180 && value[0] <= 180 && // Longitude
           value[1] >= -90 && value[1] <= 90;     // Latitude
}

const ownerSchema = new Schema({
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
        match: [/^\S+@\S+\.\S+$/, 'Format email invalide'],
        maxlength: 254,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 128,
    },
    address: {
        zip: { type: String, required: true, trim: true, maxlength: 12 },
        city: { type: String, required: true, trim: true, maxlength: 100 },
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number], // [Longitude, Latitude]
            required: true,
            validate: {
                validator: validateGeoJsonCoordinates,
                message: '{VALUE} n\'est pas un tableau de coordonnées valide'
            },
            default: [8.2275, 46.8182]
        }
    },
    societyName: { type: String, required: false, trim: true, maxlength: 150 },
    phoneNumber: { type: String, required: false, trim: true, maxlength: 30 },
    about: { type: String, required: false, maxlength: 150, trim: true },
    image: { type: String, required: false, trim: true, maxlength: 500, default: '' },
}, {
    timestamps: true,
});

// Index géospatial pour la carte et les recherches de proximité
ownerSchema.index({ location: '2dsphere' });

// Hashage du mot de passe
ownerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) { next(err); }
});

ownerSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

ownerSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model('Owner', ownerSchema);