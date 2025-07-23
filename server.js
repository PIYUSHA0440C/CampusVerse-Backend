// server.js
require('dotenv').config()
const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

const authRouter = require('./routes/auth')
const userRouter = require('./routes/user')
const chatRouter = require('./routes/chat')

const app = express()

// Trust proxy (for secure cookies behind Render)
app.set('trust proxy', 1)

// CORS: allow your GH Pages + backend origin
const CLIENT_ORIGINS = [
  'https://piyusha0440c.github.io',
  'https://piyusha0440c.github.io/campusverse-frontend',
  'https://campusverse-backend.onrender.com'
]
app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth',  authRouter)
app.use('/api/users', userRouter)
app.use('/api/chat',  chatRouter)

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected')
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () =>
    console.log(`🚀 Server listening on port ${PORT}`)
  )
})
.catch(err => console.error('❌ MongoDB connection error:', err))
