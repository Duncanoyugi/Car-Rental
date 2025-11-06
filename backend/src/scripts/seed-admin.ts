// import { DataSource } from 'typeorm';
// import * as bcrypt from 'bcrypt';
// import { User } from '../user/entities/user.entity';
// import { UserRole } from '../user/entities/user.entity';

// export async function seedAdmin(dataSource: DataSource) {
//   const userRepository = dataSource.getRepository(User);
//   const existingAdmin = await userRepository.findOne({
//     where: { email: 'admin@carrental.com' }
//   });

//   const newPassword = 'Admin123!';
//   const hashedPassword = await bcrypt.hash(newPassword, 12);

//   if (existingAdmin) {
//     console.log('ℹ️  Admin already exists, updating password...');
//     existingAdmin.password = hashedPassword;
//     existingAdmin.isActive = true;
//     await userRepository.save(existingAdmin);
//     console.log('✅ Admin password updated successfully');
//   } else {
//     const adminUser = userRepository.create({
//       email: 'admin@carrental.com',
//       password: hashedPassword,
//       firstName: 'System',
//       lastName: 'Admin',
//       role: UserRole.SUPER_ADMIN,
//       phoneNumber: '+1234567890',
//       isActive: true
//     });
//     await userRepository.save(adminUser);
//     console.log('✅ Super admin user created successfully');
//   }
  
//   console.log('Email: admin@carrental.com');
//   console.log('Password: Admin123!');
// }