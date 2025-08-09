const express = require('express');
const router = express.Router();

// Get reports page with chart data
router.get('/', (req, res) => {
    const userId = req.session.userId;
    const period = req.query.period || 'weekly'; // daily, weekly, monthly
    const db = req.app.locals.db;

    // Calculate date range based on period
    const today = new Date();
    let startDate, endDate, dateFormat, groupBy;

    switch (period) {
        case 'daily':
            startDate = new Date(today);
            endDate = new Date(today);
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(completed_at)';
            break;
        case 'weekly':
            startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(completed_at)';
            break;
        case 'monthly':
            startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(completed_at)';
            break;
        default:
            startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            dateFormat = 'YYYY-MM-DD';
            groupBy = 'DATE(completed_at)';
    }

    // Get completed tasks for the selected period
    db.all(
        `SELECT DATE(completed_at) as date, COUNT(*) as count 
         FROM tasks 
         WHERE user_id = ? AND is_completed = 1 
         AND completed_at IS NOT NULL
         AND DATE(completed_at) >= DATE(?) 
         AND DATE(completed_at) <= DATE(?)
         GROUP BY DATE(completed_at) 
         ORDER BY date`,
        [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
        (err, results) => {
            if (err) {
                console.error('Error fetching report data:', err);
                return res.status(500).send('Database error');
            }

            // Get summary statistics
            db.get(
                `SELECT 
                    COUNT(*) as total_completed,
                    MAX(completed_at) as last_completed,
                    COUNT(DISTINCT DATE(completed_at)) as productive_days
                 FROM tasks 
                 WHERE user_id = ? AND is_completed = 1 
                 AND completed_at IS NOT NULL
                 AND DATE(completed_at) >= DATE(?) 
                 AND DATE(completed_at) <= DATE(?)`,
                [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
                (err, summary) => {
                    if (err) {
                        console.error('Error fetching summary:', err);
                        return res.status(500).send('Database error');
                    }

                    // Get most productive day
                    db.get(
                        `SELECT DATE(completed_at) as date, COUNT(*) as count 
                         FROM tasks 
                         WHERE user_id = ? AND is_completed = 1 
                         AND completed_at IS NOT NULL
                         AND DATE(completed_at) >= DATE(?) 
                         AND DATE(completed_at) <= DATE(?)
                         GROUP BY DATE(completed_at) 
                         ORDER BY count DESC 
                         LIMIT 1`,
                        [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
                        (err, mostProductive) => {
                            if (err) {
                                console.error('Error fetching most productive day:', err);
                                return res.status(500).send('Database error');
                            }

                            // Create chart data
                            const chartData = [];
                            const currentDate = new Date(startDate);
                            
                            while (currentDate <= endDate) {
                                const dateStr = currentDate.toISOString().split('T')[0];
                                const result = results.find(r => r.date === dateStr);
                                chartData.push({
                                    date: currentDate.toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    }),
                                    count: result ? result.count : 0,
                                    fullDate: dateStr
                                });
                                currentDate.setDate(currentDate.getDate() + 1);
                            }

                            res.render('reports', {
                                user: req.session.user,
                                chartData: JSON.stringify(chartData),
                                period: period,
                                summary: summary || { total_completed: 0, productive_days: 0 },
                                mostProductive: mostProductive || { date: null, count: 0 },
                                startDate: startDate.toISOString().split('T')[0],
                                endDate: endDate.toISOString().split('T')[0]
                            });
                        }
                    );
                }
            );
        }
    );
});

// API endpoint for chart data (for AJAX requests)
router.get('/data', (req, res) => {
    const userId = req.session.userId;
    const period = req.query.period || 'weekly';
    const db = req.app.locals.db;

    // Calculate date range based on period
    const today = new Date();
    let startDate, endDate;

    switch (period) {
        case 'daily':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        case 'weekly':
            startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            break;
        case 'monthly':
            startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            break;
        default:
            startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
    }

    db.all(
        `SELECT DATE(completed_at) as date, COUNT(*) as count 
         FROM tasks 
         WHERE user_id = ? AND is_completed = 1 
         AND completed_at IS NOT NULL
         AND DATE(completed_at) >= DATE(?) 
         AND DATE(completed_at) <= DATE(?)
         GROUP BY DATE(completed_at) 
         ORDER BY date`,
        [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
        (err, results) => {
            if (err) {
                console.error('Error fetching report data:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Create chart data
            const chartData = [];
            const currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const result = results.find(r => r.date === dateStr);
                chartData.push({
                    date: currentDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    count: result ? result.count : 0,
                    fullDate: dateStr
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }

            res.json({
                chartData: chartData,
                period: period,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });
        }
    );
});

// Download report as PDF
router.get('/download/pdf', (req, res) => {
    const userId = req.session.userId;
    const period = req.query.period || 'weekly';
    const db = req.app.locals.db;

    // Calculate date range based on period
    const today = new Date();
    let startDate, endDate;

    switch (period) {
        case 'daily':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        case 'weekly':
            startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            break;
        case 'monthly':
            startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
            break;
        default:
            startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = new Date(today);
    }

    // Get all the data needed for the report
    db.all(
        `SELECT DATE(completed_at) as date, COUNT(*) as count 
         FROM tasks 
         WHERE user_id = ? AND is_completed = 1 
         AND completed_at IS NOT NULL
         AND DATE(completed_at) >= DATE(?) 
         AND DATE(completed_at) <= DATE(?)
         GROUP BY DATE(completed_at) 
         ORDER BY date`,
        [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
        (err, results) => {
            if (err) {
                console.error('Error fetching report data:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Get summary statistics
            db.get(
                `SELECT 
                    COUNT(*) as total_completed,
                    MAX(completed_at) as last_completed,
                    COUNT(DISTINCT DATE(completed_at)) as productive_days
                 FROM tasks 
                 WHERE user_id = ? AND is_completed = 1 
                 AND completed_at IS NOT NULL
                 AND DATE(completed_at) >= DATE(?) 
                 AND DATE(completed_at) <= DATE(?)`,
                [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
                (err, summary) => {
                    if (err) {
                        console.error('Error fetching summary:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    // Get most productive day
                    db.get(
                        `SELECT DATE(completed_at) as date, COUNT(*) as count 
                         FROM tasks 
                         WHERE user_id = ? AND is_completed = 1 
                         AND completed_at IS NOT NULL
                         AND DATE(completed_at) >= DATE(?) 
                         AND DATE(completed_at) <= DATE(?)
                         GROUP BY DATE(completed_at) 
                         ORDER BY count DESC 
                         LIMIT 1`,
                        [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
                        (err, mostProductive) => {
                            if (err) {
                                console.error('Error fetching most productive day:', err);
                                return res.status(500).json({ error: 'Database error' });
                            }

                            // Create chart data
                            const chartData = [];
                            const currentDate = new Date(startDate);
                            
                            while (currentDate <= endDate) {
                                const dateStr = currentDate.toISOString().split('T')[0];
                                const result = results.find(r => r.date === dateStr);
                                chartData.push({
                                    date: currentDate.toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    }),
                                    count: result ? result.count : 0,
                                    fullDate: dateStr
                                });
                                currentDate.setDate(currentDate.getDate() + 1);
                            }

                            const reportData = {
                                chartData: JSON.stringify(chartData),
                                summary: summary || { total_completed: 0, productive_days: 0 },
                                mostProductive: mostProductive || { date: null, count: 0 },
                                startDate: startDate.toISOString().split('T')[0],
                                endDate: endDate.toISOString().split('T')[0]
                            };

                            // For now, return CSV as PDF generation requires additional libraries
                            const ReportGenerator = require('../utils/reportGenerator');
                            const generator = new ReportGenerator();
                            const csv = generator.generateCSV(reportData, period);

                            res.setHeader('Content-Type', 'text/csv');
                            res.setHeader('Content-Disposition', `attachment; filename="productivity-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`);
                            res.send(csv);
                        }
                    );
                }
            );
        }
    );
});

module.exports = router; 