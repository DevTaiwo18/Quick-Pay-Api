const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
   const authorizationHeader = req.header('Authorization');

   if (!authorizationHeader) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
   }

   try {
      const token = authorizationHeader.split(' ')[1]; 

      if (!token) {
         return res.status(401).json({ msg: 'No token, authorization denied' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.jwtSecret);
      req.user = decoded.user;
      next();
   } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
   }
};
