import { query } from '../lib/db-direct'

async function setupAdminRole() {
  try {
    console.log('Adding role column to users table...')
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT \'user\'')
    console.log('✅ Role column added successfully')
    
    // Create a default admin user by updating the first user
    console.log('Creating default admin user...')
    const adminUsers = await query('SELECT * FROM users WHERE role = \'admin\'')
    
    if (adminUsers.length === 0) {
      const firstUser = await query('SELECT id, email FROM users ORDER BY created_at ASC LIMIT 1')
      if (firstUser.length > 0) {
        await query('UPDATE users SET role = \'admin\' WHERE id = $1', [firstUser[0].id])
        console.log(`✅ Made user ${firstUser[0].email} an admin`)
      } else {
        console.log('ℹ️  No users exist yet - admin will be created when first user registers')
      }
    } else {
      console.log(`✅ Admin user already exists: ${adminUsers[0].email}`)
    }
    
    console.log('✅ Admin setup complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error setting up admin:', error)
    process.exit(1)
  }
}

setupAdminRole()