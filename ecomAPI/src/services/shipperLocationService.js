import db from '../models/index.js';

export let upsertShipperLocation = async (shipperId, lat, lng) => {
  try {
    if (!shipperId || lat == null || lng == null) return;

    await db.ShipperLocation.upsert({
      shipperId,
      lat,
      lng,
    });
  } catch (err) {
    console.error('upsertShipperLocation error:', err);
  }
};

export default { upsertShipperLocation };
