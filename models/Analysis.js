// backend/models/Analysis.js
// REPLACE THE ENTIRE FILE WITH THIS CODE

const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Analysis Parameters
    address: {
        type: String,
        required: true
    },
    radius: {
        type: Number,
        required: true,
        default: 3
    },
    selectedPOIs: {
        type: Map,
        of: Number,
        default: {}
    },
    
    // Location Data
    siteLocation: {
        lat: Number,
        lng: Number,
        address: String
    },
    
    rectangleBounds: {
        north: Number,
        south: Number,
        east: Number,
        west: Number
    },
    
    // POI Data
    allPOIsData: {
        type: Map,
        of: Array,
        default: {}
    },
    
    // Highway Data
    highwayData: {
        type: Array,
        default: []
    },
    
    // Selection State
    selectedPOIsState: {
        type: Map,
        of: Object,
        default: {}
    },
    
    selectedHighways: {
        type: Array,
        default: []
    },
    
    // Cluster Data
    clusters: {
        type: Array,
        default: []
    },
    
    // Drag Positions
    draggedPositions: {
        pois: {
            type: Map,
            of: Object,
            default: {}
        },
        clusters: {
            type: Map,
            of: Object,
            default: {}
        },
        highways: {
            type: Map,
            of: Object,
            default: {}
        },
        siteMarker: {
            type: Object,
            default: null
        }
    },
    
    // Resized Elements
    resizedSizes: {
        pois: {
            type: Map,
            of: Number,
            default: {}
        },
        clusters: {
            type: Map,
            of: Number,
            default: {}
        },
        highways: {
            type: Map,
            of: Number,
            default: {}
        },
        siteMarker: {
            type: Number,
            default: null
        }
    },
    
    // Break Lines
    breakPoints: {
        type: Map,
        of: Array,
        default: {}
    },
    
    // Rotations
    rotations: {
        type: Map,
        of: Number,
        default: {}
    },
    
    // Reshapes
    reshapes: {
        type: Map,
        of: Object,
        default: {}
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    lastModified: {
        type: Date,
        default: Date.now
    }
});

// ✅ FIXED: Update lastModified on save (no 'next' callback needed)
AnalysisSchema.pre('save', function() {
    this.lastModified = Date.now();
});

module.exports = mongoose.model('Analysis', AnalysisSchema);