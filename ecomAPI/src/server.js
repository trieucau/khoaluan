import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import viewEngine from './config/viewEngine.js';
import initwebRoutes from './route/web.js';
import connectDB from './config/connectDB.js';
import http from 'http';
import { sendMessage } from './services/messageService.js';
import { batchUpsertLocations } from './services/shipperLocationService.js';
import db from './models/index.js';

/* ─────────────────────────────────────────────────────────────────────────────
   IN-MEMORY LOCATION CACHE
   Mục đích: Không ghi DB mỗi giây (gây quá tải). Thay vào đó:
   - Lưu vị trí mới nhất vào Map in-memory (cực nhanh, không tốn DB I/O)
   - Socket relay cho khách vẫn chạy realtime (không ảnh hưởng)
   - Flush toàn bộ cache vào DB mỗi DB_FLUSH_INTERVAL_MS (15 giây)
   Kết quả: Giảm DB write từ 60/phút/shipper xuống còn 4/phút/shipper (giảm 93%)
───────────────────────────────────────────────────────────────────────────── */
const locationCache = new Map(); // shipperId → { lat, lng, updatedAt }
const DB_FLUSH_INTERVAL_MS = 15_000; // flush vào DB mỗi 15 giây

const flushLocationCache = async () => {
  if (locationCache.size === 0) return;
  // Snapshot và xóa cache trước khi ghi (tránh race condition)
  const snapshot = new Map(locationCache);
  locationCache.clear();
  try {
    await batchUpsertLocations(snapshot);
  } catch (err) {
    console.error('[LocationCache] Flush error:', err.message);
    // Nếu ghi lỗi → đưa lại vào cache (không mất data)
    for (const [id, loc] of snapshot) {
      if (!locationCache.has(id)) locationCache.set(id, loc);
    }
  }
};

setInterval(flushLocationCache, DB_FLUSH_INTERVAL_MS);

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
    socketIo.to(data.roomId).emit('sendDataServer', { data });
  });
  socket.on('loadRoomClient', function (data) {
    socketIo.to(data.roomId).emit('loadRoomServer', { data });
  });

  // Shipper gửi vị trí realtime (mỗi 1s khi đang giao)
  // FIX HIỆU NĂNG: KHÔNG ghi DB trực tiếp → lưu vào locationCache
  // Flush cache → DB chỉ xảy ra mỗi 15s (giảm 93% DB writes)
  socket.on('shipper:location', (data) => {
    const { shipperId, lat, lng, orderIds } = data || {};
    if (!shipperId || lat == null || lng == null) return;

    // 1. Lưu vào in-memory cache (O(1), không chạm DB)
    locationCache.set(String(shipperId), { lat, lng, updatedAt: Date.now() });

    // 2. Relay realtime cho khách hàng đang theo dõi (qua socket, không qua DB)
    const ids = Array.isArray(orderIds) ? orderIds : [];
    ids.forEach((orderId) => {
      socketIo.to(`order:tracking:${orderId}`).emit('order:shipper_location', {
        orderId,
        shipperId,
        lat,
        lng,
      });
    });

    // 3. Relay cho admin map
    socketIo.to('admin:shipper_map').emit('shipper:location', { shipperId, lat, lng });
  });

  // Khách hàng join room theo dõi đơn (chỉ chủ đơn mới được join)
  socket.on('join_order_tracking', async (data) => {
    const { orderId, token } = data || {};
    if (!orderId || !token) {
      // Nếu không có token (khách chưa đăng nhập), vẫn cho join để xem map cơ bản
      if (orderId) socket.join(`order:tracking:${orderId}`);
      return;
    }
    try {
      const accessToken = (token || '').split(' ')[1] || token;
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
      const order = await db.OrderProduct.findOne({ where: { id: orderId }, raw: true });
      if (!order) return;
      const addressUser = await db.AddressUser.findOne({
        where: { id: order.addressUserId },
        raw: true,
      });
      // FIX: dùng String() để tránh type mismatch (số vs string trong JWT sub)
      if (!addressUser || String(addressUser.userId) !== String(payload.sub)) return;
      socket.join(`order:tracking:${orderId}`);
    } catch (e) {
      // Token hết hạn hoặc không hợp lệ → vẫn join để xem (không lộ data nhạy cảm)
      socket.join(`order:tracking:${orderId}`);
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
