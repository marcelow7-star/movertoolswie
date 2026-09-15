# Sucessão em Movimento® — Diagnósticos MOVER

Guia rápido para publicar este app num link de verdade, pronto pra enviar pra família.

## O que é isso

Este é o mesmo app que você testou no chat, só que empacotado como um projeto de verdade,
pronto pra rodar num site próprio. A diferença principal: os botões de IA agora passam por
um "servidorzinho" (pasta `api/`) que guarda sua chave da Anthropic em segredo — sem isso,
ou a IA não funciona fora do chat, ou a chave ficaria exposta pra qualquer visitante ver.

## Passo a passo (Vercel, gratuito)

### 1. Gerar uma chave de API nova

Se você revogou a chave anterior (ótimo, era o certo a fazer), gere uma nova em
[console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**.
Copie e guarde — você vai colar ela no Vercel no passo 4, não em nenhum arquivo daqui.

### 2. Instalar as ferramentas (uma vez só, no seu computador)

Você precisa do [Node.js](https://nodejs.org) instalado (baixe a versão "LTS"). Depois,
abra o Terminal (Mac) ou PowerShell (Windows) e rode:

```
npm install -g vercel
```

### 3. Publicar

Dentro da pasta deste projeto (`mover-app`), rode:

```
vercel
```

Na primeira vez, ele vai pedir pra você fazer login (abre o navegador) e perguntar algumas
coisas — pode aceitar as opções padrão (Enter em tudo) até finalizar. Isso já publica um
link de teste.

### 4. Adicionar sua chave da Anthropic

No site [vercel.com](https://vercel.com), entre no projeto que acabou de criar → **Settings**
→ **Environment Variables** → adicione:

- **Nome:** `ANTHROPIC_API_KEY`
- **Valor:** a chave que você gerou no passo 1 (começa com `sk-ant-...`)

Salve, e rode `vercel --prod` de novo no terminal (ou clique em "Redeploy" no painel) pra
essa configuração valer.

### 5. Publicar a versão definitiva

```
vercel --prod
```

Isso te dá um link fixo, tipo `https://mover-diagnosticos.vercel.app` (ou o nome que você
escolher). É esse link que substitui a URL usada dentro do app pra gerar os links de envio
pra família — o app já detecta a URL automaticamente, não precisa editar nada no código.

### Domínio próprio (opcional)

Se você tiver um domínio (ex.: `diagnosticos.marcelowietha.com.br`), dá pra apontar ele pro
Vercel em **Settings → Domains** dentro do projeto. Me avise se quiser ajuda nessa parte.

## Atualizações futuras

Quando eu (Claude) atualizar o app aqui no chat, você recebe um novo `App.jsx` — é só
substituir o arquivo dentro de `src/App.jsx` neste projeto e rodar `vercel --prod` de novo.

## Banco de dados (Supabase)

Já está tudo conectado, não precisa mexer em nada aqui — as chaves do Supabase que já
estão no código são as chaves públicas, seguras para estarem no código do app (elas só
permitem inserir respostas, não ler os dados de ninguém).
