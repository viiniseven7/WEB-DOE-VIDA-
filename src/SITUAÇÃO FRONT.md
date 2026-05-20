# Situação Atual do Front-end - DoaVida

Documento atualizado para refletir o estado real do front, os fluxos já ligados na API e os pontos que dependem do backend para ficarem corretos de verdade.

---

## Autenticação

- Login usa `POST /api/auth/login`.
- Sessão usa `GET /api/auth/me`.
- O token é enviado pelo interceptor de `src/services/api.ts`.
- Atenção: o front ainda precisa manter uma única chave de token no `localStorage`. Hoje há histórico de uso entre `token` e `access_token`; isso deve ficar padronizado com o backend.

---

## Cadastro + Elegibilidade

### Estado atual

- O teste de elegibilidade (`EligibilityTestPage.tsx`) é um questionário local.
- Quando o usuário termina como apto, o front grava uma marca temporária em `sessionStorage`.
- A tela de cadastro (`RegistrationDonationPage.tsx`) redireciona para `/teste-elegibilidade` se o usuário não logado tentar cadastrar sem ter feito o teste.

### Limitação importante

Isso não é validação real de negócio. O backend ainda não recebe nem salva o exame de elegibilidade.

Para virar regra segura, precisa de backend com algo como:

- `POST /api/auth/elegibilidade`
- `GET /api/auth/elegibilidade/atual`

E o backend deveria bloquear `POST /api/auth/agendamentos` caso o usuário não tenha elegibilidade válida.

Sem isso, o front só melhora o fluxo visual, mas não impede burla por API, aba nova, limpeza de sessão ou chamada direta.

---

## Painel do Doador

Arquivo principal: `src/components/dashboards/DonorDashboard.tsx`.

### Próxima doação

- Usa `GET /api/agendamentos`.
- Pelo DOC-API, para doador essa rota retorna apenas agendamentos ativos (`AGE`) ou confirmados (`CON`).
- Por isso ela não deve ser usada para histórico concluído.

### Histórico

- Agora deve usar `GET /api/agendamentos/historico`.
- Essa rota é a correta para exibir agendamentos finalizados, cancelados e excluídos.

### Minhas Coletas

- Usa `GET /api/doacoes`.
- Se o funcionário registrou uma doação completa, ela aparecer em "Minhas Coletas" está correto.
- "Histórico" é a visão de agendamentos; "Minhas Coletas" é a visão de doações/coletas registradas.

### Restrição do doador

- O botão "Agendar Doação" não deve ficar desabilitado/translúcido.
- O comportamento melhor é deixar clicável e mostrar mensagem informando que o doador está temporariamente inelegível.

### Meus Certificados

- Atualmente é placeholder visual.
- Não existe rota documentada para listar ou gerar certificado.
- Para funcionar de verdade, precisa de backend, por exemplo:
  - `GET /api/certificados`
  - `GET /api/certificados/{id}/pdf`

---

## Painel do Funcionário

Arquivo principal: `src/components/dashboards/StaffDashboard.tsx`.

### Agenda

- Usa `GET /api/agendamentos`.
- Pelo DOC-API, funcionário deve ver todos os agendamentos do seu hemocentro.
- O front filtra pela data selecionada.

### Confirmar presença

- Usa `POST /api/auth/agendamentos/{id}/confirmar`.
- Muda o status para `CON`.

### Cancelar

- Usa `POST /api/auth/agendamentos/{id}/cancelar`.
- Muda o status para `CAN`.
- O front atualiza localmente o item cancelado para não depender de o backend devolver cancelados imediatamente na listagem.

### Reabrir

- Usa `POST /api/auth/agendamentos/{id}/reabrir`.
- O botão aparece somente para status `CAN` e se a data da doação ainda não passou.
- Se o botão não aparecer, as causas mais prováveis são:
  - o backend não está retornando agendamentos cancelados em `GET /api/agendamentos`;
  - o status retornado não é `CAN`;
  - a data do agendamento já passou;
  - algum endpoint auxiliar estava quebrando o carregamento da agenda.

O front foi ajustado para a agenda não depender de `/estoque` ou `/estatisticas/funcionario`; se esses endpoints falharem, a agenda ainda deve carregar.

### Registrar triagem e doação

- Triagem usa `POST /api/auth/triagens`.
- Body esperado inclui:
  - `agendamento_id`
  - `user_id`
  - `hemocentro_id`
  - `data_triagem`
  - `apto`
  - `motivo_inaptidao`
  - `observacoes`

- Doação usa `POST /api/auth/doacoes`.
- Body esperado inclui:
  - `agendamento_id`
  - `triagem_id`
  - `user_id`
  - `hemocentro_id`
  - `data_hora_doacao`
  - `tipo_sangue`
  - `quantidade`
  - `data_validade_sangue`

Após sucesso, o front mantém o card visível como "Doação realizada", com visual verde.

---

## Pontos que dependem do backend

- Persistir exame de elegibilidade no usuário.
- Bloquear agendamento sem elegibilidade válida.
- Gerar/listar certificados.
- Garantir que `GET /api/agendamentos` retorne cancelados para funcionário, se a regra for permitir reabrir pela agenda.
- Padronizar o status de doação concluída: hoje o front aceita `FIN`, `DOA`, `REALIZADA` e presença de `doacao_id`, mas o ideal é o backend ter um padrão único.

---

## Observações técnicas

- Base URL: `http://localhost:8000/api`.
- O build pode falhar se `node_modules` estiver quebrado pelo pacote opcional do Rollup. Nesse caso, rodar:

```bash
npm install
npm run build
```
