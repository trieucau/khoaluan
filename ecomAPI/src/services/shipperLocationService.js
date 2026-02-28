import db from '../models/index';

let upsertShipperLocation = async (shipperId, lat, lng) => {
  try {
    if (!shipperId || lat == null || lng == null) return;
    const [record, created] = await db.ShipperLocation.findOrCreate({
      where: { shipperId },
      defaults: { shipperId, lat, lng },
    });
    if (!created) {
      record.lat = lat;
      record.lng = lng;
      await record.save();
    }
  } catch (err) {
    console.error('upsertShipperLocation error:', err);
  }
};

module.exports = { upsertShipperLocation };
