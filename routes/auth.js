const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// User Signup
router.post('/signup', async (req, res) => {
    const { fullname, email, username, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Create user
        user = await User.create({
            fullname,
            email,
            username,
            password
        });

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
});

// User Signin
router.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user with password
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Signin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signin'
        });
    }
});

module.exports = router;