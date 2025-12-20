import { pool } from '../config/database.js';

async function addFriend() {
  try {
    // Get all users
    const usersResult = await pool.query('SELECT id, username, strava_id FROM users ORDER BY id');
    console.log('Users:', usersResult.rows);

    if (usersResult.rows.length < 2) {
      console.log('Need at least 2 users to create friendship');
      process.exit(1);
    }

    // Find pion user
    const pionUser = usersResult.rows.find(u => u.username?.toLowerCase().includes('pion'));
    const otherUser = usersResult.rows.find(u => u.id !== pionUser?.id);

    if (!pionUser || !otherUser) {
      console.log('Could not find both users');
      process.exit(1);
    }

    console.log(`Creating friendship between ${otherUser.username} (${otherUser.id}) and ${pionUser.username} (${pionUser.id})`);

    // Create friendship (accepted)
    const result = await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status, requested_at, accepted_at)
       VALUES ($1, $2, 'accepted', NOW(), NOW())
       ON CONFLICT (user_id, friend_id) DO NOTHING
       RETURNING *`,
      [otherUser.id, pionUser.id]
    );

    if (result.rows.length > 0) {
      console.log('✅ Friendship created:', result.rows[0]);
    } else {
      console.log('⚠️ Friendship already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addFriend();
