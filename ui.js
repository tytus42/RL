// ui.js – warstwa interfejsu pod telefon/tablet.
// Nie zmienia zasad gry: czyta stan ze script.js i steruje jego ukrytymi listami (<select>),
// wywołując te same zdarzenia 'change'/'click', co wcześniej użytkownik.
(function () {
    'use strict';

    // Pliki muszą być z tej samej wersji. Gdy przeglądarka (lub GitHub Pages) poda stary script.js
    // z pamięci podręcznej, interfejs by się nie zbudował i nie dałoby się zagrać karty.
    const UI_VERSION = '2026-10-11d';
    if (typeof APP_VERSION === 'undefined' || APP_VERSION !== UI_VERSION) {
        const box = document.createElement('div');
        box.className = 'version-error';
        box.innerHTML = '<p><strong>Wczytały się pliki z różnych wersji.</strong><br>Odśwież stronę. Jeśli to nie pomoże, wyczyść pamięć podręczną przeglądarki dla tej strony.</p>';
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = 'Odśwież';
        btn.addEventListener('click', () => location.reload());
        box.appendChild(btn);
        document.body.prepend(box);
        return;
    }

    const ROWS = ['melee', 'ranged', 'siege'];
    const ROW_LABEL = { melee: 'Wręcz', ranged: 'Dystans', siege: 'Oblężnicze' };
    const ROW_ICON = { melee: '⚔', ranged: '➶', siege: '⛫' };
    const ABILITY_LABEL = {
        tight_bond: 'Więź', morale_boost: 'Wzmocnienie', spy: 'Szpieg', medic: 'Medyk',
        muster: 'Wezwanie', agile: 'Zwinna', scorch_row: 'Deszcz ognia (rząd)', scorch: 'Deszcz ognia',
        scorch_strongest: 'Deszcz ognia', horn: 'Róg', decoy: 'Chrząszcz', avenger: 'Mściciel',
        summon_next_round: 'Przywołanie', 'Moc': 'Moc', 'Wyzwolenie siły': 'Wyzwolenie siły'
    };
    const WEATHER_ICON = { 'Lodowa fala': '❄', 'Grom': '⚡', 'Rój owadów': '🐝', 'Strach': '☠', 'Magia Braci': '☠', 'Światło': '☀' };

    const $ = (sel, root = document) => root.querySelector(sel);
    const P = () => [players.player1, players.player2];
    const numOf = player => (player === players.player1 ? 1 : 2);
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* brak dostępu */ } }
    };

    // ---------- Kolory frakcji (z Karty_RL.xlsx – kolor wiersza z nazwą talii) ----------
    const FACTION_COLORS = {
        Khorinis: '#E69138', Potwory: '#6AA84F', Najemnicy: '#4285F4', Klasztor: '#EA4335',
        Orkowie: '#FFFF00', Bandyci: '#999999', Nieumarli: '#9900FF', Neutral: '#A61C00'
    };
    const DEFAULT_COLORS = ['#e0a83c', '#6fa8dc'];
    const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const rgbToHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
    const mixWhite = (h, t) => rgbToHex(hexToRgb(h).map(v => v + (255 - v) * t));
    const luminance = h => {
        const [r, g, b] = hexToRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    // Wersja do tekstu na ciemnym tle: rozjaśniamy ciemne kolory (np. fiolet Nieumarłych), aż będą czytelne.
    function readable(h) {
        let t = 0, out = h;
        while (luminance(out) < 0.2 && t < 0.8) { t += 0.05; out = mixWhite(h, t); }
        return out;
    }
    function applyFactionColors() {
        const f = [1, 2].map(n => {
            const pl = players[`player${n}`];
            return (pl && pl.faction) || ($(`#player${n}-faction-select`) || {}).value || '';
        });
        const base = f.map((fac, i) => FACTION_COLORS[fac] || DEFAULT_COLORS[i]);
        // Ta sama frakcja u obu graczy – gracz 2 dostaje jaśniejszy odcień, żeby się odróżniał.
        if (f[0] && f[0] === f[1]) base[1] = luminance(base[1]) > 0.5 ? rgbToHex(hexToRgb(base[1]).map(v => v * 0.6)) : mixWhite(base[1], 0.45);
        const root = document.documentElement.style;
        base.forEach((col, i) => {
            const n = i + 1;
            root.setProperty(`--p${n}`, col);
            root.setProperty(`--p${n}-text`, readable(col));
            root.setProperty(`--p${n}-on`, luminance(col) > 0.35 ? '#1d160c' : '#ffffff');
        });
    }

    // ---------- Wygląd karty na planszy (nadpisuje createCardElement) ----------
    window.createCardElement = function (card) {
        const el = document.createElement('div');
        el.classList.add('card-on-board');
        el.dataset.instanceId = card.instanceId;
        if (card.isHero) el.classList.add('hero-card');
        if (card.isDecoy) el.classList.add('decoy-card');
        if (card.type === 'Horn') el.classList.add('horn-card');
        if (card.type === 'Weather') el.classList.add('weather-card');
        if (card.abilities && card.abilities.includes('spy')) el.classList.add('spy-card');

        let badge = '';
        if (card.type === 'Unit') {
            const fin = card.currentPower ?? card.power;
            const cls = fin < card.power ? 'power-nerfed' : fin > card.power ? 'power-boosted' : '';
            badge = `<span class="card-power ${cls}">${fin}</span>`;
        } else if (card.type === 'Horn') {
            badge = '<span class="card-power card-icon">×2</span>';
        } else if (card.type === 'Weather') {
            badge = `<span class="card-power card-icon">${WEATHER_ICON[card.name] || '☁'}</span>`;
        }
        const name = card.type === 'Horn' ? 'Róg' : (card.isDecoy ? 'Chrząszcz' : card.name);
        el.innerHTML = `${badge}<span class="card-name">${esc(name)}</span>`;
        el.title = card.name + (card.type === 'Unit' ? ` – siła ${card.power}` : '');
        return el;
    };

    // ---------- Odświeżanie po każdej zmianie stanu ----------
    let refreshQueued = false;
    function scheduleRefresh() {
        if (refreshQueued) return;
        refreshQueued = true;
        queueMicrotask(() => { refreshQueued = false; refreshUi(); });
    }
    ['updatePlayerControlsVisibility', 'activateDecoyMode', 'deactivateDecoyMode', 'executeResurrection'].forEach(fn => {
        const orig = window[fn];
        if (typeof orig !== 'function') return;
        window[fn] = function () { const r = orig.apply(this, arguments); scheduleRefresh(); return r; };
    });

    // Koniec gry: nie pytaj „czy opuścić stronę” przy automatycznym przeładowaniu.
    let gameRunning = false;
    const origCheckGameOver = window.checkGameOver;
    window.checkGameOver = function () {
        const over = players.player1.crystalCount <= 0 || players.player2.crystalCount <= 0;
        if (over) gameRunning = false;
        return origCheckGameOver.apply(this, arguments);
    };

    // ---------- Pasek wyniku, status, stan paneli ----------
    let medicWasActive = false;

    function gemsHtml(n) {
        let s = '';
        for (let i = 0; i < 2; i++) s += `<i class="gem ${i < n ? 'on' : 'off'}"></i>`;
        return s;
    }

    function statusText() {
        const act = activePlayer;
        if (isMusterModeActive && pendingMuster) return { cls: 'mode', text: `📯 ${pendingMuster.player.name}: Wezwanie – wybierz karty, które kładziesz.`, action: 'muster' };
        if (isDecoyModeActive && act) return { cls: 'mode', text: `🪲 ${act.name}: dotknij jednostkę na swoim polu. Dotknięcie gdzie indziej anuluje.` };
        if (isAgileResurrectionModeActive && act) return { cls: 'mode', text: `${act.name}: wybierz rząd dla „${cardToResurrectWithAgile ? cardToResurrectWithAgile.name : ''}”.` };
        if (isMedicModeActive && act) return { cls: 'mode', text: `✚ ${act.name}: medyk – wybierz kartę z cmentarza.`, action: 'medic' };
        if (passedPlayers.length === 2) return { cls: '', text: 'Obaj spasowali – liczenie tury…' };
        if (isFirstMoveOfRound) return { cls: '', text: `Tura ${roundNumber} – zaczyna dowolny gracz.` };
        if (act) {
            const opp = act === players.player1 ? players.player2 : players.player1;
            const extra = passedPlayers.includes(opp) ? ` (${opp.name} spasował)` : '';
            return { cls: 'turn', text: `Ruch: ${act.name}${extra}` };
        }
        return { cls: '', text: '' };
    }

    function refreshUi() {
        if (battlefieldScreen.style.display === 'none') return;

        // Pasek wyniku
        P().forEach(pl => {
            const n = numOf(pl);
            $(`#sb-name-${n}`).textContent = pl.name;
            $(`#sb-total-${n}`).textContent = pl.power;
            $(`#sb-gems-${n}`).innerHTML = gemsHtml(pl.crystalCount);
            const sb = $(`.sb-p${n}`);
            sb.classList.toggle('is-active', activePlayer === pl && !passedPlayers.includes(pl));
            sb.classList.toggle('is-passed', passedPlayers.includes(pl));
            sb.classList.toggle('is-leading', pl.power > (pl === players.player1 ? players.player2 : players.player1).power);
        });
        $('#sb-round').textContent = `Tura ${roundNumber}`;
        $('#undo-btn').disabled = !canUndo();
        $('#redo-btn').disabled = !canRedo();

        const st = statusText();
        const banner = $('#status-banner');
        banner.className = 'status-banner ' + st.cls;
        banner.textContent = st.text;
        if (st.action === 'medic' || st.action === 'muster') {
            const b = document.createElement('button');
            b.className = 'btn-small banner-btn';
            b.textContent = st.action === 'medic' ? 'Cmentarz' : 'Wybierz karty';
            b.addEventListener('click', () => (st.action === 'medic' ? openGraveyard(activePlayer, true) : openMusterPicker(pendingMuster)));
            banner.appendChild(b);
        }

        // Panele graczy
        P().forEach(pl => {
            const n = numOf(pl);
            const canAct = !passedPlayers.includes(pl) && (isFirstMoveOfRound || activePlayer === pl);
            const state = passedPlayers.includes(pl) ? 'is-passed' : canAct ? 'is-active' : 'is-waiting';
            document.querySelectorAll(`[data-player="${n}"].player-sidebar, [data-player="${n}"].player-board-area`).forEach(el => {
                el.classList.remove('is-active', 'is-passed', 'is-waiting');
                el.classList.add(state);
            });
            const sidebar = $(`.player${n}-sidebar`);
            $('.turn-badge', sidebar).textContent = state === 'is-passed' ? 'spasował' : state === 'is-active' ? (isFirstMoveOfRound ? 'może zacząć' : 'twój ruch') : 'czeka';
            $(`#player${n}-name-display`).textContent = pl.name;
            refreshControls(pl);
        });

        // Tryb medyka: otwórz cmentarz automatycznie raz, gdy tryb się włącza
        if (isMedicModeActive && activePlayer && !medicWasActive) openGraveyard(activePlayer, true);
        if (!isMedicModeActive && medicWasActive && sheetState && sheetState.kind === 'medic') closeSheet();
        medicWasActive = isMedicModeActive;
        if (!isMusterModeActive && sheetState && sheetState.kind === 'muster') closeSheet();
    }

    // ---------- Sterowanie gracza: przycisk karty, przyciski rzędu, cmentarz ----------
    function ensureControls(pl) {
        const n = numOf(pl);
        const section = $(`.player${n}-sidebar .card-play-section`);
        if (section.dataset.enhanced) return;
        section.dataset.enhanced = '1';

        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'card-pick-btn';
        pick.id = `pick-card-${n}`;
        pick.addEventListener('click', () => openCardPicker(pl));
        section.insertBefore(pick, section.firstChild);

        const rows = document.createElement('div');
        rows.className = 'row-choice';
        rows.id = `row-choice-${n}`;
        section.insertBefore(rows, pl.domElements.playCardButton);

        const grave = document.createElement('button');
        grave.type = 'button';
        grave.className = 'btn-grave';
        grave.id = `grave-btn-${n}`;
        grave.addEventListener('click', () => openGraveyard(pl, isMedicModeActive && activePlayer === pl));
        const sec = $(`.player${n}-sidebar .secondary-actions`);
        sec.insertBefore(grave, sec.firstChild);
    }

    function refreshControls(pl) {
        ensureControls(pl);
        const n = numOf(pl);
        const d = pl.domElements;

        // Przycisk wyboru karty
        const pick = $(`#pick-card-${n}`);
        const selected = d.cardSelect.value ? getCardDetailsById(d.cardSelect.value) : null;
        pick.disabled = d.cardSelect.disabled;
        pick.innerHTML = selected
            ? `${selected.type === 'Unit' ? `<span class="card-power">${selected.power}</span>` : ''}<span class="pick-name">${esc(selected.name)}</span><span class="pick-change">zmień</span>`
            : `<span class="pick-name muted">Wybierz kartę…</span><span class="pick-count">${pl.availableCards.length}</span>`;
        pick.classList.toggle('has-card', !!selected);

        // Przyciski rzędu (lustro ukrytego <select>)
        const box = $(`#row-choice-${n}`);
        const opts = [...d.rowSelect.options].filter(o => o.value);
        box.innerHTML = '';
        box.hidden = d.rowSelect.disabled || opts.length === 0;
        opts.forEach(o => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `row-btn row-${o.value}`;
            b.innerHTML = `<span>${ROW_ICON[o.value] || ''}</span> ${esc(o.text)}`;
            b.setAttribute('aria-pressed', String(d.rowSelect.value === o.value));
            b.addEventListener('click', () => {
                d.rowSelect.value = o.value;
                box.querySelectorAll('.row-btn').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
                d.rowSelect.dispatchEvent(new Event('change', { bubbles: true }));
                updatePlayButton(pl);
            });
            box.appendChild(b);
        });

        updatePlayButton(pl);

        // Cmentarz
        const grave = $(`#grave-btn-${n}`);
        grave.textContent = `Cmentarz (${pl.graveyard.length})`;
        grave.disabled = pl.graveyard.length === 0;
        grave.classList.toggle('pulse', isMedicModeActive && activePlayer === pl);

        // Dowódca
        const lb = d.activateLeaderButton;
        if (pl.commander && pl.commander.isUsed) { lb.textContent = 'Użyty'; lb.classList.add('used'); }
        else { lb.textContent = 'Użyj'; lb.classList.remove('used'); }

        // Pasowanie – reset uzbrojenia, gdy przycisk się zablokował
        if (d.passRoundButton.disabled) disarmPass(d.passRoundButton);
    }

    function updatePlayButton(pl) {
        const d = pl.domElements;
        const selected = d.cardSelect.value ? getCardDetailsById(d.cardSelect.value) : null;
        const needsRow = !d.rowSelect.disabled && [...d.rowSelect.options].some(o => o.value);
        let label = 'Zagraj';
        if (selected) {
            label = needsRow && !d.rowSelect.value ? 'Wybierz rząd' : `Zagraj: ${selected.name}`;
            if (selected.abilities && selected.abilities.includes('decoy') && d.playCardButton.disabled) label = 'Brak celu dla Chrząszcza';
        }
        if (selected && selected.type === 'Special' && selected.abilities && selected.abilities.includes('horn') && !needsRow) label = 'Każdy rząd ma już róg';
        d.playCardButton.textContent = label;
        d.playCardButton.hidden = !selected && !isAgileResurrectionModeActive;
        if (isMedicModeActive && activePlayer === pl) d.playCardButton.hidden = true;
        if (isAgileResurrectionModeActive && activePlayer === pl) d.playCardButton.hidden = true;
        if (isMusterModeActive) d.playCardButton.hidden = true;
    }

    // ---------- Potwierdzenie pasowania (dwa dotknięcia) ----------
    function disarmPass(btn) {
        if (!btn.dataset.armed) return;
        delete btn.dataset.armed;
        btn.classList.remove('armed');
        btn.textContent = 'Pasuj';
        clearTimeout(btn._t);
    }
    document.addEventListener('click', e => {
        const btn = e.target.closest('#passRoundButton1, #passRoundButton2');
        if (!btn || btn.disabled) return;
        if (btn.dataset.armed) { disarmPass(btn); return; } // drugie dotknięcie – przepuść do script.js
        e.stopImmediatePropagation();
        e.preventDefault();
        btn.dataset.armed = '1';
        btn.classList.add('armed');
        btn.textContent = 'Na pewno pasujesz?';
        btn._t = setTimeout(() => disarmPass(btn), 3500);
    }, true);

    // ---------- Arkusz wyboru ----------
    let sheetState = null;
    const sheet = $('#sheet');

    function renderSheetFoot() {
        const cfg = sheetState;
        const foot = $('#sheet-foot');
        foot.innerHTML = '';
        const footer = typeof cfg.footer === 'function' ? cfg.footer() : cfg.footer;
        (footer || []).forEach(f => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = f.cls || 'btn-small';
            b.textContent = f.label;
            if (f.disabled) b.disabled = true;
            b.addEventListener('click', f.onClick);
            foot.appendChild(b);
        });
        foot.hidden = !(footer && footer.length);
    }

    function openSheet(cfg) {
        sheetState = cfg;
        $('#sheet-title').textContent = cfg.title;
        const search = $('#sheet-search');
        search.value = '';
        search.parentElement.hidden = !cfg.searchable;
        cfg.filter = 'all';
        const filters = $('#sheet-filters');
        filters.innerHTML = '';
        (cfg.filters || []).forEach(f => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip';
            b.textContent = f.label;
            b.setAttribute('aria-pressed', String(f.key === 'all'));
            b.addEventListener('click', () => {
                cfg.filter = f.key;
                filters.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
                renderSheetList();
            });
            filters.appendChild(b);
        });
        filters.hidden = !(cfg.filters && cfg.filters.length);
        renderSheetFoot();
        renderSheetList();
        sheet.hidden = false;
        document.body.classList.add('sheet-open');
        $('#sheet-list').scrollTop = 0;
    }

    function closeSheet() {
        sheet.hidden = true;
        document.body.classList.remove('sheet-open');
        sheetState = null;
    }
    sheet.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) {
            const st = sheetState;
            closeSheet();
            if (st && st.onClose) st.onClose();
        }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetState) { const st = sheetState; closeSheet(); if (st.onClose) st.onClose(); } });
    $('#sheet-search').addEventListener('input', () => renderSheetList());

    function renderSheetList() {
        const cfg = sheetState;
        if (!cfg) return;
        const q = $('#sheet-search').value.trim().toLocaleLowerCase('pl');
        const list = $('#sheet-list');
        const items = cfg.items.filter(it =>
            (cfg.filter === 'all' || it.group === cfg.filter || (it.tags || []).includes(cfg.filter)) &&
            (!q || it.name.toLocaleLowerCase('pl').includes(q)));
        list.innerHTML = '';
        if (!items.length) {
            list.innerHTML = `<p class="sheet-empty">${cfg.emptyText || 'Brak kart.'}</p>`;
            return;
        }
        let lastGroup = null;
        items.forEach(it => {
            if (cfg.groupLabels && it.group !== lastGroup) {
                lastGroup = it.group;
                const h = document.createElement('h4');
                h.className = 'sheet-group';
                h.textContent = cfg.groupLabels[it.group] || it.group;
                list.appendChild(h);
            }
            const b = document.createElement('button');
            b.type = 'button';
            const isSel = cfg.multi && cfg.selected.has(it.key);
            b.className = 'tile' + (it.hero ? ' hero' : '') + (it.disabled ? ' is-disabled' : '') + (cfg.multi ? ' is-check' : '') + (isSel ? ' is-selected' : '');
            b.disabled = !!it.disabled || (!cfg.onPick && !cfg.multi);
            if (cfg.multi) b.setAttribute('aria-pressed', String(isSel));
            b.innerHTML =
                `<span class="tile-power ${it.powerCls || ''}">${it.badge}</span>` +
                `<span class="tile-main"><span class="tile-name">${esc(it.name)}${it.count > 1 ? ` <em>×${it.count}</em>` : ''}</span>` +
                `<span class="tile-meta">${esc(it.meta)}</span></span>` +
                (cfg.multi ? '<span class="tile-check" aria-hidden="true"></span>' : '');
            if (cfg.multi && !it.disabled) {
                b.addEventListener('click', () => {
                    if (cfg.selected.has(it.key)) cfg.selected.delete(it.key); else cfg.selected.add(it.key);
                    renderSheetList();
                    renderSheetFoot();
                });
            } else if (cfg.onPick && !it.disabled) b.addEventListener('click', () => cfg.onPick(it));
            list.appendChild(b);
        });
    }

    function rowMeta(card) {
        if (card.type !== 'Unit') return '';
        const rows = Array.isArray(card.row) ? card.row : [card.row];
        return rows.map(r => ROW_LABEL[r] || r).join(' / ');
    }
    function abilityMeta(card) {
        return (card.abilities || []).map(a => ABILITY_LABEL[a] || a).join(', ');
    }
    function cardItem(card, extra = {}) {
        const isWeather = card.type === 'Weather';
        const group = card.type === 'Unit' ? (card.isHero ? 'hero' : 'unit') : isWeather ? 'weather' : 'special';
        const meta = [rowMeta(card), abilityMeta(card)].filter(Boolean).join(' · ') ||
            (isWeather ? (card.rowAffected ? card.rowAffected.map(r => ROW_LABEL[r]).join(' + ') : 'usuwa pogodę') : 'karta specjalna');
        return Object.assign({
            id: card.id, name: card.name, group, hero: !!card.isHero, count: 1, meta,
            badge: card.type === 'Unit' ? card.power : isWeather ? (WEATHER_ICON[card.name] || '☁') : '★',
            tags: Array.isArray(card.row) ? card.row : card.row ? [card.row] : []
        }, extra);
    }
    const GROUP_ORDER = { hero: 0, unit: 1, special: 2, weather: 3 };
    const GROUP_LABELS = { hero: 'Bohaterowie', unit: 'Jednostki', special: 'Karty specjalne', weather: 'Pogoda' };

    function openCardPicker(pl) {
        const d = pl.domElements;
        if (d.cardSelect.disabled) return;
        // Te same karty (np. Zombie ×5) pokazujemy raz, z licznikiem.
        const byKey = new Map();
        pl.availableCards.forEach(c => {
            const key = `${c.name}|${c.type}|${c.power ?? ''}|${(c.abilities || []).join(',')}`;
            if (byKey.has(key)) byKey.get(key).count++;
            else byKey.set(key, cardItem(c));
        });
        const items = [...byKey.values()].sort((a, b) =>
            (GROUP_ORDER[a.group] - GROUP_ORDER[b.group]) || a.name.localeCompare(b.name, 'pl'));
        openSheet({
            kind: 'cards',
            title: `${pl.name} – zagraj kartę`,
            searchable: true,
            groupLabels: GROUP_LABELS,
            filters: [
                { key: 'all', label: 'Wszystkie' }, { key: 'melee', label: ROW_ICON.melee + ' Wręcz' },
                { key: 'ranged', label: ROW_ICON.ranged + ' Dystans' }, { key: 'siege', label: ROW_ICON.siege + ' Obl.' },
                { key: 'hero', label: 'Bohaterowie' }, { key: 'special', label: 'Specjalne' }, { key: 'weather', label: 'Pogoda' }
            ],
            items,
            emptyText: 'Brak pasujących kart w puli.',
            onPick: it => {
                closeSheet();
                d.cardSelect.value = it.id;
                d.cardSelect.dispatchEvent(new Event('change', { bubbles: true }));
                // Zwinna karta / róg – od razu przewiń do wyboru rzędu
                const rc = $(`#row-choice-${numOf(pl)}`);
                setTimeout(() => (rc && !rc.hidden ? rc : d.playCardButton).scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
            }
        });
    }

    function openGraveyard(pl, medic) {
        if (!pl) return;
        const d = pl.domElements;
        const items = pl.graveyard.map(c => {
            const valid = c.type === 'Unit' && !c.isHero && !c.isDecoy;
            return cardItem(c, { disabled: medic && !valid, meta: medic && !valid ? 'nie można wskrzesić' : cardItem(c).meta });
        });
        openSheet({
            kind: medic ? 'medic' : 'grave',
            title: medic ? `${pl.name} – wskrześ jednostkę` : `Cmentarz: ${pl.name} (${pl.graveyard.length})`,
            searchable: pl.graveyard.length > 8,
            items,
            emptyText: 'Cmentarz jest pusty.',
            onPick: medic ? it => {
                closeSheet();
                d.graveyardSelect.value = it.id;
                d.graveyardSelect.dispatchEvent(new Event('change', { bubbles: true }));
            } : null,
            footer: medic ? [{
                label: 'Pomiń wskrzeszenie', cls: 'btn-pass', onClick: () => {
                    closeSheet();
                    d.graveyardSelect.value = '';
                    d.graveyardSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, { label: 'Zamknij', cls: 'btn-small', onClick: closeSheet }] : null
        });
    }

    // ---------- Wezwanie: wybór kart, które gracz fizycznie kładzie ----------
    // script.js wywołuje window.openMusterPicker(pendingMuster) i czeka na confirmMuster(ids).
    function openMusterPicker(pm) {
        if (!pm || !isMusterModeActive) return;
        // Każda karta osobno (np. trzy Wilki to trzy pozycje) – gracz może mieć tylko część z nich.
        const sameName = {};
        pm.candidates.forEach(c => { sameName[c.name] = (sameName[c.name] || 0) + 1; });
        const seen = {};
        const items = pm.candidates.map(c => {
            seen[c.name] = (seen[c.name] || 0) + 1;
            const label = sameName[c.name] > 1 ? `${c.name} (${seen[c.name]}/${sameName[c.name]})` : c.name;
            return cardItem(c, { key: c.id, name: label, hero: !!c.isHero });
        });
        const cfg = {
            kind: 'muster',
            title: `Wezwanie: ${pm.card.name} – które karty kładziesz?`,
            searchable: false,
            multi: true,
            selected: new Set(pm.candidates.map(c => c.id)), // domyślnie wszystkie
            items,
            onClose: () => scheduleRefresh(),
            footer: () => {
                const all = cfg.selected.size === items.length;
                return [
                    {
                        label: all ? 'Odznacz wszystkie' : 'Zaznacz wszystkie', cls: 'btn-small', onClick: () => {
                            if (cfg.selected.size === items.length) cfg.selected.clear();
                            else items.forEach(it => cfg.selected.add(it.key));
                            renderSheetList();
                            renderSheetFoot();
                        }
                    },
                    {
                        label: cfg.selected.size ? `Połóż wybrane (${cfg.selected.size})` : 'Nie kładę żadnej', cls: 'btn-primary', onClick: () => {
                            const ids = [...cfg.selected];
                            closeSheet();
                            confirmMuster(ids);
                        }
                    }
                ];
            }
        };
        openSheet(cfg);
    }
    window.openMusterPicker = openMusterPicker;

    // ---------- Cofanie ruchu ----------
    let toastTimer = null;
    function toast(text) {
        const t = $('#toast');
        t.textContent = text;
        t.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
    }
    const lastLogText = () => {
        const last = historyLog.firstElementChild;
        return last ? last.textContent.replace(/^\[(Runda|Tura) \d+\]\s*/, '') : '';
    };
    function afterRestore() {
        if (!isGameOver) { gameRunning = true; $('#summary').hidden = true; document.body.classList.remove('sheet-open'); }
        scheduleRefresh();
    }
    function doUndo(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); } // przyciski siedzą w nagłówku <details>
        if (!canUndo()) return;
        const what = lastLogText();
        if (sheetState) closeSheet();
        undoLastMove();
        afterRestore();
        toast(what ? `Cofnięto: ${what}` : 'Cofnięto ostatni ruch');
    }
    function doRedo(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!canRedo()) return;
        if (sheetState) closeSheet();
        redoLastMove();
        afterRestore();
        const what = lastLogText();
        toast(what ? `Powtórzono: ${what}` : 'Powtórzono ruch');
    }
    $('#undo-btn').addEventListener('click', doUndo);
    $('#redo-btn').addEventListener('click', doRedo);

    // ---------- Podsumowanie gry ----------
    const pad = n => String(n).padStart(2, '0');
    function stamp(d, sep = ' ') { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}${sep}${pad(d.getHours())}${sep === ' ' ? ':' : ''}${pad(d.getMinutes())}`; }

    function summaryText(winner) {
        const [a, b] = P();
        const line = pl => `${pl.name} – ${pl.faction}, dowódca: ${pl.commander ? pl.commander.name : '-'}`;
        const out = [];
        out.push('Ryżowy Książę – podsumowanie gry');
        out.push(`Data: ${stamp(new Date())}`);
        out.push('');
        out.push(`Gracz 1: ${line(a)}`);
        out.push(`Gracz 2: ${line(b)}`);
        out.push(`Zwycięzca: ${winner ? winner.name : 'remis'}`);
        out.push('');
        out.push('Wyniki tur:');
        roundResults.forEach(r => {
            const w = r.winner === 'draw' ? 'remis' : `wygrywa ${players[r.winner].name}`;
            out.push(`Tura ${r.round}: ${a.name} ${r.p1} : ${r.p2} ${b.name} – ${w}`);
        });
        out.push('');
        out.push('Historia gry:');
        [...historyLog.children].reverse().forEach(p => out.push(p.textContent));
        return out.join('\n');
    }

    function showGameSummary(winner) {
        gameRunning = false;
        if (sheetState) closeSheet();
        const [a, b] = P();
        $('#summary-winner').textContent = winner ? `Wygrywa: ${winner.name}` : 'Remis – obaj gracze stracili wszystkie kryształy';
        const rows = roundResults.map(r => `<tr>
            <th scope="row">Tura ${r.round}</th>
            <td class="${r.winner === 'player1' ? 'won' : ''}">${r.p1}</td>
            <td class="${r.winner === 'player2' ? 'won' : ''}">${r.p2}</td>
            <td>${r.winner === 'draw' ? 'remis' : esc(players[r.winner].name)}</td></tr>`).join('');
        $('#summary-table').innerHTML = `<thead><tr><th></th><th class="p1">${esc(a.name)}</th><th class="p2">${esc(b.name)}</th><th>Wygrał</th></tr></thead><tbody>${rows}</tbody>`;
        $('#summary-text').value = summaryText(winner);
        $('#summary-undo').disabled = !canUndo();
        $('#summary').hidden = false;
        document.body.classList.add('sheet-open');
        scheduleRefresh();
    }
    window.showGameSummary = showGameSummary;

    $('#summary-copy').addEventListener('click', async () => {
        const ta = $('#summary-text');
        try { await navigator.clipboard.writeText(ta.value); toast('Skopiowano podsumowanie'); }
        catch (e) {
            ta.focus(); ta.select();
            try { document.execCommand('copy'); toast('Skopiowano podsumowanie'); } catch (e2) { toast('Zaznacz tekst i skopiuj ręcznie'); }
        }
    });
    $('#summary-download').addEventListener('click', () => {
        const blob = new Blob([$('#summary-text').value], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ryzowy-ksiaze-${stamp(new Date(), '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#summary-undo').addEventListener('click', () => doUndo());
    $('#summary-new').addEventListener('click', () => { gameRunning = false; location.reload(); });

    // ---------- Ekran konfiguracji ----------
    const nameInputs = [$('#player1-name-input'), $('#player2-name-input')];
    nameInputs.forEach((inp, i) => { inp.value = store.get(`rk-name-${i + 1}`) || ''; });

    function setupComplete() {
        return ['player1', 'player2'].every(k => $(`#${k}-faction-select`).value && $(`#${k}-leader-select`).value);
    }
    function refreshSetup() {
        const ok = setupComplete();
        startGameButton.disabled = !ok;
        $('#setup-hint').hidden = ok;
    }
    gameSetupScreen.addEventListener('change', () => setTimeout(() => { refreshSetup(); applyFactionColors(); }, 0));
    refreshSetup();

    // Przechwycenie przed startGame(): imiona + blokada niepełnej konfiguracji
    // (oryginalny return w forEach nie zatrzymywał startu gry).
    document.addEventListener('click', e => {
        if (!e.target.closest('#startGameButton')) return;
        if (!setupComplete()) { e.stopImmediatePropagation(); e.preventDefault(); refreshSetup(); return; }
        P().forEach((pl, i) => {
            const v = nameInputs[i].value.trim();
            pl.name = v || `Gracz ${i + 1}`;
            store.set(`rk-name-${i + 1}`, v);
        });
        gameRunning = true;
        requestWakeLock();
        setTimeout(() => { battlefieldScreen.style.display = ''; applyFactionColors(); scheduleRefresh(); }, 0);
    }, true);

    // ---------- Wygoda przy stole ----------
    let wakeLock = null;
    async function requestWakeLock() {
        try { if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); }
        catch (e) { /* niedostępne – trudno */ }
    }
    document.addEventListener('visibilitychange', () => { if (gameRunning && document.visibilityState === 'visible') requestWakeLock(); });

    window.addEventListener('beforeunload', e => {
        if (!gameRunning) return;
        e.preventDefault();
        e.returnValue = '';
    });

    // Historia otwarta na dużym ekranie, zwinięta na telefonie
    const wide = window.matchMedia('(min-width: 900px)');
    const hist = $('#history-container');
    const syncHist = () => { hist.open = wide.matches; };
    syncHist();
    if (wide.addEventListener) wide.addEventListener('change', syncHist);

    // Nowe wpisy historii: polskie nazwy rzędów (script.js wpisuje melee/ranged/siege)
    // i odświeżenie paska „ostatnia akcja”.
    new MutationObserver(muts => {
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType === 1) n.textContent = n.textContent.replace(/do rzędu (melee|ranged|siege)\b/g, (_, r) => `do rzędu ${ROW_LABEL[r]}`);
        }));
        scheduleRefresh();
    }).observe(historyLog, { childList: true });
})();
