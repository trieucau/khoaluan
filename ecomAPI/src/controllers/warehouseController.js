import warehouseService from '../services/warehouseService.js';

let handleGetAllWarehouses = async (req, res) => {
  try {
    let data = await warehouseService.getAllWarehouses();
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};

let handleCreateWarehouse = async (req, res) => {
  try {
    let data = await warehouseService.createNewWarehouse(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};

let handleUpdateWarehouse = async (req, res) => {
  try {
    let data = await warehouseService.updateWarehouse(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};

let handleDeleteWarehouse = async (req, res) => {
  try {
    let data = await warehouseService.deleteWarehouse(req.query.id);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      errCode: -1,
      errMessage: 'Error from server',
    });
  }
};

export default {
  handleGetAllWarehouses,
  handleCreateWarehouse,
  handleUpdateWarehouse,
  handleDeleteWarehouse,
};
