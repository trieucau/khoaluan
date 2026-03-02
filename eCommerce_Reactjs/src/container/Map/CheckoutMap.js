import { Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import BaseMap from '../../component/Map/BaseMap';
import { deliveryIcon } from './mapIcons';

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

  return position ? <Marker position={position} icon={deliveryIcon} /> : null;
}

export default function CheckoutMap({ setLocation, setAddress }) {
  return (
    <BaseMap center={[16.047079, 108.20623]} zoom={5} height={400}>
      <LocationMarker setLocation={setLocation} setAddress={setAddress} />
    </BaseMap>
  );
}
