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
    const { email, password, name, role = 'donor', bloodType, phone, cpf, hemocenterId, hemocentroName } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return c.json({ error: 'Email, senha e nome são obrigatórios' }, 400);
    }

    // Validate role
    const validRoles = ['donor', 'staff', 'director', 'admin'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Tipo de usuário inválido' }, 400);
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

// Sign in endpoint
app.post("/make-server-f9f63502/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios' }, 400);
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Auth error during signin: ${error.message}`);
      return c.json({ error: 'Email ou senha inválidos' }, 401);
    }

    // Get user profile from KV store
    const userId = data.user.id;
    const userProfile = await kv.get(`user:${userId}`);

    if (!userProfile) {
      console.log(`User profile not found for user: ${userId}`);
      return c.json({ error: 'Perfil de usuário não encontrado' }, 404);
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
      return c.json({ error: 'Token não fornecido' }, 401);
    }

    // Verify token and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`Auth error getting user: ${error?.message}`);
      return c.json({ error: 'Token inválido ou expirado' }, 401);
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${user.id}`);

    if (!userProfile) {
      return c.json({ error: 'Perfil de usuário não encontrado' }, 404);
    }

    return c.json({ user: userProfile });

  } catch (error) {
    console.log(`Get user error: ${error}`);
    return c.json({ error: 'Erro ao buscar usuário' }, 500);
  }
});

// Update user profile endpoint
app.put("/make-server-f9f63502/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Token não fornecido' }, 401);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Token inválido ou expirado' }, 401);
    }

    const body = await c.req.json();
    const { name, bloodType, phone, cpf } = body;

    // Get current profile
    const currentProfile = await kv.get(`user:${user.id}`);

    if (!currentProfile) {
      return c.json({ error: 'Perfil não encontrado' }, 404);
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
      return c.json({ error: 'Email é obrigatório' }, 400);
    }

    // Find user by email (search in KV store)
    const allUsers = await kv.getByPrefix('user:');
    const user = allUsers.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return c.json({ 
        message: 'Se o email existir, você receberá um código de recuperação.',
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
      "Recuperação de Senha - DoaVida",
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
            <h1 class="logo">🩸 DoaVida</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Sistema de Doação de Sangue</p>
          </div>
          
          <div class="content">
            <h2 style="color: #dc2626; margin-top: 0;">Recuperação de Senha</h2>
            <p>Olá, <strong>${user.name}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta DoaVida.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Seu código de recuperação:</p>
              <div class="code">${resetCode}</div>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">Válido por 15 minutos</p>
            </div>
            
            <p><strong>Como usar o código:</strong></p>
            <ol style="padding-left: 20px;">
              <li>Acesse a página de redefinição de senha</li>
              <li>Insira o código acima</li>
              <li>Crie sua nova senha</li>
            </ol>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Se você não solicitou essa recuperação, ignore este email e sua senha permanecerá inalterada.
            </div>
            
            <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe DoaVida</strong></p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; 2026 DoaVida - Salvando vidas através da doação de sangue</p>
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
        message: 'Código de recuperação gerado. (Email não configurado - modo desenvolvimento)',
        codeForDev: resetCode,
        email: email,
        emailSent: false,
        emailError: emailResponse.error,
      });
    }

    return c.json({ 
      message: 'Código de recuperação enviado para o email.',
      codeForDev: resetCode, // Keep for development
      email: email,
      emailSent: true,
    });

  } catch (error) {
    console.log(`Forgot password error: ${error}`);
    return c.json({ error: 'Erro ao processar solicitação' }, 500);
  }
});

// Verify reset code and change password
app.post("/make-server-f9f63502/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return c.json({ error: 'Email, código e nova senha são obrigatórios' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, 400);
    }

    // Get reset code from KV
    const resetData = await kv.get(`reset:${email}`);

    if (!resetData) {
      return c.json({ error: 'Código inválido ou expirado' }, 400);
    }

    // Check if code matches
    if (resetData.code !== code) {
      return c.json({ error: 'Código incorreto' }, 400);
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(resetData.expiresAt);
    if (now > expiresAt) {
      await kv.del(`reset:${email}`);
      return c.json({ error: 'Código expirado. Solicite um novo código.' }, 400);
    }

    // Check if code was already used
    if (resetData.used) {
      return c.json({ error: 'Código já foi utilizado' }, 400);
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
      message: 'Senha alterada com sucesso! Você pode fazer login com a nova senha.',
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
      {
        email: 'doador@example.com',
        password: 'doador123',
        name: 'João Silva',
        role: 'donor',
        bloodType: 'O+',
        phone: '(11) 98765-4321',
        cpf: '123.456.789-00',
      },
      {
        email: 'funcionario@hemocentro.com',
        password: 'funcionario123',
        name: 'Maria Santos',
        role: 'staff',
        phone: '(11) 98765-4322',
        hemocenterId: 'hemo-001',
        hemocentroName: 'Hemocentro São Paulo',
      },
      {
        email: 'diretor@hemocentro.com',
        password: 'diretor123',
        name: 'Carlos Oliveira',
        role: 'director',
        phone: '(11) 98765-4323',
        hemocenterId: 'hemo-001',
        hemocentroName: 'Hemocentro São Paulo',
      },
      {
        email: 'admin@doavida.com',
        password: 'admin123',
        name: 'Ana Costa',
        role: 'admin',
        phone: '(11) 98765-4324',
      },
    ];

    const createdUsers = [];
    const errors = [];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const allUsers = await kv.getByPrefix('user:');
        const existingUser = allUsers.find((u: any) => u.email === userData.email);
        
        if (existingUser) {
          console.log(`User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Create user in Supabase Auth
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
          console.log(`Error creating user ${userData.email}: ${authError.message}`);
          errors.push({ email: userData.email, error: authError.message });
          continue;
        }

        // Store user profile in KV store
        const userProfile = {
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          bloodType: userData.bloodType || null,
          phone: userData.phone || null,
          cpf: userData.cpf || null,
          donationCount: userData.role === 'donor' ? 0 : undefined,
          lastDonation: null,
          hemocenterId: userData.hemocenterId || null,
          hemocentroName: userData.hemocentroName || null,
          createdAt: new Date().toISOString(),
        };

        await kv.set(`user:${authData.user.id}`, userProfile);
        createdUsers.push({ email: userData.email, role: userData.role });

      } catch (error) {
        console.log(`Error processing user ${userData.email}: ${error}`);
        errors.push({ email: userData.email, error: String(error) });
      }
    }

    return c.json({
      message: 'Seed completed',
      created: createdUsers,
      errors: errors,
      total: testUsers.length,
    });

  } catch (error) {
    console.log(`Seed error: ${error}`);
    return c.json({ error: 'Erro ao criar usuários de teste' }, 500);
  }
});

Deno.serve(app.fetch);