import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

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
        environment: {
            type: [{
                type: String,
                maxlength: 30,
                enum: ['appartement', 'voiture', 'enfant', 'chien', 'chat', 'autre animaux'],
            }],
            required: false,
            default: [],
        },
        species: {
            type: [{ type: String, maxlength: 50 }],
            required: false,
            default: [],
        },
        sizePreference: {
            type: [{
                type: String,
                maxlength: 10,
                enum: ['petit', 'moyen', 'grand'],
            }],
            required: false,
            default: [],
        },
    },
}, {
    timestamps: true,
});

// Hash password before saving
adopterSchema.pre('save', async function(next) {
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
adopterSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON responses
adopterSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model('Adopter', adopterSchema);
