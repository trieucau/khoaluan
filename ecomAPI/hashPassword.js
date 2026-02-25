const bcrypt = require("bcryptjs");

const salt = bcrypt.genSaltSync(10);

const password = "admin123"; // đổi mật khẩu bạn muốn ở đây

const hash = bcrypt.hashSync(password, salt);

console.log("Hashed password:", hash);
