# Projeto FVS (Site + Simulação)

Site institucional estático (HTML/CSS/JS) com página de simulação, CTAs para WhatsApp, modal de vídeos e integração opcional com Kommo via Netlify Function. Também inclui tracking de cliques/interesses via `dataLayer` (GTM/Google) e compatibilidade com `gtag`/`fbq` quando existirem no site.

## Páginas

- `index.html`: landing page com seções, vídeos e CTAs.
- `simulacao.html`: formulário de simulação (objetivo, valor e prazo) + envio via WhatsApp e registro no Kommo.

## Estrutura do projeto

```
Projeto FVS/
  index.html
  simulacao.html
  style.css
  script.js
  netlify/
    functions/
      kommo-lead.js
  imagens/
```

## Executar localmente

Este projeto não depende de build. Para revisar layout/conteúdo, dá para abrir os arquivos `.html` no navegador.

Para testar a integração com Kommo (`/.netlify/functions/kommo-lead`), é necessário rodar via Netlify (deploy) ou ambiente que suporte Functions.

## Deploy na Netlify

O site pode ser publicado como estático. Para publicar a Function junto:

- Publish directory: `.`
- Functions directory: `netlify/functions`

Após o deploy, a Function fica disponível em:

`https://<seu-site>.netlify.app/.netlify/functions/kommo-lead`

## Integração Kommo (Netlify Function)

### O que ela faz

Quando o usuário clica em “Solicitar Análise Completa” na simulação, o front-end:

- abre o WhatsApp com a mensagem já preenchida
- tenta criar um Lead no Kommo via Function

Front-end: [sendSimulation](file:///c:/Users/napie/Downloads/Projeto%20Ebook/Projeto%20FVS/script.js#L866-L929)  
Function: [kommo-lead.js](file:///c:/Users/napie/Downloads/Projeto%20Ebook/Projeto%20FVS/netlify/functions/kommo-lead.js)

### Variáveis de ambiente (Netlify)

Obrigatórias:

- `KOMMO_SUBDOMAIN`: subdomínio do Kommo (ex: `minhaempresa`)
- `KOMMO_LONG_LIVED_TOKEN`: token Bearer (long-lived)

Opcionais:

- `KOMMO_PIPELINE_ID`: número
- `KOMMO_STATUS_ID`: número

### Respostas típicas

- `200` `{ ok: true, lead_id: <id> }` quando cria o lead
- `422` `{ ok: false, error: "missing_required_fields" }` quando faltam campos obrigatórios
- `503` `{ ok: false, error: "kommo_not_configured" }` quando as variáveis de ambiente não estão configuradas
- `502` `{ ok: false, error: "kommo_api_error", status, body }` quando a API do Kommo rejeita a requisição

### Arquivo legado (não usado na Netlify)

Existe um `kommo-lead.php` na raiz do projeto, mas a publicação na Netlify deve usar a Function em `netlify/functions/kommo-lead.js`.

## Tracking de Marketing (Meta + Google)

O site emite eventos para o `dataLayer` e também dispara `gtag`/`fbq` se existirem na página. Não são enviados dados pessoais para tracking, apenas comportamento e intenção.

Implementação: [trackMarketingEvent](file:///c:/Users/napie/Downloads/Projeto%20Ebook/Projeto%20FVS/script.js#L1-L23)

### Eventos emitidos

- `lead_whatsapp_click`: clique em qualquer link/botão do WhatsApp  
  Parâmetros: `label`, `placement`, `page_path`
- `simulation_start`: clique para abrir `simulacao.html`  
  Parâmetros: `label`, `placement`, `page_path`
- `simulation_view`: visualização da página de simulação  
  Parâmetros: `page_path`
- `simulation_interest_select`: seleção de objetivo/interesse  
  Parâmetros: `interest` (`imovel|veiculo|motocicleta|pesados|servicos`)
- `simulation_calculated`: simulação calculada (interesse + prazo selecionado)  
  Parâmetros: `interest`, `term_months`, `page_path`
- `simulation_submit`: clique em “Solicitar Análise Completa”  
  Parâmetros: `interest`, `credit_value` (número), `term_months`, `page_path`
- `video_open`: abertura de vídeo no modal  
  Parâmetros: `video`, `page_path`
- `partner_click`: clique em parceiros (ex: Embracon / Google Maps)  
  Parâmetros: `partner`, `label`, `placement`, `page_path`

`placement` identifica a área do site onde ocorreu o clique (ex: `header`, `hero`, `footer`, `floating`, `simulation`, `page`).

### Como validar rapidamente

1. Abra o site no navegador
2. Clique em alguns botões/CTAs
3. No Console do DevTools, execute:

```js
window.dataLayer.slice(-10)
```

## Troubleshooting (Netlify)

- Function retorna `404`: verifique se o “Functions directory” está configurado como `netlify/functions`.
- Function retorna `503`: configure `KOMMO_SUBDOMAIN` e `KOMMO_LONG_LIVED_TOKEN` nas variáveis do site.
- Não aparece requisição na simulação: no DevTools, filtre por `Fetch/XHR` e procure `/.netlify/functions/kommo-lead`.
