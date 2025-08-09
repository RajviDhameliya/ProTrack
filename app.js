const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const db = new sqlite3.Database('./productivity.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: 'smart-productivity-tracker-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Make database available to routes
app.locals.db = db;

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');

app.use('/', authRoutes);
app.use('/tasks', requireAuth, taskRoutes);
app.use('/reports', requireAuth, reportRoutes);

// Home route
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.render('home', { user: req.session.user });
    }
});

// About route
app.get('/about', (req, res) => {
    res.render('about', { user: req.session.user });
});

// Contact route
app.get('/contact', (req, res) => {
    res.render('contact', { user: req.session.user });
});

// Get Started route (handles conditional routing)
app.post('/get-started', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Dashboard route
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const today = new Date().toISOString().split('T')[0];
        
        console.log('Fetching tasks for user:', userId, 'date:', today);
        
        // Get all tasks for the user sorted by priority and due date
        db.all(
            `SELECT * FROM tasks WHERE user_id = ? ORDER BY 
             CASE priority 
                 WHEN 'High' THEN 1 
                 WHEN 'Medium' THEN 2 
                 WHEN 'Low' THEN 3 
                 ELSE 4 
             END, due_date ASC, created_at DESC`,
            [userId],
            (err, tasks) => {
                if (err) {
                    console.error('Error fetching tasks:', err);
                    return res.status(500).send('Database error');
                }
                
                console.log('Found tasks:', tasks);
                
                res.render('dashboard', { 
                    tasks, 
                    user: req.session.user,
                    today 
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Analytics route
app.get('/analytics', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        // Get completed tasks for the last 7 days
        db.all(
            `SELECT DATE(completed_at) as date, COUNT(*) as count 
             FROM tasks 
             WHERE user_id = ? AND is_completed = 1 
             AND completed_at IS NOT NULL
             AND DATE(completed_at) >= DATE(?) 
             GROUP BY DATE(completed_at) 
             ORDER BY date`,
            [userId, sevenDaysAgo.toISOString().split('T')[0]],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Database error');
                }
                
                // Create data for Chart.js
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
                    const dateStr = date.toISOString().split('T')[0];
                    const result = results.find(r => r.date === dateStr);
                    chartData.push({
                        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                        count: result ? result.count : 0
                    });
                }
                
                res.render('analytics', { 
                    chartData: JSON.stringify(chartData),
                    user: req.session.user 
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Email reminder system
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Cron job to check for overdue tasks and send reminders
cron.schedule('0 * * * *', async () => {
    console.log('Running overdue task check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
        `SELECT t.*, u.email, u.username 
         FROM tasks t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.due_date < ? AND t.is_completed = 0`,
        [today],
        async (err, overdueTasks) => {
            if (err) {
                console.error('Error fetching overdue tasks:', err);
                return;
            }
            
            for (const task of overdueTasks) {
                try {
                    const mailOptions = {
                        from: process.env.EMAIL_USER || 'your-email@gmail.com',
                        to: task.email,
                        subject: 'Task Reminder: Overdue Task',
                        html: `
                            <h2>Task Reminder</h2>
                            <p>Hello ${task.username},</p>
                            <p>You have an overdue task that needs your attention:</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                                <h3>${task.title}</h3>
                                <p><strong>Description:</strong> ${task.description || 'No description'}</p>
                                <p><strong>Due Date:</strong> ${task.due_date}</p>
                            </div>
                            <p>Please complete this task as soon as possible to stay on track with your productivity goals!</p>
                            <p>Best regards,<br>Smart Productivity Tracker</p>
                        `
                    };
                    
                    await transporter.sendMail(mailOptions);
                    console.log(`Reminder sent to ${task.email} for task: ${task.title}`);
                } catch (error) {
                    console.error(`Error sending reminder to ${task.email}:`, error);
                }
            }
        }
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { user: req.session.user });
});

// Start server
app.listen(PORT, () => {
    console.log(`Smart Productivity Tracker is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
}); 