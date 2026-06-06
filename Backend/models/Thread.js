import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ThreadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        default: "New Chat"
    },
    messages: [MessageSchema],

    // ✅ FIX (Quality): The old schema defined createdAt and updatedAt as plain
    // Date fields with `default: Date.now`. That works, but you have to remember
    // to manually set `thread.updatedAt = new Date()` on every save — and if you
    // ever forget, the field silently drifts out of sync.
    //
    // `timestamps: true` tells Mongoose to own those two fields completely:
    //   • createdAt is set once on insert and never touched again.
    //   • updatedAt is set on every .save() / findByIdAndUpdate() automatically.
    //
    // Existing documents are compatible — the field names are identical.
}, { timestamps: true });

export default mongoose.model("Thread", ThreadSchema);
