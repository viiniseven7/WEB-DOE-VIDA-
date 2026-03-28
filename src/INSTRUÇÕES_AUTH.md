# 🩸 DoaVida - Sistema de Autenticação

## 📋 Visão Geral

Sistema completo de autenticação integrado com **Supabase** para o aplicativo DoaVida, oferecendo login, cadastro, recuperação de senha e gestão de usuários com 4 tipos de perfis distintos.

## 🔐 Tipos de Usuários

### 1. **Doador** (donor)
- Pode agendar e reagendar doações
- Visualiza histórico de doações
- Acessa informações sobre elegibilidade
- Dashboard personalizado para acompanhamento

### 2. **Funcionário do Hemocentro** (staff)
- Confirma doações realizadas
- Gerencia estoque de sangue
- Visualiza agenda diária do hemocentro
- Acesso restrito ao seu hemocentro

### 3. **Diretor do Hemocentro** (director)
- Acesso administrativo ao seu hemocentro
- Visualiza relatórios e estatísticas
- Gerencia equipe do hemocentro
- Acesso limitado ao seu hemocentro

### 4. **Administrador Global** (admin)
- Acesso global a todos os hemocentros
- Cria grupos de permissões
- Gerencia campanhas de email/WhatsApp
- Controle total do sistema

---

## 🚀 Como Usar

### **Primeira Execução - Criar Usuários de Teste**

1. Acesse a página de **Login** (`/login`)
2. Clique no botão **"Criar Usuários de Teste"** (ícone de banco de dados)
3. Aguarde a confirmação de que os usuários foram criados
4. Agora você pode fazer login com as credenciais abaixo

### **Credenciais de Teste**

#### 👤 Doador
```
Email: doador@example.com
Senha: doador123
```

#### 🏥 Funcionário
```
Email: funcionario@hemocentro.com
Senha: funcionario123
```

#### 👔 Diretor
```
Email: diretor@hemocentro.com
Senha: diretor123
```

#### 👨‍💼 Administrador
```
Email: admin@doavida.com
Senha: admin123
```

---

## 📝 Cadastro de Novos Usuários

### **Via Interface**

1. Acesse a página de **Cadastro** (`/signup`)
2. Preencha os campos obrigatórios:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Confirmar senha
3. Campos opcionais:
   - Telefone
   - CPF
   - Tipo sanguíneo
4. Clique em **"Criar Conta"**
5. Após o sucesso, você será redirecionado para o login

### **Campos por Tipo de Usuário**

#### Doador (padrão)
- ✅ Nome, Email, Senha (obrigatórios)
- Telefone, CPF, Tipo sanguíneo (opcionais)

#### Funcionário/Diretor
- ✅ Nome, Email, Senha (obrigatórios)
- Telefone (opcional)
- `hemocenterId` e `hemocentroName` (definidos pelo admin)

#### Administrador
- ✅ Nome, Email, Senha (obrigatórios)
- Telefone (opcional)

---

## 🔄 Fluxo de Autenticação

### **Login**
1. Usuário insere email e senha
2. Sistema valida credenciais no Supabase Auth
3. Busca perfil do usuário no KV Store
4. Retorna token de acesso (JWT)
5. Armazena token no localStorage
6. Redireciona para dashboard apropriado

### **Proteção de Rotas**
- Rotas de dashboard exigem autenticação
- Usuários são redirecionados automaticamente para seu dashboard correto
- Tokens expirados forçam novo login
- Sessões persistem entre recarregamentos da página

### **Logout**
- Remove tokens do localStorage
- Limpa estado do usuário
- Redireciona para página inicial

---

## 🔑 Recuperação de Senha

### **Como Recuperar Senha**

1. Na página de **Login**, clique em **"Esqueci a senha"**
2. Insira seu **email cadastrado**
3. Clique em **"Enviar Código"**
4. Um código de 6 dígitos será gerado (exibido na tela em modo desenvolvimento)
5. Clique em **"Continuar para Redefinir Senha"**
6. Insira o **código** e sua **nova senha**
7. Confirme a nova senha e clique em **"Redefinir Senha"**

### **Modo Desenvolvimento**

Como não temos servidor de email configurado, o código é exibido diretamente na tela. Em produção, seria enviado por email.

### **Regras de Segurança**

- ✅ Código de 6 dígitos aleatórios
- ✅ Válido por 15 minutos
- ✅ Uso único (não pode ser reutilizado)
- ✅ Senha mínima de 6 caracteres

