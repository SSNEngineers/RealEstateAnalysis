const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { protect } = require('../middleware/authMiddleware');

// ✅ Submit Contact Form (PUBLIC - No auth required)
router.post('/submit', async (req, res) => {
    try {
        const { fullname, email, address, subject, description } = req.body;
        
        if (!fullname || !email || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Create contact
        const contact = await Contact.create({
            fullname,
            email,
            address: address || '',
            subject,
            description
        });
        
        console.log('✅ Contact form submitted:', contact._id);
        
        res.status(201).json({
            success: true,
            message: 'Thank you! Your message has been sent successfully.',
            contactId: contact._id
        });
        
    } catch (error) {
        console.error('❌ Submit Contact Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting contact form',
            error: error.message
        });
    }
});

// ✅ Get All Contacts (ADMIN ONLY)
router.get('/all', protect, async (req, res) => {
    try {
        // Check if admin
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const contacts = await Contact.find()
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: contacts.length,
            contacts
        });
        
    } catch (error) {
        console.error('❌ Get Contacts Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching contacts',
            error: error.message
        });
    }
});

// ✅ Delete Contact (ADMIN ONLY)
router.delete('/:contactId', protect, async (req, res) => {
    try {
        // Check if admin
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const contact = await Contact.findById(req.params.contactId);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        await contact.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Contact deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete Contact Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting contact',
            error: error.message
        });
    }
});

// ✅ Delete All Contacts (ADMIN ONLY)
router.delete('/delete-all/confirm', protect, async (req, res) => {
    try {
        // Check if admin
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const result = await Contact.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: `All contacts deleted successfully (${result.deletedCount} contacts removed)`,
            deletedCount: result.deletedCount
        });
        
    } catch (error) {
        console.error('❌ Delete All Contacts Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting all contacts',
            error: error.message
        });
    }
});

// ✅ Update Contact Status (ADMIN ONLY)
router.put('/:contactId/status', protect, async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { status } = req.body;
        
        const contact = await Contact.findById(req.params.contactId);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        
        contact.status = status;
        await contact.save();
        
        res.status(200).json({
            success: true,
            message: 'Contact status updated',
            contact
        });
        
    } catch (error) {
        console.error('❌ Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating status',
            error: error.message
        });
    }
});

module.exports = router;