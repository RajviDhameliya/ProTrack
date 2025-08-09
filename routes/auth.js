const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null, user: null });
});

// Login POST
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('login', { 
            error: errors.array()[0].msg, 
            user: null 
        });
    }

    const { email, password } = req.body;
    const db = req.app.locals.db;

    db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, user) => {
            if (err) {
                console.error(err);
                return res.render('login', { 
                    error: 'Database error occurred', 
                    user: null 
                });
            }

            if (!user) {
                return res.render('login', { 
                    error: 'Invalid email or password', 
                    user: null 
                });
            }

            try {
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return res.render('login', { 
                        error: 'Invalid email or password', 
                        user: null 
                    });
                }

                // Set session
                req.session.userId = user.id;
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email
                };

                res.redirect('/dashboard');
            } catch (error) {
                console.error('Password comparison error:', error);
                res.render('login', { 
                    error: 'Authentication error occurred', 
                    user: null 
                });
            }
        }
    );
});

// Signup page
router.get('/signup', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('signup', { error: null, user: null });
});

// Signup POST
router.post('/signup', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('signup', { 
            error: errors.array()[0].msg, 
            user: null 
        });
    }

    const { username, email, password } = req.body;
    const db = req.app.locals.db;

    // Check if user already exists
    db.get(
        'SELECT id FROM users WHERE email = ?',
        [email],
        async (err, existingUser) => {
            if (err) {
                console.error(err);
                return res.render('signup', { 
                    error: 'Database error occurred', 
                    user: null 
                });
            }

            if (existingUser) {
                return res.render('signup', { 
                    error: 'User with this email already exists', 
                    user: null 
                });
            }

            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert new user
                db.run(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, email, hashedPassword],
                    function(err) {
                        if (err) {
                            console.error(err);
                            return res.render('signup', { 
                                error: 'Error creating user account', 
                                user: null 
                            });
                        }

                        // Set session for new user
                        req.session.userId = this.lastID;
                        req.session.user = {
                            id: this.lastID,
                            username: username,
                            email: email
                        };

                        res.redirect('/dashboard');
                    }
                );
            } catch (error) {
                console.error('Password hashing error:', error);
                res.render('signup', { 
                    error: 'Error creating user account', 
                    user: null 
                });
            }
        }
    );
});

module.exports = router; 