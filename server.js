// server.js
require('dotenv').config();
const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

// Import routers
const authRouter     = require('./routes/auth');
const eventRouter    = require('./routes/event');       // ← here
const resourceRouter = require('./routes/resource');
const bookRouter     = require('./routes/book');
const chatRouter     = require('./routes/chat');

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5500',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/api/auth',      authRouter);
app.use('/api/events',    eventRouter);      // ← here
app.use('/api/resources', resourceRouter);
app.use('/api/books',     bookRouter);
app.use('/api/chat',      chatRouter);

// Connect & start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
})
.catch(err => console.error('MongoDB connection error:', err));
