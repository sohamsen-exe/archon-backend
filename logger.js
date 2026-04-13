const { ActivityLog } = require('../db');

const activityLogger = (action) => async (req, res, next) => {
    try {
        await ActivityLog.create({
            user_id: req.session?.user?.id || null,
            action: action,
            ip_address: req.ip
        });
        next();
    } catch (err) {
        console.error('Logging Error:', err);
        next();
    }
};

module.exports = { activityLogger };