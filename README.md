# Painel de Negociacao

Painel web em Node.js/Express para consulta de contratos, recalculo de opcoes de negociacao e geracao de mensagens prontas para WhatsApp. O projeto possui modo demonstrativo para portfolio, sem depender de rede interna, banco SQL Server ou API real.

## Demo local

1. Instale as dependencias:

```powershell
npm.cmd install
```

2. Crie um arquivo `.env` com:

```env
PORT=3000
DEMO_MODE=true
DEMO_PHONE=11999999999
SCRIPT_ADMIN_PASSWORD=demo-admin
```

3. Inicie:

```powershell
npm.cmd start
```

4. Abra `http://localhost:3000`.

Use os dados de teste:

```text
Telefone: 11999999999
Carteira: Riachuelo, Bemol ou Grupo Mateus
```

## O que o modo demo permite testar

- Buscar contratos ficticios por telefone e carteira.
- Selecionar contrato/IDCON.
- Recalcular mensagem para WhatsApp.
- Simular parcela personalizada.
- Gerar sugestao demonstrativa de contraproposta para Riachuelo.
- Usar biblioteca de scripts rapidos e cadastro local de scripts.

## Stack

- Node.js
- Express
- JavaScript
- HTML/CSS
- SQL Server via `tedious` no modo interno
- Integracao SOAP/XML no modo interno

## Variaveis internas

Use somente em ambiente privado. Nao publique `.env`, logs, XMLs reais, retornos de API, credenciais ou dados de clientes.

```env
NECTAR_BASE_URL=
NECTAR_CNPJ=
NECTAR_CODIGO_PARCEIRO=
NECTAR_USU=
NECTAR_PASS=
SQLSERVER_HOST=
SQLSERVER_DATABASE=
SQLSERVER_USER=
SQLSERVER_PASSWORD=
SQLSERVER_DOMAIN=
```

## Observacao de seguranca

O repositorio publico deve conter apenas dados ficticios. Arquivos temporarios como `tmp_*.xml`, `.env`, `*.log` e a pasta `data/` ficam ignorados pelo Git.
