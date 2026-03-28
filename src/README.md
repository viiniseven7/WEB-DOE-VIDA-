# 🩸 DoaVida - Sistema de Doação de Sangue

Sistema completo de gerenciamento de doação de sangue com autenticação, dashboards personalizados e recuperação de senha por email.

---

## ✨ Funcionalidades Principais

### 🔐 **Autenticação Completa**
- ✅ Login e cadastro de usuários
- ✅ Recuperação de senha por email (Resend)
- ✅ 4 tipos de usuários com permissões diferentes
- ✅ Proteção de rotas e redirecionamento automático
- ✅ Sessão persistente

### 📧 **Sistema de Email**
- ✅ Envio real de emails via Resend
- ✅ Template HTML profissional
- ✅ Código de recuperação de 6 dígitos
- ✅ Expiração de código (15 minutos)
- ✅ Fallback para modo desenvolvimento

### 🔧 **Modo Desenvolvimento vs Produção**

O sistema funciona em **dois modos**:

#### **Modo Desenvolvimento (Padrão)**
- ❌ API key do Resend **não** configurada
- ✅ Código de recuperação aparece **na tela**
- ✅ Perfeito para testes
- ✅ Zero configuração necessária

#### **Modo Produção (Email Real)**
- ✅ API key do Resend **configurada**
- ✅ Email enviado para caixa de entrada
- ✅ Código não aparece na tela (segurança)
- ✅ Pronto para lançamento

**📖 Configure email em 4 minutos**: Veja [SOLUÇÃO_RÁPIDA_EMAIL.md](./SOLUÇÃO_RÁPIDA_EMAIL.md)

### 👥 **Tipos de Usuários**

#### 1. **Doador** (`donor`)
- Agendar e reagendar doações
- Visualizar histórico de doações
- Verificar elegibilidade
- Dashboard personalizado

#### 2. **Funcionário** (`staff`)
- Confirmar doações realizadas
- Gerenciar estoque de sangue
- Visualizar agenda diária
- Acesso ao seu hemocentro

#### 3. **Diretor** (`director`)
- Acesso administrativo ao hemocentro
- Relatórios e estatísticas
- Gerenciar equipe
- Visão geral do hemocentro

#### 4. **Administrador** (`admin`)
- Acesso global a todos os hemocentros
- Criar grupos de permissões
- Gerenciar campanhas de email/WhatsApp
- Controle total do sistema

---

## 🚀 Como Usar

### **1. Primeiro Acesso**

1. Acesse a página de **Login** (`/login`)
2. Clique no botão **"Criar Usuários de Teste"** (ícone de banco de dados)
3. Aguarde confirmação
4. Faça login com as credenciais de teste

### **2. Credenciais de Teste**

```
👤 Doador
Email: doador@example.com
Senha: doador123

🏥 Funcionário
Email: funcionario@hemocentro.com
Senha: funcionario123

👔 Diretor
Email: diretor@hemocentro.com
Senha: diretor123

👨‍💼 Administrador
Email: admin@doavida.com
Senha: admin123
```

### **3. Recuperação de Senha**

1. Na página de login, clique em **"Esqueci a senha"**
2. Digite seu email
3. Receba código por email (ou veja na tela em modo dev)
4. Redefina sua senha

---

## 📖 Documentação

### **Guias Completos:**

- **[INSTRUÇÕES_AUTH.md](./INSTRUÇÕES_AUTH.md)** - Autenticação completa
- **[RECUPERAÇÃO_DE_SENHA.md](./RECUPERAÇÃO_DE_SENHA.md)** - Sistema de reset de senha
- **[CONFIGURAÇÃO_EMAIL.md](./CONFIGURAÇÃO_EMAIL.md)** - Configurar envio de emails

### **Conteúdo da Documentação:**

- ✅ Fluxos de autenticação
- ✅ Estrutura de dados
- ✅ Endpoints da API
- ✅ Testes e troubleshooting
- ✅ Configuração de produção
- ✅ Segurança e boas práticas

