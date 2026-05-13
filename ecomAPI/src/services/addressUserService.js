import db from '../models/index.js';

let createNewAddressUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        await db.AddressUser.create({
          userId: data.userId,
          shipName: data.shipName,
          shipAdress: data.shipAdress,
          shipEmail: data.shipEmail,
          shipPhonenumber: data.shipPhonenumber,
          lat: data.lat,
          lng: data.lng,
        });
        resolve({
          errCode: 0,
          errMessage: 'ok',
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let getAllAddressUserByUserId = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let limit = parseInt(data.limit) || 10;
        let offset = parseInt(data.offset) || 0;

        let { count, rows } = await db.AddressUser.findAndCountAll({
          where: { userId: data.userId },
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });
        resolve({
          errCode: 0,
          data: rows,
          count: count,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let deleteAddressUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let addressUser = await db.AddressUser.findOne({
          where: {
            id: data.id,
            userId: data.userId,
          },
        });
        if (addressUser) {
          await db.AddressUser.destroy({
            where: {
              id: data.id,
              userId: data.userId,
            },
          });
          resolve({
            errCode: 0,
            errMessage: 'ok',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'Địa chỉ user không tìm thấy hoặc bạn không có quyền',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
let editAddressUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.id ||
        !data.userId ||
        !data.shipName ||
        !data.shipAdress ||
        !data.shipEmail ||
        !data.shipPhonenumber
      ) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let addressUser = await db.AddressUser.findOne({
          where: { id: data.id, userId: data.userId },
          raw: false,
        });
        if (addressUser) {
          addressUser.shipName = data.shipName;
          addressUser.shipPhonenumber = data.shipPhonenumber;
          addressUser.shipAdress = data.shipAdress;
          addressUser.shipEmail = data.shipEmail;
          addressUser.lat = data.lat;
          addressUser.lng = data.lng;

          await addressUser.save();
          resolve({
            errCode: 0,
            errMessage: 'ok',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'Địa chỉ người dùng không tồn tại hoặc bạn không có quyền',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
let getDetailAddressUserById = (id, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id || !userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let res = await db.AddressUser.findOne({
          where: { id: id, userId: userId },
        });
        if (res) {
          resolve({
            errCode: 0,
            data: res,
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'Địa chỉ không tồn tại hoặc bạn không có quyền',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

let updateLocationAddressUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.userId || !data.lat || !data.lng || !data.shipAdress) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter!',
        });
      } else {
        let addressUser = await db.AddressUser.findOne({
          where: {
            id: data.id,
            userId: data.userId,
          },
          raw: false,
        });

        if (addressUser) {
          addressUser.shipAdress = data.shipAdress;
          addressUser.lat = data.lat;
          addressUser.lng = data.lng;

          await addressUser.save();

          resolve({
            errCode: 0,
            errMessage: 'Update location success',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: "Address user not found or you don't have permission",
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
export default {
  createNewAddressUser: createNewAddressUser,
  getAllAddressUserByUserId: getAllAddressUserByUserId,
  deleteAddressUser: deleteAddressUser,
  editAddressUser: editAddressUser,
  getDetailAddressUserById: getDetailAddressUserById,
  updateLocationAddressUser: updateLocationAddressUser,
};

