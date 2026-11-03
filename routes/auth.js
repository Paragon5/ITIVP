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
        return res.status(400).json({ error: "РџРѕР»СЏ 'email' Рё 'password' РѕР±СЏР·Р°С‚РµР»СЊРЅС‹ Рё РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ СЃС‚СЂРѕРєР°РјРё" });
    }

    const existing = await User.findOne({ where: { email: email } });
    if (existing) {
        return res.status(409).json({ error: "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ С‚Р°РєРёРј email СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚" });
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
        return res.status(400).json({ error: "РџРѕР»СЏ 'email' Рё 'password' РѕР±СЏР·Р°С‚РµР»СЊРЅС‹ Рё РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ СЃС‚СЂРѕРєР°РјРё" });
    }

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        return res.status(401).json({ error: "РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ" });
    }

    // РџСЂРѕРІРµСЂРєР° Р±Р»РѕРєРёСЂРѕРІРєРё
    if (user.lockUntil && user.lockUntil > new Date()) {
        const minutes = Math.ceil((user.lockUntil - new Date()) / 60000);
        return res.status(423).json({
            error: `РЈС‡С‘С‚РЅР°СЏ Р·Р°РїРёСЃСЊ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅР° РїРѕСЃР»Рµ ${MAX_ATTEMPTS} РЅРµСѓРґР°С‡РЅС‹С… РїРѕРїС‹С‚РѕРє. РћСЃС‚Р°Р»РѕСЃСЊ ${minutes} РјРёРЅ.`
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
                error: `РџСЂРµРІС‹С€РµРЅРѕ РєРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРїС‹С‚РѕРє. РЈС‡С‘С‚РЅР°СЏ Р·Р°РїРёСЃСЊ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅР° РЅР° ${LOCK_MINUTES} РјРёРЅ.`
            });
        }

        await user.update(update);
        return res.status(401).json({
            error: "РќРµРІРµСЂРЅС‹Р№ email РёР»Рё РїР°СЂРѕР»СЊ",
            remainingAttempts: MAX_ATTEMPTS - attempts
        });
    }

    // РЈСЃРїРµС€РЅС‹Р№ РІС…РѕРґ вЂ” СЃР±СЂРѕСЃ СЃС‡С‘С‚С‡РёРєР°
    if (user.failedLoginAttempts !== 0 || user.lockUntil) {
        await user.update({ failedLoginAttempts: 0, lockUntil: null });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token: token, tokenType: "Bearer", expiresIn: "1h" });
});


module.exports = router;

