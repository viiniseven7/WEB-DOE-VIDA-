import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import * as kv from "./kv_store.tsx";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Seed users for testing
const seedUsers = async () => {
  console.log('Starting seed process...');

  const testUsers = [
    {
      email: 'doador@example.com',
      password: 'doador123',
      name: 'João Silva',
      role: 'donor',
      bloodType: 'O+',
      phone: '(11) 98765-4321',
      cpf: '123.456.789-00',
      donationCount: 5,
      lastDonation: '2025-12-15',
    },
    {
      email: 'funcionario@hemocentro.com',
      password: 'funcionario123',
      name: 'Maria Santos',
      role: 'staff',
      phone: '(41) 97654-3210',
      hemocenterId: 'hc-001',
      hemocentroName: 'Hemepar',
    },
    {
      email: 'diretor@hemocentro.com',
      password: 'diretor123',
      name: 'Carlos Oliveira',
      role: 'director',
      phone: '(41) 96543-2109',
      hemocenterId: 'hc-001',
      hemocentroName: 'Hemepar',
    },
    {
      email: 'admin@doavida.com',
      password: 'admin123',
      name: 'Admin DoaVida',
      role: 'admin',
      phone: '(41) 95432-1098',
    },
  ];

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser?.users.some(u => u.email === userData.email);

      if (userExists) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role,
        }
      });

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError.message);
        continue;
      }

      // Store user profile in KV store
      const userId = authData.user.id;
      const userProfile = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        bloodType: userData.bloodType || null,
        phone: userData.phone || null,
        cpf: userData.cpf || null,
        donationCount: userData.donationCount || (userData.role === 'donor' ? 0 : undefined),
        lastDonation: userData.lastDonation || null,
        hemocenterId: userData.hemocenterId || null,
        hemocentroName: userData.hemocentroName || null,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`user:${userId}`, userProfile);

      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    } catch (error) {
      console.error(`Error processing user ${userData.email}:`, error);
    }
  }

  console.log('Seed process completed!');
};

// Run seed if this file is executed directly
if (import.meta.main) {
  await seedUsers();
}

export { seedUsers };
