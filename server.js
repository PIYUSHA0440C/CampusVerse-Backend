// server.js
require('dotenv').config()
const express     = require('express')
const mongoose    = require('mongoose')
const cors        = require('cors')
const cookieParser= require('cookie-parser')
const multer      = require('multer')
const { v2: cloudinary } = require('cloudinary')
const streamifier = require('streamifier')
const bcrypt      = require('bcryptjs')
const jwt         = require('jsonwebtoken')

const app = express()

// --- CORS ---
const CLIENT_ORIGINS = [
  'https://campusverse-backend.onrender.com',
  'https://piyusha0440c.github.io',
  'https://piyusha0440c.github.io/campusverse-frontend'
]
app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true,
}))

// --- MIDDLEWARE ---
app.use(express.json())
app.use(cookieParser())

// --- CLOUDINARY CONFIG ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})
const upload = multer()

// --- MONGOOSE MODELS ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

const { Schema } = mongoose

// User
const userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true },
  college:  { type: String, required: true }
})
const User = mongoose.model('User', userSchema)

// Resource
const resourceSchema = new Schema({
  title:   String,
  link:    String,
  subject: String,
  user:    { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
})
const Resource = mongoose.model('Resource', resourceSchema)

// Event
const eventSchema = new Schema({
  title:    String,
  desc:     String,
  datetime: Date,
  link:     String,
  mediaUrl: String,
  user:     { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt:{ type: Date, default: Date.now }
})
const Event = mongoose.model('Event', eventSchema)

// Book Exchange
const bookSchema = new Schema({
  type:        { type: String, enum:['lend','borrow'], required: true },
  title:       String,
  author:      String,
  description: String,
  reason:      String,
  user:        { type: Schema.Types.ObjectId, ref: 'User' },
  accepted:    { type: Boolean, default: false },
  acceptedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now }
})
const Book = mongoose.model('Book', bookSchema)

// Chat message
const chatSchema = new Schema({
  kind:     { type: String, enum:['global','group','one-to-one'], required: true },
  sender:   { type: Schema.Types.ObjectId, ref: 'User' },
  college:  String,            // for group
  receiver: { type: Schema.Types.ObjectId, ref: 'User' }, // for one-to-one
  text:     String,
  createdAt:{ type: Date, default: Date.now }
})
const Chat = mongoose.model('Chat', chatSchema)

// --- AUTH HELPERS ---
const JWT_SECRET = process.env.JWT_SECRET

function authMiddleware(req,res,next){
  const token = req.cookies.token
  if(!token) return res.status(401).json({ message:'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.id
    next()
  } catch {
    res.status(401).json({ message:'Invalid token' })
  }
}

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req,res) => {
  const { username,email,password,college } = req.body
  if(!username||!email||!password||!college)
    return res.status(400).json({ message:'Missing fields' })
  try {
    const hash = await bcrypt.hash(password,12)
    const user = await User.create({ username, email, password:hash, college })
    res.status(201).json({ message:'Registered' })
  } catch(err){
    res.status(400).json({ message: err.code===11000
      ? 'Username or email taken'
      : 'Registration error' })
  }
})

app.post('/api/auth/login', async (req,res) => {
  const { username,password } = req.body
  const user = await User.findOne({ username })
  if(!user||!await bcrypt.compare(password,user.password))
    return res.status(401).json({ message:'Invalid credentials' })
  const token = jwt.sign({ id:user._id }, JWT_SECRET, { expiresIn:'7d' })
  res.cookie('token', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    maxAge:   7*24*60*60*1000
  })
  res.json({ message:'Logged in' })
})

app.get('/api/auth/logout', (req,res) => {
  res.clearCookie('token', { sameSite:'none', secure:true })
  res.json({ message:'Logged out' })
})

app.get('/api/auth/user', authMiddleware, async (req,res) => {
  const user = await User.findById(req.userId)
  res.json({ username: user.username, college: user.college })
})

// --- RESOURCE ROUTES ---
app.post('/api/resources', authMiddleware, async (req,res) => {
  const { title,link,subject } = req.body
  const resource = await Resource.create({
    title, link, subject, user: req.userId
  })
  res.status(201).json(resource)
})
app.get('/api/resources', authMiddleware, async (req,res) => {
  const list = await Resource.find().populate('user','username')
  res.json(list)
})

