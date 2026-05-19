import { useEffect, useState, useRef } from 'react';
import { formatDistance, formatETA, getDistance } from '../utils/MapUtils';

/* ─────────────────────────────────────────────────────────────────────────────
   useOSRMRoute — Fetch đường đi từ OSRM với debounce 2s để tránh spam API.
   Khi shipper di chuyển liên tục mỗi giây, OSRM chỉ được gọi sau khi waypoints
   ổn định ít nhất 2 giây hoặc khi đã di chuyển đáng kể (handled by caller).
───────────────────────────────────────────────────────────────────────────── */
export const useOSRMRoute = (waypoints, shippingFee = 0) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [eta, setEta] = useState(null);

  const debounceRef = useRef(null);
  const controllerRef = useRef(null);
  const lastKeyRef = useRef('');

  useEffect(() => {
    if (!waypoints || waypoints.length < 2) {
      setRouteCoords([]);
      setDistanceKm(null);
      setEta(null);
      return;
    }

    // Tạo key để so sánh — chỉ fetch khi waypoints thực sự thay đổi
    const newKey = waypoints.map((p) => `${p.lat?.toFixed(5)},${p.lng?.toFixed(5)}`).join('|');
    if (newKey === lastKeyRef.current) return; // không thay đổi → bỏ qua

    // Clear debounce timer cũ
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Hủy request đang chạy (nếu có)
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();

      lastKeyRef.current = newKey;

      try {
        const formatted = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${formatted}?overview=full&geometries=geojson`;

        const res = await fetch(url, { signal: controllerRef.current.signal });
        const data = await res.json();

        if (!data.routes?.length) {
          setRouteCoords([]);
          setDistanceKm(null);
          setEta(null);
          return;
        }

        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);

        setRouteCoords(coords);

        // Use Haversine for consistent distance across all roles
        const distKmRaw = getDistance(
          waypoints[0].lat,
          waypoints[0].lng,
          waypoints[waypoints.length - 1].lat,
          waypoints[waypoints.length - 1].lng
        );
        setDistanceKm(formatDistance(distKmRaw));

        let velocity = 40;
        const fee = Number(shippingFee) || 0;
        if (fee >= 50000) {
          velocity = 50;
        } else if (fee >= 30000) {
          velocity = 30;
        } else {
          velocity = 20;
        }

        const durationSeconds = (distKmRaw / velocity) * 3600;
        setEta(formatETA(durationSeconds));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('OSRM error:', err);
          setRouteCoords([]);
          setDistanceKm(null);
          setEta(null);
        }
      }
    }, 2000); // debounce 2 giây

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(waypoints.map((p) => `${p?.lat?.toFixed(4)},${p?.lng?.toFixed(4)}`))]);

  return { routeCoords, distanceKm, eta };
};
