import addressUserService from '../services/addressUserService.js';

let createNewAddressUser = async (req, res) => {
  try {
    let data = await addressUserService.createNewAddressUser({
      ...req.body,
      userId: req.user.id,
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
let getAllAddressUserByUserId = async (req, res) => {
  try {
    let data = await addressUserService.getAllAddressUserByUserId({
      userId: req.user.id,
      limit: req.query.limit,
      offset: req.query.offset,
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
let deleteAddressUser = async (req, res) => {
  try {
    let data = await addressUserService.deleteAddressUser({
      ...req.body,
      userId: req.user.id,
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
let editAddressUser = async (req, res) => {
  try {
    let data = await addressUserService.editAddressUser({
      ...req.body,
      userId: req.user.id,
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
let getDetailAddressUserById = async (req, res) => {
  try {
    let data = await addressUserService.getDetailAddressUserById(req.query.id, req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
let updateLocationAddressUser = async (req, res) => {
  try {
    let data = await addressUserService.updateLocationAddressUser({
      ...req.body,
      userId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};
export default {
  createNewAddressUser: createNewAddressUser,
  getAllAddressUserByUserId: getAllAddressUserByUserId,
  deleteAddressUser: deleteAddressUser,
  editAddressUser: editAddressUser,
  getDetailAddressUserById: getDetailAddressUserById,
  updateLocationAddressUser: updateLocationAddressUser,
};
