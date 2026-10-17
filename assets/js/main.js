(function () {
    'use strict';

    var doc = document.documentElement;
    doc.classList.add('js');

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------- Idioma ---------- */
    var EN = window.I18N_EN || { text: {}, attr: {}, misc: {}, projects: {} };
    var PT = {
        title: document.title,
        description: $('meta[name="description"]').getAttribute('content'),
        roles: ['Especialista em Localização', 'Analista de QA e LQA', 'Desenvolvedor Web', 'Fundador da MRF'],
        menuOpen: 'Abrir menu', menuClose: 'Fechar menu',
        sending: 'Enviando…', sent: 'Mensagem enviada! Retorno em breve.',
        sendError: 'Não foi possível enviar. Tente pelo e-mail falecom@matheusrayol.com.',
        details: 'Ver detalhes: ', openProject: 'Acessar projeto', source: 'Código-fonte', shot: ', captura ',
        langLabel: 'View in English'
    };

    // Fusos horários do Brasil e de Portugal: indicam onde o visitante está.
    var PT_ZONES = /^(America\/(Sao_Paulo|Araguaina|Bahia|Belem|Boa_Vista|Campo_Grande|Cuiaba|Eirunepe|Fortaleza|Maceio|Manaus|Noronha|Porto_Velho|Recife|Rio_Branco|Santarem)|Brazil\/.*|Europe\/Lisbon|Portugal|Atlantic\/(Azores|Madeira))$/;

    function detectLang() {
        var q = (location.search.match(/[?&]lang=(pt|en)\b/) || [])[1];
        if (q) return q;
        try {
            var saved = localStorage.getItem('lang');
            if (saved === 'pt' || saved === 'en') return saved;
        } catch (e) { }
        var tz = '';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
        if (tz) return PT_ZONES.test(tz) ? 'pt' : 'en';
        var langs = navigator.languages || [navigator.language || ''];
        return /^pt-(br|pt)$/i.test(langs[0] || '') ? 'pt' : 'en';
    }

    var lang = 'pt';
    var original = null;

    function captureOriginal() {
        original = { text: [], label: [], attr: [] };
        $$('[data-i18n]').forEach(function (el) { original.text.push([el, el.innerHTML]); });
        $$('[data-i18n-label]').forEach(function (el) { original.label.push([el, el.firstChild.nodeValue]); });
        $$('[data-i18n-attr]').forEach(function (el) {
            var attrs = EN.attr[el.getAttribute('data-i18n-attr')] || {};
            var saved = {};
            Object.keys(attrs).forEach(function (k) { saved[k] = el.getAttribute(k); });
            original.attr.push([el, saved]);
        });
    }

    function t(key) { return (lang === 'en' ? EN.misc : PT)[key]; }

    function applyLang(next) {
        lang = next;
        if (!original) captureOriginal();
        var en = lang === 'en';
        original.text.forEach(function (o) {
            var v = EN.text[o[0].getAttribute('data-i18n')];
            o[0].innerHTML = en && v != null ? v : o[1];
        });
        original.label.forEach(function (o) {
            var v = EN.text[o[0].getAttribute('data-i18n-label')];
            o[0].firstChild.nodeValue = en && v != null ? v : o[1];
        });
        original.attr.forEach(function (o) {
            var attrs = EN.attr[o[0].getAttribute('data-i18n-attr')] || {};
            Object.keys(o[1]).forEach(function (k) { o[0].setAttribute(k, en ? attrs[k] : o[1][k]); });
        });
        doc.setAttribute('lang', en ? 'en' : 'pt-BR');
        document.title = t('title');
        $('meta[name="description"]').setAttribute('content', t('description'));
        var btn = $('#lang-toggle');
        $('span', btn).textContent = en ? 'PT' : 'EN';
        btn.setAttribute('aria-label', t('langLabel'));
        btn.setAttribute('title', t('langLabel'));
        menuBtn.setAttribute('aria-label', nav.classList.contains('is-open') ? t('menuClose') : t('menuOpen'));
        if (rotator) { roleIdx = 0; rotator.textContent = t('roles')[0]; }
        renderArchive();
        if (current && modal.open) fillModal();
    }

    /* ---------- Tema ---------- */
    $('#theme-toggle').addEventListener('click', function () {
        var next = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        doc.setAttribute('data-theme', next);
        $('meta[name="theme-color"]').setAttribute('content', next === 'light' ? '#f7f6f2' : '#0b0d12');
        try { localStorage.setItem('theme', next); } catch (e) { }
    });

    /* ---------- Header e menu ---------- */
    var header = $('.site-header');
    var nav = $('#nav');
    var menuBtn = $('#menu-toggle');

    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        header.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? t('menuClose') : t('menuOpen'));
        $('use', menuBtn).setAttribute('href', open ? '#i-close' : '#i-menu');
    }
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

    /* Link ativo conforme a seção visível */
    var links = $$('a', nav);
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (a) {
                    a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        $$('main section[id]').forEach(function (s) { spy.observe(s); });
    }

    /* ---------- Papéis rotativos ---------- */
    var rotator = $('#role-rotator');
    var roleIdx = 0;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rotator && !reduced) {
        setInterval(function () {
            rotator.classList.add('is-out');
            setTimeout(function () {
                var roles = t('roles');
                roleIdx = (roleIdx + 1) % roles.length;
                rotator.textContent = roles[roleIdx];
                rotator.classList.remove('is-out');
            }, 300);
        }, 2800);
    }

    /* ---------- Reveal ---------- */
    if ('IntersectionObserver' in window && !reduced) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        $$('.reveal').forEach(function (el) { io.observe(el); });
    } else {
        $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- Arquivo de projetos ---------- */
    var IMG = 'assets/img/portfolio/';
    var range = function (dir, prefix, from, to, ext) {
        var out = [];
        for (var i = from; i <= to; i++) out.push(IMG + dir + '/' + prefix + i + (ext || '.png'));
        return out;
    };
    var DIO = 'https://github.com/matheusrayol/dio-orbi-games-developer/tree/main/';
    var DIO_URL = 'https://matheusrayol.com/dio-orbi-games-developer/';
    var DIO_COURSE = 'DIO Órbi Web Games Developer';

    var projects = [
        {
            title: 'App To-Do', cat: 'curso', sub: 'Front-End II · Certified Tech Developer',
            desc: 'Aplicação web para gerenciamento de tarefas consumindo a API da instituição de ensino, com Bootstrap 5 e customizações próprias em CSS e JavaScript.',
            meta: { Curso: 'Certified Tech Developer', Disciplina: 'Front-End II', Entrega: 'Abril/2022' },
            url: 'https://matheusrayol.com/FEII-CheckpointII', code: 'https://github.com/matheusrayol/FEII-CheckpointII',
            imgs: [IMG + 'todoapp/todoapp.png'].concat(range('todoapp', 'todo_', 1, 11))
        },
        {
            title: 'Game Geek', cat: 'curso', sub: 'Front-End II · Certified Tech Developer',
            desc: 'Biblioteca online para cadastro de jogos, com manipulação do DOM e estilos customizados sobre o Bootstrap 5.',
            meta: { Curso: 'Certified Tech Developer', Disciplina: 'Front-End II', Entrega: 'Março/2022' },
            url: 'https://matheusrayol.com/FEII-CheckpointI', code: 'https://github.com/matheusrayol/FEII-CheckpointI',
            imgs: [IMG + 'gamegeek/gamegeek.jpg'].concat(range('gamegeek', 'gamegeek_', 2, 5))
        },
        {
            title: 'Streamy', cat: 'curso', sub: 'Front-End I · Certified Tech Developer',
            desc: 'Protótipo de um serviço de streaming, com página individual para os itens do catálogo.',
            meta: { Curso: 'Certified Tech Developer', Disciplina: 'Front-End I', Entrega: 'Dezembro/2021' },
            url: 'https://matheusrayol.com/FEI-CheckpointIII', code: 'https://github.com/matheusrayol/FEI-CheckpointIII',
            imgs: [IMG + 'streamy/streamy.jpg'].concat(range('streamy', 'streamy_', 2, 5))
        },
        {
            title: 'Minha Cidade v2', cat: 'curso', sub: 'Front-End I · Certified Tech Developer',
            desc: 'Curiosidades e pontos turísticos da cidade, reconstruído com os conhecimentos adquiridos após a primeira versão.',
            meta: { Curso: 'Certified Tech Developer', Disciplina: 'Front-End I', Entrega: 'Novembro/2021' },
            url: 'https://matheusrayol.com/FEI-CheckpointII', code: 'https://github.com/matheusrayol/FEI-CheckpointII',
            imgs: [IMG + 'minhacidadev2/minhacidadev2.png'].concat(range('minhacidadev2', 'minhacidadev2_', 2, 4))
        },
        {
            title: 'Minha Cidade', cat: 'curso', sub: 'Front-End I · Certified Tech Developer',
            desc: 'Página com curiosidades e pontos turísticos da cidade em que residimos.',
            meta: { Curso: 'Certified Tech Developer', Disciplina: 'Front-End I', Entrega: 'Novembro/2021' },
            url: 'https://matheusrayol.com/FEI-CheckpointI', code: 'https://github.com/matheusrayol/FEI-CheckpointI',
            imgs: [IMG + 'minhacidade/minhacidade.png', IMG + 'minhacidade/minhacidade_2.png']
        },
        {
            title: 'Jogo Dino', cat: 'bootcamp', sub: 'Bootcamp Órbi Web Games Developer',
            desc: 'Recriação do jogo do dinossauro presente no Chrome, feita com HTML e JavaScript.',
            meta: { Curso: DIO_COURSE, Tecnologias: 'HTML + JavaScript', Entrega: 'Abril/2022' },
            url: DIO_URL + '05-Chrome_Dino_Game', code: DIO + '05-Chrome_Dino_Game',
            imgs: [IMG + 'dio/dino.png']
        },
        {
            title: 'Space Shooter', cat: 'bootcamp', sub: 'Bootcamp Órbi Web Games Developer',
            desc: 'Recriação de um jogo de nave no estilo Space Shooter, feita com HTML e JavaScript.',
            meta: { Curso: DIO_COURSE, Tecnologias: 'HTML + JavaScript', Entrega: 'Abril/2022' },
            url: DIO_URL + '04-Jogo_Space_Shooter', code: DIO + '04-Jogo_Space_Shooter',
            imgs: [IMG + 'dio/spaceshooter.png']
        },
        {
            title: 'Jogo Genius', cat: 'bootcamp', sub: 'Bootcamp Órbi Web Games Developer',
            desc: 'Recriação do clássico jogo de memória Genius, feita com HTML e JavaScript.',
            meta: { Curso: DIO_COURSE, Tecnologias: 'HTML + JavaScript', Entrega: 'Abril/2022' },
            url: DIO_URL + '03-Jogo_Genesis', code: DIO + '03-Jogo_Genesis',
            imgs: [IMG + 'dio/genius.png']
        },
        {
            title: 'Jogo Resgate', cat: 'bootcamp', sub: 'Bootcamp Órbi Web Games Developer',
            desc: 'Recriação do jogo Resgate, feita com HTML e JavaScript.',
            meta: { Curso: DIO_COURSE, Tecnologias: 'HTML + JavaScript', Entrega: 'Abril/2022' },
            url: DIO_URL + '02-Jogo_de_naves', code: DIO + '02-Jogo_de_naves',
            imgs: [IMG + 'dio/resgate.png', IMG + 'dio/dio-resgate_1.png']
        },
        {
            title: 'Jogo da Velha', cat: 'bootcamp', sub: 'Bootcamp Órbi Web Games Developer',
            desc: 'Jogo da velha para dois jogadores, feito com HTML e JavaScript.',
            meta: { Curso: DIO_COURSE, Tecnologias: 'HTML + JavaScript', Entrega: 'Abril/2022' },
            url: DIO_URL + '01-Jogo_da_velha', code: DIO + '01-Jogo_da_velha',
            imgs: [IMG + 'dio/jogodavelha.png', IMG + 'dio/dio-velha_1.png', IMG + 'dio/dio-velha_2.png']
        },
        {
            title: 'Ecomud', cat: 'institucional', sub: 'WordPress + Avada',
            desc: 'Site institucional da Ecomud, empresa que reaproveita rejeitos de minério para pavimentação sustentável de estradas.',
            meta: { Tipo: 'Site institucional', Tecnologias: 'WordPress + Avada', Entrega: 'Outubro/2021' },
            url: 'https://ecomud.com.br',
            imgs: [IMG + 'ecomud/ecomud.png'].concat(range('ecomud', 'ecomud_', 1, 8))
        },
        {
            title: 'XMBR', cat: 'institucional', sub: 'WordPress + Newspaper',
            desc: 'Portal da comunidade brasileira de usuários Xiaomi, com notícias, tutoriais e traduções.',
            meta: { Tipo: 'Portal de comunidade', Tecnologias: 'WordPress + Newspaper' },
            url: 'https://xmbr.org',
            imgs: [IMG + 'xmbr/xmbr.png']
        }
    ];

    // Textos do projeto no idioma atual (o português é a base).
    function loc(p) {
        var en = lang === 'en' && EN.projects[p.title];
        if (!en) return p;
        return { title: en.title || p.title, sub: en.sub || p.sub, desc: en.desc || p.desc, meta: en.meta || p.meta };
    }

    var archive = $('#archive');
    var activeFilter = 'all';

    function renderArchive() {
        archive.innerHTML = '';
        projects.forEach(function (p, i) {
            var l = loc(p);
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tile';
            btn.dataset.cat = p.cat;
            btn.hidden = activeFilter !== 'all' && p.cat !== activeFilter;
            btn.innerHTML =
                '<div class="tile-img"><img loading="lazy" alt="" src="' + p.imgs[0] + '"></div>' +
                '<div class="tile-body"><h3></h3><p></p></div>';
            $('h3', btn).textContent = l.title;
            $('p', btn).textContent = l.sub;
            btn.setAttribute('aria-label', t('details') + l.title);
            btn.addEventListener('click', function () { openModal(i); });
            archive.appendChild(btn);
        });
    }

    $$('.filter').forEach(function (f) {
        f.addEventListener('click', function () {
            activeFilter = f.dataset.filter;
            $$('.filter').forEach(function (o) {
                o.classList.toggle('is-active', o === f);
                o.setAttribute('aria-selected', String(o === f));
            });
            $$('.tile', archive).forEach(function (tile) {
                tile.hidden = activeFilter !== 'all' && tile.dataset.cat !== activeFilter;
            });
        });
    });

    /* ---------- Modal ---------- */
    var modal = $('#project-modal');
    var current = null, imgIdx = 0;

    function showImg() {
        var imgs = current.imgs;
        $('#modal-img').src = imgs[imgIdx];
        $('#modal-img').alt = loc(current).title + t('shot') + (imgIdx + 1);
        $('#modal-count').textContent = (imgIdx + 1) + ' / ' + imgs.length;
        var multi = imgs.length > 1;
        $('.gal-prev', modal).hidden = !multi;
        $('.gal-next', modal).hidden = !multi;
        $('#modal-count').hidden = !multi;
    }

    function linkBtn(href, label, primary) {
        var a = document.createElement('a');
        a.className = 'btn btn-small ' + (primary ? 'btn-primary' : 'btn-ghost');
        a.href = href; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = label;
        return a;
    }

    function fillModal() {
        var l = loc(current);
        $('#modal-title').textContent = l.title;
        $('#modal-desc').textContent = l.desc;
        var dl = $('#modal-meta'); dl.innerHTML = '';
        Object.keys(l.meta).forEach(function (k) {
            var dt = document.createElement('dt'); dt.textContent = k;
            var dd = document.createElement('dd'); dd.textContent = l.meta[k];
            dl.appendChild(dt); dl.appendChild(dd);
        });
        var links = $('#modal-links'); links.innerHTML = '';
        if (current.url) links.appendChild(linkBtn(current.url, t('openProject'), true));
        if (current.code) links.appendChild(linkBtn(current.code, t('source'), false));
        showImg();
    }

    function openModal(i) {
        current = projects[i]; imgIdx = 0;
        fillModal();
        if (typeof modal.showModal === 'function') modal.showModal();
        else modal.setAttribute('open', '');
    }

    function step(d) {
        if (!current) return;
        imgIdx = (imgIdx + d + current.imgs.length) % current.imgs.length;
        showImg();
    }

    $('.gal-prev', modal).addEventListener('click', function () { step(-1); });
    $('.gal-next', modal).addEventListener('click', function () { step(1); });
    $('[data-close]', modal).addEventListener('click', function () { modal.close(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
    modal.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });

    /* ---------- Formulário ---------- */
    var form = $('#contact-form');
    var status = $('#form-status');
    form.addEventListener('submit', function (e) {
        if (!window.fetch) return;
        e.preventDefault();
        var btn = $('button[type="submit"]', form);
        btn.disabled = true;
        status.className = 'form-status';
        status.textContent = t('sending');
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
            .then(function (res) {
                if (!res.ok) throw new Error();
                form.reset();
                status.className = 'form-status ok';
                status.textContent = t('sent');
            })
            .catch(function () {
                status.className = 'form-status err';
                status.textContent = t('sendError');
            })
            .then(function () { btn.disabled = false; });
    });

    $('#year').textContent = new Date().getFullYear();

    $('#lang-toggle').addEventListener('click', function () {
        var next = lang === 'en' ? 'pt' : 'en';
        try { localStorage.setItem('lang', next); } catch (e) { }
        applyLang(next);
    });
    applyLang(detectLang());
})();
