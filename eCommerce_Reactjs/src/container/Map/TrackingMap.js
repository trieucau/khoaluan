import { useEffect, useRef, useMemo } from 'react';
import { Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import BaseMap from '../../component/Map/BaseMap';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { truckIcon, deliveryIcon, warehouseIcon } from './mapIcons';

const isInVietnam = ({ lat, lng }) =>
  lat >= 8.18 && lat <= 23.39 && lng >= 102.14 && lng <= 109.46;

/* ─────────────────────────────────────────────────────────────────────────────
   AutoFit — fit bounds bao gồm cả shipper + điểm giao hàng ngay khi render.
   Chỉ chạy 1 lần để tránh giật. Sau đó map panner handle pan nhẹ nhàng.
───────────────────────────────────────────────────────────────────────────── */
const AutoFit = ({ shipperLoc, deliveryCoords }) => {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current) return;
    if (!shipperLoc || !deliveryCoords) return;

    const bounds = L.latLngBounds(
      [shipperLoc.lat, shipperLoc.lng],
      [deliveryCoords.lat, deliveryCoords.lng],
    );
    map.fitBounds(bounds, { padding: [70, 70], animate: true, duration: 1.2 });
    hasFit.current = true;
  }, [shipperLoc, deliveryCoords, map]);

  return null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   SmoothShipperMarker — dùng imperative Leaflet API (setLatLng) để di chuyển
   marker KHÔNG gây re-render React. Khi shipper di chuyển, bản đồ tự pan theo
   nếu marker sắp ra ngoài viewport. Hoàn toàn mượt mà, không nhấp nháy.
───────────────────────────────────────────────────────────────────────────── */
const SmoothShipperMarker = ({ shipperLoc, icon }) => {
  const map = useMap();
  const markerRef = useRef(null);
  const prevLocRef = useRef(null);

  useEffect(() => {
    if (!shipperLoc) return;
    const latlng = L.latLng(shipperLoc.lat, shipperLoc.lng);

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon, zIndexOffset: 1000 }).addTo(map);
      markerRef.current.bindPopup('🚚 Shipper đang giao hàng');
    } else {
      // Di chuyển marker mượt mà bằng imperative API
      markerRef.current.setLatLng(latlng);
    }

    // Pan bản đồ nhẹ nhàng nếu marker tiến gần rìa viewport (giữ nguyên zoom)
    if (prevLocRef.current) {
      const mapBounds = map.getBounds();
      const latSpan = mapBounds.getNorth() - mapBounds.getSouth();
      const lngSpan = mapBounds.getEast() - mapBounds.getWest();
      const padRatio = 0.2; // 20% từ mép

      const innerBounds = L.latLngBounds(
        [mapBounds.getSouth() + latSpan * padRatio, mapBounds.getWest() + lngSpan * padRatio],
        [mapBounds.getNorth() - latSpan * padRatio, mapBounds.getEast() - lngSpan * padRatio],
      );

      if (!innerBounds.contains(latlng)) {
        map.panTo(latlng, { animate: true, duration: 0.6, easeLinearity: 0.25 });
      }
    }
    prevLocRef.current = latlng;
  }, [shipperLoc, map, icon]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  return null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   DeliveryMarker — marker tĩnh (điểm giao hàng), không thay đổi → React thường
───────────────────────────────────────────────────────────────────────────── */
const DeliveryMarker = ({ deliveryCoords, icon }) => {
  if (!deliveryCoords) return null;
  return <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={icon} />;
};

/* ── Nội dung bên trong MapContainer ── */
const TrackingMapInner = ({ shipperLoc, deliveryCoords, statusId, isDomestic, routeCoords }) => {
  const shipperIcon = statusId === 'S4' ? warehouseIcon : truckIcon;

  return (
    <>
      {/* Shipper: mượt mà realtime */}
      {shipperLoc && <SmoothShipperMarker shipperLoc={shipperLoc} icon={shipperIcon} />}

      {/* Điểm giao hàng: tĩnh */}
      <DeliveryMarker deliveryCoords={deliveryCoords} icon={deliveryIcon} />

      {/* Nội địa → route OSRM */}
      {isDomestic && routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: '#FF6B9D', weight: 4, opacity: 0.85 }}
        />
      )}

      {/* Quốc tế → đường thẳng nét đứt */}
      {!isDomestic && shipperLoc && deliveryCoords && (
        <Polyline
          positions={[
            [shipperLoc.lat, shipperLoc.lng],
            [deliveryCoords.lat, deliveryCoords.lng],
          ]}
          pathOptions={{ color: '#C44569', dashArray: '10 10', weight: 3 }}
        />
      )}

      {/* Auto-fit 1 lần khi lần đầu load */}
      <AutoFit shipperLoc={shipperLoc} deliveryCoords={deliveryCoords} />
    </>
  );
};

/* ── Main component ── */
const TrackingMap = ({ shipperLoc, deliveryCoords, statusId }) => {
  const isDomestic =
    shipperLoc &&
    deliveryCoords &&
    isInVietnam(shipperLoc) &&
    isInVietnam(deliveryCoords);

  const waypoints = isDomestic ? [shipperLoc, deliveryCoords] : [];
  const { routeCoords, distanceKm, eta } = useOSRMRoute(waypoints);

  return (
    <div style={{ position: 'relative' }}>
      <BaseMap height={420}>
        <TrackingMapInner
          shipperLoc={shipperLoc}
          deliveryCoords={deliveryCoords}
          statusId={statusId}
          isDomestic={isDomestic}
          routeCoords={routeCoords}
        />
      </BaseMap>

      {/* Info overlay */}
      {shipperLoc && deliveryCoords && (
        <div className="ot-map-info-overlay">
          {isDomestic ? (
            <>
              <div className="ot-map-info-row">
                <i className="fa-solid fa-route" style={{ color: '#FF6B9D' }} />
                <span>{distanceKm} km</span>
              </div>
              <div className="ot-map-info-row">
                <i className="fa-solid fa-clock" style={{ color: '#F8B195' }} />
                <span>{eta}</span>
              </div>
            </>
          ) : (
            <div className="ot-map-info-row">
              <i className="fa-solid fa-plane" style={{ color: '#3498DB' }} />
              <span>Vận chuyển quốc tế</span>
            </div>
          )}
        </div>
      )}

      {/* Map legend */}
      <div className="ot-map-legend">
        <div className="ot-legend-item">
          <span
            className={`ot-legend-dot ${statusId === 'S4' ? 'ot-legend-dot--warehouse' : 'ot-legend-dot--shipper'}`}
          />
          {statusId === 'S4' ? 'Kho hàng' : 'Shipper'}
        </div>
        <div className="ot-legend-item">
          <span className="ot-legend-dot ot-legend-dot--dest" />
          Điểm giao
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
