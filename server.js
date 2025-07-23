// server.js
require('dotenv').config()
const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

// Routers
const authRouter     = require('./routes/auth')
const userRouter     = require('./routes/user')
const eventRouter    = require('./routes/event')
const resourceRouter = require('./routes/resource')
const bookRouter     = require('./routes/book')
const chatRouter     = require('./routes/chat')

const app = express()

// Trust Render’s TLS proxy so secure cookies work
app.set('trust proxy', 1)

// CORS: your GH Pages & backend
const CLIENT_ORIGINS = [
  'https://piyusha0440c.github.io',
  'https://campusverse-frontend.onrender.com', 
  'https://campusverse-backend.onrender.com'
]
app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// Mount in this order!
app.use('/api/auth',      authRouter)
app.use('/api/users',     userRouter)
app.use('/api/events',    eventRouter)
app.use('/api/resources', resourceRouter)
app.use('/api/books',     bookRouter)
app.use('/api/chat',      chatRouter)

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected')
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`))
})
.catch(err => console.error('❌ MongoDB error:', err))
