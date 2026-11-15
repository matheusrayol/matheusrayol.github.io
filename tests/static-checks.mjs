#!/usr/bin/env node
/* Checagens estáticas da tarefa #8: CSP em meta tag + tabs de filtro com
   navegação por teclado. Uso: node tests/static-checks.mjs (sem dependências). */
import { readFileSync } from 'node:fs';

let failures = 0;
function check(name, ok) {
  console.log((ok ? 'ok    ' : 'FALHA ') + name);
  if (!ok) failures++;
}

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('assets/css/main.css', 'utf8');
const js = readFileSync('assets/js/main.js', 'utf8');
const theme = readFileSync('assets/js/theme-init.js', 'utf8');

/* ---- CSP ---- */
const cspTag = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
check('CSP em meta tag no index.html', Boolean(cspTag));
const dir = {};
if (cspTag) {
  cspTag[1].split(';').forEach((part) => {
    const p = part.trim();
    if (p) dir[p.split(/\s+/)[0]] = p;
  });
}
check("CSP default-src 'self'", dir['default-src'] === "default-src 'self'");
check("CSP script-src 'self'", dir['script-src'] === "script-src 'self'");
check('CSP style-src permite fonts.googleapis.com', /fonts\.googleapis\.com/.test(dir['style-src'] || ''));
check('CSP font-src permite fonts.gstatic.com', /fonts\.gstatic\.com/.test(dir['font-src'] || ''));
check('CSP img-src permite data:', /(^|\s)data:/.test(dir['img-src'] || ''));
check('CSP connect-src permite o Formspree (fetch do formulário)', /formspree\.io/.test(dir['connect-src'] || ''));
check("CSP object-src 'none'", dir['object-src'] === "object-src 'none'");
check("CSP base-uri 'self'", dir['base-uri'] === "base-uri 'self'");
check('CSP form-action permite o Formspree (POST nativo)', /formspree\.io/.test(dir['form-action'] || ''));

/* ---- nada que a CSP bloquearia ---- */
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .filter((m) => !/application\/ld\+json/.test(m[0]));
check('nenhum <script> inline executável (bloqueado por script-src)', inlineScripts.length === 0);
check('nenhum atributo style= inline (bloqueado por style-src)', !/<[^>]*\sstyle="/.test(html));
check('tema inicial em arquivo externo referenciado', /<script src="assets\/js\/theme-init\.js"><\/script>/.test(html));
check('theme-init.js aplica data-theme', /setAttribute\('data-theme'/.test(theme));

/* ---- tabs de filtro ---- */
const tabs = [...html.matchAll(/<button class="filter[^>]*>/g)];
check('4 botões com role=tab e aria-selected', tabs.length === 4 &&
  tabs.every((m) => /role="tab"/.test(m[0]) && /aria-selected="/.test(m[0])));
check('tablist com aria-label', /role="tablist" aria-label="/.test(html));
check('roving tabindex no HTML: ativa 0, outras -1',
  /class="filter is-active"[^>]*tabindex="0"/.test(html) &&
  (html.match(/class="filter"[^>]*tabindex="-1"/g) || []).length === 3);
check('tabs com aria-controls="archive"', tabs.every((m) => /aria-controls="archive"/.test(m[0])));
check('painel com role=tabpanel e aria-labelledby',
  /id="archive" role="tabpanel" aria-labelledby="tab-all"/.test(html));

/* ---- teclado no main.js ---- */
check('setas ArrowRight/ArrowLeft', /'ArrowRight'/.test(js) && /'ArrowLeft'/.test(js));
check('Home/End', /'Home'/.test(js) && /'End'/.test(js));
check('roving tabindex sincronizado (tabIndex = on ? 0 : -1)', /tabIndex = on \? 0 : -1/.test(js));
check('painel recebe aria-labelledby da tab ativa', /archive\.setAttribute\('aria-labelledby'/.test(js));
check('sprite sem style inline: classe .svg-sprite no CSS', /\.svg-sprite \{ position: absolute; \}/.test(css));

console.log(failures ? `\n${failures} checagem(ns) falharam` : '\nTodas as checagens passaram');
process.exit(failures ? 1 : 0);
