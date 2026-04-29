import L from 'leaflet';

export const warehouseIcon = L.divIcon({
  html: `<div style="font-size:32px;">🏬</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export const truckIcon = L.divIcon({
  html: `<div style="font-size:32px;">🚚</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export const deliveryIcon = L.divIcon({
  html: `<div style="font-size:32px;">📍</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
