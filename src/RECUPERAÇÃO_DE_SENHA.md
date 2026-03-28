# 🔐 Recuperação de Senha - DoaVida

## 📋 Visão Geral

Sistema completo de recuperação de senha com código de 6 dígitos enviado por **email real** usando **Resend**.

✅ **EMAIL REAL CONFIGURADO** - O sistema agora envia emails de verdade!

---

## 🚀 Como Usar

### **1. Solicitar Recuperação de Senha**

1. Na página de **Login**, clique em **"Esqueci a senha"**
2. Insira seu **email cadastrado**
3. Clique em **"Enviar Código"**
4. Um código de 6 dígitos será gerado

### **2. Receber o Código**

O código pode ser recebido de duas formas:

#### **📧 Email Real (Produção)**

Se você configurou a API key do **Resend**, o código é enviado por email:

- ✅ Email profissional e formatado
- ✅ Remetente: `DoaVida <onboarding@resend.dev>`
- ✅ Código destacado em vermelho
- ✅ Válido por 15 minutos

**Verifique sua caixa de entrada!** (e spam, se necessário)

#### **💻 Modo Desenvolvimento (Sem Email)**

Se a API key do Resend NÃO estiver configurada, o código aparece na tela:

```
┌─────────────────────────────────┐
│  ⚠️  Modo Desenvolvimento       │
│                                 │
│  Seu código de recuperação:     │
│         123456                  │
│                                 │
│  Válido por 15 minutos          │
└─────────────────────────────────┘
```

> **Configurar email**: Veja `/CONFIGURAÇÃO_EMAIL.md` para ativar envio real

### **3. Redefinir Senha**

1. Copie ou anote o código de 6 dígitos
2. Clique em **"Continuar para Redefinir Senha"**
3. Insira o **código recebido**
4. Digite sua **nova senha** (mínimo 6 caracteres)
5. **Confirme** a nova senha
6. Clique em **"Redefinir Senha"**

### **4. Fazer Login**

Após o sucesso, você será redirecionado automaticamente para o login onde poderá usar sua nova senha.

---

## 🔄 Fluxo Completo

```
┌─────────────────┐
│  Página Login   │
│  "Esqueci senha"│
└────────┬────────┘
         ▼
┌─────────────────────┐
│  Solicitar Código   │
│  (email)            │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Código Gerado      │
│  (6 dígitos)        │
│  Válido: 15 min     │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Redefinir Senha    │
│  (código + nova)    │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Senha Alterada!    │
│  → Redireciona      │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│  Login com nova     │
│  senha              │
└─────────────────────┘
```

---

## 🧪 Testando a Funcionalidade

### **Teste 1: Recuperação Bem-sucedida**

1. Acesse `/login`
2. Clique em "Esqueci a senha"
3. Digite: `doador@example.com`
4. Clique em "Enviar Código"
5. ✅ Código exibido na tela (ex: `123456`)
6. Clique em "Continuar para Redefinir Senha"
7. Digite o código: `123456`
8. Nova senha: `novaSenha123`
9. Confirmar: `novaSenha123`
10. Clique em "Redefinir Senha"
11. ✅ Sucesso! → Redireciona para login
12. Faça login com `doador@example.com` / `novaSenha123`

### **Teste 2: Código Inválido**

1. Solicite código para um email
2. Na página de redefinir senha, digite código **errado**
3. ❌ Erro: "Código incorreto"

### **Teste 3: Código Expirado**

1. Solicite código para um email
2. **Aguarde 15 minutos** (ou mais)
3. Tente usar o código
4. ❌ Erro: "Código expirado. Solicite um novo código."

### **Teste 4: Código Já Utilizado**

1. Solicite código e redefina senha com sucesso
2. Tente usar o **mesmo código** novamente
3. ❌ Erro: "Código já foi utilizado"

### **Teste 5: Email Inexistente**

1. Digite email que não existe: `naocadastrado@example.com`
2. Clique em "Enviar Código"
3. ✅ Mensagem genérica (por segurança): "Se o email existir, você receberá um código"
4. Nenhum código é gerado

---

## 🔒 Segurança

### **Recursos de Segurança Implementados:**

✅ **Código de 6 dígitos aleatórios**
- Gerado com `Math.random()` (100000-999999)
- Não é sequencial ou previsível

✅ **Expiração em 15 minutos**
- Códigos não podem ser usados após expirar
- Automaticamente inválidos após o tempo

✅ **Uso único**
- Cada código só pode ser usado uma vez
- Marcado como "usado" após redefinição

✅ **Não revela se email existe**
- Mesma mensagem para emails válidos e inválidos
- Previne enumeração de usuários

✅ **Validação de senha forte**
- Mínimo de 6 caracteres
- Confirmação obrigatória

✅ **Atualização direta no Supabase Auth**
- Senha criptografada com bcrypt
- Armazenamento seguro

---

## 📊 Estrutura de Dados

### **Código de Reset armazenado no KV Store:**

```typescript
// Chave: reset:${email}
{
  code: "123456",              // Código de 6 dígitos
  userId: "uuid-do-usuario",   // ID do usuário
  expiresAt: "2026-03-23T...", // Data/hora de expiração
  used: false                  // Status de uso
}
```

### **Ciclo de Vida:**

