import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import emailService from './emailService.js';
import { v4 as uuidv4 } from 'uuid';
import CommonUtils from '../utils/CommonUtils.js';
import { Op } from 'sequelize';
import admin from '../config/firebaseAdmin.js';
import fetch from 'node-fetch';
import 'dotenv/config';
const salt = bcrypt.genSaltSync(10);

let buildUrlEmail = (token, userId) => {
  let result = `${process.env.URL_REACT}/verify-email?token=${token}&userId=${userId}`;
  return result;
};

let hashUserPasswordFromBcrypt = (password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let hashPassword = await bcrypt.hashSync(password, salt);
      resolve(hashPassword);
    } catch (error) {
      reject(error);
    }
  });
};
let checkUserEmail = (userEmail) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: { email: userEmail },
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      reject(error);
    }
  });
};
let handleCreateNewUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.email || !data.firstName || !data.lastName) {
        resolve({
          errCode: 2,
          errMessage: 'Missing required parameters !',
        });
      } else {
        let check = await checkUserEmail(data.email);
        if (check === true) {
          resolve({
            errCode: 1,
            errMessage: 'Your email is already in used, Plz try another email!',
          });
        } else {
          let hashPassword = await hashUserPasswordFromBcrypt(data.password);
          await db.User.create({
            email: data.email,
            password: hashPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            address: data.address,
            roleId: data.roleId,
            genderId: data.genderId,
            phonenumber: data.phonenumber,
            image: data.avatar,
            dob: data.dob,
            isActiveEmail: 0,
            statusId: 'S1',
            usertoken: '',
          });
          resolve({
            errCode: 0,
            message: 'OK',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

let deleteUser = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId) {
        resolve({
          errCode: 1,
          errMessage: `Missing required parameters !`,
        });
      } else {
        let foundUser = await db.User.findOne({
          where: { id: userId },
        });
        if (!foundUser) {
          resolve({
            errCode: 2,
            errMessage: `The user isn't exist`,
          });
        }
        await db.User.destroy({
          where: { id: userId },
        });
        resolve({
          errCode: 0,
          message: `The user is deleted`,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let updateUserData = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.genderId) {
        resolve({
          errCode: 2,
          errMessage: `Missing required parameters`,
        });
      } else {
        let user = await db.User.findOne({
          where: { id: data.id },
          raw: false,
        });
        if (user) {
          user.firstName = data.firstName;
          user.lastName = data.lastName;
          user.address = data.address;
          user.roleId = data.roleId;
          user.genderId = data.genderId;
          user.phonenumber = data.phonenumber;
          user.dob = data.dob;
          if (data.image) {
            user.image = data.image;
          }
          await user.save();
          resolve({
            errCode: 0,
            errMessage: 'Update the user succeeds!',
          });
        } else {
          resolve({
            errCode: 1,
            errMessage: 'User not found!',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
let handleLogin = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.email || !data.password) {
        resolve({
          errCode: 4,
          errMessage: 'Missing required parameters!',
        });
      } else {
        let userData = {};

        let isExist = await checkUserEmail(data.email);

        if (isExist === true) {
          let user = await db.User.findOne({
            attributes: ['email', 'roleId', 'password', 'firstName', 'lastName', 'id'],
            where: { email: data.email, statusId: 'S1' },
            raw: true,
          });
          if (user) {
            let check = await bcrypt.compareSync(data.password, user.password);
            if (check) {
              userData.errCode = 0;
              userData.errMessage = 'Ok';

              delete user.password;

              userData.user = user;
              userData.accessToken = CommonUtils.encodeToken(user.id);
            } else {
              userData.errCode = 3;

              userData.errMessage = 'Wrong password';
            }
          } else {
            userData.errCode = 2;
            userData.errMessage = 'User not found!';
          }
        } else {
          userData.errCode = 1;
          userData.errMessage = `Your's email isn't exist in your system. plz try other email`;
        }
        resolve(userData);
      }
    } catch (error) {
      reject(error);
    }
  });
};

let handleLoginSocial = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.idToken) {
        return resolve({
          errCode: 1,
          errMessage: 'Missing idToken!',
        });
      }

      // 1. Verify Firebase ID Token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(data.idToken);
      } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return resolve({
          errCode: 2,
          errMessage: 'Invalid or expired token!',
        });
      }

      const { email, name, picture, phone_number } = decodedToken;

      if (!email) {
        return resolve({
          errCode: 3,
          errMessage: 'Email not provided by social provider!',
        });
      }

      // 2. Check if user exists
      let user = await db.User.findOne({
        where: { email: email },
        attributes: [
          'email',
          'roleId',
          'password',
          'firstName',
          'lastName',
          'id',
          'phonenumber',
          'address',
        ],
        raw: true,
      });

      // 3. If user doesn't exist, create one
      if (!user) {
        let avatarBase64 = null;
        if (picture) {
          try {
            const response = await fetch(picture);
            const arrayBuffer = await response.arrayBuffer();
            // Store as base64 data URL — consistent with manual upload (readAsDataURL)
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            avatarBase64 = `data:image/jpeg;base64,${base64}`;
          } catch (e) {
            console.error('Error fetching social avatar:', e);
          }
        }

        // Split Firebase full name into firstName (họ) and lastName (tên)
        const nameParts = (name || 'Social User').trim().split(' ');
        const socialFirstName = nameParts[0]; // Họ (first word)
        const socialLastName = nameParts.slice(1).join(' ') || nameParts[0]; // Tên (remaining)

        const newUser = await db.User.create({
          email: email,
          password: 'social_login_no_password', // Placeholder
          firstName: socialFirstName,
          lastName: socialLastName,
          roleId: 'R2',
          statusId: 'S1',
          isActiveEmail: true,
          image: avatarBase64,
          phonenumber: phone_number || '',
        });

        user = {
          email: newUser.email,
          roleId: newUser.roleId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          id: newUser.id,
        };
      } else {
        // Auto-fix for existing social users: repair missing firstName or image
        const needsUpdate = {};

        if (!user.firstName && name) {
          const nameParts = name.trim().split(' ');
          needsUpdate.firstName = nameParts[0];
          needsUpdate.lastName = nameParts.slice(1).join(' ') || nameParts[0];
          user = { ...user, firstName: needsUpdate.firstName, lastName: needsUpdate.lastName };
        }

        if (!user.image && picture) {
          // Re-fetch Google avatar and store as base64 data URL (fix old raw-binary format)
          try {
            const response = await fetch(picture);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            needsUpdate.image = `data:image/jpeg;base64,${base64}`;
          } catch (e) {
            console.error('[AVATAR] Không thể tải ảnh đại diện:', e.message);
          }
        }

        if (Object.keys(needsUpdate).length > 0) {
          await db.User.update(needsUpdate, { where: { id: user.id } });
        }
      }

      // 4. Generate Access Token
      const accessToken = CommonUtils.encodeToken(user.id);

      resolve({
        errCode: 0,
        errMessage: 'OK',
        user: {
          email: user.email,
          roleId: user.roleId,
          firstName: user.firstName,
          lastName: user.lastName,
          id: user.id,
        },
        accessToken: accessToken,
      });
    } catch (error) {
      reject(error);
    }
  });
};
let handleChangePassword = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.password || !data.oldpassword) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter!',
        });
      } else {
        let user = await db.User.findOne({
          where: { id: data.id },
          raw: false,
        });
        if (await bcrypt.compareSync(data.oldpassword, user.password)) {
          if (user) {
            user.password = await hashUserPasswordFromBcrypt(data.password);
            await user.save();
          }
          resolve({
            errCode: 0,
            errMessage: 'ok',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'Mật khẩu cũ không chính xác',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
let getAllUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let objectFilter = {
        where: { statusId: 'S1' },
        attributes: {
          exclude: ['password'],
        },
        include: [
          { model: db.Allcode, as: 'roleData', attributes: ['value', 'code'] },
          {
            model: db.Allcode,
            as: 'genderData',
            attributes: ['value', 'code'],
          },
        ],
        raw: true,
        nest: true,
      };
      if (data.limit && data.offset) {
        objectFilter.limit = +data.limit;
        objectFilter.offset = +data.offset;
      }
      if (data.keyword !== '')
        objectFilter.where = {
          ...objectFilter.where,
          phonenumber: { [Op.substring]: data.keyword },
        };
      let res = await db.User.findAndCountAll(objectFilter);
      if (res.rows && res.rows.length > 0) {
        res.rows = res.rows.map((item) => {
          if (item.image) {
            item.image = Buffer.from(item.image, 'base64').toString('binary');
          }
          return item;
        });
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
let getDetailUserById = (userid, requesterId, requesterRole) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userid) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters!',
        });
      } else {
        // Ownership check: User can only see their own info, unless they are Admin (R1/R4) or Shipper (R3)
        if (
          requesterRole !== 'R1' &&
          requesterRole !== 'R4' &&
          requesterRole !== 'R3' &&
          userid != requesterId
        ) {
          return resolve({
            errCode: 2,
            errMessage: 'Bạn không có quyền xem thông tin này',
          });
        }

        let res = await db.User.findOne({
          where: { id: userid, statusId: 'S1' },
          attributes: {
            exclude: ['password'],
          },
          include: [
            {
              model: db.Allcode,
              as: 'roleData',
              attributes: ['value', 'code'],
            },
            {
              model: db.Allcode,
              as: 'genderData',
              attributes: ['value', 'code'],
            },
          ],
          raw: true,
          nest: true,
        });
        if (res && res.image) {
          res.image = Buffer.from(res.image, 'base64').toString('binary');
        }
        resolve({
          errCode: 0,
          data: res,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let getDetailUserByEmail = (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!email) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameters!',
        });
      } else {
        let res = await db.User.findOne({
          where: { email: email, statusId: 'S1' },
          attributes: {
            exclude: ['password'],
          },
        });
        resolve({
          errCode: 0,
          data: res,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let handleSendVerifyEmailUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id) {
        return resolve({
          errCode: 1,
          errMessage: 'Missing required parameter!',
        });
      }

      let user = await db.User.findOne({
        where: { id: data.id },
        attributes: { exclude: ['password'] },
        raw: false,
      });

      if (!user) {
        return resolve({
          errCode: 2,
          errMessage: 'User not found!',
        });
      }

      // Lưu token vào DB trước — đảm bảo token tồn tại dù mail có lỗi
      let token = uuidv4();
      user.usertoken = token;
      await user.save();

      // Gửi mail riêng — lỗi SMTP không làm crash toàn bộ request
      try {
        await emailService.sendSimpleEmail({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          redirectLink: buildUrlEmail(token, user.id),
          email: user.email,
          type: 'verifyEmail',
        });
      } catch (mailError) {
        console.error('[EMAIL] Gửi email xác thực thất bại:', mailError.message);
        return resolve({
          errCode: 3,
          errMessage: 'Không thể gửi email. Vui lòng thử lại sau!',
        });
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
let handleVerifyEmailUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.token) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter!',
        });
      } else {
        let user = await db.User.findOne({
          where: {
            id: data.id,
            usertoken: data.token,
          },
          attributes: {
            exclude: ['password'],
          },
          raw: false,
        });

        if (user) {
          user.isActiveEmail = 1;
          user.usertoken = '';

          await user.save();
          resolve({
            errCode: 0,
            errMessage: 'ok',
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: 'User not found!',
          });
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};
let handleSendEmailForgotPassword = (email) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!email) {
        return resolve({
          errCode: 1,
          errMessage: 'Missing required parameter!',
        });
      }

      let check = await checkUserEmail(email);
      if (check !== true) {
        return resolve({
          errCode: 2,
          errMessage: 'Email không tồn tại trong hệ thống!',
        });
      }

      let user = await db.User.findOne({
        where: { email: email },
        attributes: { exclude: ['password'] },
        raw: false,
      });

      if (!user) {
        return resolve({
          errCode: 2,
          errMessage: 'User not found!',
        });
      }

      // Lưu token vào DB trước — đảm bảo token tồn tại dù mail có lỗi
      let token = uuidv4();
      user.usertoken = token;
      await user.save();

      // Gửi mail riêng — lỗi SMTP không làm crash toàn bộ request
      try {
        await emailService.sendSimpleEmail({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          redirectLink: `${process.env.URL_REACT}/verify-forgotpassword?token=${token}&userId=${user.id}`,
          email: user.email,
          type: 'forgotpassword',
        });
      } catch (mailError) {
        console.error('[EMAIL] Gửi email quên mật khẩu thất bại:', mailError.message);
        return resolve({
          errCode: 3,
          errMessage: 'Không thể gửi email. Vui lòng thử lại sau!',
        });
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
let handleForgotPassword = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.token || !data.password) {
        resolve({
          errCode: 1,
          errMessage: 'Missing required parameter!',
        });
      } else {
        let user = await db.User.findOne({
          where: {
            id: data.id,
            usertoken: data.token,
          },
          attributes: {
            exclude: ['password'],
          },
          raw: false,
        });

        if (user) {
          user.password = await hashUserPasswordFromBcrypt(data.password);
          user.usertoken = '';

          await user.save();
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
let checkPhonenumberEmail = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let phone = await db.User.findOne({
        where: { phonenumber: data.phonenumber },
      });
      let email = await db.User.findOne({
        where: { email: data.email },
      });
      if (phone) {
        resolve({
          isCheck: true,
          errMessage: 'Số điện thoại đã tồn tại',
        });
      }
      if (email) {
        resolve({
          isCheck: true,
          errMessage: 'Email đã tồn tại',
        });
      }

      resolve({
        isCheck: false,
        errMessage: 'Hợp lệ',
      });
    } catch (error) {
      reject(error);
    }
  });
};
export default {
  handleCreateNewUser: handleCreateNewUser,
  deleteUser: deleteUser,
  updateUserData: updateUserData,
  handleLogin: handleLogin,
  handleChangePassword: handleChangePassword,
  getAllUser: getAllUser,
  getDetailUserById: getDetailUserById,
  handleSendVerifyEmailUser: handleSendVerifyEmailUser,
  handleVerifyEmailUser: handleVerifyEmailUser,
  handleSendEmailForgotPassword: handleSendEmailForgotPassword,
  handleForgotPassword: handleForgotPassword,
  checkPhonenumberEmail: checkPhonenumberEmail,
  handleLoginSocial: handleLoginSocial,
};
