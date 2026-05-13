import shopCartService from '../services/shopCartService';

let addShopCart = async (req, res) => {
  try {
    let data = await shopCartService.addShopCart({
      ...req.body,
      userId: req.user.id, // Force use of authenticated user ID
    });
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let getAllShopCartByUserId = async (req, res) => {
  try {
    // Ignore query id, use token id
    let data = await shopCartService.getAllShopCartByUserId(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let deleteItemShopCart = async (req, res) => {
  try {
    let data = await shopCartService.deleteItemShopCart({
      ...req.body,
      userId: req.user.id, // Pass for ownership check
    });
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
module.exports = {
  addShopCart: addShopCart,
  getAllShopCartByUserId: getAllShopCartByUserId,
  deleteItemShopCart: deleteItemShopCart,
};
