// backend/routes/analysis.js
// REPLACE ENTIRE FILE WITH THIS CODE
// This handles all analysis processing on backend (hidden from browser)

const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const poiService = require('../services/poiService');

// ✅ Create New Analysis (Save Parameters ONLY)
router.post('/create', protect, async (req, res) => {
    try {
        const { address, radius, pois } = req.body;
        
        if (!address || !radius || !pois) {
            return res.status(400).json({
                success: false,
                message: 'Please provide address, radius, and POIs'
            });
        }
        
        // Create new analysis (pending status)
        const analysis = await Analysis.create({
            userId: req.user._id,
            address: address,
            radius: radius,
            selectedPOIs: pois,
            status: 'pending'
        });
        
        console.log('✅ Analysis created:', analysis._id);
        
        res.status(201).json({
            success: true,
            message: 'Analysis created successfully',
            analysisId: analysis._id,
            analysis: analysis
        });
        
    } catch (error) {
        console.error('❌ Create Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating analysis',
            error: error.message
        });
    }
});

// ✅ NEW: Process Analysis (ALL LOGIC ON BACKEND - HIDDEN FROM BROWSER)
router.post('/:analysisId/process', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }
        
        // Check ownership
        if (analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Update status to processing
        analysis.status = 'processing';
        await analysis.save();
        
        console.log('🔄 Processing analysis:', analysis._id);
        console.log('   Address:', analysis.address);
        console.log('   Radius:', analysis.radius);
        console.log('   Categories:', Object.keys(analysis.selectedPOIs));
        
        try {
            // ✅ ALL PROCESSING HAPPENS ON BACKEND (HIDDEN FROM BROWSER)
            const result = await poiService.fetchAllPOIsForAnalysis({
                address: analysis.address,
                radius: analysis.radius,
                pois: Object.fromEntries(analysis.selectedPOIs)
            });
            
            // Calculate rectangle bounds
            const bounds = calculateRectangleBounds(
                result.location.lat,
                result.location.lng,
                analysis.radius
            );
            
            // Save all data to database
            analysis.siteLocation = result.location;
            analysis.rectangleBounds = bounds;
            analysis.allPOIsData = result.allPOIsData;
            analysis.status = 'completed';
            await analysis.save();
            
            console.log('✅ Analysis processing complete:', analysis._id);
            
            res.status(200).json({
                success: true,
                message: 'Analysis processed successfully',
                analysis: {
                    _id: analysis._id,
                    siteLocation: analysis.siteLocation,
                    rectangleBounds: analysis.rectangleBounds,
                    allPOIsData: analysis.allPOIsData,
                    status: analysis.status
                }
            });
            
        } catch (processingError) {
            console.error('❌ Processing error:', processingError);
            
            analysis.status = 'failed';
            await analysis.save();
            
            res.status(500).json({
                success: false,
                message: 'Analysis processing failed',
                error: processingError.message
            });
        }
        
    } catch (error) {
        console.error('❌ Process Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// ✅ Helper function: Calculate rectangle bounds
function calculateRectangleBounds(lat, lng, radiusMiles) {
    const radiusKm = radiusMiles * 1.60934;
    const latDiff = radiusKm / 111.32;
    const lngDiff = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
    const paddingFactor = 1.10;
    
    return {
        north: lat + (latDiff * paddingFactor),
        south: lat - (latDiff * paddingFactor),
        east: lng + (lngDiff * paddingFactor),
        west: lng - (lngDiff * paddingFactor)
    };
}

// ✅ Get Analysis by ID
router.get('/:analysisId', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }
        
        // Check ownership
        if (analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        res.status(200).json({
            success: true,
            analysis: analysis
        });
        
    } catch (error) {
        console.error('❌ Get Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// ✅ Update Analysis Data
router.put('/:analysisId/data', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Analysis not found'
            });
        }
        
        if (analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Update fields
        const {
            siteLocation,
            rectangleBounds,
            allPOIsData,
            highwayData,
            selectedPOIsState,
            selectedHighways,
            clusters,
            status
        } = req.body;
        
        if (siteLocation) analysis.siteLocation = siteLocation;
        if (rectangleBounds) analysis.rectangleBounds = rectangleBounds;
        if (allPOIsData) analysis.allPOIsData = allPOIsData;
        if (highwayData) analysis.highwayData = highwayData;
        if (selectedPOIsState) analysis.selectedPOIsState = selectedPOIsState;
        if (selectedHighways) analysis.selectedHighways = selectedHighways;
        if (clusters) analysis.clusters = clusters;
        if (status) analysis.status = status;
        
        await analysis.save();
        
        console.log('✅ Analysis data updated:', analysis._id);
        
        res.status(200).json({
            success: true,
            message: 'Analysis updated successfully',
            analysis: analysis
        });
        
    } catch (error) {
        console.error('❌ Update Analysis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// ✅ Update Dragged Positions
router.put('/:analysisId/dragged', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const { draggedPositions } = req.body;
        if (draggedPositions) {
            analysis.draggedPositions = draggedPositions;
        }
        
        await analysis.save();
        res.status(200).json({ success: true, message: 'Dragged positions updated' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ✅ Update Resized Sizes
router.put('/:analysisId/resized', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const { resizedSizes } = req.body;
        if (resizedSizes) {
            analysis.resizedSizes = resizedSizes;
        }
        
        await analysis.save();
        res.status(200).json({ success: true, message: 'Resized sizes updated' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ✅ Update Break Points
router.put('/:analysisId/breakpoints', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const { breakPoints } = req.body;
        if (breakPoints) {
            analysis.breakPoints = breakPoints;
        }
        
        await analysis.save();
        res.status(200).json({ success: true, message: 'Break points updated' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ✅ Update Rotations
router.put('/:analysisId/rotations', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const { rotations } = req.body;
        if (rotations) {
            analysis.rotations = rotations;
        }
        
        await analysis.save();
        res.status(200).json({ success: true, message: 'Rotations updated' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ✅ Update Reshapes
router.put('/:analysisId/reshapes', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const { reshapes } = req.body;
        if (reshapes) {
            analysis.reshapes = reshapes;
        }
        
        await analysis.save();
        res.status(200).json({ success: true, message: 'Reshapes updated' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ✅ Mark Analysis as Completed
router.put('/:analysisId/complete', protect, async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.analysisId);
        
        if (!analysis || analysis.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        if (analysis.status !== 'completed') {
            analysis.status = 'completed';
            await analysis.save();
            
            // Update user's analysis count
            const user = await User.findById(req.user._id);
            if (user) {
                user.analysisCount += 1;
                user.lastActivity = Date.now();
                await user.save();
            }
        }
        
        res.status(200).json({ success: true, message: 'Analysis completed' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ✅ Get User's All Analyses
router.get('/user/all', protect, async (req, res) => {
    try {
        const analyses = await Analysis.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: analyses.length,
            analyses: analyses
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;