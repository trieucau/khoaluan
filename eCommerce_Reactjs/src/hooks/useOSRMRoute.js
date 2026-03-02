import { useEffect, useState } from 'react';
import { formatDistance, formatETA } from '../utils/MapUtils';

export const useOSRMRoute = (waypoints) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    // Nếu không đủ 2 điểm → reset toàn bộ
    if (!waypoints || waypoints.length < 2) {
      setRouteCoords([]);
      setDistanceKm(null);
      setEta(null);
      return;
    }

    const controller = new AbortController();

    const fetchRoute = async () => {
      try {
        const formatted = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');

        const url = `https://router.project-osrm.org/route/v1/driving/${formatted}?overview=full&geometries=geojson`;

        const res = await fetch(url, {
          signal: controller.signal,
        });

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
        setDistanceKm(formatDistance(route.distance));
        setEta(formatETA(route.duration));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('OSRM error:', err);
          setRouteCoords([]);
          setDistanceKm(null);
          setEta(null);
        }
      }
    };

    fetchRoute();

    // Cleanup khi unmount hoặc waypoints thay đổi
    return () => controller.abort();
  }, [JSON.stringify(waypoints)]); // tránh re-render vô hạn

  return { routeCoords, distanceKm, eta };
};
