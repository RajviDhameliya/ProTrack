const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all tasks for a user
router.get('/', (req, res) => {
    const userId = req.session.userId;
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, tasks) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tasks);
        }
    );
});

// Create a new task
router.post('/', [
    body('title').isLength({ min: 1 }).withMessage('Task title is required'),
    body('due_date').isISO8601().withMessage('Valid due date is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, description, due_date, priority } = req.body;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    console.log('Creating task:', { title, description, due_date, priority, userId });
    
    db.run(
        'INSERT INTO tasks (title, description, due_date, priority, user_id) VALUES (?, ?, ?, ?, ?)',
        [title, description || '', due_date, priority || 'Medium', userId],
        function(err) {
            if (err) {
                console.error('Database error creating task:', err);
                return res.status(500).json({ error: 'Error creating task' });
            }

            console.log('Task created with ID:', this.lastID);

            // Get the created task
            db.get(
                'SELECT * FROM tasks WHERE id = ?',
                [this.lastID],
                (err, task) => {
                    if (err) {
                        console.error('Error retrieving created task:', err);
                        return res.status(500).json({ error: 'Error retrieving task' });
                    }
                    console.log('Returning created task:', task);
                    res.status(201).json(task);
                }
            );
        }
    );
});

// Get a single task by ID
router.get('/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    db.get(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId],
        (err, task) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            
            res.json(task);
        }
    );
});

// Update a task
router.put('/:id', [
    body('title').isLength({ min: 1 }).withMessage('Task title is required'),
    body('due_date').isISO8601().withMessage('Valid due date is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const taskId = req.params.id;
    const { title, description, due_date, priority, is_completed } = req.body;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    // First check if task belongs to user
    db.get(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId],
        (err, task) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Update the task
            db.run(
                'UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, is_completed = ? WHERE id = ? AND user_id = ?',
                [title, description || '', due_date, priority || 'Medium', is_completed ? 1 : 0, taskId, userId],
                function(err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error updating task' });
                    }

                    // Get the updated task
                    db.get(
                        'SELECT * FROM tasks WHERE id = ?',
                        [taskId],
                        (err, updatedTask) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ error: 'Error retrieving updated task' });
                            }
                            res.json(updatedTask);
                        }
                    );
                }
            );
        }
    );
});

// Toggle task completion status
router.patch('/:id/toggle', (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    // First check if task belongs to user and get current status
    db.get(
        'SELECT id, is_completed FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId],
        (err, task) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Toggle the completion status
            const newStatus = task.is_completed ? 0 : 1;
            const completedAt = newStatus ? new Date().toISOString() : null;
            
            db.run(
                'UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ? AND user_id = ?',
                [newStatus, completedAt, taskId, userId],
                function(err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error updating task' });
                    }

                    res.json({ 
                        id: taskId, 
                        is_completed: newStatus,
                        message: newStatus ? 'Task marked as completed' : 'Task marked as incomplete'
                    });
                }
            );
        }
    );
});

// Delete a task
router.delete('/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    // First check if task belongs to user
    db.get(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, userId],
        (err, task) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Delete the task
            db.run(
                'DELETE FROM tasks WHERE id = ? AND user_id = ?',
                [taskId, userId],
                function(err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error deleting task' });
                    }

                    res.json({ 
                        message: 'Task deleted successfully',
                        deletedId: taskId
                    });
                }
            );
        }
    );
});

// Get tasks by date range
router.get('/range', (req, res) => {
    const { start_date, end_date } = req.query;
    const userId = req.session.userId;
    const db = req.app.locals.db;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    db.all(
        'SELECT * FROM tasks WHERE user_id = ? AND DATE(due_date) BETWEEN ? AND ? ORDER BY due_date ASC',
        [userId, start_date, end_date],
        (err, tasks) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tasks);
        }
    );
});

// Get overdue tasks
router.get('/overdue', (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0];
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM tasks WHERE user_id = ? AND due_date < ? AND is_completed = 0 ORDER BY due_date ASC',
        [userId, today],
        (err, tasks) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tasks);
        }
    );
});

// Get today's tasks
router.get('/today', (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().split('T')[0];
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM tasks WHERE user_id = ? AND DATE(due_date) = ? ORDER BY created_at DESC',
        [userId, today],
        (err, tasks) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tasks);
        }
    );
});

module.exports = router; 