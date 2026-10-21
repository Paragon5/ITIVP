const express = require('express');
const { Ticket, User } = require('../models');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// Все маршруты ниже — только для авторизованных администраторов
router.use(auth, adminOnly);

const statuses = ['active', 'winner', 'expired'];

// Просмотр всех билетов всех пользователей (с владельцем)
router.get('/tickets', async (req, res) => {
    const status = req.query.status;

    if (status && statuses.indexOf(status) === -1) {
        return res.status(200).json([]);
    }

    const tickets = await Ticket.findAll({
        where: status ? { status: status } : {},
        include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        order: [['id', 'ASC']]
    });

    res.status(200).json(tickets);
});

// Список всех пользователей (без хэшей паролей)
router.get('/users', async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'email', 'role', 'createdAt'],
        order: [['id', 'ASC']]
    });

    res.status(200).json(users);
});

// Статистика: количество билетов по статусам и сумма призовых
router.get('/stats', async (req, res) => {
    const tickets = await Ticket.findAll();

    const byStatus = { active: 0, winner: 0, expired: 0 };
    let totalPrize = 0;

    for (const ticket of tickets) {
        byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
        totalPrize += Number(ticket.prizeAmount) || 0;
    }

    res.status(200).json({
        totalTickets: tickets.length,
        byStatus: byStatus,
        totalPrize: totalPrize
    });
});

module.exports = router;