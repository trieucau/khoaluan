import { v4 as uuidv4 } from 'uuid';
import db from '../models/index.js';
import paypal from 'paypal-rest-sdk';
import { Op } from 'sequelize';
import querystring from 'qs';
import crypto from 'crypto';

import 'dotenv/config';
import moment from 'moment';
import localization from 'moment/locale/vi.js';
import { EXCHANGE_RATES } from '../utils/constants.js';
moment.updateLocale('vi', localization);
paypal.configure({
  mode: 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

let createNewOrder = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.addressUserId || !data.typeShipId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let product = await db.OrderProduct.create({
          addressUserId: data.addressUserId,
          isPaymentOnlien: data.isPaymentOnlien,
          statusId: 'S3',
          typeShipId: data.typeShipId,
          voucherId: data.voucherId,
          note: data.note,
        });

        data.arrDataShopCart = data.arrDataShopCart.map((item, index) => {
          item.orderId = product.dataValues.id;
          return item;
        });

        await db.OrderDetail.bulkCreate(data.arrDataShopCart);
        let res = await db.ShopCart.findOne({
          where: { userId: data.userId, statusId: 0 },
        });
        if (res) {
          await db.ShopCart.destroy({
            where: { userId: data.userId },
          });
          for (let i = 0; i < data.arrDataShopCart.length; i++) {
            let productDetailSize = await db.ProductDetailSize.findOne({
              where: {
                id: data.arrDataShopCart[i].productId,
              },
              raw: false,
            });
            await productDetailSize.save();
          }
        }
        if (data.voucherId && data.userId) {
          let voucherUses = await db.VoucherUsed.findOne({
            where: {
              voucherId: data.voucherId,
              userId: data.userId,
            },
            raw: false,
          });
          voucherUses.status = 1;
          await voucherUses.save();
        }
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
let getAllOrders = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let objectFilter = {
        include: [
          { model: db.TypeShip, as: 'typeShipData' },
          { model: db.Voucher, as: 'voucherData' },
          { model: db.Allcode, as: 'statusOrderData' },
        ],
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true,
      };
      if (data.limit && data.offset) {
        objectFilter.limit = +data.limit;
        objectFilter.offset = +data.offset;
      }
      if (data.statusId && data.statusId !== 'ALL')
        objectFilter.where = { statusId: data.statusId };
      let res = await db.OrderProduct.findAndCountAll(objectFilter);
      for (let i = 0; i < res.rows.length; i++) {
        let addressUser = await db.AddressUser.findOne({
          where: { id: res.rows[i].addressUserId },
        });
        let shipper = await db.User.findOne({
          where: { id: res.rows[i].shipperId },
        });

        if (addressUser) {
          let user = await db.User.findOne({
            where: {
              id: addressUser.userId,
            },
            raw: true,
            nest: true,
          });

          if (user && user.image) {
            user.image = Buffer.from(user.image, 'base64').toString('binary');
          }

          res.rows[i].userData = user;
          res.rows[i].addressUser = addressUser;
          res.rows[i].shipperData = shipper;
        }
      }
      resolve({
        errCode: 0,
        data: res.rows,
        count: res.count,
      });
    } catch (error) {
      reject(error);
    }
  });
};
let getDetailOrderById = (id, requesterId, requesterRole) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let order = await db.OrderProduct.findOne({
          where: { id: id },
          include: [
            { model: db.TypeShip, as: 'typeShipData' },
            { model: db.Voucher, as: 'voucherData' },
            { model: db.Allcode, as: 'statusOrderData' },
          ],
          raw: true,
          nest: true,
        });

        if (!order) {
          return resolve({ errCode: 2, errMessage: 'Order not found' });
        }

        let addressUser = await db.AddressUser.findOne({
          where: { id: order.addressUserId },
        });

        // Ownership Check: User must own the order or be Admin/Shipper
        if (
          requesterRole !== 'R1' &&
          requesterRole !== 'R4' &&
          requesterRole !== 'R3' &&
          addressUser.userId != requesterId
        ) {
          return resolve({ errCode: 3, errMessage: 'Bạn không có quyền xem đơn hàng này' });
        }

        if (order.image) {
          // FIX 1: Buffer.from -> Buffer.from
          order.image = Buffer.from(order.image, 'base64').toString('binary');
        }
        if (order.voucherData && order.voucherData.typeVoucherId) {
          order.voucherData.typeVoucherOfVoucherData = await db.TypeVoucher.findOne({
            where: { id: order.voucherData.typeVoucherId },
          });
        }
        let orderDetail = await db.OrderDetail.findAll({
          where: { orderId: id },
        });

        order.addressUser = addressUser;
        let user = await db.User.findOne({
          where: { id: addressUser.userId },
          attributes: {
            exclude: ['password', 'image'],
          },
          raw: true,
          nest: true,
        });
        order.userData = user;
        if (order.shipperId) {
          order.shipperData = await db.User.findOne({
            where: { id: order.shipperId },
            attributes: { exclude: ['password', 'image'] },
            raw: true,
          });
        }
        for (let i = 0; i < orderDetail.length; i++) {
          orderDetail[i].productDetailSize = await db.ProductDetailSize.findOne({
            where: { id: orderDetail[i].productId },
            include: [{ model: db.Allcode, as: 'sizeData' }],
            raw: true,
            nest: true,
          });
          orderDetail[i].productDetail = await db.ProductDetail.findOne({
            where: {
              id: orderDetail[i].productDetailSize.productdetailId,
            },
          });
          orderDetail[i].product = await db.Product.findOne({
            where: { id: orderDetail[i].productDetail.productId },
          });
          orderDetail[i].productImage = await db.ProductImage.findAll({
            where: {
              productdetailId: orderDetail[i].productDetail.id,
            },
          });
          for (let j = 0; j < orderDetail[i].productImage.length; j++) {
            // FIX 1: Buffer.from -> Buffer.from
            orderDetail[i].productImage[j].image = Buffer.from(
              orderDetail[i].productImage[j].image,
              'base64'
            ).toString('binary');
          }
        }

        order.orderDetail = orderDetail;

        resolve({
          errCode: 0,
          data: order,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let updateStatusOrder = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.statusId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let order = await db.OrderProduct.findOne({
          where: { id: data.id },
          raw: false,
        });
        if (!order) {
          return resolve({ errCode: 2, errMessage: 'Order not found' });
        }

        let addressUser = await db.AddressUser.findOne({
          where: { id: order.addressUserId },
        });

        // Ownership Check: Only owner can update (cancel) OR Admin/Shipper
        if (
          data.roleId !== 'R1' &&
          data.roleId !== 'R4' &&
          data.roleId !== 'R3' &&
          addressUser.userId != data.userId
        ) {
          return resolve({ errCode: 3, errMessage: 'Bạn không có quyền cập nhật đơn hàng này' });
        }

        order.statusId = data.statusId;
        await order.save();

        if (
          data.statusId == 'S7' &&
          data.dataOrder &&
          data.dataOrder.orderDetail &&
          data.dataOrder.orderDetail.length > 0
        ) {
          for (let i = 0; i < data.dataOrder.orderDetail.length; i++) {
            let productDetailSize = await db.ProductDetailSize.findOne({
              where: {
                id: data.dataOrder.orderDetail[i].productDetailSize.id,
              },
              raw: false,
            });
            productDetailSize.stock =
              productDetailSize.stock + data.dataOrder.orderDetail[i].quantity;
            await productDetailSize.save();
          }
        }

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
let getAllOrdersByUser = (data) => {
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
        let statusId = data.statusId;
        let keyword = data.keyword;

        let addressUser = await db.AddressUser.findAll({
          where: { userId: data.userId },
          attributes: ['id'],
          raw: true,
        });

        const addressIds = addressUser.map((item) => item.id);

        let whereClause = {
          addressUserId: { [Op.in]: addressIds },
        };

        if (statusId && statusId !== 'ALL') {
          whereClause.statusId = statusId;
        }

        if (keyword) {
          // Simplified keyword search for Order ID
          // For complex product name search, we would need complex joins
          whereClause[Op.or] = [{ id: { [Op.like]: `%${keyword}%` } }];
        }

        let { count, rows: orders } = await db.OrderProduct.findAndCountAll({
          where: whereClause,
          include: [
            { model: db.TypeShip, as: 'typeShipData' },
            { model: db.Voucher, as: 'voucherData' },
            { model: db.Allcode, as: 'statusOrderData' },
          ],
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
          raw: true,
          nest: true,
        });

        for (let j = 0; j < orders.length; j++) {
          if (orders[j].voucherData && orders[j].voucherData.typeVoucherId) {
            orders[j].voucherData.typeVoucherOfVoucherData = await db.TypeVoucher.findOne({
              where: {
                id: orders[j].voucherData.typeVoucherId,
              },
            });
          }
          let orderDetail = await db.OrderDetail.findAll({
            where: { orderId: orders[j].id },
          });
          for (let k = 0; k < orderDetail.length; k++) {
            orderDetail[k].productDetailSize = await db.ProductDetailSize.findOne({
              where: { id: orderDetail[k].productId },
              include: [{ model: db.Allcode, as: 'sizeData' }],
              raw: true,
              nest: true,
            });
            orderDetail[k].productDetail = await db.ProductDetail.findOne({
              where: {
                id: orderDetail[k].productDetailSize.productdetailId,
              },
            });
            orderDetail[k].product = await db.Product.findOne({
              where: {
                id: orderDetail[k].productDetail.productId,
              },
            });
            orderDetail[k].productImage = await db.ProductImage.findAll({
              where: {
                productdetailId: orderDetail[k].productDetail.id,
              },
            });
            for (let f = 0; f < orderDetail[k].productImage.length; f++) {
              orderDetail[k].productImage[f].image = Buffer.from(
                orderDetail[k].productImage[f].image,
                'base64'
              ).toString('binary');
            }
          }

          orders[j].orderDetail = orderDetail;
        }

        resolve({
          errCode: 0,
          data: orders,
          count: count,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let getAllOrdersByShipper = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let objectFilter = {
        include: [
          { model: db.TypeShip, as: 'typeShipData' },
          {
            model: db.Voucher,
            as: 'voucherData',
            include: [
              {
                model: db.TypeVoucher,
                as: 'typeVoucherOfVoucherData',
              },
            ],
          },
          { model: db.Allcode, as: 'statusOrderData' },
          { model: db.OrderDetail, as: 'orderDetail' },
          {
            model: db.AddressUser,
            as: 'addressUser',
            include: [{ model: db.User, as: 'userData', attributes: { exclude: ['password', 'image'] } }],
          },
        ],
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true,
        where: { shipperId: data.shipperId },
      };

      if (data.status && data.status === 'working')
        objectFilter.where = { ...objectFilter.where, statusId: 'S5' };
      if (data.status && data.status === 'done')
        objectFilter.where = { ...objectFilter.where, statusId: 'S6' };

      // STATS MODE: chỉ lấy id+statusId+updatedAt — không N+1, không include nặng
      // Dùng cho ShipperDashboard stats calculation (delay 3s sau mount)
      if (data.status === 'stats') {
        const statsOrders = await db.OrderProduct.findAll({
          where: { shipperId: data.shipperId },
          attributes: ['id', 'statusId', 'updatedAt'],
          raw: true,
        });
        return resolve({ errCode: 0, data: statsOrders });
      }

      // FIX HIỆU NĂNG: Eager loading (include AddressUser) đã giải quyết N+1
      // Nên ta có thể an tâm trả về toàn bộ lịch sử (bao gồm S7, S8) để Frontend tính tỉ lệ ActivityRate.

      let res = await db.OrderProduct.findAll(objectFilter);
      // Removed the N+1 loop for AddressUser and User because it was exhausting the connection pool and causing 12-second timeouts (502 Bad Gateway).
      // They are now eager loaded in the objectFilter.include array using JOINs.

      resolve({
        errCode: 0,
        data: res,
      });
    } catch (error) {
      reject(error);
    }
  });
};
let getOrdersAvailableForShipper = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await db.OrderProduct.findAll({
        where: { statusId: 'S4', shipperId: null },
        include: [
          { model: db.TypeShip, as: 'typeShipData' },
          { model: db.Voucher, as: 'voucherData' },
          { model: db.Allcode, as: 'statusOrderData' },
          {
            model: db.AddressUser,
            as: 'addressUser',
            include: [{ model: db.User, as: 'userData', attributes: { exclude: ['password', 'image'] } }],
          },
        ],
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true,
      });
      // Removed the N+1 loop for AddressUser and User because it was exhausting the connection pool and causing 12-second timeouts (502 Bad Gateway).
      // They are now eager loaded in the objectFilter.include array using JOINs.
      resolve({ errCode: 0, data: orders });
    } catch (error) {
      reject(error);
    }
  });
};
let shipperTakeOrder = (orderId, shipperId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!orderId || !shipperId) {
        return resolve({ errCode: 1, errMessage: 'Missing required parameter!' });
      }
      const order = await db.OrderProduct.findOne({
        where: { id: orderId },
        raw: false,
      });
      if (!order) {
        return resolve({ errCode: 2, errMessage: 'Order not found!' });
      }
      if (order.statusId !== 'S4' || order.shipperId != null) {
        return resolve({ errCode: 3, errMessage: 'Order is not available for taking!' });
      }
      order.shipperId = shipperId;
      order.statusId = 'S5';
      await order.save();
      resolve({ errCode: 0, errMessage: 'ok' });
    } catch (error) {
      reject(error);
    }
  });
};
let shipperUpdateOrderStatus = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { orderId, shipperId, statusId, image, statusReason } = data;
      if (!orderId || !shipperId || !statusId) {
        return resolve({ errCode: 1, errMessage: 'Missing required parameter!' });
      }
      const order = await db.OrderProduct.findOne({
        where: { id: orderId },
        raw: false,
      });
      if (!order) {
        return resolve({ errCode: 2, errMessage: 'Order not found!' });
      }
      if (order.shipperId !== shipperId) {
        return resolve({ errCode: 3, errMessage: 'Not your order!' });
      }
      const allowed = [
        ['S4', 'S5'],
        ['S5', 'S6'],
        ['S5', 'S7'],
        ['S5', 'S8'],
        ['S4', 'S7'],
        ['S4', 'S8'],
      ];
      const allowedTransition = allowed.some(
        ([from, to]) => order.statusId === from && statusId === to
      );
      if (!allowedTransition) {
        return resolve({ errCode: 4, errMessage: 'Invalid status transition!' });
      }
      if (
        (statusId === 'S6' && !image) ||
        ((statusId === 'S7' || statusId === 'S8') && !statusReason)
      ) {
        return resolve({
          errCode: 5,
          errMessage:
            statusId === 'S6'
              ? 'Image required for delivery confirmation!'
              : 'Reason required for cancel/fail!',
        });
      }
      order.statusId = statusId;
      if (image) order.image = image;
      if (statusReason) order.statusReason = statusReason;
      await order.save();
      if (statusId === 'S7' || statusId === 'S8') {
        const orderDetail = await db.OrderDetail.findAll({ where: { orderId } });
        for (let i = 0; i < orderDetail.length; i++) {
          const pds = await db.ProductDetailSize.findOne({
            where: { id: orderDetail[i].productId },
            raw: false,
          });
          if (pds) {
            pds.stock = (pds.stock || 0) + orderDetail[i].quantity;
            await pds.save();
          }
        }
      }
      resolve({ errCode: 0, errMessage: 'ok' });
    } catch (error) {
      reject(error);
    }
  });
};
let getOrderShipperLocation = (orderId, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!orderId || !userId) {
        return resolve({ errCode: 1, errMessage: 'Missing required parameter!' });
      }
      const order = await db.OrderProduct.findOne({
        where: { id: orderId },
        raw: true,
      });
      if (!order) {
        return resolve({ errCode: 2, errMessage: 'Order not found!' });
      }
      const addressUser = await db.AddressUser.findOne({
        where: { id: order.addressUserId },
      });
      if (!addressUser || addressUser.userId !== userId) {
        return resolve({ errCode: 3, errMessage: 'Not authorized to view this order!' });
      }
      if (!order.shipperId) {
        return resolve({ errCode: 0, data: { lat: null, lng: null, shipperId: null } });
      }
      const location = await db.ShipperLocation.findOne({
        where: { shipperId: order.shipperId },
      });
      resolve({
        errCode: 0,
        data: {
          lat: location?.lat,
          lng: location?.lng,
          shipperId: order.shipperId,
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};
let getAdminShippersOnMap = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await db.OrderProduct.findAll({
        where: { statusId: { [Op.in]: ['S4', 'S5'] } },
        attributes: ['id', 'shipperId', 'statusId'],
        raw: true,
      });
      const shipperIds = [...new Set(orders.map((o) => o.shipperId).filter(Boolean))];
      const list = [];
      for (const sid of shipperIds) {
        let user = await db.User.findOne({
          where: { id: sid },
          attributes: ['id', 'firstName', 'lastName', 'phonenumber', 'image'],
          raw: true,
          nest: true,
        });

        if (user && user.image) {
          user.image = Buffer.from(user.image, 'base64').toString('binary');
        }
        const location = await db.ShipperLocation.findOne({
          where: { shipperId: sid },
          raw: true,
        });
        const orderIds = orders.filter((o) => o.shipperId === sid).map((o) => o.id);
        list.push({
          shipperId: sid,
          shipper: user,
          lat: location?.lat,
          lng: location?.lng,
          orderIds,
        });
      }
      resolve({ errCode: 0, data: list });
    } catch (error) {
      reject(error);
    }
  });
};
let paymentOrder = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let listItem = [];
      let totalPriceProduct = 0;
      for (let i = 0; i < data.result.length; i++) {
        data.result[i].productDetailSize = await db.ProductDetailSize.findOne({
          where: { id: data.result[i].productId },
          include: [{ model: db.Allcode, as: 'sizeData' }],
          raw: true,
          nest: true,
        });
        data.result[i].productDetail = await db.ProductDetail.findOne({
          where: {
            id: data.result[i].productDetailSize.productdetailId,
          },
        });
        data.result[i].product = await db.Product.findOne({
          where: { id: data.result[i].productDetail.productId },
        });
        data.result[i].realPrice = parseFloat(
          (data.result[i].realPrice / EXCHANGE_RATES.USD).toFixed(2)
        );

        listItem.push({
          name:
            data.result[i].product.name +
            ' | ' +
            data.result[i].productDetail.nameDetail +
            ' | ' +
            data.result[i].productDetailSize.sizeData.value,
          sku: data.result[i].productId + '',
          price: data.result[i].realPrice + '',
          currency: 'USD',
          quantity: data.result[i].quantity,
        });
        totalPriceProduct += data.result[i].realPrice * data.result[i].quantity;
      }
      listItem.push({
        name: 'Phi ship + Voucher',
        sku: '1',
        price: parseFloat(data.total - totalPriceProduct).toFixed(2) + '',
        currency: 'USD',
        quantity: 1,
      });

      var create_payment_json = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url: `${process.env.URL_REACT}/payment/success`,
          cancel_url: `${process.env.URL_REACT}/payment/cancel`,
        },
        transactions: [
          {
            item_list: {
              items: listItem,
            },
            amount: {
              currency: 'USD',
              total: data.total,
            },
            description: 'This is the payment description.',
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          resolve({
            errCode: -1,
            errMessage: error,
          });
        } else {
          resolve({
            errCode: 0,
            errMessage: 'ok',
            link: payment.links[1].href,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
let paymentOrderSuccess = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.PayerID || !data.paymentId || !data.token) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        var execute_payment_json = {
          payer_id: data.PayerID,
          transactions: [
            {
              amount: {
                currency: 'USD',
                total: data.total,
              },
            },
          ],
        };

        var paymentId = data.paymentId;

        paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
          if (error) {
            resolve({
              errCode: 0,
              errMessage: error,
            });
          } else {
            let product = await db.OrderProduct.create({
              addressUserId: data.addressUserId,
              isPaymentOnlien: data.isPaymentOnlien,
              statusId: 'S3',
              typeShipId: data.typeShipId,
              voucherId: data.voucherId,
              note: data.note,
            });

            data.arrDataShopCart = data.arrDataShopCart.map((item, index) => {
              item.orderId = product.dataValues.id;
              return item;
            });

            await db.OrderDetail.bulkCreate(data.arrDataShopCart);
            let res = await db.ShopCart.findOne({
              where: { userId: data.userId, statusId: 0 },
            });
            if (res) {
              await db.ShopCart.destroy({
                where: { userId: data.userId },
              });
              for (let i = 0; i < data.arrDataShopCart.length; i++) {
                let productDetailSize = await db.ProductDetailSize.findOne({
                  where: {
                    id: data.arrDataShopCart[i].productId,
                  },
                  raw: false,
                });
                productDetailSize.stock =
                  productDetailSize.stock - data.arrDataShopCart[i].quantity;
                await productDetailSize.save();
              }
            }
            if (data.voucherId && data.userId) {
              let voucherUses = await db.VoucherUsed.findOne({
                where: {
                  voucherId: data.voucherId,
                  userId: data.userId,
                },
                raw: false,
              });
              voucherUses.status = 1;
              await voucherUses.save();
            }
            resolve({
              errCode: 0,
              errMessage: 'ok',
            });
          }
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let paymentOrderVnpaySuccess = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product = await db.OrderProduct.create({
        addressUserId: data.addressUserId,
        isPaymentOnlien: data.isPaymentOnlien,
        statusId: 'S3',
        typeShipId: data.typeShipId,
        voucherId: data.voucherId,
        note: data.note,
      });

      data.arrDataShopCart = data.arrDataShopCart.map((item, index) => {
        item.orderId = product.dataValues.id;
        return item;
      });

      await db.OrderDetail.bulkCreate(data.arrDataShopCart);
      let res = await db.ShopCart.findOne({
        where: { userId: data.userId, statusId: 0 },
      });
      if (res) {
        await db.ShopCart.destroy({
          where: { userId: data.userId },
        });
        for (let i = 0; i < data.arrDataShopCart.length; i++) {
          let productDetailSize = await db.ProductDetailSize.findOne({
            where: { id: data.arrDataShopCart[i].productId },
            raw: false,
          });
          productDetailSize.stock = productDetailSize.stock - data.arrDataShopCart[i].quantity;
          await productDetailSize.save();
        }
      }
      if (data.voucherId && data.userId) {
        let voucherUses = await db.VoucherUsed.findOne({
          where: {
            voucherId: data.voucherId,
            userId: data.userId,
          },
          raw: false,
        });
        voucherUses.status = 1;
        await voucherUses.save();
      }
      resolve({
        errCode: 0,
        errMessage: 'ok',
      });
    } catch (error) {
      reject(error);
    }
  });
};
let confirmOrder = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.shipperId || !data.orderId || !data.statusId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let orderProduct = await db.OrderProduct.findOne({
          where: { id: data.orderId },
          raw: false,
        });
        orderProduct.shipperId = data.shipperId;
        orderProduct.statusId = data.statusId;
        await orderProduct.save();

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
let paymentOrderVnpay = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      var ipAddr =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      var tmnCode = process.env.VNP_TMNCODE;
      var secretKey = process.env.VNP_HASHSECRET;
      var vnpUrl = process.env.VNP_URL;
      var returnUrl = process.env.URL_REACT + '/payment/vnpay_return';

      // FIX 2: tạo createDate động thay vì dùng biến môi trường tĩnh
      var now = new Date();
      var createDate =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      var orderId = uuidv4();

      var amount = req.body.amount;
      var bankCode = req.body.bankCode;

      var orderInfo = req.body.orderDescription;
      var orderType = req.body.orderType;
      var locale = req.body.language;
      if (locale === null || locale === '') {
        locale = 'vn';
      }
      var currCode = 'VND';
      var vnp_Params = {};
      vnp_Params['vnp_Version'] = '2.1.0';
      vnp_Params['vnp_Command'] = 'pay';
      vnp_Params['vnp_TmnCode'] = tmnCode;
      vnp_Params['vnp_Locale'] = locale;
      vnp_Params['vnp_CurrCode'] = currCode;
      vnp_Params['vnp_TxnRef'] = orderId;
      vnp_Params['vnp_OrderInfo'] = orderInfo;
      vnp_Params['vnp_OrderType'] = orderType;
      vnp_Params['vnp_Amount'] = amount * 100;
      vnp_Params['vnp_ReturnUrl'] = returnUrl;
      vnp_Params['vnp_IpAddr'] = ipAddr;
      vnp_Params['vnp_CreateDate'] = createDate;
      if (bankCode !== null && bankCode !== '') {
        vnp_Params['vnp_BankCode'] = bankCode;
      }

      let sortedParams = sortObject(vnp_Params);
      let signData = querystring.stringify(sortedParams, { encode: false });

      let hmac = crypto.createHmac('sha512', secretKey);
      let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      sortedParams['vnp_SecureHash'] = signed;

      vnpUrl += '?' + querystring.stringify(sortedParams, { encode: false });
      resolve({
        errCode: 200,
        link: vnpUrl,
      });
    } catch (error) {
      console.error('paymentOrderVnpay error:', error);
      reject(error);
    }
  });
};
let confirmOrderVnpay = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let vnp_Params = { ...data };
      let secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      vnp_Params = sortObject(vnp_Params);

      let secretKey = process.env.VNP_HASHSECRET;
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac('sha512', secretKey);
      let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash === signed) {
        if (
          vnp_Params['vnp_ResponseCode'] === '00' ||
          vnp_Params['vnp_TransactionStatus'] === '00'
        ) {
          resolve({
            errCode: 0,
            errMessage: 'Success',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage:
              'Giao dịch thất bại (VNP_ResponseCode: ' + vnp_Params['vnp_ResponseCode'] + ')',
          });
        }
      } else {
        resolve({
          errCode: 1,
          errMessage: 'Sai chữ ký xác thực (Checksum failed)',
        });
      }
    } catch (error) {
      console.error('confirmOrderVnpay error:', error);
      reject(error);
    }
  });
};

