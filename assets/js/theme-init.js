/* Tema antes do render (anti-FOUC). Fica fora do index.html porque a CSP
   do site usa script-src 'self' e bloqueia <script> inline. */
(function () {
    'use strict';
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (e) { }
    if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
})();
