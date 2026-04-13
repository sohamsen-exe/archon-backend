const express = require('express');
const bcrypt = require('bcryptjs');
const { User, AdminCode } = require('../db');
const router = express.Router();



router.post('/signup', async (req, res) => {
    const { username, email, password, role, department, fullName, studentId, facultyId, adminId } = req.body;

    try {
        // Validate admin code before creating the user
        if (role === 'admin') {
            const code = await AdminCode.findOne({ code: adminId, used: false });
            if (!code) {
                return res.status(403).json({ message: 'Invalid or already used admin code.' });
            }
            await AdminCode.findByIdAndUpdate(code._id, { used: true });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ username, email, password: hashedPassword, role, department, fullName, studentId, facultyId, adminId });
        res.status(201).json({ message: 'User created successfully' });

    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        req.session.user = { id: user._id, username: user.username, role: user.role, department: user.department };
        res.json({ role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ message: 'Login failed' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('rbac_session_cookie');
    res.json({ message: 'Logged out' });
});

module.exports = router;