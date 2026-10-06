const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;


router.post('/register', async (req, res) => {
    const body = req.body ? req.body : {};
    const email = body.email;
    const password = body.password;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: "Поля 'email' и 'password' обязательны и должны быть строками" });
    }

    const existing = await User.findOne({ where: { email: email } });
    if (existing) {
        return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        email: email,
        passwordHash: passwordHash,
        failedLoginAttempts: 0,
        lockUntil: null
    });

    res.status(201).json({ id: user.id, email: user.email });
});


router.post('/login', async (req, res) => {
    const body = req.body ? req.body : {};
    const email = body.email;
    const password = body.password;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: "Поля 'email' и 'password' обязательны и должны быть строками" });
    }

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    // Проверка блокировки
    if (user.lockUntil && user.lockUntil > new Date()) {
        const minutes = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res.status(423).json({
            error: `Учётная запись заблокирована после ${MAX_ATTEMPTS} неудачных попыток. Осталось ${minutes} мин.`
        });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
        const attempts = user.failedLoginAttempts + 1;
        const update = { failedLoginAttempts: attempts };

        if (attempts >= MAX_ATTEMPTS) {
            update.failedLoginAttempts = 0;
            update.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
            await user.update(update);
            return res.status(423).json({
                error: `Превышено количество попыток. Учётная запись заблокирована на ${LOCK_MINUTES} мин.`
            });
        }

        await user.update(update);
        return res.status(401).json({
            error: "Неверный email или пароль",
            remainingAttempts: MAX_ATTEMPTS - attempts
        });
    }

    // Успешный вход — сброс счётчика
    if (user.failedLoginAttempts !== 0 || user.lockUntil) {
        await user.update({ failedLoginAttempts: 0, lockUntil: null });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token: token, tokenType: "Bearer", expiresIn: "1h" });
});


module.exports = router;
