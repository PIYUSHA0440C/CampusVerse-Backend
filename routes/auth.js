const router = require('express').Router()
const {
  register,
  login,
  getUser,
  logout
} = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

router.post('/register', register)
router.post('/login',    login)
router.get('/user',      protect, getUser)
router.get('/logout',    logout)

module.exports = router
