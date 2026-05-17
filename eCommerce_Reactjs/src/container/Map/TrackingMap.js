import { useEffect, useRef } from 'react';
import { Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import BaseMap from '../../component/Map/BaseMap';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { truckIcon, deliveryIcon, warehouseIcon } from './mapIcons';

const isInVietnam = ({ lat, lng }) =>
  lat >= 8.18 && lat <= 23.39 && lng >= 102.14 && lng <= 109.46;

/* ─────────────────────────────────────────────────────────────────────────────
   AutoFit — zoom vừa khít cả 2 điểm [shipper, điểm giao] ngay khi lần đầu render.
   Chỉ chạy 1 lần (hasFit flag) → không reset zoom khi shipper di chuyển.
───────────────────────────────────────────────────────────────────────────── */
const AutoFit = ({ shipperLoc, deliveryCoords }) => {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current || !shipperLoc || !deliveryCoords) return;
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
   SmoothShipperMarker — marker di chuyển MƯỢT MÀ với animation requestAnimationFrame.

   Khi nhận vị trí mới từ socket (mỗi 1s):
   • Không setLatLng() tức thì → marker sẽ nhảy cục
   • Thay bằng: interpolate (lerp) từ vị trí cũ → vị trí mới trong 900ms
   • Easing: ease-out (bắt đầu nhanh, cuối chậm dần) → cảm giác di chuyển tự nhiên
   • Bản đồ tự pan nhẹ nhàng nếu marker gần rìa viewport → không bao giờ mất dấu shipper
───────────────────────────────────────────────────────────────────────────── */
const ANIM_DURATION = 900; // ms — khớp với tần suất update 1s của shipper

const SmoothShipperMarker = ({ shipperLoc, icon }) => {
  const map = useMap();
  const markerRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!shipperLoc) return;
    const targetLat = shipperLoc.lat;
    const targetLng = shipperLoc.lng;

    if (!markerRef.current) {
      /* ── Lần đầu: tạo marker ngay tại vị trí hiện tại ── */
      markerRef.current = L.marker([targetLat, targetLng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
      markerRef.current.bindPopup('🚚 Shipper đang giao hàng');
      return;
    }

    /* ── Lần sau: animate từ vị trí cũ → vị trí mới ── */
    // Huỷ animation đang chạy (nếu vị trí mới đến sớm hơn dự kiến)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const startPos = markerRef.current.getLatLng();
    const startLat = startPos.lat;
    const startLng = startPos.lng;
    const startTime = performance.now();

    // Easing function: ease-out cubic → tự nhiên như Google Maps
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / ANIM_DURATION, 1);
      const t = easeOut(rawT);

      const lat = startLat + (targetLat - startLat) * t;
      const lng = startLng + (targetLng - startLng) * t;
      markerRef.current?.setLatLng([lat, lng]);

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation xong → kiểm tra pan
        const latlng = L.latLng(targetLat, targetLng);
        const b = map.getBounds();
        const latSpan = b.getNorth() - b.getSouth();
        const lngSpan = b.getEast() - b.getWest();
        const pad = 0.2;

        const inner = L.latLngBounds(
          [b.getSouth() + latSpan * pad, b.getWest() + lngSpan * pad],
          [b.getNorth() - latSpan * pad, b.getEast() - lngSpan * pad],
        );

        if (!inner.contains(latlng)) {
          map.panTo(latlng, { animate: true, duration: 0.5, easeLinearity: 0.3 });
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [shipperLoc, map, icon]);

  /* Cleanup khi unmount */
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  return null;
};

/* ── Marker điểm giao hàng (tĩnh) ── */
const DeliveryMarker = ({ deliveryCoords, icon }) => {
  if (!deliveryCoords) return null;
  return <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={icon} />;
};

/* ── Nội dung bên trong MapContainer ── */
const TrackingMapInner = ({ shipperLoc, deliveryCoords, statusId, isDomestic, routeCoords }) => {
  const shipperIcon = statusId === 'S4' ? warehouseIcon : truckIcon;

  return (
    <>
      {shipperLoc && <SmoothShipperMarker shipperLoc={shipperLoc} icon={shipperIcon} />}
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
