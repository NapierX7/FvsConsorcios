# Atualizações do Site - Sessão de 27/02/2026

Este documento resume as principais alterações e melhorias realizadas no site da FVS Consórcios durante a sessão de hoje, comparando com a versão anterior ("ANTIGO FVS").

## 1. Melhorias Visuais e de Conteúdo

### Slogan e Cabeçalho
- **Novo Slogan:** A logo antiga (`logo sem fundo FVS.png`) no topo foi substituída pelo novo "Slogan FVS Remaster" (`sloganfvs remaster.png`) em tamanho ampliado.
- **Posicionamento:** O slogan agora "transborda" levemente o header para dar um efeito visual mais dinâmico e moderno.
    - *Antes:* A logo ficava contida dentro do header de tamanho padrão.
    - *Agora:* A logo flutua sobre o header (`top: -30px` no desktop, `top: -22px` no mobile) e tem altura de `160px` (desktop) e `120px` (mobile).
- **Ajuste de Altura:** A altura do header foi fixada em `100px` (desktop) e `80px` (mobile) para garantir consistência.
- **Espaçamento:** A margem superior da seção "Hero" (topo com a foto principal) foi ajustada para eliminar o espaço em branco indesejado entre o header e a imagem, alinhando-se perfeitamente com a altura fixa do menu.

### Nova Seção "Central de Conhecimento"
- **Vídeos Explicativos:** Criada uma nova seção dedicada (`.knowledge-center`) para agrupar os vídeos informativos sobre consórcio.
- **Layout em Grade:** Os vídeos agora são apresentados em cards organizados, com títulos claros e descrições curtas.
- **Thumbnails Corrigidas:**
    - Substituídas as imagens quebradas por thumbnails existentes e relevantes (`thumb lance fixo.jpg`, `thumb consultoria consorcio.jpg`).
    - Adicionado suporte a "Lazy Loading" para melhorar a performance de carregamento das imagens.
- **Links de Vídeos Ajustados:**
    - Vídeo "Lances Embutidos" vinculado a `lance fixo.mp4`.
    - Vídeo "Reformar e Construir" vinculado a `consultoria consorcio.mp4`.

### Remoção de Elementos Antigos
- **Pop-up Teaser:** O vídeo de "Incentivo" que aparecia como pop-up intrusivo na versão antiga foi removido. O conteúdo foi reaproveitado na nova seção de vídeos.
- **Botões de Vídeo nos Benefícios:** Removidos os botões de "Ver vídeo" que ficavam dentro dos cards de benefícios, centralizando a experiência de vídeo na nova seção dedicada.

## 2. Ajustes Técnicos e de Usabilidade

### Botão de Play e Animações
- **Alinhamento do Overlay:** Corrigida a animação de pulso do botão de play, que agora utiliza a cor dourada (identidade da marca) em vez do verde padrão do WhatsApp.
- **Centralização Visual:** Ajustado o `padding-left` do ícone de play para `6px` para corrigir a ilusão de ótica que o deixava descentralizado.
- **Animação Personalizada:** Criada a animação `@keyframes pulse-gold` para garantir que o efeito visual esteja alinhado com o design do site.

### Navegação e Links
- **Links Externos:** Links para WhatsApp e mapas agora abrem em nova aba (`target="_blank"`) para não tirar o usuário do site.
- **Rolagem Suave:** Implementado `scroll-behavior: smooth` no CSS global para que a navegação pelos menus ("Quem Somos", "Serviços") deslize suavemente pela página.

### Mobile
- **Legibilidade:** A cor do texto do botão "Fale Conosco" no menu mobile foi alterada para branco, corrigindo o problema de "tom sobre tom" que existia na versão anterior.
- **Botão Sólido:** O botão mobile agora tem fundo preenchido com a cor secundária (dourado) para maior destaque.

## 3. Performance
- **Carregamento Otimizado:** Imagens secundárias agora carregam sob demanda (lazy loading), acelerando a abertura inicial do site.
- **Preload:** A imagem principal do topo (`fotofabianaprincipal.jpg`) foi configurada no `<head>` com `<link rel="preload">` para carregar com prioridade máxima, evitando "piscar" ao abrir a página.

---

**Resumo da Comparação (Antes vs. Depois):**

| Recurso | Versão Antiga (ANTIGO FVS) | Versão Atual (Projeto FVS) |
| :--- | :--- | :--- |
| **Logo no Topo** | Pequena, contida no header | "Slogan Remaster" grande, transbordando o header |
| **Vídeos** | Botões espalhados | Seção "Central de Conhecimento" dedicada e organizada |
| **Header** | Altura variável | Altura fixa (100px desktop / 80px mobile) |
| **Botão Play** | Verde (padrão WhatsApp) | Dourado (Identidade Visual) e centralizado |
| **Navegação** | Pulo seco para as seções | Rolagem suave (Smooth Scroll) |
| **Mobile CTA** | Texto difícil de ler (tom sobre tom) | Botão sólido dourado com texto branco |
| **Performance** | Carregamento padrão | Lazy Loading + Preload de imagem crítica |
