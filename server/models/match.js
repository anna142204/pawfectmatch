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
        default: true,
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
            },
            message: {
                type: String,
                required: true,
                trim: true,
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