// Hàm sortObject dùng khi TẠO payment (encode value để ký)
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
  }
  return sorted;
}

let updateImageOrder = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.image) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter !',
        });
      } else {
        let order = await db.OrderProduct.findOne({
          where: { id: data.id },
          raw: false,
        });
        order.image = data.image;
        await order.save();

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
export default {
  createNewOrder: createNewOrder,
  getAllOrders: getAllOrders,
  getDetailOrderById: getDetailOrderById,
  updateStatusOrder: updateStatusOrder,
  getAllOrdersByUser: getAllOrdersByUser,
  paymentOrder: paymentOrder,
  paymentOrderSuccess: paymentOrderSuccess,
  confirmOrder: confirmOrder,
  getAllOrdersByShipper: getAllOrdersByShipper,
  getOrdersAvailableForShipper: getOrdersAvailableForShipper,
  shipperTakeOrder: shipperTakeOrder,
  shipperUpdateOrderStatus: shipperUpdateOrderStatus,
  getOrderShipperLocation: getOrderShipperLocation,
  getAdminShippersOnMap: getAdminShippersOnMap,
  paymentOrderVnpay: paymentOrderVnpay,
  confirmOrderVnpay: confirmOrderVnpay,
  paymentOrderVnpaySuccess: paymentOrderVnpaySuccess,
  updateImageOrder: updateImageOrder,
};
