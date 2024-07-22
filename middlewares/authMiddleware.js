const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

module.exports = async function (req, res, next) {
    const authorizationHeader = req.header('Authorization');

    if (!authorizationHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const token = authorizationHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const blacklistedToken = await BlacklistedToken.findOne({ token });
        if (blacklistedToken) {
            return res.status(401).json({ msg: 'Token is blacklisted' });
        }

        const decoded = jwt.verify(token, process.env.jwtSecret);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
