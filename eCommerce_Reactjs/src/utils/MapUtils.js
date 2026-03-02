export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ================= FORMAT DISTANCE
export const formatDistance = (meters) => {
  return (meters / 1000).toFixed(2);
};

// ================= FORMAT ETA (3 mức độ)
export const formatETA = (seconds) => {
  const totalMinutes = Math.ceil(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} phút`;
  }

  if (totalMinutes < 1440) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }

  const days = Math.floor(totalMinutes / 1440);
  const remainingMinutes = totalMinutes % 1440;
  const hours = Math.floor(remainingMinutes / 60);

  return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
};
