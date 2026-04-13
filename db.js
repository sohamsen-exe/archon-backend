const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    }
};

// 1. User schema & model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'faculty', 'admin'], default: 'user' },
    department: { type: String, default: null },
    fullName: { type: String, default: null },
    studentId: { type: String, default: null },
    facultyId: { type: String, default: null }, // NEW
    adminId: { type: String, default: null },   // NEW
    grades: [{
        subject: { type: String, required: true },
        grade: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 2. ActivityLog schema & model
const activityLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    ip_address: { type: String },
    details: { type: String, default: null }, // NEW — stores grade details
    timestamp: { type: Date, default: Date.now }
});
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// 3. AdminCode schema & model  ← you added this
const adminCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false }
});

const AdminCode = mongoose.model('AdminCode', adminCodeSchema);

// exports MUST be last
module.exports = { connectDB, User, ActivityLog, AdminCode };