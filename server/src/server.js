import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import societyRoutes from './routes/societyRoutes.js';
import buildingRoutes from './routes/buildingRoutes.js';
import flatRoutes from './routes/flatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import billRoutes from './routes/billRoutes.js';
import amenityRoutes from './routes/amenityRoutes.js';
import pollRoutes from './routes/pollRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  console.log(`🔌 Socket Connected: ${socket.id}`);

  socket.on('join_society', (societyId) => {
    socket.join(`society_${societyId}`);
    console.log(`Socket ${socket.id} joined society_${societyId}`);
  });

  socket.on('join_resident', (flatId) => {
    socket.join(`flat_${flatId}`);
    console.log(`Socket ${socket.id} joined flat_${flatId}`);
  });

  socket.on('join_security', (societyId) => {
    socket.join(`security_${societyId}`);
    console.log(`Socket ${socket.id} joined security_${societyId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket Disconnected: ${socket.id}`);
  });
});

// Make io accessible in req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'SocioHub API',
    phase: 'Phase 3 - Financial Engine, Amenities, Community & Polish',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/society', societyRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 SocioHub Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
