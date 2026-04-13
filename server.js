const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./db');

const app = express();
connectDB();

app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.use(cors({ origin: 'http://archonau.netlify.app', credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use(session({
    key: 'rbac_session_cookie',
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2, httpOnly: true, secure: false, httpOnly: true, sameSite: 'none' }
}));

app.set('trust proxy', 1);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/protected', require('./routes/protected'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));