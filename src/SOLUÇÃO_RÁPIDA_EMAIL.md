# ⚡ Solução Rápida - Erro "API key is invalid"

## 🚨 Problema

Você está vendo este erro nos logs:

```
Email send error: {"statusCode":401,"name":"validation_error","message":"API key is invalid"}
```

## ✅ Solução em 3 Passos

### **Passo 1: Criar conta no Resend (2 minutos)**

1. Acesse: **[https://resend.com/signup](https://resend.com/signup)**
2. Cadastre-se com seu email ou GitHub
3. Confirme seu email

### **Passo 2: Gerar nova API Key (1 minuto)**

1. No dashboard do Resend, vá em **"API Keys"**
2. Clique em **"Create API Key"**
3. Nome: `DoaVida-2026`
4. Permissão: **Sending access** ✅
5. Clique em **"Add"**
6. **Copie a API key** (começa com `re_...`)

Exemplo de API key válida:
```
re_AbCdEfGh_1234567890aBcDeFgHiJkLmNoPqRsTuV
```

### **Passo 3: Atualizar no Supabase (1 minuto)**

1. Acesse seu **Supabase Dashboard**
2. Vá em: **Settings** → **Edge Functions** → **Secrets**
3. Procure por `RESEND_API_KEY`
4. Clique em **"Edit"** (ícone de lápis)
5. Cole a nova API key
6. Clique em **"Save"**
7. Aguarde 10-20 segundos

### **Passo 4: Testar! 🎉**

1. Acesse `/forgot-password` no seu app
2. Digite um email válido
3. Clique em "Enviar Código"
4. ✅ **Verifique seu email!**

---

## 🔍 Como Saber se Funcionou?

### ✅ **Sucesso:**
- Mensagem: "Código enviado para seu email!"
- Email recebido de: `DoaVida <onboarding@resend.dev>`
- Logs do Supabase mostram: `Email sent successfully to...`

### ❌ **Ainda com erro:**
- Aguarde mais 30 segundos (pode demorar para propagar)
- Verifique se copiou a API key completa (sem espaços)
- Confirme que a API key começa com `re_`
- Tente gerar uma nova API key no Resend

---

## 💡 Modo Desenvolvimento (Sem Email)

**Não quer configurar email agora?** Sem problemas!

O sistema funciona perfeitamente em **modo desenvolvimento**:

1. Solicite recuperação de senha normalmente
2. O código aparecerá **na tela** (em vez de ir para o email)
3. Copie e use o código para redefinir sua senha

**Vantagens:**
- ✅ Zero configuração necessária
- ✅ Funciona imediatamente
- ✅ Perfeito para testes e desenvolvimento

**Quando configurar email:**
- Antes de lançar em produção
- Quando quiser testar com usuários reais
- Para ter experiência completa do sistema

---

## 📊 Comparação

| Recurso | Modo Desenvolvimento | Com Email (Resend) |
|---------|---------------------|-------------------|
| Configuração | ✅ Zero | ⚙️ 4 minutos |
| Código | 📱 Aparece na tela | 📧 Enviado por email |
| Produção | ❌ Não recomendado | ✅ Pronto para produção |
| Segurança | ⚠️ Código exposto | 🔒 Código privado |
| Custo | 💚 Grátis | 💚 Grátis (100/dia) |

---

## 🎯 Resumo

**Opção 1 - Rápida (Agora)**
- Não faça nada
- Use modo desenvolvimento
- Código aparece na tela

**Opção 2 - Completa (4 minutos)**
- Cadastre no Resend → [resend.com](https://resend.com)
- Copie API key
- Cole no Supabase Secrets
- Pronto! Emails reais funcionando

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- **[CONFIGURAÇÃO_EMAIL.md](./CONFIGURAÇÃO_EMAIL.md)** - Guia completo
- **[RECUPERAÇÃO_DE_SENHA.md](./RECUPERAÇÃO_DE_SENHA.md)** - Como usar o sistema

---

## 🆘 Ajuda Adicional

**Ainda com dúvidas?**

1. Verifique os **logs do Supabase Edge Functions**
2. Confirme que a API key está salva corretamente
3. Tente criar uma **nova** API key no Resend
4. Verifique se o nome da secret é exatamente: `RESEND_API_KEY`

---

✨ **Sistema funcionando em qualquer modo!**

- 💻 **Sem configuração**: Modo desenvolvimento (código na tela)
- 📧 **Com configuração**: Emails reais (4 minutos de setup)

**Você escolhe!** Ambas as opções funcionam perfeitamente. 🎉