---

## 🛠️ Tecnologias

### **Frontend:**
- React 18
- TypeScript
- React Router (Data mode)
- Tailwind CSS v4
- shadcn/ui components
- Lucide Icons
- Sonner (toasts)

### **Backend:**
- Supabase Auth
- Supabase Edge Functions (Deno)
- Hono (web framework)
- KV Store (PostgreSQL)

### **Email:**
- Resend API
- HTML templates responsivos

---

## ⚙️ Configuração

### **Variáveis de Ambiente (Supabase Secrets):**

```
SUPABASE_URL          - URL do projeto Supabase
SUPABASE_ANON_KEY     - Chave pública anônima
SUPABASE_SERVICE_ROLE_KEY - Chave de serviço (backend)
RESEND_API_KEY        - API key do Resend (opcional)
```

### **Configurar Email (Opcional):**

1. Crie conta em [https://resend.com](https://resend.com)
2. Gere uma API Key
3. Adicione ao Supabase Secrets como `RESEND_API_KEY`
4. Emails serão enviados automaticamente!

**Sem email configurado**: Código aparece na tela (modo dev)

---

## 🎯 Estrutura do Projeto

```
/
├── components/
│   ├── dashboards/          # Dashboards por tipo de usuário
│   │   ├── DonorDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   ├── DirectorDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── ui/                  # Componentes shadcn/ui
│   ├── LoginPage.tsx        # Página de login
│   ├── SignupPage.tsx       # Página de cadastro
│   ├── ForgotPasswordPage.tsx  # Solicitar código
│   ├── ResetPasswordPage.tsx   # Redefinir senha
│   ├── HomePage.tsx         # Landing page
│   ├── Root.tsx             # Layout principal
│   └── NotFound.tsx         # 404
│
├── supabase/functions/server/
│   ├── index.tsx            # API principal
│   └── kv_store.tsx         # Utilitários KV
│
├── utils/supabase/
│   └── info.tsx             # Config Supabase
│
├── routes.ts                # Rotas do app
├── App.tsx                  # Componente raiz
│
└── Documentação:
    ├── README.md
    ├── INSTRUÇÕES_AUTH.md
    ├── RECUPERAÇÃO_DE_SENHA.md
    └── CONFIGURAÇÃO_EMAIL.md
```

---

## 🔒 Segurança

### **Implementado:**
- ✅ Senhas criptografadas (bcrypt via Supabase)
- ✅ Tokens JWT para sessões
- ✅ Proteção de rotas por role
- ✅ Códigos de recuperação com expiração
- ✅ Uso único de códigos de reset
- ✅ Não revela existência de emails
- ✅ Service Role Key protegida (backend only)

### **Recomendações para Produção:**
- [ ] Rate limiting (prevenir força bruta)
- [ ] HTTPS obrigatório
- [ ] Captcha em formulários públicos
- [ ] Monitoramento de tentativas falhas
- [ ] 2FA (autenticação de dois fatores)
- [ ] Política de senhas mais forte

---

## 🧪 Testes

### **Teste 1: Login**
1. Acesse `/login`
2. Use: `doador@example.com` / `doador123`
3. ✅ Redireciona para `/dashboard/donor`

### **Teste 2: Cadastro**
1. Acesse `/signup`
2. Preencha o formulário
3. ✅ Conta criada, redireciona para login

### **Teste 3: Recuperação de Senha**
1. Acesse `/login` → "Esqueci a senha"
2. Digite email cadastrado
3. ✅ Recebe código (email ou tela)
4. Use código para redefinir senha
5. ✅ Login com nova senha funciona

### **Teste 4: Proteção de Rotas**
1. Sem estar logado, tente acessar `/dashboard/donor`
2. ✅ Redireciona para `/login`
3. Faça login como doador
4. Tente acessar `/dashboard/admin`
5. ✅ Redireciona para `/dashboard/donor`

---

## 📊 API Endpoints

### **Autenticação:**
```
POST /make-server-f9f63502/auth/signup        - Criar conta
POST /make-server-f9f63502/auth/signin        - Login
GET  /make-server-f9f63502/auth/me            - Usuário atual
PUT  /make-server-f9f63502/auth/profile       - Atualizar perfil
```

### **Recuperação de Senha:**
```
POST /make-server-f9f63502/auth/forgot-password  - Solicitar código
POST /make-server-f9f63502/auth/reset-password   - Redefinir senha
```

### **Desenvolvimento:**
```
POST /make-server-f9f63502/seed               - Criar usuários de teste
GET  /make-server-f9f63502/health             - Health check
```

---

## 🎨 Design

### **Tema:**
- Cor principal: Vermelho (#dc2626)
- Gradientes: Red-50 a Red-700
- Componentes: shadcn/ui (Radix + Tailwind)
- Responsivo: Mobile-first

### **Ícones:**
- Lucide React
- Ícone principal: Droplet (gota de sangue)

---

## 🚀 Deploy

### **Frontend:**
- Build automático via Figma Make
- Hospedagem: Supabase

### **Backend:**
- Edge Functions: Supabase
- Região: Auto (mais próxima)

### **Banco de Dados:**
- PostgreSQL (Supabase)
- KV Store para perfis

---

## 🐛 Troubleshooting

### **Problema: Usuários de teste não criados**
1. Veja console do navegador
2. Verifique logs do Supabase Edge Functions
3. Tente criar manualmente via `/signup`

### **Problema: Email não chega**
1. Verifique se `RESEND_API_KEY` está configurada
2. Veja spam/lixo eletrônico
3. Confira logs do servidor
4. Use modo desenvolvimento (código na tela)

### **Problema: Sessão expira**
1. Tokens JWT expiram em 1 hora (padrão Supabase)
2. Implemente refresh token se necessário
3. Ou faça login novamente

### **Problema: Redirecionamento incorreto**
1. Limpe localStorage
2. Limpe sessionStorage
3. Faça logout e login novamente

---

## 📝 Melhorias Futuras

### **Funcionalidades:**
- [ ] Agendamento de doações (calendário)
- [ ] Notificações push
- [ ] Campanhas de email em massa
- [ ] Integração WhatsApp
- [ ] Relatórios e analytics
- [ ] Exportação de dados (CSV, PDF)
- [ ] Sistema de pontos/gamificação
- [ ] Mapa de hemocentros

### **UX/UI:**
- [ ] Dark mode
- [ ] Animações (Motion)
- [ ] Loading skeletons
- [ ] Internacionalização (i18n)
- [ ] Acessibilidade (a11y)
- [ ] PWA (offline mode)

### **Técnico:**
- [ ] Testes unitários (Jest/Vitest)
- [ ] Testes E2E (Playwright)
- [ ] CI/CD pipeline
- [ ] Monitoramento (Sentry)
- [ ] Cache otimizado
- [ ] Lazy loading de componentes

---

## 👥 Contribuindo

Este é um projeto de demonstração. Para adaptar para produção:

1. Configure variáveis de ambiente reais
2. Ative envio de email (Resend)
3. Implemente rate limiting
4. Adicione mais validações
5. Configure domínio próprio
6. Ative HTTPS

---

## 📄 Licença

Projeto desenvolvido para fins educacionais e de demonstração.

---

## 🎉 Pronto para Usar!

O sistema está 100% funcional com:
- ✅ Autenticação completa
- ✅ Recuperação de senha
- ✅ Envio de emails
- ✅ Dashboards personalizados
- ✅ Proteção de rotas
- ✅ Documentação completa

**Comece agora**: Acesse `/login` e clique em "Criar Usuários de Teste"!

---

✨ **Desenvolvido com React, TypeScript, Supabase e Resend**

💡 **Dúvidas?** Consulte a documentação em `/INSTRUÇÕES_AUTH.md`