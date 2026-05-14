import db from '../models/index.js';
import { Op } from 'sequelize';

let createNewRoom = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters !',
        });
      } else {
        let userAdmin = await db.User.findOne({
          where: { roleId: 'R1', statusId: 'S1' },
        });
        if (!userAdmin) {
          resolve({ errCode: 3, errMessage: 'Không tìm thấy admin chat' });
          return;
        }
        let [room, created] = await db.RoomMessage.findOrCreate({
          where: { userOne: data.userId },
          defaults: { userOne: data.userId, userTwo: userAdmin.id },
        });
        resolve({ errCode: 0, data: room, created: created });
      }
    } catch (error) {
      reject(error);
    }
  });
};
export let sendMessage = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.userId || !data.roomId || !data.text) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters !',
        });
      } else {
        let userRole = data.roleId;
        if (!userRole) {
          let user = await db.User.findOne({ where: { id: data.userId } });
          userRole = user ? user.roleId : null;
        }

        if (userRole !== 'R1' && userRole !== 'R4') {
          let room = await db.RoomMessage.findOne({
            where: {
              id: data.roomId,
              [Op.or]: [{ userOne: data.userId }, { userTwo: data.userId }],
            },
          });

          if (!room) {
            return resolve({ errCode: 2, errMessage: 'Bạn không thuộc phòng chat này' });
          }
        }

        await db.Message.create({
          text: data.text,
          userId: data.userId,
          roomId: data.roomId,
          unRead: true,
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
let loadMessage = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.roomId || !data.userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters !',
        });
      } else {
        let userRole = data.roleId;
        if (!userRole) {
          let user = await db.User.findOne({ where: { id: data.userId } });
          userRole = user ? user.roleId : null;
        }

        if (userRole !== 'R1' && userRole !== 'R4') {
          let room = await db.RoomMessage.findOne({
            where: {
              id: data.roomId,
              [Op.or]: [{ userOne: data.userId }, { userTwo: data.userId }],
            },
          });

          if (!room) {
            return resolve({ errCode: 2, errMessage: 'Bạn không thuộc phòng chat này' });
          }
        }

        await db.Message.update(
          {
            unRead: false,
          },
          { where: { roomId: data.roomId, userId: { [Op.not]: data.userId } } }
        );

        let limit = parseInt(data.limit) || 10;
        let offset = parseInt(data.offset) || 0;

        let message = await db.Message.findAll({
          where: { roomId: data.roomId },
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });

        message = message.reverse();

        for (let i = 0; i < message.length; i++) {
          message[i].userData = await db.User.findOne({
            where: { id: message[i].userId },
          });
          if (message[i].userData && message[i].userData.image) {
            message[i].userData.image = Buffer.from(message[i].userData.image, 'base64').toString(
              'binary'
            );
          }
        }
        resolve({
          errCode: 0,
          data: message,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let listRoomOfUser = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters !',
        });
      } else {
        let room = await db.RoomMessage.findAll({
          where: { userOne: userId },
        });

        for (let i = 0; i < room.length; i++) {
          room[i].messageData = await db.Message.findAll({
            where: { roomId: room[i].id },
          });

          room[i].userOneData = await db.User.findOne({
            where: { id: room[i].userOne },
          });
          if (room[i].userOneData && room[i].userOneData.image) {
            room[i].userOneData.image = Buffer.from(room[i].userOneData.image, 'base64').toString(
              'binary'
            );
          }
          room[i].userTwoData = await db.User.findOne({
            where: { id: room[i].userTwo },
          });
          if (room[i].userTwoData && room[i].userTwoData.image) {
            room[i].userTwoData.image = Buffer.from(room[i].userTwoData.image, 'base64').toString(
              'binary'
            );
          }
        }
        resolve({
          errCode: 0,
          data: room,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let listRoomOfAdmin = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let room = await db.RoomMessage.findAll();
      for (let i = 0; i < room.length; i++) {
        room[i].messageData = await db.Message.findAll({
          where: { roomId: room[i].id },
        });
        room[i].userOneData = await db.User.findOne({
          where: { id: room[i].userOne },
        });
        if (room[i].userOneData && room[i].userOneData.image) {
          room[i].userOneData.image = Buffer.from(room[i].userOneData.image, 'base64').toString(
            'binary'
          );
        }
        room[i].userTwoData = await db.User.findOne({
          where: { id: room[i].userTwo },
        });
        if (room[i].userTwoData && room[i].userTwoData.image) {
          room[i].userTwoData.image = Buffer.from(room[i].userTwoData.image, 'base64').toString(
            'binary'
          );
        }
      }
      resolve({
        errCode: 0,
        data: room,
      });
    } catch (error) {
      reject(error);
    }
  });
};
export default {
  createNewRoom: createNewRoom,
  sendMessage: sendMessage,
  loadMessage: loadMessage,
  listRoomOfUser: listRoomOfUser,
  listRoomOfAdmin: listRoomOfAdmin,
};
