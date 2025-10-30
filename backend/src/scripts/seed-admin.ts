// src/scripts/seed-admin.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/entities/user.entity';

export async function seedAdmin(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  
  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@carrental.com' }
  });

  if (!existingAdmin) {
    const adminUser = userRepository.create({
      email: 'admin@carrental.com',
      password: await bcrypt.hash('Admin123!', 12),
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      phoneNumber: '+1234567890',
      isActive: true
    });

    await userRepository.save(adminUser);
    console.log('✅ Super admin user created successfully');
    console.log('Email: admin@carrental.com');
    console.log('Password: Admin123!');
  } else {
    console.log('ℹ️  Super admin already exists');
  }
}