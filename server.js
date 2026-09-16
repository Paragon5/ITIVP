const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());


let tickets = [
    {
        id: 1,
        owner: 'Иван Иванов',
        numbers: [4, 12, 23, 31, 38, 45],
        purchaseDate: '2026-09-01',
        status: 'active'
    },
    {
        id: 2,
        owner: 'Петр Петров',
        numbers: [2, 9, 17, 28, 33, 41],
        purchaseDate: '2026-09-02',
        status: 'winner'
    }
];
let nextId = 3;
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


app.get('/tickets', (req, res) => {
    const status = req.query.status;

    if (status) {
        const found = tickets.filter(t => t.status === status);
        return res.status(200).json(found);
    }

    res.status(200).json(tickets);
});

app.get('/tickets/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ticket = tickets.find(t => t.id === id);

    if (!ticket) {
        return res.status(404).json({ error: "Билет не найден" });
    }
    res.status(200).json(ticket);
});

app.post('/tickets', (req, res) => {
    const body = req.body ? req.body : {};
    const owner = body.owner;
    const numbers = body.numbers;

    if (!owner || typeof owner !== 'string') {
        return res.status(400).json({ error: "Поле 'owner' обязательно и должно быть строкой" });
    }

    if (numbers && checkNumbers(numbers) !== true) {
        return res.status(400).json({ error: "Поле 'numbers' должно содержать 6 разных чисел от 1 до 49" });
    }

    const newTicket = {
        id: nextId++,
        owner: owner,
        numbers: numbers ? numbers : generateNumbers(),
        purchaseDate: new Date().toISOString(),
        status: 'active'
    };

    tickets.push(newTicket);
    res.status(201).json(newTicket);
});

app.put('/tickets/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const body = req.body ? req.body : {};
    const owner = body.owner;
    const numbers = body.numbers;
    const status = body.status;
    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
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

    tickets[ticketIndex] = {
        id: id,
        owner: owner,
        numbers: numbers,
        purchaseDate: tickets[ticketIndex].purchaseDate,
        status: status ? status : 'active'
    };

    res.status(200).json(tickets[ticketIndex]);
});

app.delete('/tickets/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
        return res.status(404).json({ error: "Билет не найден" });
    }

    tickets.splice(ticketIndex, 1);
    res.status(200).json({ message: "Билет успешно удален" });
});


app.use((req, res, next) => {
    res.status(404).json({ error: "Маршрут не найден" });
});


app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: "Некорректный JSON в теле запроса" });
    }

    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Try testing: GET http://localhost:${PORT}/tickets`);
});