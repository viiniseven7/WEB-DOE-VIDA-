import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// CORS and logging middleware
app.use("*", cors());
app.use("*", logger(console.log));

// Initialize Supabase Admin Client (with service role key)
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Helper function to send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "DoaVida <onboarding@resend.dev>", // Use verified domain in production
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Email send error: ${JSON.stringify(data)}`);
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log(`Email sent successfully to ${to}: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error(`Email send exception: ${error}`);
    return { success: false, error: String(error) };
  }
}

// Health check endpoint
app.get("/make-server-f9f63502/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-f9f63502/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      email, 
      password, 
      name, 
      role = 'donor', 
      bloodType, 
      phone, 
      cpf, 
      hemocenterId, 
      hemocentroName,
      sexo,
      data_nasc,
      cep,
      rua,
      numero,
      cidade,
      uf,
      status = 1
    } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return c.json({ error: 'Email, senha e nome sÃƒÂ£o obrigatÃƒÂ³rios' }, 400);
    }

    // Validate role
    const validRoles = ['donor', 'staff', 'director', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Tipo de usuÃƒÂ¡rio invÃƒÂ¡lido' }, 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server configured
      user_metadata: {
        name,
        role,
      }
    });

    if (authError) {
      console.log(`Auth error during signup: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userId = authData.user.id;
    const userProfile = {
      id: userId,
      email,
      name,
      role,
      bloodType: bloodType || null,
      phone: phone || null,
      cpf: cpf || null,
      sexo: sexo || null,
      data_nasc: data_nasc || null,
      cep: cep || null,
      rua: rua || null,
      numero: numero || null,
      cidade: cidade || null,
      uf: uf || null,
      status: Number(status),
      donationCount: role === 'donor' ? 0 : undefined,
      lastDonation: null,
      hemocenterId: hemocenterId || null,
      hemocentroName: hemocentroName || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, userProfile);

    // Return user data without password
    return c.json({
      user: userProfile,
      message: 'Cadastro realizado com sucesso!',
    }, 201);

  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: 'Erro ao criar conta. Tente novamente.' }, 500);
  }
});

// Get users (donor search) endpoint
app.get("/make-server-f9f63502/users", async (c) => {
  try {
    // 1. Authenticate and get staff hemocentro
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'NÃƒÂ£o autorizado. Token nÃƒÂ£o fornecido.' }, 401);
    }

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !authUser) {
      return c.json({ error: 'SessÃƒÂ£o invÃƒÂ¡lida ou expirada.' }, 401);
    }

    const staffProfile = await kv.get(`user:${authUser.id}`);
    if (!staffProfile) {
      return c.json({ error: 'Perfil de funcionÃƒÂ¡rio nÃƒÂ£o encontrado.' }, 404);
    }

    const staffHemocenterId = staffProfile.hemocenterId || staffProfile.hemocentro_id;
    const isGlobalAdmin = staffProfile.role === 'admin' && !staffHemocenterId;

    const role = c.req.query('role') || 'donor';
    const searchTerm = c.req.query('q'); // Nome ou CPF
    const bloodType = c.req.query('bloodType');
    const gender = c.req.query('gender');
    const status = c.req.query('status');
    const city = c.req.query('city');
    const minAge = c.req.query('minAge');
    const maxAge = c.req.query('maxAge');
    const lastDonationSince = c.req.query('lastDonationSince');
    const lastDonationUntil = c.req.query('lastDonationUntil');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');

    // 2. Fetch donors from the specific hemocentro (via doacoes table)
    let authorizedDonorIds: Set<string> | null = null;

    if (!isGlobalAdmin) {
      if (!staffHemocenterId) {
        return c.json({ error: 'FuncionÃƒÂ¡rio nÃƒÂ£o vinculado a um hemocentro.' }, 403);
      }

      // Query the 'doacoes' table to find donors who donated at this hemocentro
      // Using 'doador_id' as the donor field to avoid confusion with staff/user_id
      const { data: donations, error: donationsError } = await supabaseAdmin
        .from('doacoes')
        .select('doador_id')
        .eq('hemocentro_id', staffHemocenterId);

      if (donationsError) {
        console.error(`Error fetching donations: ${donationsError.message}`);
        // If the table doesn't exist yet or other error, we return empty or handle gracefully
        // For now, assume it exists as per requirements
        authorizedDonorIds = new Set();
      } else {
        authorizedDonorIds = new Set(donations.map(d => String(d.doador_id)));
      }
    }

    // 3. Get all users and filter
    let allUsers = await kv.getByPrefix('user:');
    
    // Initial filter by role and (if not admin) by donation history at staff hemocentro
    let filteredUsers = allUsers.filter((u: any) => {
      // Must match the requested role (usually 'donor')
      if (u.role !== role) return false;

      // If staff/director, must have donated at their hemocentro
      // If the user is not a global admin, they must have a valid authorizedDonorIds list.
      if (!isGlobalAdmin) {
        if (!authorizedDonorIds || authorizedDonorIds.size === 0) {
          return false;
        }
        if (!authorizedDonorIds.has(String(u.id))) {
          return false;
        }
      }

      return true;
    });

    // 4. Apply Dynamic Filters (Query Params)
    
    // Filter by Search Term (Nome ou CPF)
    if (searchTerm) {
      const cleanSearch = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const cleanCpfSearch = searchTerm.replace(/\D/g, '');
      
      filteredUsers = filteredUsers.filter((u: any) => {
        const userName = (u.name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const nameMatch = userName.includes(cleanSearch);
        const cpfMatch = u.cpf?.replace(/\D/g, '').includes(cleanCpfSearch);
        return nameMatch || (cleanCpfSearch && cpfMatch);
      });
    }

    // Filter by Blood Type
    if (bloodType && bloodType !== 'todos' && bloodType !== '') {
      filteredUsers = filteredUsers.filter((u: any) => u.bloodType?.toUpperCase() === bloodType.toUpperCase());
    }

    // Filter by Gender
    if (gender && gender !== 'todos' && gender !== '') {
      const genderMap: Record<string, string[]> = {
        male: ['male', 'masculino', 'm'],
        female: ['female', 'feminino', 'f'],
        other: ['other', 'outro', 'o'],
      };
      
      const allowedGenders = genderMap[gender] || [gender];
      filteredUsers = filteredUsers.filter((u: any) => {
        const userGender = (u.sexo || '').toLowerCase();
        return allowedGenders.includes(userGender);
      });
    }

    // Filter by Status
    if (status !== undefined && status !== 'todos' && status !== '') {
      filteredUsers = filteredUsers.filter((u: any) => String(u.status) === String(status));
    }

    // Filter by City
    if (city && city !== '') {
      const cleanCity = city.toLowerCase().trim();
      filteredUsers = filteredUsers.filter((u: any) => u.cidade?.toLowerCase().includes(cleanCity));
    }

    // Filter by Age Range
    if (minAge || maxAge) {
      const now = new Date();
      filteredUsers = filteredUsers.filter((u: any) => {
        if (!u.data_nasc) return false;
        
        let birthDate;
        if (u.data_nasc.includes('/')) {
          const [d, m, y] = u.data_nasc.split('/');
          birthDate = new Date(`${y}-${m}-${d}`);
        } else {
          birthDate = new Date(u.data_nasc);
        }

        let age = now.getFullYear() - birthDate.getFullYear();
        const m = now.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;

        if (minAge && age < parseInt(minAge)) return false;
        if (maxAge && age > parseInt(maxAge)) return false;
        return true;
      });
    }

    // Filter by Last Donation Date
    if (lastDonationSince || lastDonationUntil) {
      filteredUsers = filteredUsers.filter((u: any) => {
        if (!u.lastDonation) return false;
        const lastDon = new Date(u.lastDonation);
        
        if (lastDonationSince && lastDon < new Date(lastDonationSince)) return false;
        if (lastDonationUntil && lastDon > new Date(lastDonationUntil)) return false;
        return true;
      });
    }

    // 5. Pagination and Response
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(start, start + limit);

    return c.json({
      data: paginatedUsers.map((u: any) => ({
        ...u,
        // Ensure required fields are present for the frontend
        hemocentroName: u.hemocentroName || staffProfile.hemocentroName || 'Hemocentro vinculado',
        lastDonation: u.lastDonation || 'Nenhuma doaÃƒÂ§ÃƒÂ£o registrada'
      })),
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.log(`Get users error: ${error}`);
    return c.json({ error: 'Erro ao buscar doadores. Tente novamente.' }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-f9f63502/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email e senha sÃƒÂ£o obrigatÃƒÂ³rios' }, 400);
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Auth error during signin: ${error.message}`);
      return c.json({ error: 'Email ou senha invÃƒÂ¡lidos' }, 401);
    }

    // Get user profile from KV store
    const userId = data.user.id;
    const userProfile = await kv.get(`user:${userId}`);

    if (!userProfile) {
      console.log(`User profile not found for user: ${userId}`);
      return c.json({ error: 'Perfil de usuÃƒÂ¡rio nÃƒÂ£o encontrado' }, 404);
    }

    return c.json({
      user: userProfile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      message: 'Login realizado com sucesso!',
    });

  } catch (error) {
    console.log(`Signin error: ${error}`);
    return c.json({ error: 'Erro ao fazer login. Tente novamente.' }, 500);
  }
});

