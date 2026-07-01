import { AppDataSource } from './src/data-source';
import * as bcrypt from 'bcrypt';

async function resetPassword() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    // Get first user
    const users = await AppDataSource.query('SELECT user_id, email FROM user_account LIMIT 1');
    
    if (users.length === 0) {
      console.log('❌ No users found');
      await AppDataSource.destroy();
      return;
    }

    const user = users[0];
    const newPassword = 'Test@12345';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await AppDataSource.query(
      'UPDATE user_account SET password = $1 WHERE user_id = $2',
      [hashedPassword, user.user_id]
    );

    console.log(`✅ Password reset for user: ${user.email}`);
    console.log(`   New password: ${newPassword}`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetPassword();
