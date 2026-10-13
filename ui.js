// ui.js – warstwa interfejsu pod telefon/tablet.
// Nie zmienia zasad gry: czyta stan ze script.js i steruje jego ukrytymi listami (<select>),
// wywołując te same zdarzenia 'change'/'click', co wcześniej użytkownik.
(function () {
    'use strict';

    // Pliki muszą być z tej samej wersji. Gdy przeglądarka (lub GitHub Pages) poda stary script.js
    // z pamięci podręcznej, interfejs by się nie zbudował i nie dałoby się zagrać karty.
    const UI_VERSION = '2026-10-13m';
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
        tight_bond: 'Jedność', morale_boost: 'Wzmocnienie', spy: 'Szpieg', medic: 'Medyk',
        muster: 'Wezwanie', agile: 'Mobilność', scorch_row: 'Deszcz ognia (rząd)', scorch: 'Deszcz ognia',
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
    // Zdolności talii (instrukcja, str. 19). use: true – gracz uruchamia ją przyciskiem „Użyj”.
    const FACTION_ABILITY = {
        Khorinis: { text: 'Zwycięstwo tury w przypadku remisu.', how: 'Działa automatycznie przy liczeniu tury.' },
        Potwory: { text: 'Po końcu każdej tury losowa karta Potworów (nie bohater, nie neutralna) zostaje na planszy.', how: 'Po każdej turze pojawi się okno wyboru karty (z przyciskiem „Losuj”).' },
        Najemnicy: { text: 'Możliwość wymiany jednej karty więcej na starcie gry.', how: 'Dzieje się przy stole – kalkulator tylko przypomina.' },
        Klasztor: { text: 'Możliwość przeczekania jednej tury bez konsekwencji.', how: 'Raz na grę: oddajesz ruch przeciwnikowi bez pasowania.', use: true },
        Orkowie: { text: 'W trzeciej turze 2 losowe karty poległe Orków (nie bohaterowie) wracają na planszę.', how: 'Na starcie 3. tury pojawi się okno wyboru (z przyciskiem „Losuj”).' },
        Bandyci: { text: 'Po przegranej turze dobór 1 losowej karty poległej przeciwnika (nie bohatera).', how: 'Po przegranej turze pojawi się okno wyboru z cmentarza przeciwnika.' },
        Nieumarli: { text: 'Po wygranej turze dobór 1 losowej karty z talii (nie bohatera).', how: 'Dzieje się przy stole – kalkulator przypomina w historii.' }
    };
    // Karty przewodnie (instrukcja, str. 11–13). passive: działa cały czas, bez aktywacji.
    const LEADER_ABILITY = {
        Oko_Innosa: 'Dwukrotnie zwiększa siłę twoich jednostek oblężniczych.',
        Zastepy_Innosa: 'Wywołuje Szeregowy deszcz ognia na rząd jednostek oblężniczych przeciwnika.',
        Swiety_plomien: 'Wywołuje efekt runy Światło (nie można jej użyć „na przeczekanie”, gdy na planszy nie ma run). Nie musisz mieć Światła w talii; działa też na Strach.',
        'Nie_boje_sie,_gdy_ciemno_jest': 'Aktywuje runę Roju owadów z talii.',
        Innos_Pan_Ognia: 'Wywołuje Szeregowy deszcz ognia na rząd jednostek dystansowych przeciwnika.',
        Drzewa_maja_uszy: { text: 'Dwukrotnie zwiększa siłę wszystkich szpiegów na planszy – twoich i przeciwnika.', passive: true },
        Selekcja_naturalna: 'Wymiana dwóch wybranych kart na jedną dowolną z całej talii (jednostka/bohater/efekt). Na początku gry albo w trakcie.',
        Instynkt_stadny: 'Pobierz dowolną kartę ze swojego stosu kart poległych i wprowadź ją ponownie do gry (nie bohatera/efektu).',
        Zew_puszczy: 'Aktywuj dowolną runę pogody (Światło, Lodowa fala, Grom, Rój owadów) z twojej talii – nie musi być w ręce.',
        Zadza_krwi: 'Dwukrotnie zwiększa siłę twoich jednostek walczących w zwarciu (nie działa na rząd z Rogiem wojennym).',
        Kuchnia_polowa: 'Na planszę wraca po jednej losowej jednostce ze stosu kart poległych obu graczy (nie bohaterowie/efekty).',
        Wlasciciel_Ziemski: 'Pobierz dowolną kartę ze stosu kart poległych przeciwnika (nie bohatera/efektu).',
        Szybki_zwiad: 'Przeciwnik musi pokazać ci 3 losowe karty ze swojej talii.',
        Chlopcy_z_Kolonii: { text: 'Przeciwnik nie może użyć karty przewodniej przez całą rozgrywkę.', passive: true },
        'Wiesz_jak_czestu_pada_tu_deszcz?': 'Aktywuje runę Gromu z talii.',
        Swieta_Aura_Innosa: 'Dwukrotnie zwiększa siłę twoich jednostek dystansowych (nie działa na rząd z Rogiem wojennym).',
        Swiety_Mlot_Innosa: 'Wywołuje Szeregowy deszcz ognia na rząd jednostek przeciwnika walczących w zwarciu.',
        Klasztorny_rygor: 'Jednostki z umiejętnością Mobilność mogą zostać przeniesione do innego, wskazanego szeregu.',
        Tarcza_Dominique: 'Aktywuje runę Lodowej fali z talii.',
        Nabor_nowicjuszy: { text: 'Na początku rozgrywki dobierasz jedną kartę więcej niż standardowe 10.', passive: true },
        Beliar_z_nami: { text: 'Negatywne runy dzielą siłę twoich jednostek przez 2 (zaokrąglenie w dół) zamiast obniżać ją do 1.', passive: true },
        Zew_hordy: 'Przemienia kąsaczy we wściekłe kąsacze, a wiarusów w fanatycznych wiarusów.',
        Wojna_totalna: 'Wszystkie karty ze stosu kart poległych przeciwnika zostają zniszczone i nie mogą wrócić na planszę.',
        Uklady: { text: 'Przeciwnik nie może użyć karty przewodniej przez całą rozgrywkę.', passive: true },
        Ukryci_wsrod_drzew: 'Wywołuje Szeregowy deszcz ognia na rząd jednostek przeciwnika walczących w zwarciu.',
        Moc_Dworu_Irdorath: 'Wywołuje Szeregowy deszcz ognia na rząd jednostek przeciwnika walczących w zwarciu.',
        Mroczny_rytual: 'Dwukrotnie zwiększa siłę twoich jednostek walczących w zwarciu (nie działa na rząd z Rogiem wojennym).',
        Wrota_piekiel: { text: 'Na początku rozgrywki dobierasz jedną kartę więcej niż standardowe 10.', passive: true }
    };
    const leaderInfo = c => { const v = c && LEADER_ABILITY[c.id]; return !v ? { text: 'Brak opisu.' } : typeof v === 'string' ? { text: v } : v; };
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
        if (typeof isFactionChoiceActive === 'function' && isFactionChoiceActive()) {
            const ch = getPendingChoice();
            return { cls: 'mode', text: `${ch.player.name}: ${ch.banner}.`, action: 'faction' };
        }
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
        $('#undo-btn').disabled = !canUndo();
        $('#redo-btn').disabled = !canRedo();

        const st = statusText();
        const banner = $('#status-banner');
        banner.className = 'status-banner ' + st.cls;
        banner.textContent = st.text;
        if (st.action === 'medic' || st.action === 'muster' || st.action === 'faction') {
            const b = document.createElement('button');
            b.className = 'btn-small banner-btn';
            b.textContent = st.action === 'medic' ? 'Cmentarz' : 'Wybierz karty';
            b.addEventListener('click', () => (st.action === 'medic' ? openGraveyard(activePlayer, true)
                : st.action === 'muster' ? openMusterPicker(pendingMuster) : openFactionChoice(getPendingChoice())));
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
            sidebar.classList.toggle('is-leading', pl.power > (pl === players.player1 ? players.player2 : players.player1).power);
            $('.turn-badge', sidebar).textContent = state === 'is-passed' ? 'spasował' : state === 'is-active' ? (isFirstMoveOfRound ? 'może zacząć' : 'twój ruch') : 'czeka';
            $(`#player${n}-name-display`).textContent = pl.name;
            refreshControls(pl);
        });

        // Tryb medyka: otwórz cmentarz automatycznie raz, gdy tryb się włącza
        if (isMedicModeActive && activePlayer && !medicWasActive) openGraveyard(activePlayer, true);
        if (!isMedicModeActive && medicWasActive && sheetState && sheetState.kind === 'medic') closeSheet();
        medicWasActive = isMedicModeActive;
        if (!isMusterModeActive && sheetState && sheetState.kind === 'muster') closeSheet();
        if (!isFactionChoiceActive() && sheetState && sheetState.kind === 'faction') closeSheet();

        flashScores();
        scheduleSave();
    }

    // ---------- Podświetlenie zmian wyniku ----------
    const lastScores = new Map();
    function flashScores() {
        const els = [...document.querySelectorAll('.row-score, .sb-total, .total-power-display span')];
        els.forEach(el => {
            const v = Number(el.textContent);
            const prev = lastScores.get(el);
            lastScores.set(el, v);
            if (prev === undefined || prev === v || suppressFx) return;
            el.classList.remove('flash-up', 'flash-down');
            void el.offsetWidth; // restart animacji
            el.classList.add(v > prev ? 'flash-up' : 'flash-down');
        });
    }

    // ---------- Zapis partii w przeglądarce ----------
    const SAVE_KEY = 'rk-save';
    let saveTimer = null;
    function scheduleSave() {
        if (!gameRunning && !isGameOver) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 250);
    }
    // Nazwa rozgrywki (pole pod tytułem) i czy imiona zostały wpisane – do podsumowania i nazwy pliku .txt
    const gameMeta = { event: '', named: [false, false] };
    function saveNow() {
        for (const n of [15, 5, 0]) {
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(exportGameState(n), { meta: gameMeta }))); return; }
            catch (e) { /* za mało miejsca – spróbuj z krótszą historią cofania */ }
        }
    }
    function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* brak dostępu */ } }
    function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } }

    // ---------- Wibracje (telefony z Androidem; iPhone ich nie obsługuje) ----------
    let suppressFx = false;
    function buzz(pattern) { try { if (!suppressFx && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* brak */ } }


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

        // Suma i kryształy w nagłówku panelu (widoczne w układzie poziomym na telefonie)
        const ps = document.createElement('span');
        ps.className = 'ps-score';
        ps.id = `ps-score-${n}`;
        const badge = $(`.player${n}-sidebar .turn-badge`);
        badge.parentNode.insertBefore(ps, badge);
        $(`#faction-btn-${n}`).addEventListener('click', () => openAbility(pl, 'faction'));
        $(`#leader-btn-${n}`).addEventListener('click', () => openAbility(pl, 'leader'));
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

        $(`#ps-score-${n}`).innerHTML = `<span class="sb-gems">${gemsHtml(pl.crystalCount)}</span><span class="ps-total">${pl.power}</span>`;

        // Przyciski zdolności talii i dowódcy
        const fb = $(`#faction-btn-${n}`), lbtn = $(`#leader-btn-${n}`);
        const hasSkip = hasAbility(pl, 'klasztor_skip');
        fb.innerHTML = `<span class="ab-icon">⚑</span><span class="ab-name">${esc(pl.faction || '')}</span>`;
        fb.classList.toggle('can-use', hasSkip && canSkipTurn(pl));
        fb.classList.toggle('used', hasSkip && skipsLeft(pl) === 0);
        const lInfo = leaderInfo(pl.commander);
        lbtn.innerHTML = `<span class="ab-icon">♛</span><span class="ab-name">${esc(pl.commander ? pl.commander.name : '')}</span>`;
        lbtn.classList.toggle('used', !!(pl.commander && pl.commander.isUsed) || !!leaderBlockedBy(pl));
        lbtn.classList.toggle('can-use', !lInfo.passive && leaderUsable(pl).ok);
        if (abilityState && abilityState.player === pl) renderAbility();

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
        if (isMusterModeActive || isFactionChoiceActive()) d.playCardButton.hidden = true;
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
        $('#sheet-searchrow').hidden = !cfg.searchable;
        cfg.filter = 'all';
        cfg.ability = 'all';
        cfg.sort = cfg.sortable ? (store.get('rk-sort') || 'group') : 'group';
        const sortSel = $('#sheet-sort');
        sortSel.hidden = !cfg.sortable;
        sortSel.value = cfg.sort;
        // Filtry umiejętności – tylko te, które występują w kartach na liście
        const abil = $('#sheet-abil');
        abil.innerHTML = '';
        const present = cfg.abilityFilters ? ABILITY_FILTERS.filter(f => cfg.items.some(it => f.keys.some(k => (it.abil || []).includes(k)))) : [];
        if (present.length) [{ key: 'all', label: 'Każda umiejętność' }, ...present].forEach(f => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip chip-abil';
            b.textContent = f.label;
            b.setAttribute('aria-pressed', String(f.key === 'all'));
            b.addEventListener('click', () => {
                cfg.ability = f.key;
                abil.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
                renderSheetList();
            });
            abil.appendChild(b);
        });
        abil.hidden = !present.length;
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
        $('.sheet-tools').hidden = !cfg.searchable && filters.hidden && abil.hidden;
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
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !abilityDlg.hidden) closeAbility(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetState) { const st = sheetState; closeSheet(); if (st.onClose) st.onClose(); } });
    $('#sheet-search').addEventListener('input', () => renderSheetList());

    function renderSheetList() {
        const cfg = sheetState;
        if (!cfg) return;
        const q = $('#sheet-search').value.trim().toLocaleLowerCase('pl');
        const list = $('#sheet-list');
        const abilKeys = cfg.ability && cfg.ability !== 'all' ? (ABILITY_FILTERS.find(f => f.key === cfg.ability) || { keys: [] }).keys : null;
        const items = cfg.items.filter(it =>
            (cfg.filter === 'all' || it.group === cfg.filter || (it.tags || []).includes(cfg.filter)) &&
            (!abilKeys || abilKeys.some(k => (it.abil || []).includes(k))) &&
            (!q || it.name.toLocaleLowerCase('pl').includes(q)));
        const byName = (a, b) => a.name.localeCompare(b.name, 'pl');
        const pw = it => (typeof it.power === 'number' ? it.power : -1);
        if (cfg.sort === 'az') items.sort(byName);
        else if (cfg.sort === 'pdesc') items.sort((a, b) => pw(b) - pw(a) || byName(a, b));
        else if (cfg.sort === 'pasc') items.sort((a, b) => pw(a) - pw(b) || byName(a, b));
        const grouped = cfg.groupLabels && cfg.sort === 'group';
        list.innerHTML = '';
        if (!items.length) {
            list.innerHTML = `<p class="sheet-empty">${cfg.emptyText || 'Brak kart.'}</p>`;
            return;
        }
        let lastGroup = null;
        items.forEach(it => {
            if (grouped && it.group !== lastGroup) {
                lastGroup = it.group;
                const h = document.createElement('h4');
                h.className = 'sheet-group';
                h.textContent = cfg.groupLabels[it.group] || it.group;
                list.appendChild(h);
            }
            const b = document.createElement('button');
            b.type = 'button';
            if (it.key != null) b.dataset.key = it.key;
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
                    if (cfg.selected.has(it.key)) cfg.selected.delete(it.key);
                    else if (cfg.max === 1) { cfg.selected.clear(); cfg.selected.add(it.key); }
                    else if (cfg.max && cfg.selected.size >= cfg.max) { toast(`Możesz wybrać ${cfg.max}.`); return; }
                    else cfg.selected.add(it.key);
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
            abil: card.abilities || [], power: card.type === 'Unit' ? card.power : undefined,
            tags: Array.isArray(card.row) ? card.row : card.row ? [card.row] : []
        }, extra);
    }
    const GROUP_ORDER = { hero: 0, unit: 1, special: 2, weather: 3 };
    // Filtry umiejętności w arkuszu wyboru kart
    const ABILITY_FILTERS = [
        { key: 'tight_bond', label: 'Jedność', keys: ['tight_bond'] },
        { key: 'morale_boost', label: 'Wzmocnienie', keys: ['morale_boost'] },
        { key: 'muster', label: 'Wezwanie', keys: ['muster'] },
        { key: 'medic', label: 'Medyk', keys: ['medic'] },
        { key: 'spy', label: 'Szpieg', keys: ['spy'] },
        { key: 'agile', label: 'Mobilność', keys: ['agile'] },
        { key: 'scorch', label: 'Deszcz ognia', keys: ['scorch', 'scorch_row', 'scorch_strongest'] },
        { key: 'horn', label: 'Róg', keys: ['horn'] },
        { key: 'moc', label: 'Moc / Wyzwolenie', keys: ['Moc', 'Wyzwolenie siły'] },
        { key: 'summon', label: 'Przywołanie', keys: ['avenger', 'summon_next_round'] },
        { key: 'decoy', label: 'Chrząszcz', keys: ['decoy'] }
    ];
    $('#sheet-sort').addEventListener('change', e => {
        if (!sheetState) return;
        sheetState.sort = e.target.value;
        store.set('rk-sort', e.target.value);
        renderSheetList();
    });
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
            searchable: true, sortable: true, abilityFilters: true,
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
        const items = pl.graveyard.map((c, i) => {
            const valid = c.type === 'Unit' && !c.isHero && !c.isDecoy;
            return cardItem(c, { key: i, disabled: medic && !valid, meta: medic && !valid ? 'nie można wskrzesić' : cardItem(c).meta });
        });
        if (!medic) {
            openSheet({ kind: 'grave', title: `Cmentarz: ${pl.name} (${pl.graveyard.length})`, searchable: pl.graveyard.length > 8, items, emptyText: 'Cmentarz jest pusty.' });
            return;
        }
        // Leczenie: jak przy Wezwaniu – najpierw zaznaczasz kartę, potem potwierdzasz.
        const resurrect = id => {
            closeSheet();
            d.graveyardSelect.value = id;
            d.graveyardSelect.dispatchEvent(new Event('change', { bubbles: true }));
            // Łańcuch Leczenia: wskrzeszony medyk wskrzesza dalej – ten sam gracz wybiera kolejną kartę.
            setTimeout(() => {
                if (isMedicModeActive && activePlayer === pl && !(sheetState && sheetState.kind === 'medic')) openGraveyard(pl, true);
            }, 0);
        };
        const cfg = {
            kind: 'medic',
            title: `${pl.name} – wskrześ jednostkę`,
            searchable: pl.graveyard.length > 8,
            multi: true, max: 1, selected: new Set(),
            items,
            emptyText: 'Cmentarz jest pusty.',
            footer: () => [
                { label: 'Pomiń wskrzeszenie', cls: 'btn-pass', onClick: () => resurrect('') },
                {
                    label: cfg.selected.size ? `Wskrześ: ${items[[...cfg.selected][0]].name}` : 'Wskrześ (wybierz kartę)', cls: 'btn-primary',
                    disabled: cfg.selected.size === 0,
                    onClick: () => { const i = [...cfg.selected][0]; if (i != null) resurrect(pl.graveyard[i].id); }
                }
            ]
        };
        openSheet(cfg);
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

    // ---------- Okno zdolności talii / dowódcy ----------
    let abilityState = null; // { player, kind: 'faction' | 'leader' }
    const abilityDlg = $('#ability-dialog');
    function openAbility(pl, kind) {
        abilityState = { player: pl, kind };
        renderAbility();
        abilityDlg.hidden = false;
    }
    function closeAbility() { abilityDlg.hidden = true; abilityState = null; }
    // Podgląd w oknie zdolności: rewers talii (bez napisów) albo karta przewodnia (grafika, nazwa, podpis)
    function renderAbilityCard(pl, kind) {
        const box = $('#ability-card');
        box.style.setProperty('--cf-color', FACTION_COLORS[pl.faction] || '#777');
        if (kind === 'faction') {
            box.className = 'ab-card card-back';
            box.innerHTML = '<span class="cb-pattern"></span><span class="cb-frame"></span><span class="cb-emblem"><span></span></span>';
            if (CARD_ART.enabled) {
                const img = new Image();
                img.className = 'cb-img'; img.alt = '';
                img.onerror = () => img.remove();
                img.src = CARD_ART.back(pl.faction);
                box.appendChild(img);
            }
            return;
        }
        const c = pl.commander, info = leaderInfo(c);
        box.className = 'ab-card leader-card' + (c && c.isUsed ? ' is-used' : '');
        box.innerHTML = '<div class="cf-art"></div><div class="lc-plate"><h3 class="lc-name"></h3><p class="lc-caption"></p></div>';
        const art = box.querySelector('.cf-art');
        const fallback = () => { art.innerHTML = `<span class="cf-initial">${esc(((c && c.name) || '?').charAt(0))}</span>`; };
        if (CARD_ART.enabled && c) {
            const img = new Image();
            img.alt = ''; img.onerror = fallback; img.src = CARD_ART.card(c.id);
            art.appendChild(img);
        } else fallback();
        box.querySelector('.lc-name').textContent = c ? c.name : '';
        box.querySelector('.lc-caption').textContent = info.text || '';
    }
    function renderAbility() {
        const { player: pl, kind } = abilityState;
        renderAbilityCard(pl, kind);
        abilityDlg.querySelector('.ability-panel').classList.toggle('is-leader', kind === 'leader');
        const use = $('#ability-use');
        let canUse = false, showUse = true, note = '';
        if (kind === 'faction') {
            const list = factionAbilities(pl.faction, RULES).filter(a => a.on);
            $('#ability-kind').textContent = `${pl.name} · ${list.length > 1 ? 'zdolności' : 'zdolność'} talii`;
            $('#ability-title').textContent = pl.faction;
            $('#ability-desc').innerHTML = list.length
                ? list.map(a => `<span class="ab-line"><b>${esc(a.name)}</b> – ${esc(a.text)}${a.origin === 'propozycja' || a.custom ? ' <em>(wariant)</em>' : ''}</span>`).join('')
                : '<span class="ab-line">Brak aktywnych zdolności (wyłączone w ustawieniach umiejętności).</span>';
            const hows = list.map(a => ABILITY_HOW[a.id]).filter(Boolean);
            showUse = hasAbility(pl, 'klasztor_skip');
            if (showUse) {
                canUse = canSkipTurn(pl);
                const left = skipsLeft(pl), per = abP('klasztor_skip', 'per') === 'round' ? 'turze' : 'grze';
                note = left === 0 ? `Przeczekanie zostało już wykorzystane w tej ${per}.`
                    : canUse ? `Przeczekanie: zostało ${left} w tej ${per}. ` + hows.join(' ')
                    : 'Teraz nie można przeczekać (nie twój ruch, przeciwnik spasował albo trwa inna akcja).';
            } else note = hows.join(' ');
        } else {
            const c = pl.commander, info = leaderInfo(c);
            $('#ability-kind').textContent = `${pl.name} · karta przewodnia${info.passive ? ' (pasywna)' : ' (aktywowana, raz na grę)'}`;
            $('#ability-title').textContent = c ? c.name : '';
            $('#ability-desc').textContent = info.text;
            const chk = leaderUsable(pl), eff = leaderEffect(pl) || { kind: 'reminder' }, by = leaderBlockedBy(pl);
            showUse = !info.passive && !by;
            canUse = showUse && chk.ok;
            note = by ? `Nie działa – blokuje ją karta przeciwnika: ${by.name}.`
                : c && c.id === 'Beliar_z_nami' ? (abOn('orkowie_beliar') ? 'Działa przez całą rozgrywkę – kalkulator liczy to sam.' : 'Wyłączone w ustawieniach umiejętności.')
                : eff.spies ? 'Działa przez całą rozgrywkę – kalkulator liczy to sam.'
                : eff.block ? 'Działa przez całą rozgrywkę – karta przewodnia przeciwnika nie działa.'
                : eff.extraCard ? 'Przy stole: na starcie dobierasz 11 kart zamiast 10.'
                : info.passive ? 'Działa przez całą rozgrywkę – nie wymaga aktywacji.'
                : chk.ok ? (LEADER_HOW[eff.kind] || LEADER_HOW.reminder) : chk.reason;
        }
        $('#ability-note').textContent = note;
        use.hidden = !showUse;
        use.disabled = !canUse;
    }
    abilityDlg.addEventListener('click', e => { if (e.target.closest('[data-close-ability]')) closeAbility(); });
    $('#ability-use').addEventListener('click', () => {
        if (!abilityState) return;
        const { player: pl, kind } = abilityState;
        closeAbility();
        if (kind === 'faction') skipTurn(pl);
        else startLeader(pl);
        scheduleRefresh();
    });

    // ---------- Karty przewodnie: wybór przed użyciem ----------
    const LEADER_HOW = {
        double: 'Rząd zostanie podwojony do końca tury (jak Róg wojenny).',
        scorch: 'Kalkulator wykona Szeregowy deszcz ognia (rząd przeciwnika musi mieć łącznie co najmniej 10 siły).',
        clear: 'Usuwa wszystkie runy z planszy (jak Światło).',
        rune: 'Kalkulator zabierze runę z twojej talii i położy ją na planszy.',
        revive: 'Wybierzesz jednostkę ze swojego cmentarza – wejdzie na stół jak przy Leczeniu.',
        steal: 'Wybierzesz jednostkę z cmentarza przeciwnika – trafi do twojej ręki.',
        kitchen: 'Sędzia losuje po jednej jednostce z obu cmentarzy – wskażesz je albo użyjesz „Losuj”.',
        totalWar: 'Cały cmentarz przeciwnika zostanie zniszczony – tych kart nie da się już wskrzesić.',
        horde: 'Kąsacze i wiarusi na twojej planszy przemienią się we wściekłe kąsacze i fanatycznych wiarusów.',
        rigor: 'Wybierzesz jednostki z Mobilnością, które przejdą do drugiego rzędu.',
        reminder: 'Efekt wykonaj przy stole – kalkulator zaznaczy użycie.'
    };
    // Arkusz wyboru kart dla kart przewodnich
    function pickCards({ title, items, max, min = 1, random = false, confirmLabel, onConfirm }) {
        const cfg = {
            kind: 'leader', title, searchable: items.length > 8, multi: true, max, selected: new Set(), items,
            onClose: () => scheduleRefresh(),
            footer: () => [
                random ? {
                    label: 'Losuj', cls: 'btn-small', onClick: () => {
                        const pool = items.map(it => it.key);
                        cfg.selected.clear();
                        while (cfg.selected.size < max && pool.length) cfg.selected.add(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
                        renderSheetList(); renderSheetFoot();
                    }
                } : { label: 'Anuluj', cls: 'btn-small', onClick: () => closeSheet() },
                {
                    label: `${confirmLabel} (${cfg.selected.size}${max < items.length || max === 1 ? '/' + max : ''})`, cls: 'btn-primary',
                    disabled: cfg.selected.size < min,
                    onClick: () => { const ids = [...cfg.selected]; closeSheet(); onConfirm(ids); scheduleRefresh(); }
                }
            ]
        };
        openSheet(cfg);
    }
    function startLeader(pl) {
        const chk = leaderUsable(pl);
        if (!chk.ok) { if (chk.reason) toast(chk.reason, true); return; }
        const c = pl.commander, opp = P().find(x => x !== pl), kind = leaderChoiceKind(pl);
        const done = ok => { if (ok) buzz(20); scheduleRefresh(); };
        const unitItem = x => cardItem(x, { key: x.instanceId });
        if (!kind) return done(useLeader(pl));
        if (kind === 'rune') {
            const seen = new Set();
            const items = leaderRuneCards(pl).filter(x => !seen.has(x.name) && seen.add(x.name)).map(x => cardItem(x, { key: x.name }));
            return pickCards({ title: `${c.name} – którą runę aktywować?`, items, max: 1, confirmLabel: 'Aktywuj', onConfirm: ids => done(useLeader(pl, { name: ids[0] })) });
        }
        if (kind === 'steal') {
            return pickCards({ title: `${c.name} – którą jednostkę zabierasz z cmentarza: ${opp.name}?`, items: opp.graveyard.filter(isPlainUnit).map(unitItem), max: 1,
                confirmLabel: 'Zabierz', onConfirm: ids => done(useLeader(pl, { id: ids[0] })) });
        }
        if (kind === 'kitchen') {
            const mine = pl.graveyard.filter(isPlainUnit), theirs = opp.graveyard.filter(isPlainUnit);
            const step2 = m => theirs.length
                ? pickCards({ title: `${c.name} – jednostka z cmentarza: ${opp.name}`, items: theirs.map(unitItem), max: 1, random: true,
                    confirmLabel: 'Przywróć', onConfirm: ids => done(useLeader(pl, { mine: m, theirs: ids[0] })) })
                : done(useLeader(pl, { mine: m, theirs: null }));
            return mine.length
                ? pickCards({ title: `${c.name} – jednostka z cmentarza: ${pl.name}`, items: mine.map(unitItem), max: 1, random: true,
                    confirmLabel: theirs.length ? 'Dalej' : 'Przywróć', onConfirm: ids => step2(ids[0]) })
                : step2(null);
        }
        if (kind === 'rigor') {
            const list = leaderAgileUnits(pl);
            const items = list.map(({ card, row }) => cardItem(card, { key: card.instanceId, meta: `${ROW_LABEL[row]} → ${ROW_LABEL[card.row.find(r => r !== row)]}` }));
            return pickCards({ title: `${c.name} – które jednostki przenieść do drugiego rzędu?`, items, max: list.length,
                confirmLabel: 'Przenieś', onConfirm: ids => done(useLeader(pl, { ids })) });
        }
    }
    window.startLeader = startLeader;

    // ---------- Zdolności talii: wybór kart (Potwory / Orkowie / Bandyci) ----------
    // Przy stole kartę losuje sędzia – tu można ją wskazać albo wylosować przyciskiem „Losuj”.
    function openFactionChoice(ch) {
        if (!ch) return;
        const items = ch.cards.map(c => cardItem(c, { key: c.instanceId, meta: [c.faction !== 'Neutral' ? c.faction : '', cardItem(c).meta].filter(Boolean).join(' · ') }));
        const cfg = {
            kind: 'faction',
            title: `${ch.player.name}: ${ch.title}`,
            searchable: items.length > 8,
            multi: true,
            max: ch.count,
            selected: new Set(),
            items,
            onClose: () => scheduleRefresh(),
            footer: () => [
                {
                    label: 'Losuj', cls: 'btn-small', onClick: () => {
                        const pool = items.map(it => it.key);
                        cfg.selected.clear();
                        while (cfg.selected.size < ch.count && pool.length) cfg.selected.add(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
                        renderSheetList();
                        renderSheetFoot();
                    }
                },
                {
                    label: `Zatwierdź (${cfg.selected.size}/${ch.count})`, cls: 'btn-primary', disabled: cfg.selected.size !== ch.count,
                    onClick: () => {
                        const ids = [...cfg.selected];
                        closeSheet();
                        confirmFactionChoice(ids);
                        scheduleRefresh();
                    }
                }
            ]
        };
        openSheet(cfg);
    }
    window.openFactionChoice = openFactionChoice;

    // ---------- Cofanie ruchu ----------
    let toastTimer = null;
    function toast(text, warn = false) {
        const t = $('#toast');
        t.textContent = text;
        t.classList.toggle('warn', warn);
        t.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.hidden = true; }, warn ? 3200 : 2600);
    }
    // Zamiast systemowego alert() ze script.js
    window.notifyUser = msg => { toast(msg, true); buzz([30, 40, 30]); };
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
        suppressFx = true;
        undoLastMove();
        afterRestore();
        queueMicrotask(() => queueMicrotask(() => { suppressFx = false; }));
        toast(what ? `Cofnięto: ${what}` : 'Cofnięto ostatni ruch');
    }
    function doRedo(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!canRedo()) return;
        if (sheetState) closeSheet();
        suppressFx = true;
        redoLastMove();
        afterRestore();
        queueMicrotask(() => queueMicrotask(() => { suppressFx = false; }));
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
        if (gameMeta.event) out.push(`Rozgrywka: ${gameMeta.event}`);
        out.push(`Umiejętności: ${rulesSummary(RULES)}`);
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
        scheduleSaveFinal();
        if (sheetState) closeSheet();
        const [a, b] = P();
        $('#summary-winner').textContent = winner ? `Wygrywa: ${winner.name}` : 'Remis – obaj gracze stracili wszystkie kryształy';
        const rows = roundResults.map(r => `<tr>
            <th scope="row">Tura ${r.round}</th>
            <td class="${r.winner === 'player1' ? 'won' : ''}">${r.p1}</td>
            <td class="${r.winner === 'player2' ? 'won' : ''}">${r.p2}</td>
            </tr>`).join('');
        $('#summary-table').innerHTML = `<thead><tr><th></th><th class="p1">${esc(a.name)}</th><th class="p2">${esc(b.name)}</th></tr></thead><tbody>${rows}</tbody>`;
        setHistoryShown(false); // historia domyślnie ukryta
        $('#summary-text').value = summaryText(winner);
        $('#summary-undo').disabled = !canUndo();
        $('#summary').hidden = false;
        document.body.classList.add('sheet-open');
        scheduleRefresh();
    }
    window.showGameSummary = showGameSummary;
    function scheduleSaveFinal() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }

    function setHistoryShown(on) {
        $('#summary-text').hidden = !on;
        const t = $('#summary-toggle');
        t.textContent = on ? 'Ukryj' : 'Pokaż';
        t.setAttribute('aria-expanded', String(on));
    }
    $('#summary-toggle').addEventListener('click', () => setHistoryShown($('#summary-text').hidden));
    $('#summary-copy').addEventListener('click', async () => {
        const ta = $('#summary-text');
        try { await navigator.clipboard.writeText(ta.value); toast('Skopiowano podsumowanie'); }
        catch (e) {
            setHistoryShown(true); ta.focus(); ta.select();
            try { document.execCommand('copy'); toast('Skopiowano podsumowanie'); } catch (e2) { toast('Zaznacz tekst i skopiuj ręcznie'); }
        }
    });
    // Nazwa pliku: [nazwa rozgrywki]_[nick1-vs-nick2]_data.txt (bez polskich znaków i spacji)
    const PL_CHARS = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z', Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z' };
    const fileSlug = s => String(s || '').replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => PL_CHARS[ch]).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    function summaryFileName() {
        const [a, b] = P();
        const parts = [];
        const ev = fileSlug(gameMeta.event);
        if (ev) parts.push(ev);
        if (gameMeta.named[0] || gameMeta.named[1]) parts.push(`${fileSlug(a.name) || 'Gracz-1'}-vs-${fileSlug(b.name) || 'Gracz-2'}`);
        if (!parts.length) parts.push('ryzowy-ksiaze');
        const d = new Date();
        parts.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`);
        return parts.join('_') + '.txt';
    }
    window.summaryFileName = summaryFileName;
    $('#summary-download').addEventListener('click', () => {
        const blob = new Blob([$('#summary-text').value], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = summaryFileName();
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#summary-undo').addEventListener('click', () => doUndo());
    $('#summary-new').addEventListener('click', () => { gameRunning = false; clearSave(); location.reload(); });

    // ---------- Pełny widok karty (kliknięcie karty na stole) ----------
    // Miejsca na przyszłe grafiki: włącz CARD_ART.enabled i wrzuć pliki do podanych folderów.
    // Gdy pliku brak, zostaje zastępczy wygląd (kolor talii + inicjał), a umiejętności jako napisy.
    const CARD_ART = {
        enabled: false,
        card: id => `grafiki/karty/${id}.webp`,          // ilustracja karty
        ability: key => `grafiki/umiejetnosci/${key}.png`, // ikona umiejętności
        back: faction => `grafiki/rewersy/${faction}.webp`,  // rewers talii (okno zdolności talii)
        emblem: faction => `grafiki/herby/${faction}.png`     // herb talii na końcu szarfy
    };
    // Przykładowe herby talii na końcu szarfy (zastępcze – do podmiany na grafiki z CARD_ART.emblem)
    const EMBLEM_SVG = {
        Khorinis: '<path d="M5 21V9l2-1V5h2v2h2V5h2v2h2V5h2v3l2 1v12h-5v-5a2 2 0 0 0-4 0v5z"/>',
        Potwory: '<path d="M6 3c3 4 3 10-1 17 5-4 7-10 5-17zM11 3c3 4 3 10-1 17 5-4 7-10 5-17zM16 3c3 4 3 10-1 17 5-4 7-10 5-17z"/>',
        Najemnicy: '<path d="M4 3l9 9-2 2L2 5zM20 3l-9 9 2 2 9-9zM6 15l3 3-3 3-3-3zM18 15l3 3-3 3-3-3zM9 13l2 2-3 3-2-2zM15 13l3 3-2 2-3-3z"/>',
        Klasztor: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9z"/>',
        Orkowie: '<path d="M11 2h2v20h-2zM13 4c5 0 8 3 8 7s-3 7-8 7zM11 4C6 4 3 7 3 11s3 7 8 7z" fill-rule="evenodd"/>',
        Bandyci: '<path d="M11 1h2l1 13h-4zM7 14h10v2H7zM11 16h2v4h-2zM10 20h4v3h-4z"/>',
        Nieumarli: '<path d="M12 2a8 8 0 0 0-8 8c0 3 1 5 3 6v3h2v-2h2v2h2v-2h2v2h2v-3c2-1 3-3 3-6a8 8 0 0 0-8-8zM8.5 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill-rule="evenodd"/>'
    };
    const ABILITY_DESC = {
        tight_bond: 'Jedność – siła × liczba kart z tą samą Jednością w rzędzie.',
        morale_boost: 'Wzmocnienie – +1 dla pozostałych jednostek w rzędzie.',
        muster: 'Wezwanie – przyzywa powiązane karty z ręki i talii.',
        medic: 'Leczenie – wskrzesza jednostkę z cmentarza.',
        spy: 'Szpiegostwo – kładziona po stronie przeciwnika.',
        agile: 'Mobilność – może stać w jednym z kilku rzędów.',
        scorch_row: 'Szeregowy deszcz ognia – niszczy najsilniejsze karty przeciwnika w tym rzędzie (gdy suma ≥ 10).',
        scorch: 'Globalny deszcz ognia – niszczy najsilniejsze karty na planszy.',
        scorch_strongest: 'Deszcz ognia – niszczy najsilniejsze karty na planszy.',
        horn: 'Róg wojenny – podwaja siłę pozostałych jednostek w rzędzie.',
        decoy: 'Chrząszcz – zastępuje kartę na planszy, która wraca do ręki.',
        avenger: 'Po zniszczeniu lub końcu tury zamienia się w silniejszą jednostkę.',
        summon_next_round: 'Po zniknięciu z planszy przyzywa Herszta orków.',
        'Moc': 'Moc – może zostać przemieniona przez Wyzwolenie siły.',
        'Wyzwolenie siły': 'Wyzwolenie siły – przemienia jednostki z Mocą w silniejsze.'
    };
    // Symbole umiejętności w kółkach (zastępcze, dopóki nie ma grafik)
    const ABILITY_ICON = {
        tight_bond: '⛓', morale_boost: '⬆', muster: '⚑', medic: '✚', spy: '👁', agile: '↕',
        scorch_row: '🔥', scorch: '🔥', scorch_strongest: '🔥', horn: '📯', decoy: '🪲',
        avenger: '♻', summon_next_round: '♻', 'Moc': 'ϟ', 'Wyzwolenie siły': '✦'
    };
    // Wskazówka pod nazwą: karty powiązane (Jedność, Wezwanie, Moc, przemiana)
    function relatedHint(c) {
        const out = [];
        const names = list => [...new Set(list.map(x => x.name))];
        const ab = c.abilities || [];
        if (ab.includes('tight_bond')) {
            const grp = allCards.filter(x => x.baseId === c.baseId && (x.abilities || []).includes('tight_bond'));
            const others = names(grp).filter(n => n !== c.name);
            out.push(others.length ? `Jedność z: ${others.join(', ')}` : `Jedność: ${c.name} ×${grp.length}`);
        }
        if (ab.includes('muster')) {
            const grp = allCards.filter(x => x.id !== c.id && (x.abilities || []).includes('muster') && (
                (c.musterGroup && x.musterGroup === c.musterGroup && !(x.musterRole === 'master' && c.musterRole !== 'master')) ||
                (c.musterRole === 'master' && String(c.musterGroup).endsWith('*') && x.musterRole === 'slug' && x.faction === c.faction)));
            const n = names(grp);
            if (n.length) out.push(`Wzywa: ${n.join(', ')}`);
        }
        const into = c.transformId || c.summons || c.nextRoundSummonId;
        if (into) { const t = getCardDetailsById(into); if (t) out.push(`Zamienia się w: ${t.name}`); }
        if (c.transformTargetId) out.push(`Działa na: ${c.transformTargetId.map(b => (allCards.find(x => x.baseId === b) || { name: b }).name).join(', ')}`);
        return out.join(' · ');
    }
    const cardView = $('#card-view');
    function closeCardView() { cardView.hidden = true; }
    cardView.addEventListener('click', e => { if (e.target.closest('[data-close-card]')) closeCardView(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !cardView.hidden) closeCardView(); });

    // Szuka karty po instanceId: rzędy, rogi, pogoda.
    function findBoardCard(instanceId) {
        const info = explainCardPower(instanceId);
        if (info) return info;
        for (const p of P()) for (const r of ROWS) {
            const h = p.board.horns[r];
            if (h && h.instanceId == instanceId) return { card: getCardDetailsById(h.id) || h, owner: p, rowType: r, steps: [], final: null, horn: true };
        }
        const w = weatherCardsOnBoard.find(c => c.instanceId == instanceId);
        return w ? { card: w, owner: null, rowType: null, steps: [], final: null } : null;
    }

    function showCardView(instanceId) {
        const info = findBoardCard(instanceId);
        if (!info) return;
        const c = info.card.isDecoy ? (getCardDetailsById(info.card.id) || info.card) : info.card;
        const isUnit = c.type === 'Unit';
        const frame = $('#cf-frame');
        // Szarfa tylko na jednostkach talii – neutralne jednostki i karty specjalne/pogody jej nie mają (jak na kartach)
        const noSash = c.faction === 'Neutral' || !isUnit;
        frame.className = 'cf-frame' + (c.isHero ? ' is-hero' : '') + (c.isToken ? ' is-token' : '') + (noSash ? ' no-sash' : '') + (isUnit ? '' : ' is-special');
        frame.style.setProperty('--cf-color', FACTION_COLORS[c.faction] || '#777');
        // siła (kółko 1)
        const fin = info.final, base = c.power;
        const pw = $('#cf-power');
        pw.hidden = !isUnit;
        pw.textContent = isUnit ? (fin ?? base) : '';
        pw.className = 'cf-circle cf-power' + (isUnit && fin != null && fin > base ? ' up' : isUnit && fin != null && fin < base ? ' down' : '');
        pw.title = isUnit ? `Siła: ${fin ?? base} (bazowa ${base})` : '';
        // szereg (kółko 2)
        // Jednostka: kółko szeregu. Karta specjalna: jedno kółko z symbolem (pogoda – symbol runy, inne – umiejętność).
        const rows = isUnit ? (Array.isArray(c.row) ? c.row : [c.row]) : [];
        // Jednostka mogąca stać w kilku rzędach: obie ikonki w jednym kółku (jak na kartach).
        const rowEl = $('#cf-row');
        const specialHasAbility = !isUnit && c.type !== 'Weather' && (c.abilities || []).length > 0;
        rowEl.hidden = specialHasAbility;
        rowEl.innerHTML = rows.length ? rows.map(r => `<span>${esc(ROW_ICON[r])}</span>`).join('') : esc(c.type === 'Weather' ? (WEATHER_ICON[c.name] || '☁') : '★');
        rowEl.title = rows.length ? `Szereg: ${rows.map(r => ROW_LABEL[r]).join(' / ')}`
            : c.type === 'Weather' ? `${c.name} – ${c.rowAffected && c.rowAffected.length ? c.rowAffected.map(r => ROW_LABEL[r]).join(' / ') : 'wszystkie rzędy'}` : 'karta specjalna';
        rowEl.classList.toggle('multi', rows.length > 1);
        rowEl.classList.toggle('dark', !isUnit); // karta specjalna / pogoda: ciemne kółko z symbolem
        // herb na końcu szarfy
        const em = $('#cf-emblem');
        em.innerHTML = EMBLEM_SVG[c.faction] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${EMBLEM_SVG[c.faction]}</svg>` : '';
        if (CARD_ART.enabled && !noSash) {
            const img = new Image();
            img.alt = ''; img.onload = () => { em.innerHTML = ''; em.appendChild(img); }; img.src = CARD_ART.emblem(c.faction);
        }
        // postać
        const art = $('#cf-art');
        art.innerHTML = '';
        const fallback = () => { art.innerHTML = `<span class="cf-initial">${esc((c.name || '?').charAt(0))}</span>`; };
        if (CARD_ART.enabled) {
            const img = new Image();
            img.alt = c.name; img.onerror = fallback; img.src = CARD_ART.card(c.id);
            art.appendChild(img);
        } else fallback();
        // umiejętności (kolejne kółka)
        const ab = $('#cf-abilities');
        ab.innerHTML = '';
        (c.abilities || []).forEach(k => {
            const el = document.createElement('span');
            el.className = 'cf-circle cf-ability';
            el.title = ABILITY_DESC[k] || ABILITY_LABEL[k] || k;
            const sym = () => { el.textContent = ABILITY_ICON[k] || (ABILITY_LABEL[k] || k).charAt(0); };
            if (CARD_ART.enabled) {
                const img = new Image();
                img.alt = ABILITY_LABEL[k] || k;
                img.onerror = () => { el.innerHTML = ''; sym(); };
                img.src = CARD_ART.ability(k);
                el.appendChild(img);
            } else sym();
            ab.appendChild(el);
        });
        // nazwa + wskazówka, tablica, opis
        $('#cf-name').textContent = c.name;
        const hint = relatedHint(c);
        $('#cf-hint').textContent = hint;
        $('#cf-hint').hidden = !hint;
        const desc = $('#cf-desc');
        desc.textContent = c.description ? `„${c.description}”` : '';
        desc.classList.toggle('empty', !c.description);
        const abDesc = (c.abilities || []).filter(k => ABILITY_DESC[k]).map(k => `${ABILITY_ICON[k] || '•'} ${ABILITY_DESC[k]}`);
        $('#cf-ability-desc').innerHTML = abDesc.map(t => `<li>${esc(t)}</li>`).join('');
        $('#cf-ability-desc').hidden = !abDesc.length;
        // dlaczego tyle punktów
        const why = $('#cf-why');
        if (isUnit && info.steps && info.steps.length) {
            why.hidden = false;
            $('#cf-why-list').innerHTML = info.steps.map(s => `<li><span>${esc(s.label)}</span><b>${s.value}</b></li>`).join('');
        } else why.hidden = true;
        cardView.hidden = false;
    }
    function pointsWord(n) {
        const a = Math.abs(n) % 100, b = a % 10;
        if (n === 1) return 'punkt';
        return (b >= 2 && b <= 4 && (a < 12 || a > 14)) ? 'punkty' : 'punktów';
    }
    // Kliknięcie karty na stole (poza trybem wyboru celu Chrząszcza) otwiera pełny widok.
    battlefieldScreen.addEventListener('click', e => {
        if (isDecoyModeActive) return;
        const el = e.target.closest('.card-on-board');
        if (!el || !el.dataset.instanceId) return;
        showCardView(el.dataset.instanceId);
    });
    battlefieldScreen.addEventListener('contextmenu', e => {
        const el = e.target.closest('.card-on-board');
        if (!el || !el.dataset.instanceId) return;
        e.preventDefault();
        showCardView(el.dataset.instanceId);
    });

    // ---------- Talia (opcjonalnie): wybór kart, które gracz ma fizycznie ----------
    const deckKey = (n, faction) => `rk-deck-${n}-${faction}`;
    const deckPool = faction => allCards.filter(c => c.type !== 'Leader' && !c.isToken && (c.faction === faction || c.faction === 'Neutral'));
    function readDeck(n, faction) {
        try { const v = JSON.parse(localStorage.getItem(deckKey(n, faction)) || 'null'); return Array.isArray(v) && v.length ? v : null; }
        catch (e) { return null; }
    }
    // script.js pyta o talię przy starcie gry (null = wszystkie karty).
    window.getDeckSelection = (playerKey, faction) => readDeck(playerKey === 'player1' ? 1 : 2, faction);
    function refreshDeckButtons() {
        [1, 2].forEach(n => {
            const btn = $(`#deck-btn-${n}`);
            const faction = $(`#player${n}-faction-select`).value;
            const badge = btn.querySelector('.deck-count');
            btn.disabled = !faction;
            btn.classList.remove('custom');
            badge.hidden = true;
            if (!faction) { btn.title = 'Talia: wybierz najpierw frakcję'; btn.setAttribute('aria-label', btn.title); return; }
            const pool = deckPool(faction), deck = readDeck(n, faction);
            const cnt = deck ? pool.filter(c => deck.includes(c.id)).length : pool.length;
            btn.title = deck ? `Talia: ${cnt} z ${pool.length} kart – zmień` : `Talia: wszystkie karty (${pool.length}) – ustaw`;
            btn.setAttribute('aria-label', btn.title);
            if (deck) { btn.classList.add('custom'); badge.textContent = cnt; badge.hidden = false; }
        });
    }
    function openDeckEditor(n) {
        const faction = $(`#player${n}-faction-select`).value;
        if (!faction) return;
        const pool = deckPool(faction);
        const saved = readDeck(n, faction);
        const sameName = {}, seen = {};
        pool.forEach(c => { sameName[c.name] = (sameName[c.name] || 0) + 1; });
        const items = pool.map(c => {
            seen[c.name] = (seen[c.name] || 0) + 1;
            const label = sameName[c.name] > 1 ? `${c.name} (${seen[c.name]}/${sameName[c.name]})` : c.name;
            return cardItem(c, { key: c.id, name: label });
        }).sort((a, b) => (GROUP_ORDER[a.group] - GROUP_ORDER[b.group]) || a.name.localeCompare(b.name, 'pl'));
        const cfg = {
            kind: 'deck',
            title: `Talia gracza ${n} – ${faction}`,
            searchable: true, sortable: true, abilityFilters: true,
            multi: true,
            groupLabels: GROUP_LABELS,
            filters: [
                { key: 'all', label: 'Wszystkie' }, { key: 'melee', label: ROW_ICON.melee + ' Wręcz' },
                { key: 'ranged', label: ROW_ICON.ranged + ' Dystans' }, { key: 'siege', label: ROW_ICON.siege + ' Obl.' },
                { key: 'hero', label: 'Bohaterowie' }, { key: 'special', label: 'Specjalne' }, { key: 'weather', label: 'Pogoda' }
            ],
            selected: new Set(saved ? saved.filter(id => pool.some(c => c.id === id)) : pool.map(c => c.id)),
            items,
            footer: () => {
                const all = cfg.selected.size === items.length;
                return [
                    {
                        label: all ? 'Odznacz wszystkie' : 'Zaznacz wszystkie', cls: 'btn-small', onClick: () => {
                            if (cfg.selected.size === items.length) cfg.selected.clear(); else items.forEach(it => cfg.selected.add(it.key));
                            renderSheetList(); renderSheetFoot();
                        }
                    },
                    {
                        label: `Gotowe (${cfg.selected.size})`, cls: 'btn-primary', disabled: cfg.selected.size === 0, onClick: () => {
                            try {
                                if (cfg.selected.size === items.length) localStorage.removeItem(deckKey(n, faction));
                                else localStorage.setItem(deckKey(n, faction), JSON.stringify([...cfg.selected]));
                            } catch (e) { /* brak miejsca / dostępu */ }
                            closeSheet();
                            refreshDeckButtons();
                        }
                    }
                ];
            }
        };
        openSheet(cfg);
    }
    [1, 2].forEach(n => $(`#deck-btn-${n}`).addEventListener('click', () => openDeckEditor(n)));

    // ---------- Wznowienie zapisanej partii ----------
    function showResumeBox() {
        const box = $('#resume-box');
        const saved = loadSave();
        if (!saved || !saved.snap) { box.hidden = true; return; }
        const a = saved.snap.p1, b = saved.snap.p2;
        const ev = saved.meta && saved.meta.event ? `${saved.meta.event}: ` : '';
        $('#resume-text').textContent = ev + (saved.snap.isGameOver
            ? `Zakończona gra: ${a.name} (${a.faction}) vs ${b.name} (${b.faction}).`
            : `Niedokończona gra: ${a.name} (${a.faction}) vs ${b.name} (${b.faction}), tura ${saved.snap.roundNumber}.`);
        $('#resume-btn').textContent = saved.snap.isGameOver ? 'Pokaż podsumowanie' : 'Wznów grę';
        box.hidden = false;
    }
    $('#resume-btn').addEventListener('click', () => {
        const saved = loadSave();
        try {
            suppressFx = true;
            if (!importGameState(saved)) throw new Error('brak zapisu');
            if (saved.meta) Object.assign(gameMeta, { event: saved.meta.event || '', named: saved.meta.named || [false, false] });
            gameRunning = !isGameOver;
            battlefieldScreen.style.display = '';
            applyFactionColors();
            requestWakeLock();
            scheduleRefresh();
            toast('Wznowiono zapisaną grę');
        } catch (e) {
            clearSave();
            toast('Nie udało się wczytać zapisu – zacznij nową grę.', true);
            location.reload();
        } finally { setTimeout(() => { suppressFx = false; }, 0); }
    });
    $('#resume-discard').addEventListener('click', () => { clearSave(); $('#resume-box').hidden = true; });

    // ---------- Ustawienia umiejętności talii (warianty do testów balansu) ----------
    // Definicje i domyślne wartości: ABILITY_DEFS w script.js. Tu: okno z listą talii, stroną talii,
    // edycją zdolności (nazwa, opis, parametry), własnymi zdolnościami (przypomnienia) i zapisanymi zestawami.
    const FACTIONS = ['Khorinis', 'Potwory', 'Najemnicy', 'Klasztor', 'Orkowie', 'Bandyci', 'Nieumarli'];
    const ABILITY_HOW = {
        khorinis_draw: 'Działa automatycznie przy liczeniu tury.',
        khorinis_draw_match: 'Działa automatycznie przy liczeniu tury.',
        potwory_keep: 'Po każdej turze pojawi się okno wyboru (z przyciskiem „Losuj”).',
        najemnicy_mulligan: 'Dzieje się przy stole – kalkulator przypomina w historii.',
        orkowie_revive: 'Na starcie tej tury pojawi się okno wyboru (z przyciskiem „Losuj”).',
        bandyci_steal: 'Po przegranej turze pojawi się okno wyboru z cmentarza przeciwnika.',
        nieumarli_draw: 'Dzieje się przy stole – kalkulator przypomina w historii.'
    };
    const PRESETS_KEY = 'rk-rule-presets', RULES_KEY = 'rk-rules';
    const emptyRules = () => ({ abilities: {}, custom: [] });
    // Zostawia tylko zmiany względem domyślnych (porównywanie i zapis)
    function normalizeRules(r) {
        const out = emptyRules();
        if (!r || typeof r !== 'object' || !r.abilities) return out;
        if (r.general && r.general.tournament) out.general = { tournament: true };
        ABILITY_DEFS.forEach(d => {
            const o = r.abilities[d.id];
            if (!o) return;
            const n = {};
            // zdolności talii można tylko włączać i wyłączać (bez edycji nazw, opisów i parametrów)
            if ('on' in o && !!o.on !== d.on) out.abilities[d.id] = { on: !!o.on };
        });
        return out;
    }
    const rulesKey = r => JSON.stringify(normalizeRules(r));
    const sameRules = (a, b) => rulesKey(a) === rulesKey(b);
    // Zdolności talii (wbudowane + własne) z tekstem po wstawieniu parametrów
    function factionAbilities(faction, rules) {
        const built = ABILITY_DEFS.filter(d => d.faction === faction).map(d => {
            const st = abilityInfo(d.id, rules);
            return { ...st, text: fillAbilityText(st.desc, st) };
        });
        return built;
    }
    // Lista zmian względem instrukcji (do statusu, historii i podsumowania)
    function changesOf(rules) {
        const r = normalizeRules(rules), out = [];
        ABILITY_DEFS.forEach(d => {
            const o = r.abilities[d.id];
            if (!o) return;
            const st = abilityInfo(d.id, r), parts = [];
            if ('on' in o) parts.push(o.on ? 'wł.' : 'wył.');
            out.push({ faction: d.faction, text: `${d.faction} – ${st.name}: ${parts.join(', ')}` });
        });
        if (r.general && r.general.tournament) out.push({ faction: null, text: 'Tryb turniejowy: wł.' });
        return out;
    }
    function rulesSummary(rules) {
        const ch = changesOf(rules);
        return ch.length ? ch.map(c => c.text).join('; ') : 'instrukcja';
    }
    const changeWord = n => `${n} ${n === 1 ? 'zmiana' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'zmiany' : 'zmian'}`;
    function readPresets() {
        try { const v = JSON.parse(store.get(PRESETS_KEY) || '[]'); return Array.isArray(v) ? v.filter(p => p && p.name && p.rules) : []; }
        catch (e) { return []; }
    }
    const writePresets = list => store.set(PRESETS_KEY, JSON.stringify(list));
    let currentRules = (() => { try { return normalizeRules(JSON.parse(store.get(RULES_KEY) || 'null')); } catch (e) { return emptyRules(); } })();
    function setCurrentRules(r) { currentRules = normalizeRules(r); store.set(RULES_KEY, JSON.stringify(currentRules)); }
    function presetNameFor(r) {
        if (sameRules(r, emptyRules())) return 'instrukcja';
        const p = readPresets().find(x => sameRules(x.rules, r));
        return p ? p.name : null;
    }
    function refreshRulesButton() {
        const name = presetNameFor(currentRules), n = changesOf(currentRules).length;
        $('#rules-status').textContent = name || `własne (${changeWord(n)})`;
        $('#rules-btn').classList.toggle('changed', n > 0);
    }

    // --- Okno: widoki main → faction (talia) / cards (koncept edycji umiejętności kart) ---
    const rulesDlg = $('#rules-dialog');
    let rulesView = { name: 'main' };
    const foot = buttons => { $('#rules-foot').innerHTML = buttons.map((b, i) => `<button type="button" data-foot="${i}" class="${b.cls || ''}">${esc(b.label)}</button>`).join(''); footActions = buttons.map(b => b.onClick); };
    let footActions = [];
    $('#rules-foot').addEventListener('click', e => { const b = e.target.closest('[data-foot]'); if (b && footActions[+b.dataset.foot]) footActions[+b.dataset.foot](); });
    function openRules() { rulesView = { name: 'main' }; renderRules(); rulesDlg.hidden = false; }
    function closeRules() { rulesDlg.hidden = true; refreshRulesButton(); }
    function goRules(v) { rulesView = v; renderRules(); $('#rules-body').scrollTop = 0; }

    function renderRules() {
        const v = rulesView;
        $('#rules-back').hidden = v.name === 'main';
        const panel = rulesDlg.querySelector('.rules-panel');
        panel.style.setProperty('--rule-color', v.faction ? (FACTION_COLORS[v.faction] || '#777') : 'var(--gold)');
        if (v.name === 'main') renderRulesMain();
        else if (v.name === 'faction') renderRulesFaction(v.faction);
        else renderCardAbilities();
        refreshRulesButton();
    }
    function renderRulesMain() {
        $('#rules-title').textContent = 'Ustawienia umiejętności';
        const presets = readPresets();
        const match = sameRules(currentRules, emptyRules()) ? '__default' : (presets.find(p => sameRules(p.rules, currentRules)) || {}).name;
        const changes = changesOf(currentRules);
        $('#rules-body').innerHTML = `
            <div class="rules-presets">
                <label for="rules-preset">Zestaw ustawień</label>
                <div class="rules-preset-row">
                    <select id="rules-preset">
                        <option value="__default">Instrukcja (domyślne)</option>
                        ${presets.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('')}
                        ${match ? '' : '<option value="__custom">— własne, niezapisane —</option>'}
                    </select>
                    <button type="button" id="rules-delete" class="btn-small"${!match || match === '__default' ? ' disabled' : ''}>Usuń</button>
                </div>
                <div class="rules-preset-row">
                    <input type="text" id="rules-name" maxlength="40" autocomplete="off" placeholder="Nazwa nowego zestawu, np. Test Khorinis">
                    <button type="button" id="rules-save" class="btn-small">Zapisz</button>
                </div>
            </div>
            <h3 class="rules-sub">Zasady ogólne</h3>
            <div class="rule-row${currentRules.general && currentRules.general.tournament ? ' changed' : ''}" style="--rule-color:var(--gold)">
                <label class="rule-text" for="rule-tournament">
                    <span class="rule-name"><b>Tryb turniejowy</b><span class="rule-tag">instrukcja, str. 6</span></span>
                    <small>Gdy mecz kończy się remisem (obaj gracze tracą ostatni kryształ), gracze rozgrywają dodatkową rundę: tasują talie i wykładają po 4 karty. Kolejny remis – kolejna runda.</small>
                </label>
                <div class="rule-ctrl"><input type="checkbox" class="switch" role="switch" id="rule-tournament" data-general="tournament"${currentRules.general && currentRules.general.tournament ? ' checked' : ''}></div>
            </div>
            <h3 class="rules-sub">Umiejętności kart</h3>
            <button type="button" class="rules-faction" data-view="cards" style="--rule-color:var(--muted)">
                <span class="rf-name">Edycja umiejętności <span class="rule-tag tag-var">koncept</span></span>
                <span class="rf-meta">Jedność, Wzmocnienie, Róg, Leczenie, Szpiegostwo… – podgląd, jeszcze nie działa</span>
                <span class="rf-go" aria-hidden="true">›</span>
            </button>
            <h3 class="rules-sub">Talie</h3>
            <div class="rules-factions">
                ${FACTIONS.map(f => {
                    const list = factionAbilities(f, currentRules), act = list.filter(a => a.on).length;
                    const n = changes.filter(c => c.faction === f).length;
                    return `<button type="button" class="rules-faction${n ? ' changed' : ''}" data-faction="${f}" style="--rule-color:${FACTION_COLORS[f]}">
                        <span class="rf-name">${esc(f)}</span>
                        <span class="rf-meta">${act} z ${list.length} ${list.length === 1 ? 'zdolności' : 'zdolności'} · ${n ? changeWord(n) : 'instrukcja'}</span>
                        <span class="rf-go" aria-hidden="true">›</span>
                    </button>`;
                }).join('')}
            </div>`;
        $('#rules-preset').value = match || '__custom';
        foot([
            { label: 'Przywróć instrukcję', onClick: () => { setCurrentRules(emptyRules()); renderRules(); toast('Przywrócono zasady z instrukcji'); } },
            { label: 'Gotowe', cls: 'btn-primary', onClick: closeRules }
        ]);
    }
    function renderRulesFaction(f) {
        $('#rules-title').textContent = f;
        const list = factionAbilities(f, currentRules);
        $('#rules-body').innerHTML = `
            <p class="rules-intro">Włącz zdolności, którymi gra ta talia. Zdolności z instrukcji są domyślnie włączone, propozycje – wyłączone.</p>
            <div class="rules-list">
                ${list.map(a => {
                    const d = ABILITY_BY_ID[a.id];
                    const changed = !!currentRules.abilities[a.id];
                    return `<div class="rule-row${changed ? ' changed' : ''}${a.on ? '' : ' off'}">
                        <label class="rule-text">
                            <span class="rule-name"><b>${esc(a.name)}</b><span class="rule-tag tag-${a.origin === 'propozycja' ? 'var' : 'orig'}">${esc(a.origin)}</span></span>
                            <small>${esc(a.text)}</small>
                        </label>
                        <div class="rule-ctrl">
                            <input type="checkbox" class="switch" role="switch" aria-label="${esc(a.name)}" data-ab="${esc(a.id)}"${a.on ? ' checked' : ''}>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        foot([
            { label: 'Przywróć instrukcję talii', onClick: () => {
                const r = normalizeRules(currentRules);
                ABILITY_DEFS.filter(d => d.faction === f).forEach(d => delete r.abilities[d.id]);
                setCurrentRules(r); renderRules();
            } },
            { label: 'Gotowe', cls: 'btn-primary', onClick: closeRules }
        ]);
    }
    function setAbilityOn(id, on) {
        const r = normalizeRules(currentRules);
        const d = ABILITY_BY_ID[id];
        r.abilities[id] = { on };
        // zdolności z tej samej grupy wykluczają się (np. Khorinis: remis = tura albo remis = mecz)
        if (on && d.group) ABILITY_DEFS.filter(x => x.group === d.group && x.id !== id).forEach(x => { r.abilities[x.id] = { on: false }; });
        setCurrentRules(r);
    }
    // Koncept: edycja umiejętności kart (abilities). Na razie tylko podgląd – kontrolki są wyłączone i nic nie zapisują.
    const CARD_ABILITY_CONCEPT = [
        { key: 'tight_bond', name: 'Jedność', desc: 'Karty o tej samej nazwie w jednym rzędzie wzmacniają się nawzajem.',
          params: [{ label: 'Siła kart z Jednością', kind: 'select', options: ['× liczba takich kart (instrukcja)', '+1 za każdą inną taką kartę', '+2 za każdą inną taką kartę'] }] },
        { key: 'morale_boost', name: 'Wzmocnienie', desc: 'Dodaje siłę pozostałym jednostkom w rzędzie.',
          params: [{ label: 'Premia dla innych jednostek', kind: 'range', min: 1, max: 3, value: 1, unit: '+' }] },
        { key: 'horn', name: 'Róg wojenny', desc: 'Mnoży siłę jednostek w rzędzie (karta Rogu i jednostki jak Lester).',
          params: [{ label: 'Mnożnik', kind: 'range', min: 2, max: 3, value: 2, unit: '×' }] },
        { key: 'medic', name: 'Leczenie', desc: 'Wskrzesza jednostkę z cmentarza na planszę.',
          params: [{ label: 'Ile jednostek', kind: 'range', min: 1, max: 2, value: 1 }, { label: 'Działa na bohaterów', kind: 'bool', value: false }] },
        { key: 'spy', name: 'Szpiegostwo', desc: 'Karta trafia na stronę przeciwnika, a ty dobierasz karty.',
          params: [{ label: 'Ile kart dobierasz (przy stole)', kind: 'range', min: 1, max: 3, value: 2 }] },
        { key: 'agile', name: 'Mobilność', desc: 'Jednostka może stanąć w jednym z kilku rzędów.',
          params: [{ label: 'Wybór rzędu także przy wskrzeszeniu', kind: 'bool', value: true }] },
        { key: 'muster', name: 'Wezwanie', desc: 'Przyzywa karty ze swojej grupy (master – całą grupę, slug – tylko slugi).',
          params: [{ label: 'Skąd przyzywa', kind: 'select', options: ['Ręka i talia (instrukcja)', 'Tylko talia', 'Tylko ręka'] }] },
        { key: 'scorch_row', name: 'Szeregowy deszcz ognia', desc: 'Niszczy najsilniejsze karty przeciwnika w rzędzie.',
          params: [{ label: 'Próg siły rzędu', kind: 'range', min: 5, max: 20, value: 10 }, { label: 'Bohaterowie liczą się do progu', kind: 'bool', value: true }] },
        { key: 'scorch', name: 'Deszcz ognia', desc: 'Niszczy najsilniejsze karty na całej planszy.',
          params: [{ label: 'Działa też na twoje karty', kind: 'bool', value: true }] },
        { key: 'decoy', name: 'Chrząszcz', desc: 'Podmienia kartę na planszy – wraca ona do ręki.',
          params: [{ label: 'Można podmienić bohatera', kind: 'bool', value: false }] },
        { key: 'Moc', name: 'Moc / Wyzwolenie siły', desc: 'Jednostki z Mocą przemieniają się w silniejsze po Wyzwoleniu siły.',
          params: [{ label: 'Przemienione karty można wskrzesić', kind: 'bool', value: false }] },
        { key: 'avenger', name: 'Przemiana po zniszczeniu', desc: 'Xardas i Orkowa mapa wojenna zamieniają się w silniejszą jednostkę.',
          params: [{ label: 'Kiedy', kind: 'select', options: ['Po zniszczeniu i na koniec tury (instrukcja)', 'Tylko po zniszczeniu'] }] }
    ];
    function renderCardAbilities() {
        $('#rules-title').textContent = 'Edycja umiejętności';
        const ctrl = p => {
            if (p.kind === 'range') return `<label class="re-field"><span>${esc(p.label)}: <b>${p.unit || ''}${p.value}</b> <small>(instrukcja: ${p.unit || ''}${p.value})</small></span>
                <input type="range" min="${p.min}" max="${p.max}" value="${p.value}" disabled></label>`;
            if (p.kind === 'bool') return `<label class="re-field re-bool"><span>${esc(p.label)}</span><input type="checkbox" class="switch" role="switch"${p.value ? ' checked' : ''} disabled></label>`;
            return `<label class="re-field"><span>${esc(p.label)}</span><select disabled>${p.options.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>`;
        };
        $('#rules-body').innerHTML = `
            <p class="concept-note"><b>Koncept.</b> Tak mogłaby wyglądać edycja umiejętności kart. Pokazane wartości to zasady z instrukcji; kontrolki są na razie wyłączone i nic nie zmieniają. Daj znać, które ustawienia mają działać.</p>
            <div class="rules-list">
                ${CARD_ABILITY_CONCEPT.map(a => `<div class="concept-ab">
                    <div class="concept-head"><span class="concept-icon" aria-hidden="true">${esc(ABILITY_ICON[a.key] || '•')}</span>
                        <span class="rule-text"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></div>
                    <div class="re-params">${a.params.map(ctrl).join('')}</div>
                </div>`).join('')}
            </div>`;
        foot([{ label: 'Gotowe', cls: 'btn-primary', onClick: closeRules }]);
    }

    $('#rules-btn').addEventListener('click', openRules);
    $('#rules-back').addEventListener('click', () => {
        goRules({ name: 'main' });
    });
    rulesDlg.addEventListener('click', e => { if (e.target.closest('[data-close-rules]')) closeRules(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !rulesDlg.hidden) closeRules(); });
    $('#rules-body').addEventListener('click', e => {
        const fb = e.target.closest('[data-faction]');
        if (fb) return goRules({ name: 'faction', faction: fb.dataset.faction });
        if (e.target.closest('[data-view="cards"]')) return goRules({ name: 'cards' });
        if (e.target.closest('#rules-save')) {
            const inp = $('#rules-name'), name = inp.value.trim();
            if (!name) { inp.focus(); toast('Wpisz nazwę zestawu', true); return; }
            if (/^instrukcja/i.test(name)) { toast('Ta nazwa jest zajęta', true); return; }
            const list = readPresets().filter(p => p.name !== name);
            list.push({ name, rules: normalizeRules(currentRules) });
            writePresets(list);
            renderRules();
            toast(`Zapisano zestaw „${name}”`);
            return;
        }
        if (e.target.closest('#rules-delete')) {
            const v = $('#rules-preset').value;
            if (!v || v.startsWith('__')) return;
            writePresets(readPresets().filter(p => p.name !== v));
            renderRules();
            toast(`Usunięto zestaw „${v}”`);
        }
    });
    $('#rules-body').addEventListener('change', e => {
        if (e.target.id === 'rules-preset') {
            const v = e.target.value;
            if (v === '__custom') return;
            const p = v === '__default' ? { rules: emptyRules() } : readPresets().find(x => x.name === v);
            if (p) { setCurrentRules(p.rules); renderRules(); }
            return;
        }
        if (e.target.dataset.ab) { setAbilityOn(e.target.dataset.ab, e.target.checked); renderRules(); return; }
        if (e.target.dataset.general) {
            const r = normalizeRules(currentRules);
            r.general = { ...(r.general || {}), [e.target.dataset.general]: e.target.checked };
            setCurrentRules(r); renderRules(); return;
        }
    });
    refreshRulesButton();

    // ---------- Ekran konfiguracji ----------
    const nameInputs = [$('#player1-name-input'), $('#player2-name-input')];
    const eventInput = $('#event-input');
    eventInput.value = store.get('rk-event') || '';
    eventInput.addEventListener('input', () => store.set('rk-event', eventInput.value.trim()));
    nameInputs.forEach((inp, i) => { inp.value = store.get(`rk-name-${i + 1}`) || ''; });

    function setupComplete() {
        return ['player1', 'player2'].every(k => $(`#${k}-faction-select`).value && $(`#${k}-leader-select`).value);
    }
    function refreshSetup() {
        const ok = setupComplete();
        startGameButton.disabled = !ok;
        $('#setup-hint').hidden = ok;
    }
    gameSetupScreen.addEventListener('change', () => setTimeout(() => { refreshSetup(); applyFactionColors(); refreshDeckButtons(); }, 0));
    refreshSetup();
    refreshDeckButtons();
    showResumeBox();

    // Przechwycenie przed startGame(): imiona + blokada niepełnej konfiguracji
    // (oryginalny return w forEach nie zatrzymywał startu gry).
    document.addEventListener('click', e => {
        if (!e.target.closest('#startGameButton')) return;
        if (!setupComplete()) { e.stopImmediatePropagation(); e.preventDefault(); refreshSetup(); return; }
        P().forEach((pl, i) => {
            const v = nameInputs[i].value.trim();
            pl.name = v || `Gracz ${i + 1}`;
            gameMeta.named[i] = !!v;
            store.set(`rk-name-${i + 1}`, v);
        });
        gameMeta.event = eventInput.value.trim();
        store.set('rk-event', gameMeta.event);
        setRules(currentRules);
        if (changesOf(RULES).length) setTimeout(() => addLogEntry(`Umiejętności (zmiany względem instrukcji): ${rulesSummary(RULES)}.`), 0);
        gameRunning = true;
        clearSave();
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

    // Ostrzeżenie przed zamknięciem strony nie jest już potrzebne – partia zapisuje się sama.

    // Historia otwarta na dużym ekranie, zwinięta na telefonie
    const wide = window.matchMedia('(orientation: landscape) and (min-width: 600px)');
    const hist = $('#history-container');
    const syncHist = () => { hist.open = wide.matches; };
    syncHist();
    if (wide.addEventListener) wide.addEventListener('change', syncHist);

    // Nowe wpisy historii: polskie nazwy rzędów (script.js wpisuje melee/ranged/siege)
    // i odświeżenie paska „ostatnia akcja”.
    new MutationObserver(muts => {
        let level = 0;
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            n.textContent = n.textContent.replace(/do rzędu (melee|ranged|siege)\b/g, (_, r) => `do rzędu ${ROW_LABEL[r]}`);
            if (/Tura zakończona/.test(n.textContent)) level = 2;
            else if (/zagrał|wskrzesił|przywołuje|Wezwanie|użył|spasował|przeczekuje|używa/.test(n.textContent)) level = Math.max(level, 1);
        }));
        const restored = muts.some(m => m.addedNodes.length > 3); // przywrócenie historii (cofnij/wznów)
        if (!restored) { if (level === 2) buzz([40, 70, 40]); else if (level === 1) buzz(15); }
        scheduleRefresh();
    }).observe(historyLog, { childList: true });
})();
