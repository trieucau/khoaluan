import { Marker, Polyline } from 'react-leaflet';
import BaseMap from '../../component/Map/BaseMap';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { truckIcon, deliveryIcon } from './mapIcons';

const isInVietnam = ({ lat, lng }) => {
  return lat >= 8.18 && lat <= 23.39 && lng >= 102.14 && lng <= 109.46;
};

const TrackingMap = ({ shipperLoc, deliveryCoords }) => {
  const isDomestic =
    shipperLoc && deliveryCoords && isInVietnam(shipperLoc) && isInVietnam(deliveryCoords);

  // Chỉ gọi OSRM khi nội địa
  const waypoints = isDomestic ? [shipperLoc, deliveryCoords] : [];

  const { routeCoords, distanceKm, eta } = useOSRMRoute(waypoints);

  return (
    <div style={{ position: 'relative' }}>
      <BaseMap>
        {shipperLoc && <Marker position={[shipperLoc.lat, shipperLoc.lng]} icon={truckIcon} />}

        {deliveryCoords && (
          <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={deliveryIcon} />
        )}

        {/* Nội địa → route OSRM */}
        {isDomestic && routeCoords.length > 0 && (
          <Polyline positions={routeCoords} pathOptions={{ color: 'blue' }} />
        )}

        {/* Quốc tế → vẽ đường thẳng nét đứt */}
        {!isDomestic && shipperLoc && deliveryCoords && (
          <Polyline
            positions={[
              [shipperLoc.lat, shipperLoc.lng],
              [deliveryCoords.lat, deliveryCoords.lng],
            ]}
            pathOptions={{
              color: 'red',
              dashArray: '10 10',
            }}
          />
        )}
      </BaseMap>

      {shipperLoc && deliveryCoords && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'white',
            padding: '10px 15px',
            borderRadius: 10,
            fontWeight: 'bold',
            zIndex: 1000,
          }}
        >
          {isDomestic ? (
            <>
              🚚 {distanceKm} km <br />⏳ {eta}
            </>
          ) : (
            <>✈️ Vận chuyển quốc tế</>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