// --- EVENT ROUTES ---
app.post('/api/events', authMiddleware, upload.single('media'), async (req,res) => {
  let mediaUrl = ''
  if(req.file){
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder:'campusverse/events' },
      (err,result) => {
        if(err) console.error(err)
        else mediaUrl = result.secure_url
      }
    )
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream)
  }
  // wait a tick for upload
  setTimeout(async () => {
    const ev = await Event.create({
      title: req.body.title,
      desc:  req.body.desc,
      datetime: req.body.datetime,
      link: req.body.link,
      mediaUrl,
      user: req.userId
    })
    res.status(201).json(ev)
  }, 1000)
})
app.get('/api/events', authMiddleware, async (req,res) => {
  const evs = await Event.find().sort('datetime').populate('user','username')
  res.json(evs)
})

// --- BOOK EXCHANGE ---
app.get('/api/books', authMiddleware, async (req,res) => {
  const books = await Book.find()
    .populate('user','username')
    .populate('acceptedBy','username')
  res.json(books)
})
app.post('/api/books/lend', authMiddleware, async (req,res) => {
  const b = await Book.create({
    type:'lend', title:req.body.title,
    author:req.body.author, description:req.body.description,
    user:req.userId
  })
  res.status(201).json(b)
})
app.post('/api/books/borrow', authMiddleware, async (req,res) => {
  const b = await Book.create({
    type:'borrow', title:req.body.title,
    reason:req.body.reason, user:req.userId
  })
  res.status(201).json(b)
})
app.patch('/api/books/accept/:id', authMiddleware, async (req,res) => {
  const b = await Book.findById(req.params.id)
  if(!b) return res.status(404).end()
  b.accepted = true
  b.acceptedBy = req.userId
  await b.save()
  res.json(b)
})

// --- CHAT: GLOBAL ---
app.get('/api/chat/global', authMiddleware, async (req,res) => {
  const msgs = await Chat.find({ kind:'global' })
    .sort('createdAt').populate('sender','username')
  res.json(msgs)
})
app.post('/api/chat/global', authMiddleware, async (req,res) => {
  const c = await Chat.create({
    kind:'global', sender:req.userId, text:req.body.text
  })
  res.status(201).json(c)
})

// --- CHAT: GROUP ---
app.get('/api/chat/group', authMiddleware, async (req,res) => {
  const user = await User.findById(req.userId)
  const msgs = await Chat.find({
    kind:'group', college:user.college
  }).sort('createdAt').populate('sender','username')
  res.json(msgs)
})
app.post('/api/chat/group', authMiddleware, async (req,res) => {
  const user = await User.findById(req.userId)
  const c = await Chat.create({
    kind:'group', sender:req.userId, college:user.college,
    text:req.body.text
  })
  res.status(201).json(c)
})

// --- CHAT: ONE-TO-ONE ---
// list contacts
app.get('/api/chat/one-to-one/contacts', authMiddleware, async (req,res) => {
  const userId = req.userId
  const msgs = await Chat.find({ kind:'one-to-one', 
    $or:[{ sender:userId },{ receiver:userId }] })
  const set = new Set()
  msgs.forEach(m => {
    const other = m.sender.equals(userId)? m.receiver: m.sender
    set.add(other.toString())
  })
  const users = await User.find({ _id: { $in: [...set] } })
  res.json(users.map(u => ({ username:u.username })))
})
// get conversation
app.get('/api/chat/one-to-one/:username', authMiddleware, async (req,res) => {
  const other = await User.findOne({ username:req.params.username })
  if(!other) return res.status(404).end()
  const msgs = await Chat.find({
    kind:'one-to-one',
    $or:[
      { sender:req.userId, receiver:other._id },
      { sender:other._id, receiver:req.userId }
    ]
  }).sort('createdAt').populate('sender','username')
  res.json(msgs)
})
// send one-to-one
app.post('/api/chat/one-to-one/:username', authMiddleware, async (req,res) => {
  const other = await User.findOne({ username:req.params.username })
  if(!other) return res.status(404).end()
  const c = await Chat.create({
    kind:'one-to-one',
    sender: req.userId,
    receiver: other._id,
    text: req.body.text
  })
  res.status(201).json(c)
})

// --- START SERVER ---
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})