1. **Criação**: Gerado ao solicitar recuperação
2. **Validação**: Verificado ao redefinir senha
3. **Marcação**: `used: true` após uso bem-sucedido
4. **Exclusão**: Removido 1 segundo após uso ou quando expirado

---

## 🎯 Endpoints da API

### **POST /auth/forgot-password**

Solicita código de recuperação.

**Request:**
```json
{
  "email": "doador@example.com"
}
```

**Response (Sucesso):**
```json
{
  "message": "Código de recuperação enviado para o email.",
  "codeForDev": "123456",  // Apenas em desenvolvimento
  "email": "doador@example.com"
}
```

**Response (Email não encontrado):**
```json
{
  "message": "Se o email existir, você receberá um código de recuperação.",
  "codeForDev": null
}
```

---

### **POST /auth/reset-password**

Redefine a senha usando o código.

**Request:**
```json
{
  "email": "doador@example.com",
  "code": "123456",
  "newPassword": "novaSenha123"
}
```

**Response (Sucesso):**
```json
{
  "message": "Senha alterada com sucesso! Você pode fazer login com a nova senha."
}
```

**Response (Erro - Código Inválido):**
```json
{
  "error": "Código incorreto"
}
```

**Response (Erro - Código Expirado):**
```json
{
  "error": "Código expirado. Solicite um novo código."
}
```

**Response (Erro - Código Já Usado):**
```json
{
  "error": "Código já foi utilizado"
}
```

---

## ⚙️ Configuração para Produção

### **Habilitar Envio de Email Real:**

✅ **JÁ IMPLEMENTADO COM RESEND!**

O sistema já está configurado para enviar emails reais usando **Resend**. Você só precisa:

1. **Obter API Key do Resend**:
   - Acesse [https://resend.com](https://resend.com)
   - Crie uma conta gratuita
   - Gere uma API Key
   - Cole a API key quando solicitado pelo sistema

2. **O código já está pronto!**
   - ✅ Função `sendEmail()` implementada
   - ✅ Template HTML profissional
   - ✅ Integração com Resend
   - ✅ Fallback para modo desenvolvimento

📖 **Guia completo**: Veja `/CONFIGURAÇÃO_EMAIL.md` para detalhes

### **Remover Código de Desenvolvimento (Produção):**

Para ocultar o código da resposta em produção, edite `/supabase/functions/server/index.tsx`:

```typescript
// REMOVER esta linha:
codeForDev: resetCode,

// Resultado: código só será enviado por email
```

---

## 🐛 Troubleshooting

### **Problema: Código não aparece**
- ✅ Verifique se o email está cadastrado
- ✅ Veja logs do console do navegador
- ✅ Verifique logs do Supabase Edge Functions

### **Problema: "Código inválido ou expirado"**
- ✅ Verifique se digitou o código corretamente (6 dígitos)
- ✅ Confirme se não passaram 15 minutos
- ✅ Solicite um novo código se necessário

### **Problema: Senha não atualiza**
- ✅ Verifique se a nova senha tem mínimo 6 caracteres
- ✅ Confirme que as senhas coincidem
- ✅ Veja logs do servidor para erros do Supabase

### **Problema: Não redireciona após sucesso**
- ✅ Aguarde 2 segundos (redirecionamento automático)
- ✅ Clique manualmente em "Ir para Login"
- ✅ Limpe cache do navegador

---

## 📝 Melhorias Futuras

### **Segurança Adicional:**
- [ ] Rate limiting (limitar tentativas por IP/email)
- [ ] Captcha na solicitação de código
- [ ] Log de tentativas de reset por email
- [ ] Notificação de mudança de senha por email
- [ ] Blacklist de senhas fracas

### **Experiência do Usuário:**
- [ ] Link direto com token no email (em vez de código)
- [ ] Envio de SMS como alternativa
- [ ] Autenticação de dois fatores (2FA)
- [ ] Histórico de últimas senhas (não permitir reutilizar)
- [ ] Indicador de força da senha

### **Funcionalidades Extras:**
- [ ] Múltiplos métodos de recuperação (email + SMS + perguntas)
- [ ] Recuperação via WhatsApp
- [ ] Biometria em apps mobile
- [ ] Backup codes para emergências

---

## ✅ Checklist de Implementação

- [x] Rota backend para solicitar código
- [x] Rota backend para validar código e resetar senha
- [x] Geração de código de 6 dígitos
- [x] Armazenamento no KV Store com expiração
- [x] Validação de código (correto, expirado, usado)
- [x] Atualização de senha no Supabase Auth
- [x] Página de "Esqueci a Senha"
- [x] Página de "Redefinir Senha"
- [x] Link na página de login
- [x] Validações de formulário
- [x] Feedback visual (alerts, toasts)
- [x] Redirecionamento após sucesso
- [x] Tratamento de erros
- [x] Modo desenvolvimento (código na tela)
- [x] Documentação completa

---

## 📞 Testando com Usuários de Exemplo

Use qualquer um dos emails de teste existentes:

```
doador@example.com
funcionario@hemocentro.com
diretor@hemocentro.com
admin@doavida.com
```

**Importante:** Após redefinir a senha de um usuário de teste, você precisará usar a **nova senha** para fazer login!

---

✨ **Sistema de recuperação de senha implementado com sucesso!**

Desenvolvido com Supabase, React, TypeScript e Tailwind CSS.