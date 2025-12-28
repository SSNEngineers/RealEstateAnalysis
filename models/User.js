const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        default: 'user'
    },
    // ✅ NEW: Track analysis count
    analysisCount: {
        type: Number,
        default: 0
    },
    // ✅ NEW: Track last activity
    lastActivity: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before saving - FIXED VERSION
UserSchema.pre('save', async function() {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ NEW: Update last activity
UserSchema.methods.updateActivity = function() {
    this.lastActivity = Date.now();
    return this.save();
};

module.exports = mongoose.model('User', UserSchema);