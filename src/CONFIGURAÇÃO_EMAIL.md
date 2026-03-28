# 📧 Configuração de Envio de Email - DoaVida

## 🎯 Visão Geral

O sistema DoaVida usa o **Resend** para enviar emails de recuperação de senha. Este guia mostra como configurar o envio real de emails.

---

## 🚀 Passo a Passo - Configuração do Resend

### **1. Criar Conta no Resend**

1. Acesse: [https://resend.com](https://resend.com)
2. Clique em **"Sign Up"** (Cadastre-se)
3. Use seu email ou faça login com GitHub
4. Confirme seu email

### **2. Obter API Key**

1. Após fazer login, acesse o Dashboard
2. No menu lateral, clique em **"API Keys"**
3. Clique em **"Create API Key"**
4. Dê um nome: `DoaVida - Production`
5. Selecione as permissões:
   - ✅ **Sending access** (Acesso de envio)
6. Clique em **"Add"**
7. **⚠️ IMPORTANTE**: Copie a API Key que aparece (você só verá ela uma vez!)
   ```
   re_123abc456def789ghi012jkl345mno678
   ```

### **3. Adicionar API Key no Supabase**

A API key já foi configurada! Quando você viu o modal solicitando `RESEND_API_KEY`, você já configurou o ambiente.

Para verificar ou atualizar:
1. Acesse o Dashboard do Supabase
2. Vá em **Settings** → **Secrets**
3. Procure por `RESEND_API_KEY`
4. Se não estiver lá, adicione manualmente

### **4. Configurar Domínio de Email (Opcional mas Recomendado)**

Por padrão, o Resend usa `onboarding@resend.dev` como remetente, que funciona mas tem limitações.

#### **4.1. Para usar seu próprio domínio:**

1. No Resend Dashboard, vá em **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `doavida.com` (ou seu domínio)
4. Siga as instruções para adicionar os registros DNS:
   ```
   TXT _resend.doavida.com → [valor fornecido]
   MX doavida.com → [valor fornecido]
   ```
5. Aguarde verificação (pode levar até 72h, geralmente < 30 minutos)

#### **4.2. Atualizar o código para usar seu domínio:**

No arquivo `/supabase/functions/server/index.tsx`, altere:

```typescript
// ANTES (domínio padrão do Resend)
from: "DoaVida <onboarding@resend.dev>",

// DEPOIS (seu domínio verificado)
from: "DoaVida <noreply@doavida.com>",
```

---

## ✅ Testando o Envio de Email

### **Teste 1: Email com Domínio Padrão (Resend)**

1. Acesse `/forgot-password`
2. Digite seu email real (que você tem acesso)
3. Clique em "Enviar Código"
4. **Verifique sua caixa de entrada**
   - Remetente: `DoaVida <onboarding@resend.dev>`
   - Assunto: "Recuperação de Senha - DoaVida"
   - Corpo: Email HTML formatado com código de 6 dígitos

5. **Se não recebeu:**
   - ✅ Verifique spam/lixo eletrônico
   - ✅ Confira se a API key está correta
   - ✅ Veja logs do Supabase Edge Functions
   - ✅ Verifique console do navegador

### **Teste 2: Email com Domínio Próprio**

Após configurar seu domínio verificado:

1. Altere o código conforme item 4.2 acima
2. Repita o teste 1
3. Agora o remetente será: `DoaVida <noreply@seudominio.com>`

---

## 🎨 Template de Email

O email enviado é **totalmente responsivo e profissional**:

### **Estrutura:**

```
┌─────────────────────────────────┐
│   🩸 DoaVida                    │ ← Header (vermelho)
│   Sistema de Doação de Sangue  │
├─────────────────────────────────┤
│   Recuperação de Senha          │
│                                 │
│   Olá, João Silva!              │
│   Recebemos uma solicitação...  │
│                                 │
│   ┌───────────────────────┐    │
│   │ Seu código:           │    │
│   │    1 2 3 4 5 6        │    │ ← Código em destaque
│   │ Válido por 15 minutos │    │
│   └───────────────────────┘    │
│                                 │
│   Como usar o código:           │
│   1. Acesse a página...         │
│   2. Insira o código...         │
│   3. Crie sua nova senha        │
│                                 │
│   ⚠️ Se não solicitou...        │
│                                 │
│   Atenciosamente,               │
│   Equipe DoaVida                │
├─────────────────────────────────┤
│   Email automático              │ ← Footer
│   © 2026 DoaVida                │
└─────────────────────────────────┘
```

### **Características:**

✅ Design responsivo (mobile e desktop)
✅ Cores do tema DoaVida (vermelho)
✅ Código em destaque e fácil de ler
✅ Instruções claras passo a passo
✅ Aviso de segurança
✅ Branding profissional

---

## 🔧 Customizar Template

Para personalizar o email, edite o arquivo `/supabase/functions/server/index.tsx`:

### **Alterar cores:**

```css
/* Encontre esta linha: */
.header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); ...

/* Altere para suas cores: */
.header { background: linear-gradient(135deg, #seu-hex 0%, #outro-hex 100%); ...
```

### **Alterar texto:**

```html
<!-- Encontre: -->
<p>Recebemos uma solicitação para redefinir a senha da sua conta DoaVida.</p>

<!-- Altere para: -->
<p>Seu texto personalizado aqui!</p>
```

### **Adicionar logo (imagem):**

```html
<!-- No header, adicione: -->
<img src="https://seudominio.com/logo.png" alt="DoaVida" style="width: 100px; height: auto;" />
```

---

## 📊 Monitoramento de Emails

### **Dashboard do Resend:**

1. Acesse [https://resend.com/emails](https://resend.com/emails)
2. Veja todos os emails enviados em tempo real
3. Status possíveis:
   - ✅ **Delivered** (Entregue)
   - ⏳ **Queued** (Na fila)
   - ❌ **Bounced** (Rejeitado)
   - 🚫 **Complained** (Marcado como spam)

### **Logs do Servidor:**

Veja os logs no Supabase:
1. Dashboard Supabase → **Edge Functions**
2. Selecione a função `make-server-f9f63502`
3. Veja logs em tempo real:
   ```
   Email sent successfully to user@example.com: re_xyz123
   ```

---

## 🔒 Limites e Quotas

### **Plano Gratuito do Resend:**

- ✅ **100 emails/dia**
- ✅ **3.000 emails/mês**
- ✅ Domínio verificado necessário para produção
- ✅ Sem limite de API keys

### **Plano Pago:**

- 🚀 **50.000 emails/mês** - $20/mês
- 🚀 **100.000 emails/mês** - $80/mês
- 🚀 Volumes maiores: preço personalizado

### **Para protótipos/desenvolvimento:**

O plano gratuito é mais que suficiente!

---

## 🛡️ Segurança e Boas Práticas

### ✅ **Fazer:**

- Usar variáveis de ambiente para API keys
- Validar emails antes de enviar
- Implementar rate limiting (prevenir spam)
- Usar domínio verificado em produção
- Monitorar bounce rate
- Adicionar unsubscribe link (em emails de campanha)

### ❌ **Não Fazer:**

- Expor API key no frontend
- Enviar emails sem validação
- Usar HTML inline sem sanitização
- Enviar emails de teste para múltiplos destinatários
- Ignorar bounces e complaints

---

## 🔥 Modo Desenvolvimento vs Produção

### **Modo Desenvolvimento (Atual):**

```typescript
return c.json({ 
  message: 'Código enviado',
  codeForDev: resetCode,  // ← Código visível na resposta
  email: email,
});
```

**Vantagem**: Testa funcionalidade sem precisar de email
**Desvantagem**: Código exposto (não seguro)

### **Modo Produção (Recomendado):**

```typescript
return c.json({ 
  message: 'Código enviado para o email.',
  // codeForDev removido
});
```

**Vantagem**: Seguro, código só no email
**Desvantagem**: Requer configuração de email

---

## 🐛 Troubleshooting

### **Problema: "RESEND_API_KEY not configured"**

✅ **Solução**:
1. Verifique se adicionou a secret no Supabase
2. Reinicie o Edge Function
3. Confirme que o nome está exatamente: `RESEND_API_KEY`

### **Problema: "API key is invalid" (Erro 401)**

Este é o erro mais comum! A API key do Resend está incorreta ou expirada.

✅ **Soluções**:

1. **Gerar nova API Key no Resend**:
   - Acesse [https://resend.com/api-keys](https://resend.com/api-keys)
   - Delete a API key antiga (se houver)
   - Clique em **"Create API Key"**
   - Nome sugerido: `DoaVida-Production-2026`
   - Permissões: **Sending access**
   - Copie a nova API key (formato: `re_...`)

2. **Atualizar no Supabase**:
   - Acesse seu projeto no Supabase Dashboard
   - Vá em **Settings** → **Edge Functions** → **Secrets**
   - Procure por `RESEND_API_KEY`
   - Edite e cole a **nova** API key
   - Salve e aguarde alguns segundos

3. **Verificar formato da API key**:
   - Deve começar com `re_`
   - Exemplo válido: `re_123abc456def789ghi012jkl345mno678`
   - Não deve ter espaços ou quebras de linha
   - Copie exatamente como mostrado no Resend

4. **Testar novamente**:
   - Aguarde 10-30 segundos após salvar
   - Faça uma nova solicitação de recuperação de senha
   - Verifique os logs do Supabase Edge Functions

**🔍 Como verificar se funcionou**:
```
✅ Logs do servidor devem mostrar:
   "Email sent successfully to user@email.com: re_xyz123"

❌ Se ainda vê erro:
   "Email send error: {\"statusCode\":401,\"name\":\"validation_error\"...}"
   → API key ainda incorreta, repita passos acima
```

### **Problema: Email não chega**

✅ **Soluções**:
1. Verifique spam/lixo eletrônico
2. Confirme que o email de destino existe
3. Veja logs do Resend (Dashboard → Emails)
4. Verifique se não atingiu o limite diário
5. Use domínio verificado

### **Problema: "Failed to send email"**

✅ **Soluções**:
1. API key inválida ou expirada
2. Formato de email inválido
3. Domínio não verificado (se usando custom domain)
4. Veja detalhes no console do servidor

### **Problema: Email vai para spam**

✅ **Soluções**:
1. Use domínio verificado
2. Configure SPF, DKIM, DMARC (Resend faz automaticamente)
3. Evite palavras de spam no assunto/corpo
4. Mantenha baixo bounce rate
5. Peça aos usuários para adicionar nos contatos

---

## 📱 Alternativas ao Resend

Se preferir outro provedor:

### **1. SendGrid**
- ✅ 100 emails/dia grátis
- ✅ Muito popular
- ❌ Setup mais complexo

### **2. Mailgun**
- ✅ 5.000 emails/mês grátis (3 meses)
- ✅ API similar
- ❌ Requer cartão de crédito

### **3. Amazon SES**
- ✅ Muito barato ($0.10/1000 emails)
- ✅ Alta escalabilidade
- ❌ Configuração técnica complexa

### **4. Postmark**
- ✅ 100 emails/mês grátis
- ✅ Focado em transacional
- ❌ Mais caro que Resend

**Recomendação**: Resend é perfeito para este projeto! 🎯

---

## 📖 Recursos Adicionais

### **Documentação Oficial:**
- [Resend Docs](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Best Practices](https://resend.com/docs/best-practices)

### **Suporte:**
- [Resend Discord](https://resend.com/discord)
- [Resend Status](https://status.resend.com)

---

## ✅ Checklist de Produção

Antes de lançar em produção:

- [ ] API key do Resend configurada
- [ ] Domínio próprio verificado
- [ ] Template de email testado
- [ ] Rate limiting implementado
- [ ] `codeForDev` removido da resposta
- [ ] Logs configurados
- [ ] Monitoramento de bounce ativo
- [ ] Plano pago contratado (se necessário)
- [ ] Emails de teste enviados com sucesso
- [ ] Política de privacidade atualizada

---

## 🎉 Pronto!

Agora seu sistema DoaVida está configurado para enviar emails reais de recuperação de senha!

**Próximos passos:**
1. ✅ Configure sua API key do Resend
2. 📧 Teste enviando para seu email
3. 🎨 Personalize o template (opcional)
4. 🚀 Lance em produção!

**Dúvidas?** Consulte a documentação ou os logs do servidor.

---

✨ **Desenvolvido com Resend + Supabase + React**