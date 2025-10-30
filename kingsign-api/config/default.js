/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 3030,
  public: process.env.PUBLIC_PATH || '../public/',
  paginate: {
    default: parseInt(process.env.PAGINATE_DEFAULT) || 10,
    max: parseInt(process.env.PAGINATE_MAX) || 50,
  },
  authentication: {
    entity: 'user',
    service: 'users',
    secret: process.env.FEATHERS_SECRET,
    authStrategies: ['jwt', 'local'],
    jwtOptions: {
      header: {
        typ: 'access',
      },
      audience: process.env.JWT_AUDIENCE || 'https://yourdomain.com',
      issuer: process.env.JWT_ISSUER || 'feathers',
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    local: {
      usernameField: 'email',
      passwordField: 'password',
    },
  },
  mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/kingsign_api',
};
