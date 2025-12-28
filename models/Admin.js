const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
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
    officialEmail: {
        type: String,
        required: true,
        unique: true
    },
    officeId: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before saving - FIXED VERSION
AdminSchema.pre('save', async function() {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
AdminSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);