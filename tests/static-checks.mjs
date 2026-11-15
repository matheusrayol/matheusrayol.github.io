#!/usr/bin/env node
/* Checagens estáticas do site (baseado no WIP antigo f20554a, adaptado ao
   branch agentes/vigia/portfolio-fixes). Uso: node tests/static-checks.mjs */
import { readFileSync, existsSync } from 'node:fs';

let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok    ' : 'FALHA ') + name); if (!ok) failures++; };

const html = readFileSync('index.html', 'utf8');
const js = readFileSync('assets/js/main.js', 'utf8');
const en = readFileSync('assets/js/i18n-en.js', 'utf8');
const css = readFileSync('assets/css/main.css', 'utf8');

// 1) CSP em meta tag, sem unsafe-inline em script-src
const csp = html.match(/<meta\s+http-equiv="content-security-policy"\s+content="([^"]+)"\s*\/?\s*>/i);
check('CSP em meta tag', !!csp);
const policy = csp ? csp[1] : '';
check("script-src 'self' sem unsafe-inline", /script-src[^;]*'self'/.test(policy) && !/script-src[^;]*unsafe-inline/.test(policy));
check('theme-init.js referenciado antes do conteúdo', /assets\/js\/theme-init\.js/.test(html));
const inlineScripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1].trim()).filter(t => t && !t.startsWith('{'));
check('nenhum <script> inline fora de JSON-LD', inlineScripts.length === 0, inlineScripts.length + ' inline');

// 2) Tabs de filtro
const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(m => m[0]);
check('4 tabs de filtro', tabs.length === 4, tabs.length + ' tabs');
check('1 tab com aria-selected=true', tabs.filter(t => /aria-selected="true"/.test(t)).length === 1);
check('tabs sem seleção com tabindex=-1', tabs.filter(t => !/aria-selected="true"/.test(t)).every(t => /tabindex="-1"/.test(t)));
check('tabs com aria-controls="archive"', tabs.every(t => /aria-controls="archive"/.test(t)));
check('painel com role=tabpanel', /role="tabpanel"[^>]*id="archive"/.test(html) || /id="archive"[^>]*role="tabpanel"/.test(html));
check('JS: setas, Home/End, tabIndex e aria-labelledby',
  /ArrowLeft/.test(js) && /ArrowRight/.test(js) && /\.key === 'Home'/.test(js) && /\.key === 'End'/.test(js)
  && /tabIndex = on \? 0 : -1/.test(js) && /aria-labelledby/.test(js));

// 3) Resíduos de issues antigas
for (const bad of ['450 mil cartas', 'Em beta', 'In beta', 'xmbr.org', 'ecomud.com.br'])
  check('sem resíduo "' + bad + '"', !html.includes(bad));
check('nenhum href para mrf.services (não responde externamente)', !/href="https:\/\/mrf\.services/.test(html) && !en.includes('href=\\"https://mrf.services'));

// 4) SEO
check('title', /<title>/.test(html));
check('meta description', /name="description"/.test(html));
check('canonical', /rel="canonical"/.test(html));
check('og:* presente', /property="og:title"/.test(html) && /property="og:image"/.test(html));
check('twitter:* presente', /name="twitter:title"/.test(html) && /name="twitter:description"/.test(html) && /name="twitter:image"/.test(html));
check('viewport', /name="viewport"/.test(html));

// 5) robots/sitemap
check('robots.txt existe', existsSync('robots.txt'));
check('sitemap.xml existe e aponta pro domínio', existsSync('sitemap.xml') && readFileSync('sitemap.xml', 'utf8').includes('https://matheusrayol.com/'));

// 6) i18n paridade básica: toda data-i18n do HTML tem chave no EN
const keys = [...html.matchAll(/data-i18n(?:-label|-attr)?="([a-z0-9.]+)"/g)].map(m => m[1]);
const missing = [...new Set(keys)].filter(k => !en.includes('"' + k + '"'));
check('chaves data-i18n com par no EN', missing.length === 0, missing.join(', '));

// 7) CSS: foco visível e prefers-reduced-motion
check(':focus-visible global', /:focus-visible\s*\{[^}]*outline/.test(css));
check('prefers-reduced-motion', /prefers-reduced-motion/.test(css));

console.log('');
console.log(failures ? failures + ' checagens falharam' : 'Todas as checagens passaram');
process.exit(failures ? 1 : 0);
