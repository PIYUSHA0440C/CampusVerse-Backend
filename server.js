// server.js

require('dotenv').config()
const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

// Import routers
const authRouter     = require('./routes/auth')
const eventRouter    = require('./routes/event')
const resourceRouter = require('./routes/resource')
const bookRouter     = require('./routes/book')
const chatRouter     = require('./routes/chat')

const app = express()

// --- CORS CONFIGURATION ---
// Whitelist your GitHub Pages front-end + backend self-origin
const CLIENT_ORIGINS = [
  'https://piyusha0440c.github.io',
  'https://piyusha0440c.github.io/campusverse-frontend',
  'https://campusverse-backend.onrender.com'
]

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}))

// --- GLOBAL MIDDLEWARE ---
app.use(express.json())
app.use(cookieParser())

// --- ROUTES ---
app.use('/api/auth',      authRouter)     // register, login, logout, user
app.use('/api/events',    eventRouter)    // create & list events
app.use('/api/resources', resourceRouter) // upload & fetch resources
app.use('/api/books',     bookRouter)     // lend, borrow, accept, list books
app.use('/api/chat',      chatRouter)     // global, group, one-to-one

// --- CONNECT TO MONGODB & START SERVER ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected')
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err)
})
