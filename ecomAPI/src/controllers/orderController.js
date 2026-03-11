import orderService from '../services/orderService';

let createNewOrder = async (req, res) => {
  try {
    let data = await orderService.createNewOrder(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let getAllOrders = async (req, res) => {
  try {
    let data = await orderService.getAllOrders(req.query);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let getDetailOrderById = async (req, res) => {
  try {
    let data = await orderService.getDetailOrderById(req.query.id);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let updateStatusOrder = async (req, res) => {
  try {
    let data = await orderService.updateStatusOrder(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let getAllOrdersByUser = async (req, res) => {
  try {
    let data = await orderService.getAllOrdersByUser(req.query.userId);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let paymentOrder = async (req, res) => {
  try {
    let data = await orderService.paymentOrder(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let paymentOrderSuccess = async (req, res) => {
  try {
    let data = await orderService.paymentOrderSuccess(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let paymentOrderVnpaySuccess = async (req, res) => {
  try {
    let data = await orderService.paymentOrderVnpaySuccess(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let confirmOrder = async (req, res) => {
  try {
    let data = await orderService.confirmOrder(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let getAllOrdersByShipper = async (req, res) => {
  try {
    let data = await orderService.getAllOrdersByShipper(req.query);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let paymentOrderVnpay = async (req, res) => {
  try {
    let data = await orderService.paymentOrderVnpay(req);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let confirmOrderVnpay = async (req, res) => {
  try {
    let data = await orderService.confirmOrderVnpay(req.query);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let updateImageOrder = async (req, res) => {
  try {
    let data = await orderService.updateImageOrder(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let getOrdersAvailableForShipper = async (req, res) => {
  try {
    let data = await orderService.getOrdersAvailableForShipper();
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ errCode: -1, errMessage: 'Error from server' });
  }
};
let shipperTakeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const shipperId = req.user.id;
    let data = await orderService.shipperTakeOrder(orderId, shipperId);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ errCode: -1, errMessage: 'Error from server' });
  }
};
let shipperUpdateOrderStatus = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const data = await orderService.shipperUpdateOrderStatus({
      ...req.body,
      shipperId,
    });
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ errCode: -1, errMessage: 'Error from server' });
  }
};
let getOrderShipperLocation = async (req, res) => {
  try {
    const { orderId } = req.query;
    const userId = req.user.id;
    let data = await orderService.getOrderShipperLocation(orderId, userId);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ errCode: -1, errMessage: 'Error from server' });
  }
};
let getAdminShippersOnMap = async (req, res) => {
  try {
    let data = await orderService.getAdminShippersOnMap();
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ errCode: -1, errMessage: 'Error from server' });
  }
};
module.exports = {
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
