import { useEffect, useState } from 'react';
import { formatDistance, formatETA } from '../utils/MapUtils';

export const useOSRMRoute = (waypoints) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (!waypoints || waypoints.length < 2) return;

    const formatted = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${formatted}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.routes?.length) return;

        const route = data.routes[0];

        const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);
        setRouteCoords(coords);

        // dùng utils
        setDistanceKm(formatDistance(route.distance));
        setEta(formatETA(route.duration));
      })
      .catch((err) => {
        console.error('OSRM error:', err);
      });
  }, [waypoints]);

  return { routeCoords, distanceKm, eta };
};
