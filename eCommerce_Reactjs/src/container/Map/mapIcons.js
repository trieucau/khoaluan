import L from 'leaflet';

const createCustomIcon = (iconClass, bgColor) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
        border: 2.5px solid #fff;
      ">
        <i class="${iconClass}" style="
          color: #fff;
          transform: rotate(45deg);
          font-size: 14px;
        "></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
};

export const warehouseIcon = createCustomIcon('fa-solid fa-warehouse', '#3498db');
export const truckIcon = createCustomIcon('fa-solid fa-truck-fast', '#c44569');
export const deliveryIcon = createCustomIcon('fa-solid fa-location-dot', '#ff6b9d');