// Get current user endpoint
app.get("/make-server-f9f63502/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Token nÃƒÂ£o fornecido' }, 401);
    }

    // Verify token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`Auth error getting user: ${error?.message}`);
      return c.json({ error: 'Token invÃƒÂ¡lido ou expirado' }, 401);
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${user.id}`);

    if (!userProfile) {
      return c.json({ error: 'Perfil de usuÃƒÂ¡rio nÃƒÂ£o encontrado' }, 404);
    }

    return c.json({ user: userProfile });

  } catch (error) {
    console.log(`Get user error: ${error}`);
    return c.json({ error: 'Erro ao buscar usuÃƒÂ¡rio' }, 500);
  }
});

// Update user profile endpoint
app.put("/make-server-f9f63502/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Token nÃƒÂ£o fornecido' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Token invÃƒÂ¡lido ou expirado' }, 401);
    }

    const body = await c.req.json();
    const { name, bloodType, phone, cpf } = body;

    // Get current profile
    const currentProfile = await kv.get(`user:${user.id}`);

    if (!currentProfile) {
      return c.json({ error: 'Perfil nÃƒÂ£o encontrado' }, 404);
    }

    // Update profile
    const updatedProfile = {
      ...currentProfile,
      name: name ?? currentProfile.name,
      bloodType: bloodType ?? currentProfile.bloodType,
      phone: phone ?? currentProfile.phone,
      cpf: cpf ?? currentProfile.cpf,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({
      user: updatedProfile,
      message: 'Perfil atualizado com sucesso!',
    });

  } catch (error) {
    console.log(`Update profile error: ${error}`);
    return c.json({ error: 'Erro ao atualizar perfil' }, 500);
  }
});

// Request password reset (generate code)
app.post("/make-server-f9f63502/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email ÃƒÂ© obrigatÃƒÂ³rio' }, 400);
    }

    // Find user by email (search in KV store)
    const allUsers = await kv.getByPrefix('user:');
    const user = allUsers.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return c.json({ 
        message: 'Se o email existir, vocÃƒÂª receberÃƒÂ¡ um cÃƒÂ³digo de recuperaÃƒÂ§ÃƒÂ£o.',
        codeForDev: null 
      });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code in KV
    await kv.set(`reset:${email}`, {
      code: resetCode,
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });

    // Send email with the code
    const emailResponse = await sendEmail(
      email,
      "RecuperaÃƒÂ§ÃƒÂ£o de Senha - DoaVida",
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { font-size: 28px; font-weight: bold; margin: 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
          .code { font-size: 36px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">Ã°Å¸Â©Â¸ DoaVida</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Sistema de DoaÃƒÂ§ÃƒÂ£o de Sangue</p>
          </div>
          
          <div class="content">
            <h2 style="color: #dc2626; margin-top: 0;">RecuperaÃƒÂ§ÃƒÂ£o de Senha</h2>
            <p>OlÃƒÂ¡, <strong>${user.name}</strong>!</p>
            <p>Recebemos uma solicitaÃƒÂ§ÃƒÂ£o para redefinir a senha da sua conta DoaVida.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Seu cÃƒÂ³digo de recuperaÃƒÂ§ÃƒÂ£o:</p>
              <div class="code">${resetCode}</div>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">VÃƒÂ¡lido por 15 minutos</p>
            </div>
            
            <p><strong>Como usar o cÃƒÂ³digo:</strong></p>
            <ol style="padding-left: 20px;">
              <li>Acesse a pÃƒÂ¡gina de redefiniÃƒÂ§ÃƒÂ£o de senha</li>
              <li>Insira o cÃƒÂ³digo acima</li>
              <li>Crie sua nova senha</li>
            </ol>
            
            <div class="warning">
              <strong>Ã¢Å¡Â Ã¯Â¸Â Importante:</strong> Se vocÃƒÂª nÃƒÂ£o solicitou essa recuperaÃƒÂ§ÃƒÂ£o, ignore este email e sua senha permanecerÃƒÂ¡ inalterada.
            </div>
            
            <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe DoaVida</strong></p>
          </div>
          
          <div class="footer">
            <p>Este ÃƒÂ© um email automÃƒÂ¡tico, por favor nÃƒÂ£o responda.</p>
            <p>&copy; 2026 DoaVida - Salvando vidas atravÃƒÂ©s da doaÃƒÂ§ÃƒÂ£o de sangue</p>
          </div>
        </div>
      </body>
      </html>
      `
    );

    // Return response with code (for development) and email status
    if (!emailResponse.success) {
      console.log(`Email failed but returning code for development: ${emailResponse.error}`);
      return c.json({ 
        message: 'CÃƒÂ³digo de recuperaÃƒÂ§ÃƒÂ£o gerado. (Email nÃƒÂ£o configurado - modo desenvolvimento)',
        codeForDev: resetCode,
        email: email,
        emailSent: false,
        emailError: emailResponse.error,
      });
    }

    return c.json({ 
      message: 'CÃƒÂ³digo de recuperaÃƒÂ§ÃƒÂ£o enviado para o email.',
      codeForDev: resetCode, // Keep for development
      email: email,
      emailSent: true,
    });

  } catch (error) {
    console.log(`Forgot password error: ${error}`);
    return c.json({ error: 'Erro ao processar solicitaÃƒÂ§ÃƒÂ£o' }, 500);
  }
});

