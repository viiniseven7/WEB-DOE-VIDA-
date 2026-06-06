# 🛠️ CHECKLIST DE PENDÊNCIAS (URGENTE)

O projeto está bloqueado por um erro de sintaxe no Back-end que impede qualquer operação de agendamento ou visualização de agenda.

---

## 🔴 1. CORREÇÃO IMEDIATA (PHP/Laravel)
O arquivo `AgendamentoController.php` possui um erro de sintaxe na **Linha 18**.

**O código provavelmente está assim (ERRADO):**
```php
public function index(Request )  // Falta a variável $request
// OU
public function index(Request $request, ) // Vírgula sobrando no final
```

**Deve ser corrigido para (CORRETO):**
```php
public function index(Request $request) 
```
*Após corrigir isso, a API voltará a responder e os dados aparecerão no Front-end.*

---

## ⚙️ 2. FORMATO DE RETORNO (Ajuste no Controller)
Para que o botão de doação funcione, o método `index` do `AgendamentoController` deve retornar os relacionamentos:

**No Laravel:**
```php
return Agendamento::with(['triagem', 'doacao'])->get();
```

**Isso fará o JSON chegar assim (Formato esperado pelo Front):**
```json
{
  "id": 1,
  "status_agendamento": "CON",
  "triagem": { "id": 10, "apto": true },
  "doacao": null
}
```

---

## 🚀 3. STATUS DO FRONT-END
- **Fluxo de Doação:** Implementado e aguardando o objeto `triagem` dentro do agendamento.
- **Segurança:** O Front já envia `agendamento_id` e `triagem_id` nas requisições de salvamento.
- **Bloqueio de Carência:** O Front já respeita o campo `tempo_restricao` do usuário.

---
**Próximo Passo:** Assim que o erro da linha 18 for corrigido no Back-end, o sistema deve ser testado novamente.
deixa eu te ma