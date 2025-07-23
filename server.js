require('dotenv').config()
const express      = require('express')
const mongoose     = require('mongoose')
const cors         = require('cors')
const cookieParser = require('cookie-parser')

const authRouter = require('./routes/auth')
const chatRouter = require('./routes/chat')
const userRouter = require('./routes/user')

const app = express()
app.set('trust proxy', 1)

app.use(cors({
  origin: [
    'https://piyusha0440c.github.io',
    'https://campusverse-backend.onrender.com'
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth',  authRouter)
app.use('/api/chat',  chatRouter)
app.use('/api/users', userRouter)

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected')
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))
})
.catch(err => console.error('❌ MongoDB error:', err))