// Verify reset code and change password
app.post("/make-server-f9f63502/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return c.json({ error: 'Email, cÃƒÂ³digo e nova senha sÃƒÂ£o obrigatÃƒÂ³rios' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'A senha deve ter no mÃƒÂ­nimo 6 caracteres' }, 400);
    }

    // Get reset code from KV
    const resetData = await kv.get(`reset:${email}`);

    if (!resetData) {
      return c.json({ error: 'CÃƒÂ³digo invÃƒÂ¡lido ou expirado' }, 400);
    }

    // Check if code matches
    if (resetData.code !== code) {
      return c.json({ error: 'CÃƒÂ³digo incorreto' }, 400);
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(resetData.expiresAt);
    if (now > expiresAt) {
      await kv.del(`reset:${email}`);
      return c.json({ error: 'CÃƒÂ³digo expirado. Solicite um novo cÃƒÂ³digo.' }, 400);
    }

    // Check if code was already used
    if (resetData.used) {
      return c.json({ error: 'CÃƒÂ³digo jÃƒÂ¡ foi utilizado' }, 400);
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetData.userId,
      { password: newPassword }
    );

    if (updateError) {
      console.log(`Error updating password: ${updateError.message}`);
      return c.json({ error: 'Erro ao atualizar senha' }, 500);
    }

    // Mark code as used
    await kv.set(`reset:${email}`, {
      ...resetData,
      used: true,
    });

    // Delete reset code after successful use (optional)
    setTimeout(() => kv.del(`reset:${email}`), 1000);

    return c.json({ 
      message: 'Senha alterada com sucesso! VocÃƒÂª pode fazer login com a nova senha.',
    });

  } catch (error) {
    console.log(`Reset password error: ${error}`);
    return c.json({ error: 'Erro ao redefinir senha' }, 500);
  }
});

