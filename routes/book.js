// routes/book.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAll,
  postLend,
  postBorrow,
  acceptRequest
} = require('../controllers/bookController');

router.get('/',             getAll);
router.post('/lend',        protect, postLend);
router.post('/borrow',      protect, postBorrow);
router.patch('/accept/:id', protect, acceptRequest);

module.exports = router;
