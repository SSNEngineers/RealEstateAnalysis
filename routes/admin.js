// backend/routes/admin.js - UPDATED WITH STATISTICS

const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware'); // ✅ ADD THIS LINE

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Admin Login
router.post('/login', async (req, res) => {
    const { username, password, officialEmail, officeId } = req.body;

    try {
        // Find admin with all matching fields
        const admin = await Admin.findOne({
            username,
            officialEmail: officialEmail.toLowerCase(),
            officeId
        }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials. Please verify all fields.'
            });
        }

        // Check password
        const isPasswordMatch = await admin.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials. Password incorrect.'
            });
        }

        // Generate token
        const token = generateToken(admin._id, admin.role);

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                officialEmail: admin.officialEmail,
                officeId: admin.officeId,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin login',
            error: error.message
        });
    }
});

// Create Initial Admin
const createInitialAdmin = async (req, res) => {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            username: process.env.ADMIN_USERNAME
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin account already exists'
            });
        }

        // Create admin from environment variables
        const admin = await Admin.create({
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            officialEmail: process.env.ADMIN_EMAIL,
            officeId: process.env.ADMIN_OFFICE_ID
        });

        res.status(201).json({
            success: true,
            message: 'Initial admin account created successfully',
            admin: {
                username: admin.username,
                officialEmail: admin.officialEmail,
                officeId: admin.officeId
            }
        });

    } catch (error) {
        console.error('Create Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin account',
            error: error.message
        });
    }
};

router.get('/create-initial', createInitialAdmin);
router.post('/create-initial', createInitialAdmin);

// ✅ NEW: Get Dashboard Statistics
router.get('/stats', protect, async (req, res) => {
    try {
        // Import Contact model at top of file if not already imported
        const Contact = require('../models/Contact');
        
        // Total Users
        const totalUsers = await User.countDocuments();
        
        // Total Analyses
        const totalAnalyses = await Analysis.countDocuments();
        
        // Total Contacts
        const totalContacts = await Contact.countDocuments();
        
        // Recent Activity (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Users who signed in recently
        const recentSignins = await User.countDocuments({
            lastActivity: { $gte: oneDayAgo }
        });
        
        // Contact forms submitted recently
        const recentContacts = await Contact.countDocuments({
            createdAt: { $gte: oneDayAgo }
        });
        
        // Total recent activity = signins + contacts
        const recentActivity = recentSignins + recentContacts;
        
        // Additional stats
        const completedAnalyses = await Analysis.countDocuments({ status: 'completed' });
        const pendingAnalyses = await Analysis.countDocuments({ status: 'pending' });
        const processingAnalyses = await Analysis.countDocuments({ status: 'processing' });
        
        // Top active users
        const topUsers = await User.find()
            .sort({ analysisCount: -1 })
            .limit(5)
            .select('username fullname analysisCount lastActivity');
        
        // Recent analyses
        const recentAnalyses = await Analysis.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'username fullname')
            .select('address status createdAt userId');
        
        // Recent contacts
        const recentContactsList = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullname email subject createdAt status');
        
        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalAnalyses,
                totalContacts,
                recentActivity,
                recentSignins,
                recentContacts,
                completedAnalyses,
                pendingAnalyses,
                processingAnalyses
            },
            topUsers,
            recentAnalyses,
            recentContacts: recentContactsList
        });
        
    } catch (error) {
        console.error('❌ Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics',
            error: error.message
        });
    }
});

// ✅ NEW: Get All Users (Admin Only)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
        
    } catch (error) {
        console.error('❌ Get Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users',
            error: error.message
        });
    }
});

// ✅ NEW: Get All Analyses (Admin Only)
router.get('/analyses', async (req, res) => {
    try {
        const analyses = await Analysis.find()
            .populate('userId', 'username fullname email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: analyses.length,
            analyses
        });
        
    } catch (error) {
        console.error('❌ Get Analyses Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching analyses',
            error: error.message
        });
    }
});

// ✅ NEW: Delete User (Admin Only)
router.delete('/users/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Delete all analyses by this user
        await Analysis.deleteMany({ userId: req.params.userId });
        
        // Delete user
        await user.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'User and their analyses deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting user',
            error: error.message
        });
    }
});

// ✅ NEW: Delete Analysis (Admin Only)
router.delete('/analyses/:analysisId', async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }
        
        await analysis.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Analysis deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting analysis',
            error: error.message
        });
    }
});

module.exports = router;