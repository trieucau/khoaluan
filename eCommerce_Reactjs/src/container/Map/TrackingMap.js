import { Marker, Polyline } from 'react-leaflet';
import BaseMap from '../../component/Map/BaseMap';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { truckIcon, deliveryIcon } from './mapIcons';

const TrackingMap = ({ shipperLoc, deliveryCoords }) => {
  const waypoints = shipperLoc && deliveryCoords ? [shipperLoc, deliveryCoords] : [];

  const { routeCoords, distanceKm, eta } = useOSRMRoute(waypoints);

  return (
    <div style={{ position: 'relative' }}>
      <BaseMap>
        {shipperLoc && <Marker position={[shipperLoc.lat, shipperLoc.lng]} icon={truckIcon} />}

        {deliveryCoords && (
          <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={deliveryIcon} />
        )}

        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} pathOptions={{ color: 'blue' }} />
        )}
      </BaseMap>

      {(distanceKm || eta) && (
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
          🚚 {distanceKm} km <br />⏳ {eta}
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
