import db from '../models/index.js';

/* ─────────────────────────────────────────────────────────────────────────────
   upsertShipperLocation — ghi đơn lẻ (vẫn giữ để các nơi khác dùng nếu cần)
───────────────────────────────────────────────────────────────────────────── */
export const upsertShipperLocation = async (shipperId, lat, lng) => {
  try {
    if (!shipperId || lat == null || lng == null) return;
    await db.ShipperLocation.upsert({ shipperId, lat, lng });
  } catch (err) {
    console.error('upsertShipperLocation error:', err);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   batchUpsertLocations — ghi NHIỀU vị trí cùng lúc từ in-memory cache.
   Được gọi mỗi 15 giây bởi flushLocationCache trong server.js.

   Input: Map<shipperId, { lat, lng, updatedAt }>
   Strategy: bulkCreate + updateOnDuplicate (1 query thay vì N queries)
───────────────────────────────────────────────────────────────────────────── */
export const batchUpsertLocations = async (locationsMap) => {
  if (!locationsMap || locationsMap.size === 0) return;

  // Chuyển Map → Array để dùng bulkCreate
  const rows = [];
  for (const [shipperId, { lat, lng }] of locationsMap) {
    if (shipperId && lat != null && lng != null) {
      rows.push({ shipperId: parseInt(shipperId, 10), lat, lng });
    }
  }

  if (rows.length === 0) return;

  try {
    // bulkCreate với updateOnDuplicate: 1 query duy nhất cho tất cả shippers
    // Thay vì N lần upsert riêng lẻ
    await db.ShipperLocation.bulkCreate(rows, {
      updateOnDuplicate: ['lat', 'lng', 'updatedAt'],
    });
  } catch (err) {
    console.error('[batchUpsertLocations] Error:', err.message);
    throw err; // re-throw để caller có thể rollback cache
  }
};

export default { upsertShipperLocation, batchUpsertLocations };
