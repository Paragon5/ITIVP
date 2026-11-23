require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const http = require('http');
const { Server } = require('socket.io');
const { Ticket, User } = require('./models');
const Message = require('./models/message');
const auth = require('./middleware/auth');
const adminOnly = require('./middleware/adminOnly');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.get('/', async (req, res) => {
    const tickets = await Ticket.findAll({ order: [['id', 'DESC']] });
    res.status(200).json(tickets);
});


app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));

app.get('/profile', auth, async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.status(200).json({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
    });
});



let statuses = ['active', 'winner', 'expired'];


function generateNumbers() {
    let numbers = [];

    while (numbers.length < 6) {
        let number = Math.floor(Math.random() * 49) + 1;

        if (numbers.indexOf(number) === -1) {
            numbers.push(number);
        }
    }

    numbers.sort((a, b) => a - b);
    return numbers;
}


function checkNumbers(numbers) {
    if (!Array.isArray(numbers) || numbers.length !== 6) {
        return false;
    }

    for (let i = 0; i < numbers.length; i++) {
        if (Number.isInteger(numbers[i]) !== true) {
            return false;
        }
        if (numbers[i] < 1 || numbers[i] > 49) {
            return false;
        }
        if (numbers.indexOf(numbers[i]) !== i) {
            return false;
        }
    }

    return true;
}


app.get('/tickets', auth, async (req, res) => {
    const status = req.query.status;
    const search = req.query.search;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    if (status && status !== 'all' && statuses.indexOf(status) === -1) {
        return res.status(200).json([]);
    }

    const whereConditions = [];
    if (status && status !== 'all') whereConditions.push({ status: status });
    if (!isAdmin) {
        whereConditions.push({
            [Op.or]: [
                { userId: userId },
                { owner: req.user.email }
            ]
        });
    }
    if (search && String(search).trim()) {
        whereConditions.push({ owner: { [Op.iLike]: `%${String(search).trim()}%` } });
    }
    const where = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    const tickets = await Ticket.findAll({
        where,
        order: [['id', 'DESC']],
        limit,
        offset
    });

    res.status(200).json(tickets);
});


app.get('/tickets/:id', auth, async (req, res) => {
    const id = parseInt(req.params.id);
    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    if (!isAdmin && ticket.userId !== userId && ticket.owner !== req.user.email) {
        return res.status(403).json({ error: "Нет прав на просмотр этого билета" });
    }

    res.status(200).json(ticket);
});

app.post('/tickets', auth, async (req, res) => {
    const body = req.body ? req.body : {};
    const owner = body.owner;
    const numbers = body.numbers;

    if (!owner || typeof owner !== 'string') {
        return res.status(400).json({ error: "Поле 'owner' обязательно и должно быть строкой" });
    }

    if (numbers && checkNumbers(numbers) !== true) {
        return res.status(400).json({ error: "Поле 'numbers' должно содержать 6 разных чисел от 1 до 49" });
    }

    const ticket = await Ticket.create({
        owner: owner,
        userId: req.user.id,
        numbers: numbers ? numbers : generateNumbers(),
        purchaseDate: new Date(),
        status: 'active',
        ...(body.prizeAmount !== undefined ? { prizeAmount: body.prizeAmount } : {})
    });

    res.status(201).json(ticket);
});

// Покупка одного или нескольких билетов (сразу оплачено, цена 5 BYN за шт.)
app.post('/tickets/purchase', auth, async (req, res) => {
    const body = req.body ? req.body : {};
    const quantity = Math.max(1, parseInt(body.quantity, 10) || 1);
    const owner = body.owner && typeof body.owner === 'string' ? body.owner.trim() : req.user.email;
    const pricePerTicket = 5;
    const tickets = [];

    for (let i = 0; i < quantity; i++) {
        const numbers = generateNumbers();
        const ticket = await Ticket.create({
            owner,
            userId: req.user.id,
            numbers,
            purchaseDate: new Date(),
            status: 'active',
            prizeAmount: 0,
            paymentStatus: 'paid',
            paymentAmount: pricePerTicket,
            paymentDate: new Date()
        });
        tickets.push(ticket);
    }

    res.status(201).json({
        tickets,
        total: pricePerTicket * quantity,
        message: `Куплено билетов: ${quantity} на сумму ${pricePerTicket * quantity} BYN`
    });
});

