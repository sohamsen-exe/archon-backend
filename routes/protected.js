const express = require('express');
const mongoose = require('mongoose');
const { User, ActivityLog } = require('../db');
const { verifySession, authorizeRoles } = require('../middleware/auth');

// Add this missing line right here!
const { activityLogger } = require('../middleware/logger'); 

const router = express.Router();

router.get('/admin', verifySession, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.session.user.id } }, '-password');
        
        const rawSessions = await mongoose.connection.db.collection('sessions').find().toArray();
        const activeSessions = rawSessions.map(s => {
            const data = JSON.parse(s.session);
            return { username: data.user?.username || 'Guest', role: data.user?.role || 'N/A' };
        });

        // NEW: Fetch the latest 50 activity logs and populate the username
        const logs = await ActivityLog.find()
            .populate('user_id', 'username') // Grabs the username tied to the user_id
            .sort({ timestamp: -1 })         // Newest first
            .limit(50);

        // Send logs alongside users and sessions
        res.json({ users, activeSessions, logs }); 
    } catch (err) { 
        res.status(500).json({ message: 'Internal Server Error' }); 
    }
});

router.put('/admin/edit-user/:id', verifySession, authorizeRoles('admin'), activityLogger('EDIT_USER'), async (req, res) => {
    try {
        const { fullName, username, email, role, department, studentId, grades } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, username, email, role, department, studentId, grades },
            { new: true, runValidators: true }
        );
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Username or Email already exists' });
        res.status(500).json({ message: 'Failed to update user profile' });
    }
});

// Faculty: Award grade to a student
router.put('/faculty/award-grade/:studentId', verifySession, authorizeRoles('faculty'), async (req, res) => {
    try {
        const { subject, grade } = req.body;
        const student = await User.findById(req.params.studentId);

        if (!student || student.role !== 'user') {
            return res.status(404).json({ message: 'Student not found' });
        }

        const existingIndex = student.grades.findIndex(g => g.subject === subject);
        if (existingIndex > -1) {
            student.grades[existingIndex].grade = grade;
        } else {
            student.grades.push({ subject, grade });
        }

        await student.save();

        // Rich log entry
        await ActivityLog.create({
            user_id: req.session.user.id,
            action: 'AWARD_GRADE',
            ip_address: req.ip,
            details: `Awarded ${grade} in ${subject} to ${student.fullName || student.username} (${student.studentId})`
        });

        res.json({ message: 'Grade awarded successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to award grade' });
    }
});

// Student/User Dashboard
router.get('/user', verifySession, authorizeRoles('user', 'faculty', 'admin'), async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id, '-password');
        const peers = await User.find({ 
            role: 'user', department: user.department, _id: { $ne: user._id } 
        }, 'fullName email studentId grades');
        res.json({ user, peers });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

module.exports = router;