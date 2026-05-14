import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const warehousesFilePath = path.join(__dirname, '../config/warehouses.json');

// In-memory cache for ultra-fast reads
let warehousesCache = [];
let isCacheLoaded = false;

// Initialize cache
const loadCache = () => {
  try {
    if (fs.existsSync(warehousesFilePath)) {
      const data = fs.readFileSync(warehousesFilePath, 'utf8');
      warehousesCache = JSON.parse(data);
    } else {
      warehousesCache = [];
    }
    isCacheLoaded = true;
  } catch (error) {
    console.error('Error loading warehouses.json:', error);
    warehousesCache = [];
    isCacheLoaded = true;
  }
};

const saveCacheToFile = () => {
  try {
    fs.writeFileSync(warehousesFilePath, JSON.stringify(warehousesCache, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving warehouses.json:', error);
  }
};

const getAllWarehouses = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!isCacheLoaded) loadCache();
      resolve({
        errCode: 0,
        errMessage: 'OK',
        data: warehousesCache,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const createNewWarehouse = (data) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isCacheLoaded) loadCache();
      if (!data.name || !data.address || !data.lat || !data.lng) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters',
        });
      } else {
        const newWarehouse = {
          id: Date.now(), // Generate unique ID based on timestamp
          name: data.name,
          phonenumber: data.phonenumber || '',
          address: data.address,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
        };
        warehousesCache.push(newWarehouse);
        saveCacheToFile();

        resolve({
          errCode: 0,
          errMessage: 'OK',
          data: newWarehouse,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const updateWarehouse = (data) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isCacheLoaded) loadCache();
      if (!data.id || !data.name || !data.address || !data.lat || !data.lng) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters',
        });
      } else {
        const index = warehousesCache.findIndex((item) => item.id == data.id);
        if (index !== -1) {
          warehousesCache[index] = {
            id: data.id,
            name: data.name,
            phonenumber: data.phonenumber || '',
            address: data.address,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng),
          };
          saveCacheToFile();

          resolve({
            errCode: 0,
            errMessage: 'OK',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'Warehouse not found',
          });
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};

const deleteWarehouse = (id) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isCacheLoaded) loadCache();
      if (!id) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters',
        });
      } else {
        const index = warehousesCache.findIndex((item) => item.id == id);
        if (index !== -1) {
          warehousesCache.splice(index, 1);
          saveCacheToFile();

          resolve({
            errCode: 0,
            errMessage: 'OK',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'Warehouse not found',
          });
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};

export default {
  getAllWarehouses,
  createNewWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