app.put('/tickets/:id', auth, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = req.body ? req.body : {};
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    if (!isAdmin && ticket.userId !== userId && ticket.owner !== req.user.email) {
        return res.status(403).json({ error: "Нет прав на редактирование этого билета" });
    }

    const owner = body.owner;
    const numbers = body.numbers;
    const status = body.status;
    const prizeAmount = body.prizeAmount;

    if (owner !== undefined && (typeof owner !== 'string' || !owner.trim())) {
        return res.status(400).json({ error: "Поле 'owner' должно быть непустой строкой" });
    }
    if (numbers !== undefined && checkNumbers(numbers) !== true) {
        return res.status(400).json({ error: "Поле 'numbers' должно содержать 6 разных чисел от 1 до 49" });
    }
    if (status !== undefined && !['active', 'winner', 'expired'].includes(status)) {
        return res.status(400).json({ error: "Недопустимый статус билета" });
    }

    const updateData = {};
    if (owner !== undefined) updateData.owner = owner.trim();
    if (numbers !== undefined) updateData.numbers = numbers;
    if (status !== undefined) updateData.status = status;
    if (prizeAmount !== undefined) updateData.prizeAmount = prizeAmount;

    await Ticket.update(updateData, { where: { id: id } });
    const updated = await Ticket.findByPk(id);
    res.status(200).json(updated);
});

app.delete('/tickets/:id', auth, async (req, res) => {
    const id = parseInt(req.params.id);
    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    if (!isAdmin && ticket.userId !== userId && ticket.owner !== req.user.email) {
        return res.status(403).json({ error: "Нет прав на удаление этого билета" });
    }

    await Ticket.destroy({ where: { id: id } });
    res.status(200).json({ message: "Билет удалён", id: id });
});


app.post('/tickets/:id/pay', auth, async (req, res) => {
    const id = parseInt(req.params.id);
    const body = req.body ? req.body : {};
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    if (!isAdmin && ticket.userId !== userId && ticket.owner !== req.user.email) {
        return res.status(403).json({ error: "Нет прав на оплату этого билета" });
    }

    if (ticket.paymentStatus === 'paid') {
        return res.status(400).json({ error: "Билет уже оплачен" });
    }

    const paymentAmount = body.paymentAmount !== undefined ? parseFloat(body.paymentAmount) : 0;

    if (isNaN(paymentAmount) || paymentAmount < 0) {
        return res.status(400).json({ error: "Некорректная сумма оплаты" });
    }

    await Ticket.update({
        paymentStatus: 'paid',
        paymentAmount: paymentAmount,
        paymentDate: new Date()
    }, { where: { id: id } });

    const updated = await Ticket.findByPk(id);
    res.status(200).json({
        message: "Оплата прошла успешно",
        ticket: updated
    });
});


app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: "Некорректный JSON в теле запроса" });
    }
    console.error(err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});


// История сообщений (PostgreSQL)
app.get('/api/messages', async (req, res) => {
    try {
        const { room, limit = 50 } = req.query;
        const messages = await Message.findAll({
            where: { room },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10)
        });
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    socket.on('join room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('chat message', async ({ room, text, user }) => {
        try {
            const message = await Message.create({
                room: room || 'general',
                text,
                user: user || 'Аноним'
            });
            io.to(room).emit('chat message', {
                id: message.id,
                room: message.room,
                text: message.text,
                user: message.user,
                createdAt: message.createdAt
            });
        } catch (err) {
            console.error('Error saving message:', err);
            socket.emit('error', { message: 'Не удалось сохранить сообщение' });
        }
    });

    socket.on('typing', ({ room, user }) => {
        socket.to(room).emit('typing', { user, room });
    });

    socket.on('disconnect', () => console.log('User disconnected', socket.id));
});

server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
