import jwt from 'jsonwebtoken';
import User from '../Models/UserModel.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

export const adminProtect = async (req, res, next) => {
  try {
    await protect(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};