const express = require('express');
const NumberFightGame = require('./gameLogic');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'numberfight';
let db;

MongoClient.connect(MONGO_URL, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(DB_NAME);
        console.log('MongoDB bağlantısı başarılı');
    })
    .catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
    });

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Body:`, req.body);
    next();
});

let game = null;
let gameMode = null; // 'ai', 'local', 'online'

// Yeni oyun başlat
app.post('/game/start', (req, res) => {
    console.log('POST /game/start çağrıldı, body:', req.body);
    const { mode } = req.body;
    if (!['ai', 'local', 'online'].includes(mode)) {
        return res.status(400).json({ error: 'Geçersiz oyun modu' });
    }
    game = new NumberFightGame();
    gameMode = mode;
    res.json({ message: 'Oyun başlatıldı', round: game.round, mode });
});

// Kart oynama
app.post('/game/play', (req, res) => {
    console.log('POST /game/play çağrıldı, body:', req.body);
    if (!game) return res.status(400).json({ error: 'Oyun başlatılmadı' });
    const { playerIndex, card } = req.body;
    try {
        // Oyuncu kartı oynar
        game.playCard(playerIndex, card);
        let aiMove = null;
        // AI modu ve oyuncu 0 ise, AI da otomatik oynasın
        if (gameMode === 'ai' && playerIndex === 0) {
            // AI için geçerli kartları bul
            const aiHand = game.players[1].hand;
            const validCards = aiHand.filter(c => game.canPlay(1, c));
            if (validCards.length > 0) {
                // En küçük geçerli kartı oynasın
                const aiCard = Math.min(...validCards);
                game.playCard(1, aiCard);
                aiMove = aiCard;
            }
        }
        res.json({ message: 'Kart oynandı', round: game.round, history: game.history, aiMove });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Oyun durumunu getir
app.get('/game/state', (req, res) => {
    console.log('GET /game/state çağrıldı');
    if (!game) return res.status(400).json({ error: 'Oyun başlatılmadı' });
    res.json({ round: game.round, players: game.players, history: game.history, mode: gameMode });
});

// Kullanıcı kaydı
app.post('/register', async (req, res) => {
    console.log('POST /register çağrıldı, body:', req.body);
    const { name, email, password, birthDate } = req.body;
    if (!name || !email || !password || !birthDate) {
        return res.status(400).json({ error: 'Tüm alanlar zorunlu.' });
    }
    if (!db) {
        console.error('MongoDB bağlantısı hazır değil!');
        return res.status(500).json({ error: 'Veritabanı bağlantısı yok.' });
    }
    try {
        const users = db.collection('users');
        const existing = await users.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Bu e-posta ile kayıtlı kullanıcı var.' });
        }
        // Parolayı hashle
        const hashedPassword = await bcrypt.hash(password, 10);
        await users.insertOne({ name, email, password: hashedPassword, birthDate });
        res.json({ message: 'Kayıt başarılı' });
    } catch (e) {
        console.error('Kayıt sırasında hata:', e);
        res.status(500).json({ error: 'Kayıt sırasında hata oluştu.' });
    }
});

// Kullanıcı girişi
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Mail ve parola zorunlu.' });
    }
    if (!db) {
        return res.status(500).json({ error: 'Veritabanı bağlantısı yok.' });
    }
    try {
        const users = db.collection('users');
        const user = await users.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        const bcrypt = require('bcryptjs');
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Parola hatalı' });
        }
        // Güvenlik için parola bilgisini döndürme
        const { password: _, ...userData } = user;
        res.json({ message: 'Giriş başarılı', user: userData });
    } catch (e) {
        res.status(500).json({ error: 'Giriş sırasında hata oluştu.' });
    }
});

// Profil bilgisi getir
app.post('/profile/me', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email zorunlu.' });
    if (!db) return res.status(500).json({ error: 'Veritabanı bağlantısı yok.' });
    try {
        const users = db.collection('users');
        const user = await users.findOne({ email });
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        const { password, ...userData } = user;
        res.json({ user: userData });
    } catch (e) {
        res.status(500).json({ error: 'Profil getirme hatası.' });
    }
});

// Profil güncelle
app.post('/profile/update', async (req, res) => {
    const { email, name, password, birthDate } = req.body;
    if (!email || !name || !birthDate) {
        return res.status(400).json({ error: 'Email, isim ve doğum tarihi zorunlu.' });
    }
    if (!db) return res.status(500).json({ error: 'Veritabanı bağlantısı yok.' });
    try {
        const users = db.collection('users');
        // E-posta başka kullanıcıya ait mi kontrolü
        const existing = await users.findOne({ email });
        if (!existing) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        let updateObj = { name, birthDate };
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateObj.password = hashedPassword;
        }
        await users.updateOne({ email }, { $set: updateObj });
        res.json({ message: 'Profil güncellendi.' });
    } catch (e) {
        res.status(500).json({ error: 'Profil güncelleme hatası.' });
    }
});

app.get('/', (req, res) => {
    console.log('GET / çağrıldı');
    res.send('Merhaba, Express sunucusu çalışıyor!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
}); 