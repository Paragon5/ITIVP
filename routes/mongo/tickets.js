const express = require('express');
const Ticket = require('../../models/mongo/Ticket');

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { status, owner, tag, limit = 50, offset = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (owner) filter.owner = new RegExp(owner, 'i');
    if (tag) filter.tags = tag;

    const tickets = await Ticket.find(filter)
      .sort({ purchaseDate: -1 })
      .limit(parseInt(limit, 10))
      .skip(parseInt(offset, 10));

    res.status(200).json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mongo/tickets/:id → билет по id
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.status(200).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mongo/tickets → создать билет
router.post('/', async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/mongo/tickets/:id → обновить билет
router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.status(200).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/mongo/tickets/:id → удалить билет и вернуть удалённый документ
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.status(200).json({ message: 'Билет удалён', ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mongo/tickets/:id/reviews → добавить отзыв (вложенный массив)
router.post('/:id/reviews', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    await ticket.addReview(req.body);
    res.status(201).json({ message: 'Отзыв добавлен', reviews: ticket.reviews });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/mongo/tickets/:id/payment → обновить вложенный документ оплаты
router.patch('/:id/payment', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: { payment: req.body } },
      { new: true, runValidators: true }
    );
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }
    res.status(200).json({ message: 'Оплата обновлена', payment: ticket.payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/mongo/tickets/:id/reviews/:reviewId → обновить элемент внутри массива отзывов
router.patch('/:id/reviews/:reviewId', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    const review = ticket.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    // Обновляем поля вложенного документа
    Object.assign(review, req.body);
    await ticket.save();

    res.status(200).json({ message: 'Отзыв обновлён', review });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/mongo/tickets/:id/reviews/:reviewId → удалить элемент из вложенного массива
router.delete('/:id/reviews/:reviewId', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Билет не найден' });
    }

    const review = ticket.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    review.deleteOne();
    await ticket.save();

    res.status(200).json({ message: 'Отзыв удалён', reviews: ticket.reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
