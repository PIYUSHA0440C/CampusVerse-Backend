// server.js
require('dotenv').config()
const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

// Import route modules
const authRouter     = require('./routes/auth')
const eventRouter    = require('./routes/event')
const resourceRouter = require('./routes/resource')
const bookRouter     = require('./routes/book')
const chatRouter     = require('./routes/chat')

const app = express()

// --- CORS ---
// Allow your frontend on GitHub Pages and your own backend origin
const CLIENT_ORIGINS = [
  'https://piyusha0440c.github.io',
  'https://piyusha0440c.github.io/campusverse-frontend',
  'https://campusverse-backend.onrender.com'
]

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true,
}))

// --- MIDDLEWARE ---
app.use(express.json())
app.use(cookieParser())

// --- ROUTES ---
app.use('/api/auth',      authRouter)
app.use('/api/events',    eventRouter)
app.use('/api/resources', resourceRouter)
app.use('/api/books',     bookRouter)
app.use('/api/chat',      chatRouter)

// --- CONNECT & START ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected')
  const port = process.env.PORT || 5000
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`))
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err)
})
