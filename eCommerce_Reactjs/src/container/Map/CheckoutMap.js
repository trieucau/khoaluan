import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';

function LocationMarker({ setLocation, setAddress }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLocation({ lat, lng });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setAddress(data.display_name);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function CheckoutMap({ setLocation, setAddress }) {
  return (
    <MapContainer
      center={[13.782, 109.219]} // Quy Nhơn
      zoom={13}
      style={{ height: '400px' }}
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker setLocation={setLocation} setAddress={setAddress} />
    </MapContainer>
  );
}