📖 **Documentação completa**: Ver arquivo `/RECUPERAÇÃO_DE_SENHA.md`

---

## 🛠️ Estrutura Técnica

### **Backend (Supabase Edge Functions)**

#### Rotas disponíveis:

```typescript
POST /make-server-f9f63502/auth/signup
// Cria novo usuário

POST /make-server-f9f63502/auth/signin
// Autentica usuário

GET /make-server-f9f63502/auth/me
// Retorna usuário atual (requer token)

PUT /make-server-f9f63502/auth/profile
// Atualiza perfil do usuário (requer token)

POST /make-server-f9f63502/auth/forgot-password
// Solicita código de recuperação de senha

POST /make-server-f9f63502/auth/reset-password
// Redefine senha usando código

POST /make-server-f9f63502/seed
// Cria usuários de teste (desenvolvimento)
```

### **Armazenamento**

- **Supabase Auth**: Gerencia autenticação e senhas (criptografadas)
- **KV Store**: Armazena perfis completos dos usuários
- **LocalStorage**: Tokens de acesso (frontend)

### **Segurança**

- ✅ Senhas criptografadas com bcrypt (Supabase)
- ✅ Tokens JWT para autenticação
- ✅ Validação de roles no backend
- ✅ CORS configurado corretamente
- ✅ Proteção de rotas sensíveis
- ✅ Service Role Key nunca exposta ao frontend

---

## 📊 Estrutura de Dados do Usuário

```typescript
interface User {
  id: string;                    // UUID do Supabase
  email: string;                 // Email único
  name: string;                  // Nome completo
  role: UserRole;                // 'donor' | 'staff' | 'director' | 'admin'
  
  // Campos opcionais
  bloodType?: string;            // Tipo sanguíneo (doadores)
  phone?: string;                // Telefone
  cpf?: string;                  // CPF (doadores)
  donationCount?: number;        // Contador de doações (doadores)
  lastDonation?: string;         // Data da última doação (doadores)
  hemocenterId?: string;         // ID do hemocentro (staff/director)
  hemocentroName?: string;       // Nome do hemocentro (staff/director)
  
  // Metadados
  createdAt: string;             // Data de criação
  updatedAt?: string;            // Data de última atualização
}
```

---

## 🎯 Próximos Passos

### **Funcionalidades a Implementar**

1. ~~**Recuperação de Senha**~~ ✅ **IMPLEMENTADO**
   - ✅ Geração de código de 6 dígitos
   - ✅ Validação e expiração (15 minutos)
   - ✅ Redefinição de senha segura
   - 🔜 Envio de email real (requer configuração SMTP)

2. **Verificação de Email**
   - Confirmar email após cadastro
   - Reenvio de email de confirmação

3. **Login Social**
   - Google OAuth
   - Facebook OAuth

4. **Autenticação de Dois Fatores (2FA)**
   - SMS ou app autenticador
   - Backup codes

5. **Gestão de Sessões**
   - Listar dispositivos ativos
   - Desconectar de outros dispositivos

---

## ⚠️ Notas Importantes

- **Ambiente de Desenvolvimento**: Este sistema está configurado para desenvolvimento/prototipagem
- **Email Confirmação**: Desabilitado (auto-confirm) pois não há servidor de email configurado
- **Dados Sensíveis**: Não use dados reais em produção sem configurar corretamente segurança adicional
- **HTTPS**: Em produção, sempre use HTTPS
- **Rate Limiting**: Adicione proteção contra força bruta em produção

---

## 🐛 Troubleshooting

### **Erro: "Email ou senha inválidos"**
- Verifique se os usuários de teste foram criados (botão "Criar Usuários de Teste")
- Confirme que está usando as credenciais corretas
- Veja os logs do console para mais detalhes

### **Erro: "Perfil de usuário não encontrado"**
- O usuário existe no Supabase Auth mas não no KV Store
- Execute o seed novamente ou crie um novo usuário

### **Redirecionamento não funciona**
- Limpe o localStorage e sessionStorage
- Faça logout e login novamente
- Verifique os logs do console

### **Sessão expira rapidamente**
- Tokens JWT têm validade padrão do Supabase (1 hora)
- Implemente refresh token se necessário

---

## 📞 Suporte

Para questões técnicas ou bugs, verifique:
1. Console do navegador (erros JavaScript)
2. Logs do Supabase Edge Functions
3. Network tab (requisições HTTP)

---

✨ **Sistema implementado com Supabase, React, TypeScript e Tailwind CSS**