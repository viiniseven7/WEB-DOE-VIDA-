# Situação Atual do Backend - Integração de Fluxos

Este documento resume as regras de negócio e a forma correta do front-end consumir os novos módulos de Triagem e LGPD.

## 1. Fluxo de Elegibilidade (Autoexame)

O backend agora **exige** que o doador tenha um teste de elegibilidade válido para permitir agendamentos.

### O que o Front deve fazer:

1. **Doador Logado:** Ao finalizar o teste de elegibilidade (`EligibilityTestPage.tsx`), o front deve disparar `POST /api/auth/elegibilidade` com o corpo `{"apto": true}`.
2. **Validade (7 dias):** O teste agora tem validade de **7 dias**. O backend controla isso pelo campo `autoexame_validade`. O doador pode agendar para qualquer data futura, desde que o *ato de agendar* ocorra dentro desses 7 dias.
3. **Tratamento de Erro:** Se o front tentar disparar `POST /api/agendamentos` e o backend retornar erro `403` com o código `REQUIRES_ELIGIBILITY`, o doador deve ser orientado a refazer o teste.

## 2. Cadastro + Pré-triagem (LGPD)

O endpoint de registro foi unificado para garantir conformidade legal e fluidez no UX.

### O que o Front deve fazer:

* **LGPD:** O campo `lgpd_aceite: true` é **obrigatório** no `POST /api/auth/register`.
* **Pré-triagem:** Se o usuário fez o teste antes de se cadastrar, envie as respostas no array `respostas_pre_triagem`. Se o resultado for "apto", o backend já ativa a elegibilidade do usuário automaticamente por 7 dias.

## 1. Fluxo de Elegibilidade (Autoexame)

...

## 2. Cadastro + Pré-triagem (LGPD)

...

## 3. Triagem Clínica Dinâmica (Módulo Staff)

...

## 4. Padronização de Status (CON vs FIN)

Foi introduzida uma distinção clara entre presença e conclusão:

* **CON (Confirmado):** O doador está presente no hemocentro. Use este status para liberar o botão de "Iniciar Triagem".
* **FIN (Finalizado):** O backend define este status automaticamente ao registrar uma doação bem-sucedida (`POST /api/doacoes`).
* **Importante:** O front deve tratar `FIN` como o estado final de sucesso absoluto do ciclo.

## 4. Novos Endpoints Disponíveis

Abaixo, a lista de rotas que o front-end já pode utilizar para substituir placeholders:

```http
// Elegibilidade e Gestão de Conta (Doador)
POST   /api/auth/elegibilidade         // Salva resultado do autoexame
GET    /api/auth/elegibilidade/atual   // Verifica status e validade (7 dias)
GET    /api/auth/meus-dados            // Portabilidade LGPD (Art. 18)
DELETE /api/auth/minha-conta           // Anonimização e exclusão (LGPD)

// Triagem e Auditoria (Staff)
GET    /api/triagens/perguntas         // Busca perguntas dinâmicas
POST   /api/auth/triagens              // Registro completo (Sinais vitais + Respostas)
POST   /api/auth/doadores/{id}/tipo-sangue-historico // Auditoria de alteração de tipo sanguíneo

// Certificados
GET    /api/certificados               // Lista doações que geram certificado
GET    /api/certificados/{id}/pdf       // Download do PDF oficial
```

---

**Status:** O backend está 100% sincronizado com as necessidades de validação real de negócio solicitadas pelo front-end.clear