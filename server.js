require('dotenv').config();

const express = require('express');
const { Ticket, User } = require('./models');
const auth = require('./middleware/auth');

const app = express();
const PORT = 3000;

app.use(express.json());


// --- Аутентификация и авторизация (ЛР №3) ---
app.use('/auth', require('./routes/auth'));

// Текущий пользователь — только для авторизованных
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

// Пример защищённого маршрута: удаление билета только авторизованными


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


app.get('/tickets', async (req, res) => {
    const status = req.query.status;

    if (status && statuses.indexOf(status) === -1) {
        return res.status(200).json([]);
    }

    const tickets = await Ticket.findAll({
        where: status ? { status: status } : {},
        order: [['id', 'ASC']]
    });

    res.status(200).json(tickets);
});


app.get('/tickets/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    res.status(200).json(ticket);
});

app.post('/tickets', async (req, res) => {
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
        numbers: numbers ? numbers : generateNumbers(),
        purchaseDate: new Date(),
        status: 'active',
        ...(body.prizeAmount !== undefined ? { prizeAmount: body.prizeAmount } : {})
    });

    res.status(201).json(ticket);
});


app.put('/tickets/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const body = req.body ? req.body : {};
    const owner = body.owner;
    const numbers = body.numbers;
    const status = body.status;

    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    if (!owner || typeof owner !== 'string' || !numbers) {
        return res.status(400).json({ error: "Поля 'owner' и 'numbers' обязательны для заполнения" });
    }

    if (checkNumbers(numbers) !== true) {
        return res.status(400).json({ error: "Поле 'numbers' должно содержать 6 разных чисел от 1 до 49" });
    }

    if (status && statuses.indexOf(status) === -1) {
        return res.status(400).json({ error: "Недопустимое значение 'status'. Разрешены: active, winner, expired" });
    }

    await Ticket.update({
        owner: owner,
        numbers: numbers,
        purchaseDate: ticket.purchaseDate,
        status: status ? status : 'active',
        ...(body.prizeAmount !== undefined ? { prizeAmount: body.prizeAmount } : {})
    }, { where: { id: id } });

    const updated = await Ticket.findByPk(id);
    res.status(200).json(updated);
});

app.delete('/tickets/:id', auth, async (req, res) => {
    const id = parseInt(req.params.id);
    const ticket = Number.isNaN(id) ? null : await Ticket.findByPk(id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    await Ticket.destroy({ where: { id: id } });
    res.status(200).json({ message: "Билет удалён", id: id });
});


app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: "Некорректный JSON в теле запроса" });
    }
    console.error(err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});


app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
