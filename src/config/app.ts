export const appConfig = {
  port: process.env.PORT || 3089,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
};
