// TrackingMap.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { truckIcon, deliveryIcon } from './mapIcons';

const TrackingMap = ({ shipperLoc, deliveryCoords }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const routeRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([21.0285, 105.8542], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (deliveryCoords) {
      L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon }).addTo(map);
    }

    if (shipperLoc) {
      L.marker([shipperLoc.lat, shipperLoc.lng], { icon: truckIcon }).addTo(map);
    }

    if (shipperLoc && deliveryCoords) {
      const url = `https://router.project-osrm.org/route/v1/driving/${shipperLoc.lng},${shipperLoc.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

          routeRef.current = L.polyline(coords, {
            color: '#007bff',
          }).addTo(map);

          map.fitBounds(routeRef.current.getBounds(), {
            padding: [50, 50],
          });
        });
    }
  }, [shipperLoc, deliveryCoords]);

  return <div ref={mapContainerRef} style={{ height: '500px', borderRadius: '12px' }} />;
};

export default TrackingMap;
