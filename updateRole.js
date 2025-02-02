const db = require('./models');

async function updateUserRole() {
  try {
    // Get the username from command line arguments
    const username = process.argv[2];
    if (!username) {
      console.log('Please provide a username as an argument');
      process.exit(1);
    }

    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    await user.update({ role: 'admin' });
    console.log('User role updated to admin successfully');
  } catch (error) {
    console.error('Error updating role:', error);
  } finally {
    process.exit();
  }
}

updateUserRole(); 