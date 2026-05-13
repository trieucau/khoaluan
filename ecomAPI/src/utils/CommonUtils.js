import JWT from 'jsonwebtoken';
import 'dotenv/config';

let encodeToken = (userId) => {
  return JWT.sign(
    {
      iss: 'Bi Ngo',
      sub: userId,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 3),
    },
    process.env.JWT_SECRET
  );
};
export default {
  encodeToken: encodeToken,
};
