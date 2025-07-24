
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
const userRouter     = require('./routes/users') // ✅ ADDED for user search route

const app = express()

// Trust proxy so secure cookies work behind Render
app.set('trust proxy', 1)

// CORS: allow GH Pages frontend + backend origin
const CLIENT_ORIGINS = [
  'https://piyusha0440c.github.io',
  'https://piyusha0440c.github.io/campusverse-frontend',
  'https://campusverse-backend.onrender.com'
]

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}))

// Parse JSON bodies and cookies
app.use(express.json())
app.use(cookieParser())

// Mount routers
app.use('/api/auth',      authRouter)
app.use('/api/events',    eventRouter)
app.use('/api/resources', resourceRouter)
app.use('/api/books',     bookRouter)
app.use('/api/chat',      chatRouter)
app.use('/api/users',     userRouter) // ✅ ADDED to enable user suggestions in one-to-one chat

// Connect to MongoDB & start server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ MongoDB connected')
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () =>
      console.log(`🚀 Server listening on port ${PORT}`)
    )
  })
  .catch(err => console.error('❌ MongoDB connection error:', err))
