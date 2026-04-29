import { Marker, Polyline } from 'react-leaflet';
import BaseMap from '../../component/Map/BaseMap';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { truckIcon, deliveryIcon } from './mapIcons';

const isInVietnam = ({ lat, lng }) =>
  lat >= 8.18 && lat <= 23.39 && lng >= 102.14 && lng <= 109.46;

const TrackingMap = ({ shipperLoc, deliveryCoords }) => {
  const isDomestic =
    shipperLoc && deliveryCoords && isInVietnam(shipperLoc) && isInVietnam(deliveryCoords);

  const waypoints = isDomestic ? [shipperLoc, deliveryCoords] : [];
  const { routeCoords, distanceKm, eta } = useOSRMRoute(waypoints);

  return (
    <div style={{ position: 'relative' }}>
      <BaseMap height={420}>
        {shipperLoc && <Marker position={[shipperLoc.lat, shipperLoc.lng]} icon={truckIcon} />}
        {deliveryCoords && <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={deliveryIcon} />}

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
          <span className="ot-legend-dot ot-legend-dot--shipper" />
          Shipper
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
