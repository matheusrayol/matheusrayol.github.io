# matheusrayol.com

Portfólio pessoal de Matheus Rayol, publicado via GitHub Pages em [matheusrayol.com](https://matheusrayol.com).

Site estático, sem etapa de build:

- `index.html`: página única (início, sobre, projetos, experiência, arquivo e contato)
- `assets/css/main.css`: estilos, com tema claro e escuro
- `assets/js/main.js`: menu, tema, idioma, animações, arquivo de projetos (dados e galeria) e envio do formulário via Formspree
- `assets/js/i18n-en.js`: textos em inglês. O português fica no próprio `index.html`; cada trecho traduzível tem `data-i18n` (conteúdo), `data-i18n-label` (rótulo de campo) ou `data-i18n-attr` (atributos)

Idioma: visitantes com fuso horário do Brasil ou de Portugal veem PT; os demais veem EN. O botão PT/EN no topo troca e memoriza a escolha, e `?lang=pt` ou `?lang=en` na URL força um idioma.

Para visualizar localmente: `python3 -m http.server` e abra `http://localhost:8000`.
