import { AppDataSource } from '../connection';
import { User } from '../../models/User';

export const seedUsers = async () => {
  const userRepository = AppDataSource.getRepository(User);

  const defaultUser = userRepository.create({
    name: 'admin',
    email: 'admin@example.com',
    password: 'admin123' // 实际应用中需要加密
  });

  await userRepository.save(defaultUser);
}; 