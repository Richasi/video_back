const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const userPayload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = userPayload;
    next();
  } catch (error) {
    console.error('Invalid token:', error.message);
    res.status(403).json({ message: 'Token is invalid' });
  }
};

module.exports = authenticateUser;
