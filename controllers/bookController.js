// controllers/bookController.js
const Book = require('../models/Book');

exports.getAll = async (_req, res) => {
  try {
    const books = await Book.find()
      .populate('user','username')
      .populate('acceptedBy','username')
      .sort('-createdAt');
    res.json(books);
  } catch (err) {
    console.error('Fetch books error:', err);
    res.status(500).json({ message: 'Fetch book feed failed' });
  }
};

exports.postLend = async (req, res) => {
  try {
    const { title, author, description } = req.body;
    const book = await Book.create({
      user: req.userId, type:'lend', title, author, description
    });
    res.status(201).json(book);
  } catch (err) {
    console.error('Post lend error:', err);
    res.status(500).json({ message: 'Post lend failed' });
  }
};

exports.postBorrow = async (req, res) => {
  try {
    const { title, reason } = req.body;
    const book = await Book.create({
      user: req.userId, type:'borrow', title, reason
    });
    res.status(201).json(book);
  } catch (err) {
    console.error('Post borrow error:', err);
    res.status(500).json({ message: 'Post borrow failed' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || book.type!=='borrow') {
      return res.status(404).json({ message: 'Not found' });
    }
    book.accepted   = true;
    book.acceptedBy = req.userId;
    await book.save();
    res.json(book);
  } catch (err) {
    console.error('Accept request error:', err);
    res.status(500).json({ message: 'Accept request failed' });
  }
};
