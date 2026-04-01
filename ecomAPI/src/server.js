import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import viewEngine from './config/viewEngine';
import initwebRoutes from './route/web';
import connectDB from './config/connectDB';
import http from 'http';
import { sendMessage } from './services/messageService';
import { upsertShipperLocation } from './services/shipperLocationService';
import db from './models/index';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
let app = express();

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

viewEngine(app);
initwebRoutes(app);
connectDB(app);

const server = http.createServer(app);

const socketIo = new Server(server, {
  cors: {
    origin: '*',
  },
});
socketIo.on('connection', (socket) => {
  console.log('New client connected ' + socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId); // user vào room riêng
  });
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId); // user rời room
  });
  socket.on('sendDataClient', function (data) {
    sendMessage(data);
    socketIo.to(data.roomId).emit('sendDataServer', { data }); // ← chỉ gửi cho room đó
  });
  socket.on('loadRoomClient', function (data) {
    socketIo.to(data.roomId).emit('loadRoomServer', { data }); // ← chỉ gửi cho room đó
  });

  // Shipper gửi vị trí realtime (mỗi 10s khi đang giao)
  socket.on('shipper:location', async (data) => {
    const { shipperId, lat, lng, orderIds } = data || {};
    if (!shipperId || lat == null || lng == null) return;
    await upsertShipperLocation(shipperId, lat, lng);
    const ids = Array.isArray(orderIds) ? orderIds : [];
    ids.forEach((orderId) => {
      socketIo.to(`order:tracking:${orderId}`).emit('order:shipper_location', {
        orderId,
        shipperId,
        lat,
        lng,
      });
    });
    socketIo.to('admin:shipper_map').emit('shipper:location', { shipperId, lat, lng });
  });

  // Khách hàng join room theo dõi đơn (chỉ chủ đơn mới được join)
  socket.on('join_order_tracking', async (data) => {
    const { orderId, token } = data || {};
    if (!orderId || !token) return;
    try {
      const accessToken = (token || '').split(' ')[1] || token;
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
      const order = await db.OrderProduct.findOne({ where: { id: orderId }, raw: true });
      if (!order) return;
      const addressUser = await db.AddressUser.findOne({
        where: { id: order.addressUserId },
        raw: true,
      });
      if (!addressUser || addressUser.userId !== payload.sub) return;
      socket.join(`order:tracking:${orderId}`);
    } catch (e) {
      // invalid token or not owner
    }
  });

  // Admin/Saler join room bản đồ shipper
  socket.on('join_admin_shipper_map', async (data) => {
    const { token } = data || {};
    if (!token) return;
    try {
      const accessToken = (token || '').split(' ')[1] || token;
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
      const user = await db.User.findOne({ where: { id: payload.sub }, raw: true });
      if (user && (user.roleId === 'R1' || user.roleId === 'R4')) {
        socket.join('admin:shipper_map');
      }
    } catch (e) {
      // invalid token or not admin
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
let port = process.env.PORT || 6969;

server.listen(port, () => {
  console.log('Backend Nodejs is running on the port : ' + port);
});
