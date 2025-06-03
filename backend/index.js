const express = require('express');
const NumberFightGame = require('./gameLogic');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

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
        const result = await users.insertOne({ name, email, password: hashedPassword, birthDate });

        // Token oluştur (örnek, gerçek uygulamada JWT önerilir)
        const token = Math.random().toString(36).substring(2); // Basit örnek token

        const user = {
            _id: result.insertedId,
            name,
            email,
            birthDate,
            token
        };

        res.json({ user });
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
        // Token oluştur (örnek, gerçek uygulamada JWT önerilir)
        const token = Math.random().toString(36).substring(2); // Basit örnek token
        await users.updateOne({ email }, { $set: { token } });
        // Güvenlik için parola bilgisini döndürme
        const { password: _, ...userData } = user;
        userData.token = token;
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

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Oda ve eşleşme yönetimi
let waitingPlayer = null;
const rooms = {};

io.on('connection', (socket) => {
    // Oda bulma
    socket.on('find_room', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // Eşleşme bulundu
            const roomId = `room_${waitingPlayer.id}_${socket.id}`;
            rooms[roomId] = {
                players: [waitingPlayer, socket],
                cards: [[1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7]],
                scores: [0, 0],
                turn: 0
            };
            waitingPlayer.join(roomId);
            socket.join(roomId);
            waitingPlayer.emit('room_joined', { roomId, playerIndex: 0 });
            socket.emit('room_joined', { roomId, playerIndex: 1 });
            io.to(roomId).emit('start_game');
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
        }
    });

    // Kart oynama
    socket.on('play_card', ({ roomId, card, playerIndex }) => {
        const room = rooms[roomId];
        if (!room) return;
        if (playerIndex === -1) return;
        // Kartı elden çıkar
        room.cards[playerIndex] = room.cards[playerIndex].filter(c => c !== card);
        room.turn = 1 - playerIndex;
        // Herkese bildir (hem rakibe hem kendine)
        io.to(roomId).emit('opponent_played', { card, playerIndex });
        // Skor güncellemesi (örnek, gerçek mantık eklenebilir)
        io.to(roomId).emit('update_scores', room.scores);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        // Oda temizliği
        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId];
            if (room.players.some(s => s.id === socket.id)) {
                delete rooms[roomId];
                io.to(roomId).emit('opponent_left');
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu (socket.io ile) çalışıyor: http://localhost:${PORT}`);
}); 