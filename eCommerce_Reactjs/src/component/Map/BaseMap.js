import { MapContainer, TileLayer } from 'react-leaflet';

export default function BaseMap({ children, center = [16, 108], zoom = 6, height = 500 }) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: '100%', borderRadius: 12 }}>
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
