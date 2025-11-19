import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
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
