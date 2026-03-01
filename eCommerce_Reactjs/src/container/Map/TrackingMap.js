// TrackingMap.jsx
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { truckIcon, deliveryIcon } from './mapIcons';

const TrackingMap = ({ shipperLoc, deliveryCoords, pastRouteCoords }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const routeRef = useRef(null);

  const [remainingDistance, setRemainingDistance] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);

  // ================= INIT MAP =================
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([16.5, 106], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ================= UPDATE MAP =================
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Xóa marker + polyline cũ
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // ===== VẼ TUYẾN ĐÃ ĐI (VÀNG NÉT ĐỨT) =====
    if (pastRouteCoords && pastRouteCoords.length > 1) {
      const pastCoords = pastRouteCoords.map((c) => [c.lat, c.lng]);

      L.polyline(pastCoords, {
        color: 'yellow',
        dashArray: '8, 8',
        weight: 6,
      }).addTo(map);
    }

    // ===== MARKER ĐIỂM GIAO =====
    if (deliveryCoords) {
      L.marker([deliveryCoords.lat, deliveryCoords.lng], {
        icon: deliveryIcon,
      }).addTo(map);
    }

    // ===== MARKER SHIPPER =====
    if (shipperLoc) {
      L.marker([shipperLoc.lat, shipperLoc.lng], {
        icon: truckIcon,
      }).addTo(map);
    }

    // ===== TUYẾN CÒN LẠI + ETA =====
    if (shipperLoc && deliveryCoords) {
      const url = `https://router.project-osrm.org/route/v1/driving/${shipperLoc.lng},${shipperLoc.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (!data.routes || data.routes.length === 0) return;

          const route = data.routes[0];

          const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);

          // ===== DISTANCE =====
          const distanceKm = (route.distance / 1000).toFixed(2);
          setRemainingDistance(distanceKm);

          // ===== ETA =====
          const eta = Math.ceil(route.duration / 60); // phút
          setEtaMinutes(eta);

          // ===== VẼ ĐƯỜNG XANH =====
          routeRef.current = L.polyline(coords, {
            color: '#007bff',
            weight: 6,
          }).addTo(map);

          map.fitBounds(routeRef.current.getBounds(), {
            padding: [50, 50],
          });
        })
        .catch((err) => {
          console.error('OSRM error:', err);
        });
    }
  }, [shipperLoc, deliveryCoords, pastRouteCoords]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapContainerRef} style={{ height: '500px', borderRadius: '12px' }} />

      {(remainingDistance || etaMinutes) && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'white',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
            fontSize: '15px',
            lineHeight: '1.6',
            zIndex: 1000,
          }}
        >
          🚚 Còn lại: {remainingDistance} km <br />⏳ ETA: {etaMinutes} phút
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
