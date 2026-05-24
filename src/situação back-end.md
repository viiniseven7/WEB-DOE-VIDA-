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

## 5. Busca de Doadores (Regra de Hemocentro)

A busca de doadores foi reestruturada para garantir a privacidade e seguir as regras de negócio das unidades.

### Regras Aplicadas:

1. **Visibilidade Restrita:** Funcionários e Diretores autenticados só visualizam doadores que já realizaram doação no **mesmo hemocentro** ao qual o funcionário pertence.
2. **Vínculo por Doação:** O backend utiliza a tabela de `doacoes` e o campo `doador_id` para validar se um doador possui histórico na unidade do funcionário.
3. **Segurança de Dados:** O filtro é aplicado no nível do servidor (Supabase Edge Function). Mesmo que parâmetros de busca sejam manipulados no frontend, o backend bloqueia o retorno de doadores de outras unidades.
4. **Filtros Dinâmicos:** Suporte completo a filtros combinados (AND) via Query Params:
   - Pesquisa por Nome/CPF (`q`).
   - Tipo Sanguíneo (`bloodType`).
   - Sexo, Status, Cidade, Faixa Etária.
   - Período de última doação.
5. **Enriquecimento de Resposta:** O retorno inclui metadados de paginação e campos normalizados como `lastDonation` e `hemocentroName`.

---

**Status:** O backend está 100% sincronizado com as necessidades de validação real de negócio solicitadas pelo front-end.clear
## 6. Observacao sobre o fluxo demo local do painel de funcionario

As ultimas alteracoes de agenda, triagem e estoque usadas para teste de usabilidade do painel de funcionario foram implementadas no frontend, em modo demo local.

### Importante

1. O backend real continua sendo a fonte de verdade para `agendamentos`, `triagens`, `doacoes` e `estoque`.
2. Os 50 agendamentos ficticios distribuidos em 10 dias do mes nao foram persistidos na base Laravel.
3. O tratamento local de check-in, cancelamento, reabertura, triagem e estoque para IDs demo existe apenas para evitar erro de integracao durante testes de UX em `localhost`.
4. Se a equipe quiser transformar esse cenario em massa real de homologacao, o ideal e criar seed proprio no backend com persistencia em banco.

---
