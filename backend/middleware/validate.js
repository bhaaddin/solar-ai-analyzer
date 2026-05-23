const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

const registerValidation = [
    body('username').trim().isLength({ min: 3 }).withMessage('Username min 3 characters'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
    handleValidation
];

const loginValidation = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation
];

const contentValidation = [
    body('siteTitle').optional().trim().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('heroText').optional().trim().isLength({ max: 500 }),
    body('contactEmail').optional().isEmail(),
    body('footerText').optional().trim().isLength({ max: 500 }),
    handleValidation
];

module.exports = { registerValidation, loginValidation, contentValidation, handleValidation };
