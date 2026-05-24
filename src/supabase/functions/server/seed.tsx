import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import * as kv from "./kv_store.tsx";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const testUsers = [
  { email: 'amanda.souza@doavida.com', password: 'doador123', name: 'Amanda Souza', role: 'donor', tipo_sanguineo: 'O+', phone: '(11) 98765-4301', cpf: '123.456.789-00', sexo: 'female', data_nasc: '1994-03-12', cidade: 'Sao Paulo', uf: 'SP', status: 1, donationCount: 3, lastDonation: '2026-04-10', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'bruno.lima@doavida.com', password: 'doador123', name: 'Bruno Lima', role: 'donor', tipo_sanguineo: 'A+', phone: '(11) 98765-4302', cpf: '223.456.789-00', sexo: 'male', data_nasc: '1988-07-01', cidade: 'Sao Paulo', uf: 'SP', status: 1, donationCount: 5, lastDonation: '2026-05-02', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'camila.rocha@doavida.com', password: 'doador123', name: 'Camila Rocha', role: 'donor', tipo_sanguineo: 'B-', phone: '(11) 98765-4303', cpf: '323.456.789-00', sexo: 'female', data_nasc: '1999-11-19', cidade: 'Guarulhos', uf: 'SP', status: 1, donationCount: 2, lastDonation: '2026-03-18', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'daniel.alves@doavida.com', password: 'doador123', name: 'Daniel Alves', role: 'donor', tipo_sanguineo: 'AB+', phone: '(11) 98765-4304', cpf: '423.456.789-00', sexo: 'male', data_nasc: '1982-09-25', cidade: 'Osasco', uf: 'SP', status: 1, donationCount: 6, lastDonation: '2026-04-28', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'elisa.martins@doavida.com', password: 'doador123', name: 'Elisa Martins', role: 'donor', tipo_sanguineo: 'O-', phone: '(11) 98765-4305', cpf: '523.456.789-00', sexo: 'female', data_nasc: '1979-01-14', cidade: 'Santo Andre', uf: 'SP', status: 1, donationCount: 8, lastDonation: '2026-05-08', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'felipe.costa@doavida.com', password: 'doador123', name: 'Felipe Costa', role: 'donor', tipo_sanguineo: 'A-', phone: '(11) 98765-4306', cpf: '623.456.789-00', sexo: 'male', data_nasc: '1996-06-30', cidade: 'Sao Bernardo do Campo', uf: 'SP', status: 1, donationCount: 4, lastDonation: '2026-02-22', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'gabriela.pereira@doavida.com', password: 'doador123', name: 'Gabriela Pereira', role: 'donor', tipo_sanguineo: 'B+', phone: '(11) 98765-4307', cpf: '723.456.789-00', sexo: 'female', data_nasc: '2001-12-05', cidade: 'Barueri', uf: 'SP', status: 1, donationCount: 1, lastDonation: '2026-05-12', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'henrique.gomes@doavida.com', password: 'doador123', name: 'Henrique Gomes', role: 'donor', tipo_sanguineo: 'AB-', phone: '(11) 98765-4308', cpf: '823.456.789-00', sexo: 'male', data_nasc: '1985-04-09', cidade: 'Diadema', uf: 'SP', status: 1, donationCount: 7, lastDonation: '2026-03-05', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'isabela.ribeiro@doavida.com', password: 'doador123', name: 'Isabela Ribeiro', role: 'donor', tipo_sanguineo: 'A+', phone: '(11) 98765-4309', cpf: '923.456.789-00', sexo: 'female', data_nasc: '1992-08-17', cidade: 'Maua', uf: 'SP', status: 1, donationCount: 3, lastDonation: '2026-04-03', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'joaquim.teixeira@doavida.com', password: 'doador123', name: 'Joaquim Teixeira', role: 'donor', tipo_sanguineo: 'O+', phone: '(11) 98765-4310', cpf: '024.456.789-00', sexo: 'male', data_nasc: '1976-10-28', cidade: 'Carapicuiba', uf: 'SP', status: 1, donationCount: 9, lastDonation: '2026-01-27', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'larissa.nunes@doavida.com', password: 'doador123', name: 'Larissa Nunes', role: 'donor', tipo_sanguineo: 'B+', phone: '(11) 98765-4311', cpf: '124.556.789-00', sexo: 'female', data_nasc: '2003-02-08', cidade: 'Taboao da Serra', uf: 'SP', status: 1, donationCount: 2, lastDonation: '2026-05-15', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'funcionario@hemocentro.com', password: 'funcionario123', name: 'Ana Santos', role: 'staff', phone: '(41) 97654-3210', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'diretor@hemocentro.com', password: 'diretor123', name: 'Carlos Oliveira', role: 'director', phone: '(41) 96543-2109', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
  { email: 'admin@doavida.com', password: 'admin123', name: 'Admin DoaVida', role: 'admin', phone: '(41) 95432-1098' },
];

const seedUsers = async () => {
  console.log('Starting seed process...');
  const donorProfiles: Array<{ seed: any; profile: any }> = [];

  for (const userData of testUsers) {
    try {
      const { data: existingUserData } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingUserData?.users.find((user) => user.email === userData.email);
      const existingProfile = existingAuthUser ? await kv.get(`user:${existingAuthUser.id}`) : null;

      if (existingProfile) {
        console.log(`User ${userData.email} already exists, skipping...`);
        if (existingProfile.role === 'donor') donorProfiles.push({ seed: userData, profile: existingProfile });
        continue;
      }

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

      const userProfile = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        bloodType: userData.tipo_sanguineo || null,
        tipo_sanguineo: userData.tipo_sanguineo || null,
        phone: userData.phone || null,
        cpf: userData.cpf || null,
        sexo: userData.sexo || null,
        data_nasc: userData.data_nasc || null,
        cidade: userData.cidade || null,
        uf: userData.uf || null,
        status: userData.status ?? 1,
        donationCount: userData.donationCount || (userData.role === 'donor' ? 0 : undefined),
        lastDonation: userData.lastDonation || null,
        hemocenterId: userData.hemocenterId || null,
        hemocentroName: userData.hemocentroName || null,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`user:${authData.user.id}`, userProfile);
      console.log(`Created user: ${userData.email} (${userData.role})`);
      if (userData.role === 'donor') donorProfiles.push({ seed: userData, profile: userProfile });
    } catch (error) {
      console.error(`Error processing user ${userData.email}:`, error);
    }
  }

  for (const donor of donorProfiles) {
    try {
      const { data: existingDonation, error: checkError } = await supabaseAdmin
        .from('doacoes')
        .select('id')
        .eq('doador_id', donor.profile.id)
        .eq('hemocentro_id', donor.seed.hemocenterId)
        .limit(1);

      if (checkError) {
        console.error(`Error checking donation for ${donor.profile.email}:`, checkError.message);
        continue;
      }

      if (existingDonation && existingDonation.length > 0) continue;

      const { error: insertDonationError } = await supabaseAdmin
        .from('doacoes')
        .insert({
          doador_id: donor.profile.id,
          hemocentro_id: donor.seed.hemocenterId,
          data_hora_doacao: `${donor.seed.lastDonation || '2026-05-01'} 09:00:00`,
          tipo_sangue: donor.seed.tipo_sanguineo || 'O+',
          quantidade: 450,
        });

      if (insertDonationError) {
        console.error(`Error inserting donation for ${donor.profile.email}:`, insertDonationError.message);
      }
    } catch (error) {
      console.error(`Error processing donation for ${donor.profile.email}:`, error);
    }
  }

  console.log('Seed process completed!');
};

if (import.meta.main) {
  await seedUsers();
}

export { seedUsers };
