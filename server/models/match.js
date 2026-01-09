import mongoose from 'mongoose';
const { Schema } = mongoose;

const matchSchema = new Schema({
    adopterId: {
        type: Schema.Types.ObjectId,
        ref: 'Adopter',
        required: true,
    },
    animalId: {
        type: Schema.Types.ObjectId,
        ref: 'Animal',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['en_attente', 'refusé', 'validé', 'adopté'],
        default: 'en_attente'
    },
    discussion: [
        {
            sender: {
                type: Schema.Types.ObjectId,
                refPath: 'discussion.senderModel', // permet d'avoir soit un Adopter, soit un Owner
                required: true,
            },
            senderModel: {
                type: String,
                required: true,
                enum: ['Adopter', 'Owner'], // indique le type d'utilisateur
                maxlength: 20,
            },
            message: {
                type: String,
                required: true,
                trim: true,
                maxlength: 1000,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, {
    timestamps: true,
});

export default mongoose.model('Match', matchSchema);
