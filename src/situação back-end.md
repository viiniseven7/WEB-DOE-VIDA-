
# Atualizações Recentes do Backend (para Integração do Front)

As seguintes funcionalidades foram implementadas e já estão prontas para consumo pelo front-end:

---

## 1. Persistência de Elegibilidade (Autoexame)

Agora o backend não apenas aceita, mas **exige** a elegibilidade para permitir agendamentos.

* **Endpoints:**
  * `POST /api/auth/elegibilidade`: Salva o resultado do teste. Enviar `{"apto": true/false}`.
  * `GET /api/auth/elegibilidade/atual`: Retorna se o usuário está apto e a validade do teste.
* **Regra de Negócio:** Se o usuário tentar `POST /api/agendamentos` sem estar apto no autoexame, receberá erro `403` com o código `REQUIRES_ELIGIBILITY`.

---

## 2. Ciclo de Vida do Agendamento e Doação

O fluxo de status foi padronizado para refletir a realidade da coleta.

* **Status de Conclusão:** Ao registrar uma doação (`POST /api/doacoes`), o agendamento muda automaticamente para o status **`FIN`** (Finalizado).
* **Visibilidade na Agenda (Staff):** A rota `GET /api/agendamentos` agora retorna agendamentos com status **`CAN`** (Cancelado) para funcionários, permitindo que a função de "Reabrir" do front-end funcione.
* **Histórico do Doador:** A rota `GET /api/agendamentos/historico` agora inclui todos os status, permitindo ver agendamentos concluídos (`FIN`) e cancelados.

---

## 3. Emissão de Certificados Reais

O placeholder de certificados agora é uma funcionalidade completa.

* **Endpoints:**
  * `GET /api/certificados`: Lista as doações concluídas do usuário logado.
  * `GET /api/certificados/{id}/pdf`: Gera e retorna o arquivo PDF oficial do certificado.
* **Segurança:** O certificado só pode ser baixado se a doação pertencer ao usuário logado e estiver devidamente registrada no sistema.

---

## 4. Resumo de Novas Rotas

```http
// Elegibilidade
POST /api/auth/elegibilidade
GET  /api/auth/elegibilidade/atual

// Certificados
GET  /api/certificados
GET  /api/certificados/{id}/pdf
```

---

**Status da Integração:** O backend agora valida e persiste todas as regras que antes eram apenas visuais no front-end.
