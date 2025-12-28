const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - No token'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'admin') {
            req.admin = await Admin.findById(decoded.id);
        } else {
            req.user = await User.findById(decoded.id);
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - Invalid token'
        });
    }
};