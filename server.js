// server.js

require('dotenv').config()
const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

// Your route modules
const authRouter     = require('./routes/auth')
const eventRouter    = require('./routes/event')
const resourceRouter = require('./routes/resource')
const bookRouter     = require('./routes/book')
const chatRouter     = require('./routes/chat')

const app = express()

// Trust the first proxy (needed for Render, Heroku, etc.)
app.set('trust proxy', 1)

// CORS: allow your GitHub Pages front-end + your own backend origin
const CLIENT_ORIGINS = [
  
  'https://piyusha0440c.github.io',
  'https://piyusha0440c.github.io/campusverse-frontend',
  'https://campusverse-backend.onrender.com',
  'http://localhost:5500'
]

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}))

// Parse JSON & Cookies
app.use(express.json())
app.use(cookieParser())

// Mount routers
app.use('/api/auth',      authRouter)     // register, login, logout, /user
app.use('/api/events',    eventRouter)    // POST + GET /events
app.use('/api/resources', resourceRouter) // POST + GET /resources
app.use('/api/books',     bookRouter)     // lend/borrow/accept/list
app.use('/api/chat',      chatRouter)     // global, group, 1-to-1

// Connect to MongoDB & start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected')
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`))
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err)
})
