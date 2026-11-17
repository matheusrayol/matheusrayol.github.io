## Antes

O portfólio tinha 22 links de projeto quebrados (subpáginas de curso que não existem mais), um número de catálogo errado, o selo "Em beta" num produto que já está em 1.0 estável, contraste insuficiente no tema claro, zero cabeçalhos de segurança e um script inline que impedia uma CSP sem 'unsafe-inline'.

## Depois

- **Links de projeto mortos removidos** (array `projects` do `main.js`): saíram os `url`/`code` de 10 projetos de curso e bootcamp — FEI, FEII e DIO —, ou seja, 20 links que apontavam para subpáginas inexistentes; o XMBR, que apontava para `xmbr.org` (domínio sem registro), passou a apontar para o repositório real no GitHub (matheusrayol/HyperOS-Brazilian-Portuguese), no array e no mini-card. São 22 links quebrados no total.
- **Número do catálogo corrigido**: "mais de 450 mil cartas" → "mais de 100 mil impressões pesquisáveis" (PT e EN). O 450.000 era um `estimatedTotal` fixo no sync do Scryfall, nunca uma contagem real.
- **Selo do produto**: "Em beta" → "1.0 estável" (o Sideboardy saiu em 1.0 estável em 25/10/2026; `versionConfig.js` está com `isBeta: false` desde então).
- **Contraste do tema claro**: `.pill-amber` passou de 3,10:1 para 5,16:1 e `.brand-mark` de 3,17:1 para 6,14:1 (mínimo WCAG AA: 4,5:1). Números recalculados a partir do CSS final desta PR; medidos no navegador, sobre o fundo real do card, a `.pill-amber` dá 4,80:1 — as duas medições passam de 4,5:1.
- **Cabeçalhos e metadados**: meta tag de CSP (`default-src 'self'; script-src 'self'` sem `unsafe-inline`, com o script do tema extraído para `assets/js/theme-init.js`), meta tags `twitter:*`, `robots.txt` e `sitemap.xml` novos.
- **Acessibilidade das tabs de filtro**: roving tabindex, setas/Home/End, `aria-controls`, `aria-labelledby` e `role="tabpanel"` no `#archive`.
- **Peso da página**: 3 imagens sem uso removidas (−678 KB) e `width`/`height` no tile da galeria para evitar layout shift.
- **CSP estrita** (issue #21, 3 linhas): o `style-src` da meta CSP perde o `'unsafe-inline'` — agora é `style-src 'self' https://fonts.googleapis.com`. Para isso, o único estilo inline do site (o `style="position:absolute"` do sprite de ícones) vira a classe `.svg-sprite`, com a regra `.svg-sprite { position: absolute; }` no `assets/css/main.css`. O repositório não tem nenhum outro estilo inline nem escrita de estilo via JS, então nada mais depende do `'unsafe-inline'`.
- **Checagens estáticas**: `tests/static-checks.mjs` (sem dependências, 29 checagens) cobre CSP, tabs, metas, robots/sitemap, resíduos conhecidos e paridade do i18n.

## Nota de conteúdo: os links da MRF e da EcoMud foram mantidos

Este PR **mantém** os links para `https://mrf.services` (botão "Visitar mrf.services" no hero, link do rodapé, `worksFor.url` do JSON-LD) e para `https://ecomud.com.br` (tile "Ecomud" no Arquivo). O link do Ecomud sai **inalterado** em relação à `main`: ele não é um dos links removidos aqui.

Uma medição feita de dentro da rede de build dava `curl 000` e TLS com altname inválido, e o primeiro commit desta série chegou a remover esses links com base nisso. **Medições posteriores, feitas de fora da rede, mostram os dois sites no ar**: `mrf.services` resolve publicamente (A `69.6.213.193`, Hostgator BR) e responde **HTTP 200** com a página da MRF carregada; `ecomud.com.br` responde **200** (WordPress, CNPJ 36.089.075/0001-38, Savassi/BH).

A explicação do 000 é de rota, não de site: **de dentro da rede do workspace o nome `mrf.services` resolve para um endereço interno/Tailscale** — o mesmo domínio, por DNS público, resolve para `69.6.213.193` e responde normalmente. Por isso o link da sua própria empresa estava sendo removido por engano, e por isso o `tests/static-checks.mjs` **exige** a presença desses links (3 hrefs + `worksFor.url` + as chaves EN), e não a ausência.

Use a apex, sem `www`: é o formato que o repositório inteiro usa e o que o `tests/static-checks.mjs` exige — a mutação que troca o href por `www` faz o teste falhar. Medido de fora em 17/11/2026, `https://www.mrf.services/` também responde **200** (mesmo nginx/1.29.8), então a escolha é por consistência de link canônico, não por indisponibilidade do `www`.

O único link realmente morto era o `xmbr.org` (sem registro A e sem CNAME) — por isso ele foi repontado para o repositório no GitHub.

## Verificação — três revisões independentes, todas passaram

**Revisão 1 (@rayol, autor da base):** servidor local + Chromium headless — zero erros de console, zero requisições falhadas, todos os links internos 200, JSON-LD válido, tema e idioma alternando sem flash, menu móvel com `aria-expanded`, foco visível e formulário com validação nativa. `node --check` nos 3 JS, parser de HTML e `node tests/static-checks.mjs` passando.

**Revisão 2 (@vigia, pré-merge, sobre a base `2e0472a`):** **veredito: pronto para merge, sem bloqueio de código.**
- JSON-LD: 1 bloco, 0 erro de parse; schema.org válido (`worksFor` sem `url` continua válido — `url` é opcional em `Organization`).
- i18n: 114 usos de `data-i18n`, 13 chamadas de `t('…')` e 10 `data-i18n-attr` — nenhum par ausente, nenhuma chave órfã; troca PT→EN→PT no navegador sem "undefined"/"NaN".
- Galeria: 12 tiles, todas as imagens carregadas (`naturalWidth > 0`), sem 404 e sem overflow horizontal em 360/768/1440 (idêntico à `main`).
- Contraste medido no render (Chrome computado): `.pill-amber` 2,88:1 → 4,80:1 e `.brand-mark` 3,17:1 → 6,14:1 — ambos AA.
- CSP: três variantes medidas no navegador — a CSP atual dá 0 mensagens e 0 violações; tirar `'unsafe-inline'` do `style-src` sem mexer no sprite dá 1 violação; trocando o `style="position:absolute"` do sprite pela classe `.svg-sprite` + regra no CSS, a CSP estrita também dá 0 violações. É exatamente a variante que esta PR traz.
- SEO/social: `title`, `description`, `canonical`, `og:*` e `twitter:*` presentes e apontando para arquivo existente.
- Teste de regressão: as checagens foram sabotadas com 13 mutações em cópia limpa — 11 foram capturadas pela checagem certa, e a cópia sem sabotagem passa com exit 0.

**Revisão 3 (@vigia, pré-merge, sobre o diff exato que entra na `main`, `2e0472a..ec77526`):** **veredito: pronto para merge, sem bloqueio de código.** Nada do que já havia sido aprovado quebrou.
- O JSON-LD com o `worksFor.url` de volta é **byte a byte igual ao da `main`** e segue schema.org válido (`url` é propriedade legítima de `Organization`).
- i18n: 109 usos de `data-i18n`, **0 sem par**; `hero.lead` e `mrf.cta` voltaram com o href e o ícone iguais à versão PT.
- O botão do Ecomud volta ao modal (`main.js:232`, restaurado idêntico ao da `main`).
- Referência cruzada de `mrf.services`: 3 hrefs apex no `index.html` + o do EN — idênticos aos da `main` (3 em `46472d2`, 3 em `ec77526`).
- `www` não entra: zero ocorrências de `www.mrf.services` no repositório, e a mutação para `www` faz o teste falhar — a asserção exige o formato exato.
- Teste invertido ainda é teste de verdade: 6 mutações em cópia limpa, todas capturadas pela checagem certa (href trocado para `www`, `worksFor.url` removido, chave `mrf.cta` apagada, href do `hero.lead` removido só no EN, `xmbr.org` reintroduzido no `index.html`), com o controle limpo passando.
- Regressão de comportamento: nenhuma. O diff toca só `index.html`, `i18n-en.js`, `main.js` e `static-checks.mjs`; CSS, `theme-init.js`, tabs e galeria ficam intocados. *Esta última conferência foi feita por leitura de código, sem navegador — a revisão com navegador acima cobre a base `2e0472a`, da qual este diff é continuação direta.*

**As 3 linhas da CSP estrita (`881041d`):** medidas em Chromium headless no branch, **0 mensagens de console e 0 violações de CSP**, com controle negativo — recolocar o `style` inline faz o mesmo teste acusar 1 violação de `style-src-attr`. O diff contra a base são exatamente 3 linhas em 2 arquivos: `index.html:7` (CSP), `index.html:~54` (sprite com `class="svg-sprite"`) e `assets/css/main.css` (`.svg-sprite { position: absolute; }`).

**Commit de restauração dos links (`ec77526`):** `node --check` nos 3 JS, `node tests/static-checks.mjs` com 29 checagens e exit 0, parser de HTML ok.

**Duas lacunas do teste, nenhuma bloqueante:** (a) as strings residuais ("450 mil cartas", "Em beta", "In beta", "xmbr.org", "ecomud.com.br") só são conferidas no `index.html` — reintroduzir "In beta" dentro do `i18n-en.js` passaria; (b) não há checagem de `width`/`height`/`loading` no tile da galeria. O conteúdo está correto nos três arquivos hoje; as duas correções cabem numa linha cada e podem entrar depois do merge.

**Uma ressalva sobre o que o teste prova:** a checagem de presença valida o **formato** do href (apex, sem `www`), não o destino. A prova de que `mrf.services` responde 200 é a medição externa acima, não o teste — de dentro da rede de build o nome ainda não resolve.

Nada é publicado por este PR além da `main` do GitHub Pages.
