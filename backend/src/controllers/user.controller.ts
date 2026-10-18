import { Request, Response } from 'express';

// Get all users (Admin only)
export const getAllUsers = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Users fetched',
    data: [], // استبدل بـ Database query
  });
};

// Get user profile
export const getUserProfile = (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Profile fetched',
    data: req.user,
  });
};