// Seed test users endpoint
app.post("/make-server-f9f63502/seed", async (c) => {
  try {
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
      { email: 'funcionario@hemocentro.com', password: 'funcionario123', name: 'Maria Santos', role: 'staff', phone: '(11) 98765-4322', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
      { email: 'diretor@hemocentro.com', password: 'diretor123', name: 'Carlos Oliveira', role: 'director', phone: '(11) 98765-4323', hemocenterId: 'hemo-001', hemocentroName: 'Hemocentro Sao Paulo' },
      { email: 'admin@doavida.com', password: 'admin123', name: 'Ana Costa', role: 'admin', phone: '(11) 98765-4324' },
    ];

    const createdUsers = [];
    const errors = [];
    const donorProfiles = [];

    for (const userData of testUsers) {
      try {
        const allUsers = await kv.getByPrefix('user:');
        const existingUser = allUsers.find((u: any) => u.email === userData.email);

        if (existingUser) {
          console.log('User ' + userData.email + ' already exists, skipping...');
          if (existingUser.role === 'donor') donorProfiles.push({ seed: userData, profile: existingUser });
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
          console.log('Error creating user ' + userData.email + ': ' + authError.message);
          errors.push({ email: userData.email, error: authError.message });
          continue;
        }

        const userProfile = {
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          bloodType: (userData as any).tipo_sanguineo || userData.bloodType || null,
          tipo_sanguineo: (userData as any).tipo_sanguineo || userData.bloodType || null,
          phone: userData.phone || null,
          cpf: userData.cpf || null,
          sexo: (userData as any).sexo || null,
          data_nasc: (userData as any).data_nasc || null,
          cidade: (userData as any).cidade || null,
          uf: (userData as any).uf || null,
          status: (userData as any).status ?? 1,
          donationCount: (userData as any).donationCount || (userData.role === 'donor' ? 0 : undefined),
          lastDonation: (userData as any).lastDonation || null,
          hemocenterId: userData.hemocenterId || null,
          hemocentroName: userData.hemocentroName || null,
          createdAt: new Date().toISOString(),
        };

        await kv.set(`user:${authData.user.id}`, userProfile);
        createdUsers.push({ email: userData.email, role: userData.role });
        if (userData.role === 'donor') donorProfiles.push({ seed: userData, profile: userProfile });

      } catch (error) {
        console.log('Error processing user ' + userData.email + ': ' + String(error));
        errors.push({ email: userData.email, error: String(error) });
      }
    }

    let createdDonations = 0;

    for (const donor of donorProfiles) {
      try {
        const donorId = donor.profile.id;
        const hemocentroId = donor.seed.hemocenterId || donor.profile.hemocenterId;

        if (!donorId || !hemocentroId) continue;

        const { data: existingDonation, error: checkError } = await supabaseAdmin
          .from('doacoes')
          .select('id')
          .eq('doador_id', donorId)
          .eq('hemocentro_id', hemocentroId)
          .limit(1);

        if (checkError) {
          errors.push({ email: donor.profile.email, error: 'Erro ao verificar doacao: ' + checkError.message });
          continue;
        }

        if (existingDonation && existingDonation.length > 0) continue;

        const { error: insertDonationError } = await supabaseAdmin
          .from('doacoes')
          .insert({
            doador_id: donorId,
            hemocentro_id: hemocentroId,
            data_hora_doacao: (donor.seed.lastDonation || '2026-05-01') + ' 09:00:00',
            tipo_sangue: donor.seed.tipo_sanguineo || donor.profile.tipo_sanguineo || donor.profile.bloodType || 'O+',
            quantidade: 450,
          });

        if (insertDonationError) {
          errors.push({ email: donor.profile.email, error: 'Erro ao criar doacao: ' + insertDonationError.message });
          continue;
        }

        createdDonations += 1;
      } catch (error) {
        errors.push({ email: donor.profile.email, error: 'Erro ao processar doacao: ' + String(error) });
      }
    }

    return c.json({
      message: 'Seed completed',
      created: createdUsers,
      createdDonations,
      errors: errors,
      total: testUsers.length,
    });

  } catch (error) {
    console.log('Seed error: ' + String(error));
    return c.json({ error: 'Erro ao criar usuarios de teste' }, 500);
  }
});
Deno.serve(app.fetch);