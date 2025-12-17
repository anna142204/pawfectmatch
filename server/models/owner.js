import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

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
    societyName: {
        type: String,
        required: false,
        trim: true,
        maxlength: 150,
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true,
        maxlength: 30,
    },
    about: {
        type: String,
        required: false,
        maxlength: 150,
        trim: true,
    },
}, {
    timestamps: true,
});

// Hash password before saving
ownerSchema.pre('save', async function(next) {
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
ownerSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON responses
ownerSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model('Owner', ownerSchema);