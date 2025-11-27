// Usage:
// Set environment variables and run from project root:
// Windows PowerShell example:
// $env:SUPABASE_URL='https://your-project.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'; node scripts/create_admin_user.js
// Linux/macOS example:
// SUPABASE_URL='https://your-project.supabase.co' SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' node scripts/create_admin_user.js

// This script creates a Supabase user using the service_role key. Do NOT commit your service_role key to source control.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function run() {
  try {
    const email = process.argv[2] || 'mohamedsallu24@gmail.com';
    const password = process.argv[3] || 'P@$$w0rd';
    const name = process.argv[4] || 'Admin User';

    console.log(`Creating user ${email} ...`);

    // Use the Admin API to create a user (requires service_role key)
    // The admin API may differ by supabase-js version; this uses `auth.admin.createUser` which is available
    // in supabase-js v2 when using a service role key.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' }
    });

    if (error) {
      console.error('Failed to create user:', error);
      process.exit(1);
    }

    console.log('User created successfully:', data);
    console.log('You can now sign in with that email and password in the admin login screen.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

run();
