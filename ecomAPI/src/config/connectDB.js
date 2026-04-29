const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+07:00',
    define: {
      freezeTableName: true, //  giúp Sequelize dùng đúng tên table
    },
    dialectOptions:
      process.env.DB_SSL === 'true' // ← đồng bộ với 2 file kia
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {}, // ← không truyền gì cả khi DB_SSL != true
  }
);

let connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully!');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
  }
};

module.exports = connectDB;
