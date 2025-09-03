import { query } from '../lib/db-direct'

async function checkAdmin() {
  try {
    const admins = await query('SELECT id, email, name, role FROM users WHERE role = \'admin\'')
    console.log('Admin users:', admins)
    
    if (admins.length === 0) {
      console.log('No admin users found. Creating one from existing users...')
      const users = await query('SELECT id, email, name FROM users ORDER BY created_at ASC LIMIT 1')
      if (users.length > 0) {
        await query('UPDATE users SET role = \'admin\' WHERE id = $1', [users[0].id])
        console.log(`Made ${users[0].email} an admin`)
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkAdmin()