# Smart Productivity Tracker

A full-stack web application to help users track their daily productivity with task management, analytics, and automated reminders.

## 🚀 Features

### Core Features
- **User Authentication**: Secure signup and login with password hashing
- **Task Management**: Create, edit, delete, and mark tasks as completed
- **Dashboard**: Overview of today's tasks with statistics
- **Analytics**: Weekly productivity charts with insights and recommendations
- **Responsive Design**: Mobile-friendly interface with Bootstrap 5

### Advanced Features
- **Email Reminders**: Automated notifications for overdue tasks
- **Real-time Updates**: Dynamic task management without page refreshes
- **Data Visualization**: Interactive charts using Chart.js
- **Session Management**: Secure user sessions with express-session

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript with EJS templates
- **Backend**: Node.js + Express.js
- **Database**: SQLite with sqlite3 library
- **Authentication**: bcrypt for password hashing
- **Styling**: Bootstrap 5 + Font Awesome icons
- **Charts**: Chart.js for data visualization
- **Email**: Nodemailer for automated reminders
- **Scheduling**: node-cron for task reminders

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-productivity-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize the Database
```bash
npm run init-db
```

This will create the SQLite database with the required tables.

### 4. Configure Email Settings (Optional)
For email reminders to work, you need to set up environment variables:

Create a `.env` file in the root directory:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Note**: For Gmail, you'll need to use an "App Password" instead of your regular password. Enable 2-factor authentication and generate an app password.

### 5. Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
smart-productivity-tracker/
├── db/
│   ├── init.sql          # Database schema
│   └── init.js           # Database initialization script
├── public/
│   └── css/
│       └── styles.css    # Custom CSS styles
├── routes/
│   ├── auth.js           # Authentication routes
│   └── tasks.js          # Task management routes
├── views/
│   ├── login.ejs         # Login page
│   ├── signup.ejs        # Registration page
│   ├── dashboard.ejs     # Main dashboard
│   ├── analytics.ejs     # Analytics page
│   └── 404.ejs          # Error page
├── app.js                # Main application file
├── package.json          # Dependencies and scripts
├── productivity.db       # SQLite database (auto-generated)
└── README.md            # This file
```

## 🗄️ Database Schema

### Users Table
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `username` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL, hashed)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Tasks Table
- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `due_date` (DATE, NOT NULL)
- `is_completed` (INTEGER, DEFAULT 0)
- `user_id` (INTEGER, FOREIGN KEY to users)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

## 🔧 API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `GET /signup` - Registration page
- `POST /signup` - Create new user
- `GET /logout` - Logout user

### Dashboard
- `GET /dashboard` - Main dashboard with today's tasks
- `GET /analytics` - Productivity analytics page

### Tasks (Protected Routes)
- `GET /tasks` - Get all tasks for user
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `PATCH /tasks/:id/toggle` - Toggle task completion
- `DELETE /tasks/:id` - Delete task
- `GET /tasks/today` - Get today's tasks
- `GET /tasks/overdue` - Get overdue tasks
- `GET /tasks/range` - Get tasks by date range

## 🎨 Features in Detail

### Dashboard
- **Task Statistics**: Total, completed, and pending tasks
- **Task Management**: Add, edit, delete, and toggle completion
- **Visual Indicators**: Overdue tasks highlighted in red
- **Responsive Table**: Mobile-friendly task list

### Analytics
- **Weekly Chart**: Bar chart showing completed tasks per day
- **Statistics Cards**: Total completed, best day, average per day, consistency
- **Insights**: AI-powered productivity insights
- **Recommendations**: Personalized improvement suggestions

### Email Reminders
- **Automated Checks**: Runs every hour via cron job
- **Overdue Notifications**: Sends emails for incomplete overdue tasks
- **Professional Templates**: HTML-formatted email notifications

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: EJS template escaping

## 🎯 Usage Guide

### Getting Started
1. Visit `http://localhost:3000`
2. Click "Sign up here" to create an account
3. Fill in your details and create your account
4. You'll be redirected to the dashboard

### Managing Tasks
1. **Add Task**: Click "Add New Task" button
2. **Edit Task**: Click the edit icon next to any task
3. **Complete Task**: Click the circle icon to toggle completion
4. **Delete Task**: Click the trash icon (with confirmation)

### Viewing Analytics
1. Click "Analytics" in the navigation
2. View your weekly productivity chart
3. Read insights and recommendations
4. Track your progress over time

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set environment variables
2. Run `npm start`
3. Use a process manager like PM2
4. Set up a reverse proxy (nginx/Apache)

### Environment Variables
- `PORT`: Server port (default: 3000)
- `EMAIL_USER`: Gmail address for reminders
- `EMAIL_PASS`: Gmail app password

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
npm run init-db
```

**Email Not Sending**
- Check your Gmail app password
- Ensure 2-factor authentication is enabled
- Verify environment variables are set

**Port Already in Use**
```bash
# Change port in app.js or set PORT environment variable
PORT=3001 npm start
```

### Logs
Check the console output for detailed error messages and debugging information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Bootstrap for the UI framework
- Chart.js for data visualization
- Font Awesome for icons
- Express.js community for the excellent framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the console logs
3. Create an issue in the repository

---

**Happy Productivity Tracking! 🚀** 