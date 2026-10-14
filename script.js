// Wersja plików – ui.js sprawdza, czy przeglądarka nie wczytała starego script.js z pamięci.
const APP_VERSION = '2026-10-14a';

// ===== Umiejętności talii (ustawienia umiejętności na ekranie startowym) =====
// Każda talia ma listę zdolności: z instrukcji (domyślnie włączone) i proponowane warianty (domyślnie wyłączone).
// ui.js pozwala je włączać/wyłączać, zmieniać nazwy, opisy i parametry, dodawać własne zdolności (przypomnienia)
// i zapisywać całość jako zestawy. W trakcie gry ustawienia się nie zmieniają – zapis partii je przechowuje.
// W opisach: {klucz} = wartość parametru, {klucz|kartę|karty|kart} = liczba z odmianą.
const ABILITY_DEFS = [
    { id: 'khorinis_draw', faction: 'Khorinis', origin: 'instrukcja', on: true, group: 'khorinis_draw',
      name: 'Zwycięstwo w remisie', desc: 'Remis w turze oznacza wygraną tury dla Khorinis (gdy tylko jeden gracz gra Khorinis).' },
    { id: 'khorinis_draw_match', faction: 'Khorinis', origin: 'propozycja', on: false, group: 'khorinis_draw',
      name: 'Remis wygrywa mecz', desc: 'Remis w turze oznacza wygraną całego meczu dla Khorinis. Gdy obaj gracze grają Khorinis, remis rozstrzyga się normalnie.' },
    { id: 'potwory_keep', faction: 'Potwory', origin: 'instrukcja', on: true,
      name: 'Karty zostają na planszy', desc: 'Po końcu każdej tury zostawiasz na planszy {count|kartę|karty|kart} Potworów (nie bohaterów, nie neutralne).',
      params: { count: { label: 'Ile kart zostaje', min: 1, max: 3, value: 1 } } },
    { id: 'najemnicy_mulligan', faction: 'Najemnicy', origin: 'instrukcja', on: true, reminder: true,
      name: 'Dodatkowa wymiana', desc: 'Na starcie gry możesz wymienić o {count|kartę|karty|kart} więcej.',
      params: { count: { label: 'Ile kart więcej', min: 1, max: 3, value: 1 } } },
    { id: 'klasztor_skip', faction: 'Klasztor', origin: 'instrukcja', on: true, use: true,
      name: 'Przeczekanie tury', desc: 'Możesz oddać ruch przeciwnikowi bez pasowania – {uses|raz|razy|razy} na {per}.',
      params: { uses: { label: 'Ile razy', min: 1, max: 3, value: 1 }, per: { label: 'Limit na', options: { game: 'grę', round: 'turę' }, value: 'game' } } },
    { id: 'klasztor_agile_weather', faction: 'Klasztor', origin: 'propozycja', on: false,
      name: 'Mobilność pod pogodą', desc: 'Jednostki z Mobilnością pod złą pogodą mają ×{mult} siły po efekcie pogody (zwykle {mult} zamiast 1).',
      params: { mult: { label: 'Mnożnik', min: 2, max: 4, value: 2 } } },
    { id: 'orkowie_revive', faction: 'Orkowie', origin: 'instrukcja', on: true,
      name: 'Powrót poległych', desc: 'Na starcie tury {round} przywracasz z cmentarza na planszę {count|kartę|karty|kart} Orków (nie bohaterów).',
      params: { count: { label: 'Ile kart wraca', min: 1, max: 4, value: 2 }, round: { label: 'W której turze', min: 2, max: 3, value: 3 } } },
    { id: 'orkowie_beliar', faction: 'Orkowie', origin: 'instrukcja – dowódca', on: true,
      name: 'Beliar z nami', desc: 'Gdy grasz dowódcą Beliar z nami: zła pogoda dzieli siłę twoich jednostek przez 2 (w dół) zamiast obniżać ją do 1.' },
    { id: 'bandyci_steal', faction: 'Bandyci', origin: 'instrukcja', on: true,
      name: 'Łup z cmentarza', desc: 'Po przegranej turze dobierasz do ręki {count|losową kartę|losowe karty|losowych kart} z cmentarza przeciwnika – zwykłe jednostki i bohaterów (bez kart specjalnych).',
      params: { count: { label: 'Ile kart', min: 1, max: 3, value: 1 }, drawIsLoss: { label: 'Remis liczy się jako przegrana', type: 'bool', value: true } } },
    { id: 'nieumarli_draw', faction: 'Nieumarli', origin: 'instrukcja', on: true, reminder: true,
      name: 'Dobór po zwycięstwie', desc: 'Po wygranej turze dobierasz {count|kartę|karty|kart} z talii – zwykłe dobranie, może to być każda karta.',
      params: { count: { label: 'Ile kart', min: 1, max: 3, value: 1 } } },
    { id: 'nieumarli_muster_grave', faction: 'Nieumarli', origin: 'propozycja', on: false,
      name: 'Wezwanie z cmentarza', desc: 'Gdy jednostka z Wezwaniem wraca z cmentarza (Leczenie), razem z nią wracają pozostałe jednostki jej grupy, które leżą na cmentarzu.' }
];
const ABILITY_BY_ID = Object.fromEntries(ABILITY_DEFS.map(d => [d.id, d]));
// Własne zdolności: kalkulator nie zna ich działania – przypomina o nich w historii w wybranym momencie.
const CUSTOM_TRIGGERS = { start: 'na starcie gry', round: 'na starcie każdej tury', win: 'po wygranej turze', loss: 'po przegranej turze', draw: 'po remisie', none: 'bez przypomnienia' };
// RULES: { abilities: { id: { on, params, name, desc } }, custom: [{ id, faction, name, desc, trigger, on }] } – tylko zmiany względem domyślnych
let RULES = { abilities: {}, custom: [], general: {} }; // general.tournament – tryb turniejowy
function setRules(r) {
    r = r && typeof r === 'object' ? r : {};
    RULES = { abilities: { ...(r.abilities || {}) }, custom: Array.isArray(r.custom) ? r.custom.map(c => ({ ...c })) : [], general: { ...(r.general || {}) } };
}
// Pełny, scalony stan zdolności (domyślne + zmiany)
function abilityInfo(id, rules = RULES) {
    const d = ABILITY_BY_ID[id];
    if (!d) return null;
    const o = (rules.abilities || {})[id] || {};
    const params = {};
    Object.entries(d.params || {}).forEach(([k, p]) => { params[k] = o.params && k in o.params ? o.params[k] : p.value; });
    return { ...d, on: 'on' in o ? !!o.on : d.on, params, name: o.name || d.name, desc: o.desc || d.desc };
}
const abOn = id => !!abilityInfo(id).on;
const abP = (id, k) => abilityInfo(id).params[k];
// Zdolność działa dla gracza: jego talia + włączona
const hasAbility = (player, id) => !!player && player.faction === ABILITY_BY_ID[id].faction && abOn(id);
// Opis z wstawionymi parametrami
function plForm(n, one, few, many) { n = Math.abs(n); return n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? few : many; }
function fillAbilityText(text, st) {
    return String(text || '').replace(/\{(\w+)(?:\|([^|}]*)\|([^|}]*)\|([^|}]*))?\}/g, (m, k, a, b, c) => {
        if (!st.params || !(k in st.params)) return m;
        let v = st.params[k];
        const p = (ABILITY_BY_ID[st.id] && ABILITY_BY_ID[st.id].params || {})[k];
        if (p && p.options) v = p.options[v] || v;
        if (a !== undefined) return (v === 1 && /^(raz|kartę|karta|losową kartę)$/.test(a)) ? a : `${v} ${plForm(v, a, b, c)}`;
        return String(v);
    });
}
// Przypomnienia o własnych zdolnościach (moment: start / round / win / loss / draw)
function customReminders(trigger, player) {
    (RULES.custom || []).filter(c => c.on !== false && c.trigger === trigger && c.faction === player.faction).forEach(c => {
        addLogEntry(`${player.name} (${player.faction}) – ${c.name}${c.desc ? `: ${c.desc}` : ''}`);
    });
}
const isAgileCard = c => (c.abilities && c.abilities.includes('agile')) || (Array.isArray(c.row) && c.row.length > 1);
// Siła jednostki pod pogodą (przed Jednością, Wzmocnieniem i Rogiem).
function beliarActive(owner) { return abOn('orkowie_beliar') && leaderOn(owner, 'Beliar_z_nami'); }
function weatherPower(owner, card) {
    let v = beliarActive(owner) ? Math.floor(card.power / 2) : 1;
    if (hasAbility(owner, 'klasztor_agile_weather') && isAgileCard(card)) v *= abP('klasztor_agile_weather', 'mult');
    return v;
}
// Klasztor: ile przeczekań zostało
function skipsLeft(player) {
    if (!hasAbility(player, 'klasztor_skip')) return 0;
    return Math.max(0, abP('klasztor_skip', 'uses') - (player.skipCount || 0));
}

// === Elementy DOM ===
const gameSetupScreen = document.getElementById('game-setup-screen');
const battlefieldScreen = document.getElementById('battlefield-screen');
const startGameButton = document.getElementById('startGameButton');
const globalWeatherRow = document.getElementById('global-weather-row');
const historyLog = document.getElementById('history-log');

// Obiekty graczy
let players = {
    player1: { name: 'Gracz 1', faction: null, crystalCount: 2, power: 0, commander: null, graveyard: [], availableCards: [], board: { melee: [], ranged: [], siege: [], horns: { melee: null, ranged: null, siege: null } } },
    player2: { name: 'Gracz 2', faction: null, crystalCount: 2, power: 0, commander: null, graveyard: [], availableCards: [], board: { melee: [], ranged: [], siege: [], horns: { melee: null, ranged: null, siege: null } } }
};
Object.keys(players).forEach(pKey => {
    const pNum = pKey.slice(-1);
    players[pKey].domElements = {
        factionDisplay: document.getElementById(`player${pNum}-faction-display`), crystalCount: document.getElementById(`player${pNum}-crystal-count`),
        powerDisplay: document.getElementById(`player${pNum}-power`), commanderName: document.getElementById(`player${pNum}-commander-name`),
        activateLeaderButton: document.getElementById(`activateLeader${pNum}`), cardSelect: document.getElementById(`player${pNum}-card-select`),
        rowSelect: document.getElementById(`player${pNum}-row-select`), playCardButton: document.getElementById(`playCardButton${pNum}`),
        graveyardSelect: document.getElementById(`player${pNum}-graveyard-select`), passRoundButton: document.getElementById(`passRoundButton${pNum}`),
        meleeRow: document.getElementById(`player${pNum}-melee-row`), rangedRow: document.getElementById(`player${pNum}-ranged-row`),
        siegeRow: document.getElementById(`player${pNum}-siege-row`), meleeHorn: document.getElementById(`player${pNum}-melee-horn`),
        rangedHorn: document.getElementById(`player${pNum}-ranged-horn`), siegeHorn: document.getElementById(`player${pNum}-siege-horn`),
        meleeScore: document.getElementById(`player${pNum}-melee-score`), rangedScore: document.getElementById(`player${pNum}-ranged-score`),
        siegeScore: document.getElementById(`player${pNum}-siege-score`),
    }
});

// Zmienne stanu gry
let activePlayer = null, roundNumber = 1, passedPlayers = [], weatherCardsOnBoard = [], isFirstMoveOfRound = true;
let isDecoyModeActive = false;
let isMedicModeActive = false;
let isAgileResurrectionModeActive = false;
let cardToResurrectWithAgile = null;
// Wezwanie: gracz wybiera, które karty z grupy faktycznie kładzie na stół.
let isMusterModeActive = false;
let pendingMuster = null; // { player, card, targetRow, candidates }

// Wyniki zakończonych tur i stan końca gry (do podsumowania).
let roundResults = []; // { round, p1, p2, winner: 'player1' | 'player2' | 'draw' }
let isGameOver = false;
// Koniec tury ze zdolnościami talii, które wymagają wyboru (Potwory, Orkowie, Bandyci).
// { stage: 'keep'|'post', queue: [{ kind, player, count, candidates: [instanceId] }], kept: { player1: [], player2: [] }, losers: [] }
let roundEndFlow = null;
let endRoundTimer = null;

// ===== Cofanie ruchu: migawki stanu przed każdą akcją gracza =====
const undoStack = [];
const redoStack = [];
const UNDO_LIMIT = 300;
function playerKeyOf(p) { return p === players.player1 ? 'player1' : p === players.player2 ? 'player2' : null; }
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function takeSnapshot() {
    const strip = p => { const { domElements, ...rest } = p; return clone(rest); };
    return {
        p1: strip(players.player1), p2: strip(players.player2),
        activePlayer: playerKeyOf(activePlayer), roundNumber, passed: passedPlayers.map(playerKeyOf),
        weather: clone(weatherCardsOnBoard), isFirstMoveOfRound,
        isMedicModeActive, isAgileResurrectionModeActive, cardToResurrectWithAgile: clone(cardToResurrectWithAgile),
        isMusterModeActive,
        pendingMuster: pendingMuster ? { ...clone({ ...pendingMuster, player: null }), player: playerKeyOf(pendingMuster.player) } : null,
        iid: __iid, roundResults: clone(roundResults), isGameOver, roundEndFlow: clone(roundEndFlow), log: historyLog.innerHTML
    };
}
function pushUndo(snap) {
    undoStack.push(snap);
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack.length = 0; // nowy ruch kasuje możliwość „Powtórz”
}
function canUndo() { return undoStack.length > 0; }
function canRedo() { return redoStack.length > 0; }
function restoreSnapshot(s) {
    clearTimeout(endRoundTimer); endRoundTimer = null;
    deactivateDecoyMode();
    // Przywróć graczy dokładnie: usuń też pola, których w migawce nie było (np. skipUsed).
    [['player1', s.p1], ['player2', s.p2]].forEach(([k, snap]) => {
        Object.keys(players[k]).forEach(key => { if (key !== 'domElements' && !(key in snap)) delete players[k][key]; });
        Object.assign(players[k], snap);
    });
    activePlayer = s.activePlayer ? players[s.activePlayer] : null;
    roundNumber = s.roundNumber;
    passedPlayers = s.passed.map(k => players[k]);
    weatherCardsOnBoard = s.weather;
    isFirstMoveOfRound = s.isFirstMoveOfRound;
    isMedicModeActive = s.isMedicModeActive;
    isAgileResurrectionModeActive = s.isAgileResurrectionModeActive;
    cardToResurrectWithAgile = s.cardToResurrectWithAgile || null;
    isMusterModeActive = s.isMusterModeActive;
    pendingMuster = s.pendingMuster ? { ...s.pendingMuster, player: players[s.pendingMuster.player] } : null;
    __iid = s.iid;
    roundResults = s.roundResults;
    isGameOver = s.isGameOver;
    roundEndFlow = s.roundEndFlow || null;
    historyLog.innerHTML = s.log;
    updateAllControls();
    // Stan „obaj spasowali, tura jeszcze nieprzeliczona” – dokończ turę.
    if (passedPlayers.length === 2 && !isGameOver && !roundEndFlow) endRoundTimer = setTimeout(endRound, 500);
    if (roundEndFlow && roundEndFlow.queue.length && typeof window.openFactionChoice === 'function') window.openFactionChoice(getPendingChoice());
    if (isMusterModeActive && typeof window.openMusterPicker === 'function') window.openMusterPicker(pendingMuster);
    if (isGameOver && typeof window.showGameSummary === 'function') {
        const c1 = players.player1.crystalCount, c2 = players.player2.crystalCount;
        window.showGameSummary(c1 <= 0 && c2 <= 0 ? null : (c1 <= 0 ? players.player2 : players.player1));
    }
}
function undoLastMove() {
    if (!undoStack.length) return false;
    const s = undoStack.pop();
    redoStack.push(takeSnapshot());
    restoreSnapshot(s);
    return true;
}
function redoLastMove() {
    if (!redoStack.length) return false;
    const s = redoStack.pop();
    undoStack.push(takeSnapshot());
    restoreSnapshot(s);
    return true;
}
// ===== Zapis partii (ui.js trzyma go w localStorage) =====
function exportGameState(maxUndo = 25) {
    return { version: APP_VERSION, snap: takeSnapshot(), undo: undoStack.slice(-maxUndo), started: true, rules: { ...RULES } };
}
function importGameState(o) {
    if (!o || !o.snap) return false;
    setRules(o.rules); // starsze zapisy bez zasad = instrukcja
    gameSetupScreen.style.display = 'none';
    battlefieldScreen.style.display = 'grid';
    undoStack.length = 0; redoStack.length = 0;
    (o.undo || []).forEach(u => undoStack.push(u));
    restoreSnapshot(o.snap);
    return true;
}

// ===== Rozbicie siły karty na planszy (dla podglądu w ui.js) =====
function explainCardPower(instanceId) {
    let owner = null, rowType = null, card = null;
    [players.player1, players.player2].forEach(p => ['melee', 'ranged', 'siege'].forEach(r => {
        const c = p.board[r].find(x => x.instanceId == instanceId);
        if (c) { owner = p; rowType = r; card = c; }
    }));
    if (!card) return null;
    const steps = [];
    const final = card.currentPower ?? card.power;
    if (card.type !== 'Unit' || card.isDecoy) return { card, owner, rowType, steps: [{ label: 'Siła', value: final }], final };
    steps.push({ label: 'Siła bazowa', value: card.power });
    if (card.isHero) { steps.push({ label: 'Bohater – odporny na wszystkie efekty', value: card.power }); return { card, owner, rowType, steps, final }; }
    const row = owner.board[rowType];
    let p = card.power;
    const weather = weatherCardsOnBoard.find(w => w.rowAffected && w.rowAffected.includes(rowType));
    if (weather) {
        const beliar = beliarActive(owner);
        p = beliar ? Math.floor(card.power / 2) : 1;
        steps.push({ label: beliar ? `Pogoda: ${weather.name} → ½ (Beliar z nami)` : `Pogoda: ${weather.name} → 1`, value: p });
        if (hasAbility(owner, 'klasztor_agile_weather') && isAgileCard(card)) {
            const m = abP('klasztor_agile_weather', 'mult');
            p *= m; steps.push({ label: `${abilityInfo('klasztor_agile_weather').name} ×${m}`, value: p });
        }
    }
    if (card.abilities && card.abilities.includes('tight_bond')) {
        // ten sam klucz grupy co w liczeniu siły (baseId albo początek id)
        const key = c => c.baseId || c.id.split('_')[0];
        const n = row.filter(c => c.abilities && c.abilities.includes('tight_bond') && key(c) === key(card)).length;
        if (n > 1) { p *= n; steps.push({ label: `Jedność ×${n}`, value: p }); }
    }
    const morale = row.filter(c => c.abilities && c.abilities.includes('morale_boost') && c.instanceId !== card.instanceId).length;
    if (morale) { p += morale; steps.push({ label: `Wzmocnienie +${morale}`, value: p }); }
    const hornCard = owner.board.horns[rowType];
    const hornUnit = row.find(c => c.type === 'Unit' && c.abilities && c.abilities.includes('horn') && c.instanceId !== card.instanceId);
    if (spiesDoubled() && card.abilities && card.abilities.includes('spy')) { p *= 2; steps.push({ label: 'Drzewa mają uszy: szpieg ×2', value: p }); }
    if (hornCard || hornUnit) { p *= 2; steps.push({ label: `Róg ×2 (${hornCard ? hornCard.name : hornUnit.name})`, value: p }); }
    return { card, owner, rowType, steps, final };
}

// Wykonuje akcję; jeśli się udała, zapamiętuje stan sprzed niej.
function runAction(action) {
    const snap = takeSnapshot();
    const ok = action();
    if (ok) pushUndo(snap);
    return ok;
}

// Róg w rzędzie: karta Rogu wojennego albo jednostka z umiejętnością rogu (np. Lester).
function rowHasHorn(player, row) {
    return !!player.board.horns[row] || player.board[row].some(c => c.type === 'Unit' && c.abilities && c.abilities.includes('horn'));
}
function isHornSpecial(card) { return card.type === 'Special' && card.abilities && card.abilities.includes('horn'); }

let __iid = 0;
function nextInstanceId() { return ++__iid; }
// === Funkcje pomocnicze ===
function translateRowName(rowKey) { const names = { melee: 'Wręcz', ranged: 'Dystans', siege: 'Oblężnicze' }; return names[rowKey] || rowKey; }
// Komunikat dla gracza: ui.js podmienia window.notify na okienko w stylu aplikacji.
function notify(msg) { if (typeof window.notifyUser === 'function') window.notifyUser(msg); else alert(msg); }
function getCardDetailsById(cardId) { return allCards.find(card => card.id === cardId); }

function addLogEntry(message) {
    const p = document.createElement('p');
    p.textContent = `[Tura ${roundNumber}] ${message}`;
    if (historyLog.firstChild) { historyLog.insertBefore(p, historyLog.firstChild); }
    else { historyLog.appendChild(p); }
}

// ==================================================================
// === NOWA FUNKCJA DLA MECHANIKI "WYZWOLENIE SIŁY" ===
// ==================================================================
/**
 * Przechodzi przez wszystkie jednostki gracza na planszy i transformuje te,
 * które posiadają zdolność "Moc".
 * @param {object} player - Gracz, który zagrał kartę "Wyzwolenie siły".
 */
function executePowerRelease(player, targets, onlyRow) {
    addLogEntry(`${player.name} uwalnia moc swoich jednostek!`);
    ['melee', 'ranged', 'siege'].filter(r => !onlyRow || r === onlyRow).forEach(rowType => {
        // Tworzymy nową tablicę dla rzędu, aby uniknąć problemów z modyfikacją podczas iteracji
        const newRow = [];
        player.board[rowType].forEach(card => {
            // Sprawdź, czy karta ma zdolność "Moc" i ID karty do transformacji
            const isTarget = !targets || targets.length === 0 || targets.includes(card.baseId);
            if (isTarget && card.abilities && card.abilities.includes('Moc') && card.transformId) {
                const transformedCardInfo = getCardDetailsById(card.transformId);
                if (transformedCardInfo) {
                    addLogEntry(`${card.name} transformuje w ${transformedCardInfo.name}!`);
                    const newCard = { ...transformedCardInfo, instanceId: nextInstanceId() };
                    newRow.push(newCard); // Dodaj nową, silniejszą kartę
                } else {
                    newRow.push(card); // W razie błędu, zachowaj starą kartę
                }
            } else {
                newRow.push(card); // Jeśli karta nie ma zdolności, po prostu ją przepisz
            }
        });
        // Zastąp stary rząd nowym, z przetransformowanymi jednostkami
        player.board[rowType] = newRow;
    });
}


// Zbiórka (Wezwanie): karty z puli z tej samej grupy.
// Karta z musterRole 'master' (Czarny wilk, Hosh-Pak, Saturas) może przyzywać pozostałe,
// ale sama nie może być przyzwana przez karty, które nie są 'master'.
function collectMusterTargets(player, playedCard) {
    return player.availableCards.filter(musterMatches(playedCard));
}

function musterMatches(playedCard) {
    return c => c.id !== playedCard.id &&
        !(c.musterRole === 'master' && playedCard.musterRole !== 'master') && (
            (playedCard.musterGroup && c.musterGroup === playedCard.musterGroup) ||
            (playedCard.musterRole === 'master' && String(playedCard.musterGroup).endsWith('*') && c.musterRole === 'slug' && c.faction === playedCard.faction)
        );
}
// Wariant Nieumarłych: wskrzeszona jednostka z Wezwaniem zabiera z cmentarza pozostałe jednostki swojej grupy.
// Wracają bez uruchamiania własnych umiejętności (jak przy zwykłym Wezwaniu); mobilne – do rzędu wskrzeszonej karty, jeśli mogą.
function undeadMusterFromGraveyard(player, card, targetRow) {
    if (!hasAbility(player, 'nieumarli_muster_grave')) return;
    const match = musterMatches(card);
    const back = player.graveyard.filter(c => c.type === 'Unit' && !c.isDecoy && match(c));
    if (!back.length) return;
    player.graveyard = player.graveyard.filter(c => !back.includes(c));
    back.forEach(data => {
        const rows = Array.isArray(data.row) ? data.row : [data.row];
        const row = rows.includes(targetRow) ? targetRow : rows[0];
        player.board[row].push({ ...data, instanceId: nextInstanceId() });
    });
    addLogEntry(`${player.name} (${abilityInfo('nieumarli_muster_grave').name}): z cmentarza razem z ${card.name} wracają: ${back.map(c => c.name).join(', ')}.`);
}

// Tokeny też trafiają na cmentarz i mogą zostać wskrzeszone.
function sendToGraveyard(owner, card) { owner.graveyard.push(card); }

// Przyzywa token (np. Demon ognia, Herszt orków), o ile nie ma go już na planszy.
function summonTokenOnBoard(owner, tokenId) {
    const info = getCardDetailsById(tokenId);
    if (!info) return;
    const alreadyOnBoard = [players.player1, players.player2].some(p =>
        ['melee', 'ranged', 'siege'].some(r => p.board[r].some(c => c.id === tokenId)));
    if (alreadyOnBoard) { addLogEntry(`${info.name} jest już na planszy – nie można mieć dwóch.`); return; }
    const row = Array.isArray(info.row) ? info.row[0] : info.row;
    owner.board[row].push({ ...info, instanceId: nextInstanceId() });
    addLogEntry(`- Na polu bitwy pojawia się ${info.name} (${owner.name})!`);
}

// Xardas / Orkowa mapa wojenna: po zniszczeniu (np. Deszczem ognia) zamieniają się w token.
function triggerOnDestroyed(owner, card) {
    if (card.abilities && card.abilities.includes('avenger') && card.summons) summonTokenOnBoard(owner, card.summons);
    if (card.abilities && card.abilities.includes('summon_next_round') && card.nextRoundSummonId) summonTokenOnBoard(owner, card.nextRoundSummonId);
}

function needsRowChoice(card) {
    return card.type === 'Special' && card.abilities && (card.abilities.includes('horn') || card.abilities.includes('Wyzwolenie siły'));
}

function executeGlobalScorch() {
    addLogEntry("Na pole bitwy spada Deszcz Ognia!");
    let wszystkieJednostkiNaPlanszy = [];
    [players.player1, players.player2].forEach(player => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            player.board[rowType].forEach(card => {
                if (card.type === 'Unit' && !card.isHero && !card.isDecoy) {
                    wszystkieJednostkiNaPlanszy.push({ card, owner: player, row: rowType });
                }
            });
        });
    });

    if (wszystkieJednostkiNaPlanszy.length === 0) {
        addLogEntry("...ale nie znalazł żadnych celów.");
        return;
    }

    let maxMoc = 0;
    wszystkieJednostkiNaPlanszy.forEach(item => {
        const moc = item.card.currentPower ?? item.card.power;
        if (moc > maxMoc) {
            maxMoc = moc;
        }
    });

    const kartyDoZniszczenia = wszystkieJednostkiNaPlanszy.filter(item => {
        const moc = item.card.currentPower ?? item.card.power;
        return moc === maxMoc;
    });

    if (kartyDoZniszczenia.length > 0) {
        addLogEntry(`Deszcz Ognia niszczy najsilniejsze jednostki o sile ${maxMoc}!`);
        const destroyedNow = [];
        kartyDoZniszczenia.forEach(itemToDestroy => {
            const { card, owner, row } = itemToDestroy;
            const cardIndex = owner.board[row].findIndex(c => c.instanceId === card.instanceId);
            if (cardIndex > -1) {
                const [destroyedCard] = owner.board[row].splice(cardIndex, 1);
                addLogEntry(`- Zniszczono: ${destroyedCard.name} (${owner.name}).`);
                sendToGraveyard(owner, destroyedCard);
                destroyedNow.push({ owner, card: destroyedCard });
            }
        });
        destroyedNow.forEach(d => triggerOnDestroyed(d.owner, d.card));
    } else {
        addLogEntry("...ale nie znalazł żadnych celów.");
    }
}

function updateAllDisplays() {
    [players.player1, players.player2].forEach(p => updatePlayerDisplay(p));
}

function updatePlayerDisplay(player) {
    player.domElements.factionDisplay.textContent = player.faction;
    renderCrystals(player);
    applyAllEffects();
    renderPlayerBoard(player);
    player.power = calculatePlayerPower(player);
    player.domElements.powerDisplay.textContent = player.power;
    player.domElements.commanderName.textContent = player.commander ? player.commander.name : '[Brak]';
    populateAvailableCardsSelect(player);
    populateGraveyardSelect(player);
    updatePlayerControlsVisibility(player);
}

function renderCrystals(player) {
    const container = player.domElements.crystalCount;
    container.innerHTML = '';
    const coinSVG = `<svg class="crystal-coin" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" stroke-width="8"/><path d="M 50,25 L 63,45 L 85,50 L 68,65 L 73,85 L 50,75 L 27,85 L 32,65 L 15,50 L 37,45 Z" fill="#B8860B"/></svg>`;
    for (let i = 0; i < player.crystalCount; i++) { container.innerHTML += coinSVG; }
}

function applyAllEffects() {
    const activeWeatherRows = new Set(weatherCardsOnBoard.map(card => card.rowAffected).flat().filter(row => row));
    [players.player1, players.player2].forEach(player => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            player.domElements[rowType + 'Row'].classList.remove('frost-effect', 'fog-effect', 'rain-effect', 'fear-effect');
            const cardsInRow = player.board[rowType];
            const hornUnits = cardsInRow.filter(c => c.type === 'Unit' && c.abilities && c.abilities.includes('horn'));
            
            const bondGroups = {};
            cardsInRow.forEach(card => {
                if (card.abilities && card.abilities.includes('tight_bond')) {
                    const baseId = card.baseId || card.id.split('_')[0];
                    if (!bondGroups[baseId]) {
                        bondGroups[baseId] = [];
                    }
                    bondGroups[baseId].push(card);
                }
            });
            
            const moraleGiversInRow = cardsInRow.filter(c => c.abilities && c.abilities.includes('morale_boost'));
            const moraleBoostValue = moraleGiversInRow.length;

            cardsInRow.forEach(card => {
                delete card.currentPower;
                if (card.type === 'Unit' && !card.isHero && !card.isDecoy) {
                    let power = card.power;
                    if (activeWeatherRows.has(rowType)) { power = weatherPower(player, card); }
                    
                    const baseId = card.baseId || card.id.split('_')[0];
                    if (card.abilities && card.abilities.includes('tight_bond') && bondGroups[baseId] && bondGroups[baseId].length > 1) {
                        power *= bondGroups[baseId].length;
                    }
                    
                    if (moraleBoostValue > 0) {
                        power += moraleBoostValue;
                        if (card.abilities && card.abilities.includes('morale_boost')) {
                            power -= 1;
                        }
                    }
                    
                    if (spiesDoubled() && card.abilities && card.abilities.includes('spy')) power *= 2; // Drzewa mają uszy
                    const hornActiveForCard = !!player.board.horns[rowType] || hornUnits.some(h => h.instanceId !== card.instanceId);
                    if (hornActiveForCard) { power *= 2; }
                    if (power !== card.power) { card.currentPower = power; }
                }
            });

            if (activeWeatherRows.has(rowType)) {
                const weatherCard = weatherCardsOnBoard.find(c => c.rowAffected && c.rowAffected.includes(rowType));
                if (weatherCard) {
                    if (weatherCard.effectClass) {
                        player.domElements[rowType + 'Row'].classList.add(weatherCard.effectClass);
                    }
                }
            }
        });
    });
    
    globalWeatherRow.innerHTML = '<h3>Pogoda</h3>';
    weatherCardsOnBoard.forEach(card => globalWeatherRow.appendChild(createCardElement(card)));
}

function calculatePlayerPower(player) {
    let totalPower = 0;
    ['melee', 'ranged', 'siege'].forEach(rowType => {
        let rowScore = 0;
        player.board[rowType].forEach(card => {
            rowScore += card.currentPower ?? card.power;
        });
        player.domElements[rowType + 'Score'].textContent = rowScore;
        totalPower += rowScore;
    });
    return totalPower;
}

function renderPlayerBoard(player) {
    ['melee', 'ranged', 'siege'].forEach(rowType => {
        const rowElement = player.domElements[rowType + 'Row'];
        const hornElement = player.domElements[rowType + 'Horn'];
        rowElement.innerHTML = `<h3>${translateRowName(rowType)}</h3>`;
        hornElement.innerHTML = '';
        hornElement.classList.remove('active');
        player.board[rowType].forEach(card => {
            rowElement.appendChild(createCardElement(card));
        });
        if (player.board.horns[rowType]) {
            hornElement.appendChild(createCardElement(player.board.horns[rowType]));
            hornElement.classList.add('active');
        }
    });
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-on-board');
    cardDiv.dataset.instanceId = card.instanceId;
    if (card.isHero) { cardDiv.classList.add('hero-card'); }
    if (card.type === 'Horn') { cardDiv.classList.add('horn-card'); }
    if (card.type === 'Weather') { cardDiv.classList.add('weather-card'); }
    let powerDisplayHTML = '';
    if (card.type === 'Unit') {
        const finalPower = card.currentPower ?? card.power;
        let powerClass = '';
        if (finalPower < card.power) { powerClass = 'power-nerfed'; }
        else if (finalPower > card.power) { powerClass = 'power-boosted'; }
        powerDisplayHTML = ` (<span class="${powerClass}">${finalPower}</span>)`;
    }
    cardDiv.innerHTML = `${card.name}${powerDisplayHTML}`;
    return cardDiv;
}

function populateAvailableCardsSelect(player) {
    const select = player.domElements.cardSelect;
    const previouslySelected = select.value;
    select.innerHTML = '<option value="">-- Wybierz kartę z puli --</option>';
    player.availableCards.sort((a, b) => a.name.localeCompare(b.name)).forEach(card => {
        const powerText = card.type === 'Unit' ? `, ${card.power}` : '';
        const optionText = `${card.name} (${card.type}${powerText})`;
        select.add(new Option(optionText, card.id));
    });
    select.value = previouslySelected;
}

function populateGraveyardSelect(player) {
    const select = player.domElements.graveyardSelect;
    select.innerHTML = `<option value="">-- Cmentarz --</option>`;
    if (isMedicModeActive && player === activePlayer) {
        select.disabled = false;
        select.innerHTML = '<option value="">-- Wybierz cel --</option>';
        player.graveyard.forEach(card => {
            const option = new Option(`${card.name} (${card.type}, ${card.power})`, card.id);
            if (card.type !== 'Unit' || card.isHero || card.isDecoy) {
                option.disabled = true;
            }
            select.add(option);
        });
    } else {
        select.disabled = player.graveyard.length === 0;
        player.graveyard.forEach(card => {
            const powerText = card.power !== undefined ? `, ${card.power}` : '';
            select.add(new Option(`${card.name} (${card.type}${powerText})`, card.id));
        });
    }
}

// Kładzie wybrane karty z Wezwania (chosenIds – lista id z pendingMuster.candidates) i kończy ruch.
function confirmMuster(chosenIds, skipUndo = false) {
    if (!isMusterModeActive || !pendingMuster) return;
    if (!skipUndo) pushUndo(takeSnapshot()); // z ui.js: cofnięcie wraca do wyboru kart
    const { player, card, targetRow, candidates } = pendingMuster;
    const chosen = candidates.filter(c => chosenIds.includes(c.id));
    isMusterModeActive = false;
    pendingMuster = null;
    chosen.forEach(data => {
        player.availableCards = player.availableCards.filter(c => c.id !== data.id);
        const row = Array.isArray(data.row) ? targetRow : data.row;
        player.board[row].push({ ...data, instanceId: nextInstanceId() });
    });
    if (chosen.length > 0) addLogEntry(`Wezwanie! ${card.name} przywołuje: ${chosen.map(c => c.name).join(', ')}.`);
    else addLogEntry(`Wezwanie: ${player.name} nie położył dodatkowych kart.`);
    endTurnAfterFollowUp(player);
}

function endTurnAfterFollowUp(player) {
    const opp = (player === players.player1) ? players.player2 : players.player1;
    if (passedPlayers.includes(opp)) { updateAllControls(); } else { switchActivePlayer(); }
}
function switchActivePlayer() { if (activePlayer) { activePlayer = (activePlayer === players.player1) ? players.player2 : players.player1; } updateAllDisplays(); }
function updateAllControls() { [players.player1, players.player2].forEach(p => updatePlayerDisplay(p)); }

function deactivateDecoyMode() {
    if (!isDecoyModeActive) return;
    document.querySelectorAll('.targetable').forEach(el => el.classList.remove('targetable'));
    isDecoyModeActive = false;
}

function executeDecoySwap(player, targetCardInstance) {
    deactivateDecoyMode();
    handlePlayerAction(player, () => {
        let boardRow, targetCardIndex = -1;
        for (const rowKey of ['melee', 'ranged', 'siege']) {
            const index = player.board[rowKey].findIndex(c => c.instanceId === targetCardInstance.instanceId);
            if (index > -1) {
                boardRow = player.board[rowKey];
                targetCardIndex = index;
                break;
            }
        }
        if (targetCardIndex === -1) return false;
        
        const [returnedCard] = boardRow.splice(targetCardIndex, 1);
        player.availableCards.push(returnedCard);
        
        const decoyCardIndex = player.availableCards.findIndex(c => c.abilities && c.abilities.includes('decoy'));
        if (decoyCardIndex > -1) {
            const [decoyCard] = player.availableCards.splice(decoyCardIndex, 1);
            const decoyUnit = { ...decoyCard, instanceId: nextInstanceId(), power: 0, type: 'Unit', isDecoy: true };
            boardRow.push(decoyUnit);
        }
        
        addLogEntry(`${player.name} użył karty Chrząszcz na karcie ${returnedCard.name}.`);
        updateAllControls();
        return true;
    });
}

function activateDecoyMode(player) {
    if (isDecoyModeActive) deactivateDecoyMode();
    // Chrząszcz jako pierwszy ruch tury: wskaż gracza, żeby dało się wybrać cel.
    if (isFirstMoveOfRound) activePlayer = player;
    isDecoyModeActive = true;
    addLogEntry(`${player.name} przygotowuje Chrząszcza... Kliknij cel na swojej planszy.`);
    updatePlayerControlsVisibility(player);
    ['melee', 'ranged', 'siege'].forEach(rowKey => {
        player.board[rowKey].forEach(cardOnBoard => {
            if (!cardOnBoard.isHero && cardOnBoard.type === 'Unit' && !cardOnBoard.isDecoy) {
                const cardElement = player.domElements[rowKey + 'Row'].querySelector(`[data-instance-id="${cardOnBoard.instanceId}"]`);
                if (cardElement) { cardElement.classList.add('targetable'); }
            }
        });
    });
}

function executeResurrection(player, resurrectedCardId) {
    pushUndo(takeSnapshot());
    isMedicModeActive = false;
    if (!resurrectedCardId) {
        addLogEntry(`${player.name} anulował wskrzeszenie.`);
        if (!isFirstMoveOfRound) endTurnAfterFollowUp(player);
        return;
    }

    const cardIndex = player.graveyard.findIndex(c => c.id === resurrectedCardId);
    if (cardIndex === -1) return;

    const [resurrectedCard] = player.graveyard.splice(cardIndex, 1);
    addLogEntry(`${player.name} przygotowuje do wskrzeszenia: ${resurrectedCard.name}.`);
    
    const cardInstance = { ...resurrectedCard, instanceId: nextInstanceId() };

    if (Array.isArray(cardInstance.row) && cardInstance.row.length > 1) {
        isAgileResurrectionModeActive = true;
        cardToResurrectWithAgile = cardInstance;
        updatePlayerControlsVisibility(player);
    } else {
        const targetRow = Array.isArray(cardInstance.row) ? cardInstance.row[0] : cardInstance.row;
        placeResurrectedCard(player, cardInstance, targetRow);
        finishResurrection(player);
    }
}

// Po wskrzeszeniu: jeśli wskrzeszony był medyk (łańcuch Leczenia), ten sam gracz wskrzesza dalej;
// w przeciwnym razie ruch przechodzi na przeciwnika.
function finishResurrection(player) {
    if (isMedicModeActive) {
        activePlayer = player;
        isFirstMoveOfRound = false;
        updateAllControls();
        return;
    }
    if (!isFirstMoveOfRound) {
        endTurnAfterFollowUp(player);
    } else {
        isFirstMoveOfRound = false;
        activePlayer = player;
        updateAllControls();
    }
}

function placeResurrectedCard(player, cardInstance, targetRow) {
    const hasAbilities = cardInstance.abilities && cardInstance.abilities.length > 0;

    if (hasAbilities && cardInstance.abilities.includes('spy')) {
        const opponent = (player === players.player1) ? players.player2 : players.player1;
        opponent.board[targetRow].push(cardInstance);
        addLogEntry(`${player.name} wskrzesił Szpiega: ${cardInstance.name} i zagrał go na stronę przeciwnika.`);
    } else {
        player.board[targetRow].push(cardInstance);
        addLogEntry(`${player.name} wskrzesił ${cardInstance.name} i położył ją w rzędzie ${translateRowName(targetRow)}.`);
        if (hasAbilities && cardInstance.abilities.includes('muster')) undeadMusterFromGraveyard(player, cardInstance, targetRow);
        
        if (hasAbilities) {
            if (cardInstance.abilities.includes('medic')) {
                const hasValidTargets = player.graveyard.some(c => c.type === 'Unit' && !c.isHero && !c.isDecoy);
                if (hasValidTargets) isMedicModeActive = true;
            }
            if (cardInstance.abilities.includes('scorch_row')) {
                executeRowScorch(player, targetRow);
            }
            if (cardInstance.abilities.includes('scorch')) {
                executeGlobalScorch();
            }
        }
    }
    updateAllControls();
}

function completeAgileResurrection(player, chosenRow) {
    if (!isAgileResurrectionModeActive || !cardToResurrectWithAgile) return;
    pushUndo(takeSnapshot());

    isAgileResurrectionModeActive = false;
    const card = cardToResurrectWithAgile;
    cardToResurrectWithAgile = null;
    placeResurrectedCard(player, card, chosenRow);
    finishResurrection(player);
}

function setupGame() {
    const factions = [...new Set(allCards.filter(c => c.type === 'Leader').map(c => c.faction))];
    const p1FactionSelect = document.getElementById('player1-faction-select'), p2FactionSelect = document.getElementById('player2-faction-select');
    const p1LeaderSelect = document.getElementById('player1-leader-select'), p2LeaderSelect = document.getElementById('player2-leader-select');
    p1FactionSelect.innerHTML = '<option value="">-- Wybierz Frakcję --</option>';
    p2FactionSelect.innerHTML = '<option value="">-- Wybierz Frakcję --</option>';
    factions.forEach(faction => { p1FactionSelect.add(new Option(faction, faction)); p2FactionSelect.add(new Option(faction, faction)); });
    p1FactionSelect.addEventListener('change', () => populateLeaderSelect(p1FactionSelect.value, p1LeaderSelect));
    p2FactionSelect.addEventListener('change', () => populateLeaderSelect(p2FactionSelect.value, p2LeaderSelect));
    startGameButton.addEventListener('click', startGame);
}

function populateLeaderSelect(faction, leaderSelect) {
    leaderSelect.innerHTML = '<option value="">-- Wybierz Dowódcę --</option>';
    leaderSelect.disabled = true; if (!faction) return;
    const leaders = allCards.filter(c => c.type === 'Leader' && c.faction === faction);
    leaders.forEach(leader => leaderSelect.add(new Option(leader.name, leader.id)));
    leaderSelect.disabled = false;
}

function startGame() {
    [players.player1, players.player2].forEach(p => {
        p.faction = document.getElementById(`${p === players.player1 ? 'player1' : 'player2'}-faction-select`).value;
        const leaderId = document.getElementById(`${p === players.player1 ? 'player1' : 'player2'}-leader-select`).value;
        if (!p.faction || !leaderId) { return alert("Proszę wybrać frakcję i dowódcę dla obu graczy!"); }
        p.commander = { ...getCardDetailsById(leaderId), isUsed: false }; // własna kopia dla każdego gracza
        p.skipCount = 0;
        p.availableCards = allCards.filter(card => 
            card.type !== 'Leader' && 
            !card.isToken &&
            (card.faction === p.faction || card.faction === 'Neutral')
        ).map(c => ({ ...c }));
        // Opcjonalna talia (ui.js): pula ograniczona do kart wybranych przez gracza.
        const deck = typeof window.getDeckSelection === 'function' ? window.getDeckSelection(playerKeyOf(p), p.faction) : null;
        if (deck && deck.length) p.availableCards = p.availableCards.filter(c => deck.includes(c.id));
    });
    gameSetupScreen.style.display = 'none'; battlefieldScreen.style.display = 'grid';
    isFirstMoveOfRound = true; activePlayer = null;
    addLogEntry(`Gra rozpoczęta! Tura ${roundNumber}.`);
    [players.player1, players.player2].forEach(p => {
        if (hasAbility(p, 'najemnicy_mulligan')) {
            const n = abP('najemnicy_mulligan', 'count');
            addLogEntry(`${p.name} (Najemnicy): na starcie możesz wymienić o ${n} ${plForm(n, 'kartę', 'karty', 'kart')} więcej (${2 + n} zamiast 2).`);
        }
        customReminders('start', p);
        customReminders('round', p);
    });
    leaderStartNotes();
    updateAllControls();
}

function updatePlayerControlsVisibility(player) {
    const { cardSelect, rowSelect, playCardButton, passRoundButton, activateLeaderButton, graveyardSelect } = player.domElements;

    playCardButton.style.display = 'inline-block';
    playCardButton.disabled = true;
    rowSelect.disabled = true;
    rowSelect.innerHTML = '<option value="">-- Wybierz Rząd --</option>';
    graveyardSelect.disabled = true;

    if (isAgileResurrectionModeActive && player === activePlayer) {
        cardSelect.disabled = true;
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;
        rowSelect.disabled = false;
        if (cardToResurrectWithAgile && Array.isArray(cardToResurrectWithAgile.row)) {
            cardToResurrectWithAgile.row.forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
        }
        return;
    }

    if (isMusterModeActive || isGameOver || roundEndFlow) {
        cardSelect.disabled = true;
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;
        return;
    }

    if (isMedicModeActive && player === activePlayer) {
        cardSelect.disabled = true;
        rowSelect.disabled = true;
        playCardButton.style.display = 'none';
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;
        populateGraveyardSelect(player);
        return;
    }

    if (passedPlayers.includes(player) || (isDecoyModeActive && player !== activePlayer)) {
        cardSelect.disabled = true;
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;
        return;
    }

    let isPlayerTurn = isFirstMoveOfRound || (player === activePlayer);
    cardSelect.disabled = !isPlayerTurn;
    passRoundButton.disabled = !isPlayerTurn;
    activateLeaderButton.disabled = !leaderUsable(player).ok;
    
    const selectedOption = cardSelect.options[cardSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value || !isPlayerTurn) return;

    const selectedCard = getCardDetailsById(selectedOption.value);
    if (!selectedCard) return;

    if (selectedCard.abilities && selectedCard.abilities.includes('decoy')) {
        playCardButton.disabled = !(player.board.melee.some(c => !c.isHero && !c.isDecoy) || player.board.ranged.some(c => !c.isHero && !c.isDecoy) || player.board.siege.some(c => !c.isHero && !c.isDecoy));
    } else if (selectedCard.type === 'Unit' && Array.isArray(selectedCard.row)) {
        rowSelect.disabled = false;
        selectedCard.row.forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
        playCardButton.disabled = !rowSelect.value;
    } else if (needsRowChoice(selectedCard)) {
        rowSelect.disabled = false;
        // Róg wojenny tylko na rząd bez rogu (karty Rogu ani jednostki z rogiem, np. Lestera).
        const rows = ['melee', 'ranged', 'siege'].filter(r => !isHornSpecial(selectedCard) || !rowHasHorn(player, r));
        rows.forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
        playCardButton.disabled = !rowSelect.value || rows.length === 0;
    } else {
        playCardButton.disabled = false;
    }
}


function handlePlayerAction(player, action, isFollowUpAction = false) {
    if (!isFollowUpAction) {
        if (isGameOver || isMusterModeActive || roundEndFlow) return;
        if (isMedicModeActive) { runAction(action); return; }
        if (isDecoyModeActive) { runAction(action); return; }
        if (!isFirstMoveOfRound && (player !== activePlayer || passedPlayers.includes(player))) { return; }
        if (isFirstMoveOfRound && passedPlayers.includes(player)) return;
    }
    
    const actionSucceeded = runAction(action);
    
    if (!actionSucceeded) { return updateAllControls(); }
    if (isFirstMoveOfRound) { isFirstMoveOfRound = false; activePlayer = player; }
    
    if (isMedicModeActive || isDecoyModeActive) { return updateAllControls(); }
    if (isMusterModeActive) {
        updateAllControls();
        // ui.js pokazuje wybór kart; bez interfejsu przywołujemy całą grupę.
        if (typeof window.openMusterPicker === 'function') window.openMusterPicker(pendingMuster);
        else confirmMuster(pendingMuster.candidates.map(c => c.id), true);
        return;
    }

    if (passedPlayers.length === 2) { return; }
    const opponent = (player === players.player1) ? players.player2 : players.player1;
    if (passedPlayers.includes(opponent)) { updateAllControls(); }
    else { switchActivePlayer(); }
}

function executeRowScorch(player, cardRow) {
    const opponent = (player === players.player1) ? players.player2 : players.player1;
    const targetRow = opponent.board[cardRow];
    const totalPowerInRow = targetRow.reduce((sum, card) => sum + (card.currentPower ?? card.power), 0);
    
    if (totalPowerInRow >= 10) {
        const nonHeroCards = targetRow.filter(card => !card.isHero);
        if (nonHeroCards.length === 0) {
            addLogEntry("Szeregowy deszcz ognia nie znalazł celów (tylko bohaterowie w rzędzie).");
            return;
        }

        let maxPower = 0;
        nonHeroCards.forEach(card => {
            const power = card.currentPower ?? card.power;
            if (power > maxPower) {
                maxPower = power;
            }
        });

        const cardsToDestroy = nonHeroCards.filter(card => (card.currentPower ?? card.power) === maxPower);
        
        const destroyedNow = [];
        cardsToDestroy.forEach(card => {
            const index = opponent.board[cardRow].findIndex(c => c.instanceId === card.instanceId);
            if (index > -1) {
                const [destroyedCard] = opponent.board[cardRow].splice(index, 1);
                addLogEntry(`Szeregowy deszcz ognia zniszczył kartę: ${destroyedCard.name}.`);
                sendToGraveyard(opponent, destroyedCard);
                destroyedNow.push(destroyedCard);
            }
        });
        destroyedNow.forEach(c => triggerOnDestroyed(opponent, c));
    } else {
        addLogEntry("Szeregowy deszcz ognia nie aktywował się (suma siły w rzędzie < 10).");
    }
}

function playCard(player) {
    if (isMusterModeActive) return;
    const cardSelect = player.domElements.cardSelect;
    const selectedCardId = cardSelect.value; if (!selectedCardId) return;
    const cardToPlayInfo = getCardDetailsById(selectedCardId);
    
    if (cardToPlayInfo.abilities && cardToPlayInfo.abilities.includes('decoy')) {
        activateDecoyMode(player);
        return;
    }

    handlePlayerAction(player, () => {
        const rowSelect = player.domElements.rowSelect;
        let targetRow;

        if (Array.isArray(cardToPlayInfo.row) || needsRowChoice(cardToPlayInfo)) {
            targetRow = rowSelect.value;
        } else {
            targetRow = cardToPlayInfo.row;
        }

        if ((cardToPlayInfo.type === 'Unit' || needsRowChoice(cardToPlayInfo)) && !targetRow) {
            notify("Wybierz rząd!");
            return false; 
        }
        if (isHornSpecial(cardToPlayInfo) && rowHasHorn(player, targetRow)) {
            notify("W tym rzędzie działa już róg!");
            return false;
        }
        
        const cardIndex = player.availableCards.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) { return false; }
        const [cardData] = player.availableCards.splice(cardIndex, 1);
        const cardInstance = { ...cardData, instanceId: nextInstanceId() };
        const hasAbilities = cardInstance.abilities && cardInstance.abilities.length > 0;

        if (hasAbilities && cardInstance.abilities.includes('spy')) {
            const opponent = (player === players.player1) ? players.player2 : players.player1;
            opponent.board[targetRow].push(cardInstance);
            addLogEntry(`${player.name} zagrał Szpiega: ${cardInstance.name} na stronę przeciwnika.`);
        } else if (cardInstance.type === 'Weather') {
            if (!cardInstance.rowAffected) { weatherCardsOnBoard = []; }
            else { if (!weatherCardsOnBoard.find(c => c.name === cardInstance.name)) { weatherCardsOnBoard.push(cardInstance); } }
            addLogEntry(`${player.name} zagrał ${cardInstance.name}.`);
            player.graveyard.push(cardInstance);
        } else if (cardInstance.type === 'Unit') {
            player.board[targetRow].push(cardInstance);
            addLogEntry(`${player.name} zagrał ${cardInstance.name} do rzędu ${targetRow}.`);
            
            if (hasAbilities) {
                if (cardInstance.abilities.includes('muster')) {
                    const candidates = collectMusterTargets(player, cardInstance);
                    if (candidates.length > 0) {
                        isMusterModeActive = true;
                        pendingMuster = { player, card: cardInstance, targetRow, candidates };
                    }
                }
                if (cardInstance.abilities.includes('scorch_row')) {
                    executeRowScorch(player, targetRow);
                }
                if (cardInstance.abilities.includes('scorch')) {
                    executeGlobalScorch();
                }
                if (cardInstance.abilities.includes('Wyzwolenie siły')) {
                    executePowerRelease(player, cardInstance.transformTargetId, targetRow); // tylko we własnym rzędzie
                }
                if (cardInstance.abilities.includes('medic')) {
                    const hasValidTargets = player.graveyard.some(c => c.type === 'Unit' && !c.isHero);
                    if (hasValidTargets) { isMedicModeActive = true; }
                    else { addLogEntry("Medyk nie znalazł celów na cmentarzu."); }
                }
            }
        } else if (cardInstance.type === 'Special') {
            let shouldGoToGraveyard = true;
            addLogEntry(`${player.name} zagrał kartę specjalną: ${cardInstance.name}.`);

            if (hasAbilities && cardInstance.abilities.includes('horn')) {
                player.board.horns[targetRow] = { ...cardInstance, type: 'Horn', name: 'Róg' };
                shouldGoToGraveyard = false;
            } else if (hasAbilities && cardInstance.abilities.includes('scorch_strongest')) {
                executeGlobalScorch();
            } else if (hasAbilities && cardInstance.abilities.includes('Wyzwolenie siły')) {
                executePowerRelease(player, cardInstance.transformTargetId, targetRow); // rząd wybrany przez gracza
            }
            
            if (shouldGoToGraveyard) {
                player.graveyard.push(cardInstance);
            }
        }
        
        updateAllControls();
        return true;
    });
}

function passRound(player) {
    if (isMusterModeActive || isMedicModeActive || isAgileResurrectionModeActive) return;
    deactivateDecoyMode();
    handlePlayerAction(player, () => {
        if (passedPlayers.includes(player)) return false;
        passedPlayers.push(player); addLogEntry(`${player.name} spasował.`);
        updateAllControls();
        if (passedPlayers.length === 2) { endRoundTimer = setTimeout(endRound, 500); }
        return true;
    });
}

// ===== Karty przewodnie (instrukcja, str. 11–13) =====
// kind: double – podwaja rząd do końca tury (jak Róg wojenny; nie działa, gdy w rzędzie jest już róg),
// scorch – Szeregowy deszcz ognia na rząd przeciwnika, clear – efekt Światła, rune – runa z talii gracza,
// revive – jednostka ze swojego cmentarza na stół (jak Leczenie), steal – karta z cmentarza przeciwnika do ręki,
// kitchen – po jednej jednostce z cmentarzy obu graczy na stół, totalWar – cmentarz przeciwnika zniszczony,
// horde – przemiana kąsaczy i wiarusów, rigor – jednostki z Mobilnością do drugiego rzędu,
// reminder – efekt przy stole (kalkulator przypomina), passive – działa cały czas.
const LEADER_EFFECTS = {
    Oko_Innosa: { kind: 'double', row: 'siege' },
    Zadza_krwi: { kind: 'double', row: 'melee' },
    Swieta_Aura_Innosa: { kind: 'double', row: 'ranged' },
    Mroczny_rytual: { kind: 'double', row: 'melee' },
    Zastepy_Innosa: { kind: 'scorch', row: 'siege' },
    Innos_Pan_Ognia: { kind: 'scorch', row: 'ranged' },
    Swiety_Mlot_Innosa: { kind: 'scorch', row: 'melee' },
    Ukryci_wsrod_drzew: { kind: 'scorch', row: 'melee' },
    Moc_Dworu_Irdorath: { kind: 'scorch', row: 'melee' },
    Swiety_plomien: { kind: 'clear' },
    'Nie_boje_sie,_gdy_ciemno_jest': { kind: 'rune', names: ['Rój owadów'] },
    'Wiesz_jak_czestu_pada_tu_deszcz?': { kind: 'rune', names: ['Grom'] },
    Tarcza_Dominique: { kind: 'rune', names: ['Lodowa fala'] },
    Zew_puszczy: { kind: 'rune', names: ['Światło', 'Lodowa fala', 'Grom', 'Rój owadów'], choose: true },
    Instynkt_stadny: { kind: 'revive' },
    Wlasciciel_Ziemski: { kind: 'steal' },
    Kuchnia_polowa: { kind: 'kitchen' },
    Wojna_totalna: { kind: 'totalWar' },
    Zew_hordy: { kind: 'horde', targets: ['Kasacz', 'Wiarus'] },
    Klasztorny_rygor: { kind: 'rigor' },
    Selekcja_naturalna: { kind: 'reminder', text: 'wymień dwie wybrane karty na jedną dowolną z całej talii' },
    Szybki_zwiad: { kind: 'reminder', text: 'przeciwnik pokazuje 3 losowe karty ze swojej talii' },
    Drzewa_maja_uszy: { kind: 'passive', spies: true },
    Chlopcy_z_Kolonii: { kind: 'passive', block: true },
    Uklady: { kind: 'passive', block: true },
    Nabor_nowicjuszy: { kind: 'passive', extraCard: true },
    Wrota_piekiel: { kind: 'passive', extraCard: true },
    Beliar_z_nami: { kind: 'passive' }
};
const opponentOf = p => (p === players.player1 ? players.player2 : players.player1);
const leaderEffect = p => (p && p.commander ? LEADER_EFFECTS[p.commander.id] || null : null);
// Układy / Chłopcy z Kolonii: karta przewodnia przeciwnika nie działa wcale (także pasywna).
function leaderBlockedBy(p) {
    const o = opponentOf(p), e = leaderEffect(o);
    return e && e.block ? o.commander : null;
}
const leaderOn = (p, id) => !!(p && p.commander && p.commander.id === id && !leaderBlockedBy(p));
const spiesDoubled = () => leaderOn(players.player1, 'Drzewa_maja_uszy') || leaderOn(players.player2, 'Drzewa_maja_uszy');
const leaderRuneCards = p => { const e = leaderEffect(p); return e && e.kind === 'rune' ? p.availableCards.filter(c => c.type === 'Weather' && e.names.includes(c.name)) : []; };
const leaderAgileUnits = p => ['melee', 'ranged', 'siege'].flatMap(r => p.board[r].map(c => ({ card: c, row: r }))).filter(x => x.card.type === 'Unit' && !x.card.isDecoy && Array.isArray(x.card.row) && x.card.row.length > 1);
const hordeTargets = (p, e) => ['melee', 'ranged', 'siege'].flatMap(r => p.board[r]).filter(c => c.abilities && c.abilities.includes('Moc') && c.transformId && e.targets.includes(c.baseId));
// Czy gracz może teraz użyć karty przewodniej; reason – dlaczego nie.
function leaderUsable(p) {
    const c = p && p.commander, e = leaderEffect(p);
    if (!c) return { ok: false, reason: '' };
    if (leaderBlockedBy(p)) return { ok: false, reason: `Zablokowana przez kartę przeciwnika: ${leaderBlockedBy(p).name}.` };
    if (e && e.kind === 'passive') return { ok: false, passive: true, reason: 'Działa przez całą rozgrywkę – nie wymaga aktywacji.' };
    if (c.isUsed) return { ok: false, reason: 'Karta przewodnia została już użyta.' };
    const opp = opponentOf(p);
    const canAct = !isGameOver && !roundEndFlow && !isMusterModeActive && !isMedicModeActive && !isAgileResurrectionModeActive &&
        !passedPlayers.includes(p) && (isFirstMoveOfRound || activePlayer === p);
    if (!canAct) return { ok: false, reason: 'Teraz nie można jej użyć (nie twój ruch albo trwa inna akcja).' };
    if (!e) return { ok: true };
    const rowName = r => translateRowName(r);
    switch (e.kind) {
        case 'double': if (rowHasHorn(p, e.row)) return { ok: false, reason: `W rzędzie ${rowName(e.row)} działa już Róg – karta nie zadziała.` }; break;
        case 'clear': if (!weatherCardsOnBoard.length) return { ok: false, reason: 'Na planszy nie ma run – nie można jej użyć „na przeczekanie”.' }; break;
        case 'rune': if (!leaderRuneCards(p).length) return { ok: false, reason: `Nie masz w talii runy: ${e.names.join(' / ')}.` }; break;
        case 'revive': if (!p.graveyard.some(isPlainUnit)) return { ok: false, reason: 'Na twoim cmentarzu nie ma jednostek do wskrzeszenia.' }; break;
        case 'steal': if (!opp.graveyard.some(isPlainUnit)) return { ok: false, reason: 'Na cmentarzu przeciwnika nie ma jednostek.' }; break;
        case 'kitchen': if (!p.graveyard.some(isPlainUnit) && !opp.graveyard.some(isPlainUnit)) return { ok: false, reason: 'Na cmentarzach nie ma jednostek.' }; break;
        case 'totalWar': if (!opp.graveyard.length) return { ok: false, reason: 'Cmentarz przeciwnika jest pusty.' }; break;
        case 'horde': if (!hordeTargets(p, e).length) return { ok: false, reason: 'Na planszy nie ma kąsaczy ani wiarusów do przemiany.' }; break;
        case 'rigor': if (!leaderAgileUnits(p).length) return { ok: false, reason: 'Na planszy nie ma twoich jednostek z Mobilnością.' }; break;
    }
    return { ok: true };
}
// Co trzeba wybrać przed użyciem (ui.js pokazuje okno wyboru); null = nic.
function leaderChoiceKind(p) {
    const e = leaderEffect(p);
    if (!e) return null;
    if (e.kind === 'rune' && e.choose && new Set(leaderRuneCards(p).map(c => c.name)).size > 1) return 'rune';
    return ['steal', 'kitchen', 'rigor'].includes(e.kind) ? e.kind : null;
}
// payload: { name } (runa), { id } (steal – instanceId), { mine, theirs } (kitchen – instanceId lub null), { ids } (rigor)
function useLeader(player, payload = {}) {
    if (isMusterModeActive) return false;
    const chk = leaderUsable(player);
    if (!chk.ok) { if (chk.reason) notify(chk.reason); return false; }
    deactivateDecoyMode();
    let done = false;
    handlePlayerAction(player, () => {
        const c = player.commander, e = leaderEffect(player) || { kind: 'reminder', text: 'efekt wykonaj przy stole' };
        const opp = opponentOf(player);
        const back = (owner, card) => { // jednostka z cmentarza na stół (bez uruchamiania umiejętności)
            const row = Array.isArray(card.row) ? card.row[0] : card.row;
            const { currentPower, ...clean } = card;
            owner.board[row].push({ ...clean, instanceId: nextInstanceId() });
        };
        switch (e.kind) {
            case 'double':
                player.board.horns[e.row] = { id: c.id, name: c.name, type: 'Horn', faction: c.faction, abilities: ['horn'], isLeaderHorn: true, instanceId: nextInstanceId() };
                addLogEntry(`${player.name} – ${c.name}: siła rzędu ${translateRowName(e.row)} podwojona do końca tury.`);
                break;
            case 'scorch':
                addLogEntry(`${player.name} – ${c.name}: Szeregowy deszcz ognia na rząd ${translateRowName(e.row)} przeciwnika.`);
                executeRowScorch(player, e.row);
                break;
            case 'clear':
                weatherCardsOnBoard = [];
                addLogEntry(`${player.name} – ${c.name}: efekty run usunięte z planszy (jak Światło).`);
                break;
            case 'rune': {
                const pool = leaderRuneCards(player);
                const card = pool.find(x => x.name === payload.name) || pool[0];
                if (!card) return false;
                player.availableCards.splice(player.availableCards.indexOf(card), 1);
                const inst = { ...card, instanceId: nextInstanceId() };
                if (!inst.rowAffected) weatherCardsOnBoard = [];
                else if (!weatherCardsOnBoard.find(w => w.name === inst.name)) weatherCardsOnBoard.push(inst);
                player.graveyard.push(inst);
                addLogEntry(`${player.name} – ${c.name}: aktywuje runę ${inst.name} z talii.`);
                break;
            }
            case 'revive':
                isMedicModeActive = true; // dalej jak Leczenie: wybór z cmentarza, karta wchodzi na stół
                addLogEntry(`${player.name} – ${c.name}: wskrzesza jednostkę ze swojego cmentarza.`);
                break;
            case 'steal': {
                const i = opp.graveyard.findIndex(x => x.instanceId == payload.id && isPlainUnit(x));
                if (i < 0) return false;
                const [card] = opp.graveyard.splice(i, 1);
                const { currentPower, instanceId, ...clean } = card;
                player.availableCards.push(clean);
                addLogEntry(`${player.name} – ${c.name}: zabiera ${card.name} z cmentarza ${opp.name} do ręki.`);
                break;
            }
            case 'kitchen': {
                const names = [];
                [[player, payload.mine], [opp, payload.theirs]].forEach(([owner, id]) => {
                    if (id == null) return;
                    const i = owner.graveyard.findIndex(x => x.instanceId == id && isPlainUnit(x));
                    if (i < 0) return;
                    const [card] = owner.graveyard.splice(i, 1);
                    back(owner, card);
                    names.push(`${card.name} (${owner.name})`);
                });
                if (!names.length) return false;
                addLogEntry(`${player.name} – ${c.name}: na planszę wracają ${names.join(', ')}.`);
                break;
            }
            case 'totalWar': {
                const n = opp.graveyard.length;
                opp.destroyed = [...(opp.destroyed || []), ...opp.graveyard];
                opp.graveyard = [];
                addLogEntry(`${player.name} – ${c.name}: ${n} ${plForm(n, 'karta', 'karty', 'kart')} z cmentarza ${opp.name} zniszczone – nie mogą wrócić.`);
                break;
            }
            case 'horde':
                addLogEntry(`${player.name} – ${c.name}: kąsacze i wiarusi przemieniają się.`);
                executePowerRelease(player, e.targets);
                break;
            case 'rigor': {
                const ids = payload.ids || [];
                const moved = [];
                leaderAgileUnits(player).filter(x => ids.includes(x.card.instanceId)).forEach(({ card, row }) => {
                    const to = card.row.find(r => r !== row);
                    if (!to) return;
                    player.board[row] = player.board[row].filter(x => x !== card);
                    player.board[to].push(card);
                    moved.push(`${card.name} → ${translateRowName(to)}`);
                });
                if (!moved.length) return false;
                addLogEntry(`${player.name} – ${c.name}: przenosi ${moved.join(', ')}.`);
                break;
            }
            default:
                addLogEntry(`${player.name} używa karty przewodniej: ${c.name} – ${e.text}.`);
        }
        c.isUsed = true; // raz na całą grę
        done = true;
        return true;
    });
    return done;
}
function activateLeaderAbility(player) { return useLeader(player); }
// Na starcie gry: przypomnienia o pasywnych kartach przewodnich i blokadach.
function leaderStartNotes() {
    [players.player1, players.player2].forEach(p => {
        const e = leaderEffect(p), by = leaderBlockedBy(p);
        if (!p.commander) return;
        if (by) { addLogEntry(`${p.name}: karta przewodnia ${p.commander.name} nie działa (blokuje ją ${by.name}).`); return; }
        if (e && e.extraCard) addLogEntry(`${p.name} (${p.commander.name}): na starcie dobierasz 11 kart zamiast 10.`);
    });
}

const otherKey = k => (k === 'player1' ? 'player2' : 'player1');
const isPlainUnit = c => c.type === 'Unit' && !c.isHero && !c.isDecoy;

// Kandydaci do wyborów ze zdolności talii (instanceId kart).
function monsterKeepCandidates(p) {
    return ['melee', 'ranged', 'siege'].flatMap(r => p.board[r]).filter(c => isPlainUnit(c) && c.faction === 'Potwory');
}
function orcReviveCandidates(p) { return p.graveyard.filter(c => isPlainUnit(c) && c.faction === 'Orkowie'); }
// Bandyci: zwykłe dobranie karty poległej – jednostki i bohaterowie, bez kart specjalnych/pogody.
function banditStealCandidates(p) { return players[otherKey(playerKeyOf(p))].graveyard.filter(c => c.type === 'Unit'); }

function endRound() {
    addLogEntry("Tura zakończona!");
    endRoundTimer = null;
    const p1Power = calculatePlayerPower(players.player1), p2Power = calculatePlayerPower(players.player2);
    let winner = p1Power > p2Power ? 'player1' : p2Power > p1Power ? 'player2' : 'draw';
    let khorinisMatch = false;
    // Khorinis: wygrywa turę (albo – wariant – cały mecz) w przypadku remisu, gdy tylko jeden gracz gra Khorinis.
    if (winner === 'draw') {
        const k1 = players.player1.faction === 'Khorinis', k2 = players.player2.faction === 'Khorinis';
        const kp = k1 ? players.player1 : players.player2;
        if (k1 !== k2 && (hasAbility(kp, 'khorinis_draw_match') || hasAbility(kp, 'khorinis_draw'))) {
            winner = k1 ? 'player1' : 'player2';
            khorinisMatch = hasAbility(kp, 'khorinis_draw_match');
            const nm = abilityInfo(khorinisMatch ? 'khorinis_draw_match' : 'khorinis_draw').name;
            addLogEntry(`Remis ${p1Power}:${p2Power} – ${players[winner].name} wygrywa dzięki zdolności Khorinis (${nm}).`);
        }
    }
    roundResults.push({ round: roundNumber, p1: p1Power, p2: p2Power, winner });
    if (khorinisMatch) {
        players[otherKey(winner)].crystalCount = 0;
        addLogEntry(`${players[winner].name} wygrywa cały mecz (Khorinis: remis wygrywa mecz).`);
        checkGameOver();
        return;
    }
    if (winner === 'draw') { players.player1.crystalCount--; players.player2.crystalCount--; addLogEntry(`Remis!`); }
    else { players[otherKey(winner)].crystalCount--; addLogEntry(`${players[winner].name} wygrywa turę!`); }
    // Tryb turniejowy (instrukcja, str. 6): remis w meczu = dodatkowa runda zamiast końca gry.
    if (RULES.general && RULES.general.tournament && players.player1.crystalCount <= 0 && players.player2.crystalCount <= 0) {
        players.player1.crystalCount = 1; players.player2.crystalCount = 1;
        addLogEntry('Tryb turniejowy: remis w meczu – dodatkowa runda. Przetasujcie talie, każdy wykłada po 4 karty.');
    }

    if (checkGameOver()) return;

    // Nieumarli: dobór losowej karty z talii po wygranej turze (fizycznie przy stole).
    if (winner !== 'draw' && hasAbility(players[winner], 'nieumarli_draw')) {
        const n = abP('nieumarli_draw', 'count');
        addLogEntry(`${players[winner].name} (Nieumarli): dobierz ${n} ${plForm(n, 'losową kartę', 'losowe karty', 'losowych kart')} z talii.`);
    }
    // Własne zdolności: przypomnienia po turze
    if (winner === 'draw') { customReminders('draw', players.player1); customReminders('draw', players.player2); }
    else { customReminders('win', players[winner]); customReminders('loss', players[otherKey(winner)]); }

    // Przegrani tury (remis = przegrana obu) – dla Bandytów.
    const losers = winner === 'draw' ? (abP('bandyci_steal', 'drawIsLoss') ? ['player1', 'player2'] : []) : [otherKey(winner)];
    roundEndFlow = { stage: 'keep', queue: [], kept: { player1: [], player2: [] }, losers };
    // Potwory: po każdej turze jedna karta Potworów zostaje na planszy.
    ['player1', 'player2'].forEach(k => {
        if (!hasAbility(players[k], 'potwory_keep')) return;
        const c = monsterKeepCandidates(players[k]);
        if (c.length) roundEndFlow.queue.push({ kind: 'keep', player: k, count: Math.min(abP('potwory_keep', 'count'), c.length), candidates: c.map(x => x.instanceId) });
    });
    continueRoundEnd();
}

function clearBoardsForNextRound(kept) {
    isMedicModeActive = false; isAgileResurrectionModeActive = false; cardToResurrectWithAgile = null;
    if (abP('klasztor_skip', 'per') === 'round') [players.player1, players.player2].forEach(p => { p.skipCount = 0; });
    const avengersForNextRound = { player1: [], player2: [] };

    [players.player1, players.player2].forEach(p => {
        const playerKey = (p === players.player1) ? 'player1' : 'player2';
        const keepIds = kept[playerKey] || [];

        ['melee', 'ranged', 'siege'].forEach(rowType => {
            const stays = [];
            p.board[rowType].forEach(card => {
                if (keepIds.includes(card.instanceId)) { stays.push(card); return; } // zdolność Potworów
                if (card.abilities && card.abilities.includes('avenger') && card.summons) {
                    addLogEntry(`Mściciel ${card.name} (${p.name}) przetrwał turę i zostanie ulepszony.`);
                    avengersForNextRound[playerKey].push({ cardId: card.summons, row: rowType });
                }
                if (card.abilities && card.abilities.includes('summon_next_round') && card.nextRoundSummonId) {
                    addLogEntry(`${card.name} (${p.name}) przywoła jednostkę w następnej rundzie.`);
                    avengersForNextRound[playerKey].push({ cardId: card.nextRoundSummonId, row: rowType });
                }
                // Wszystkie karty z pola (także bohaterowie i szpiedzy przeciwnika) trafiają
                // na cmentarz gracza, na którego polu leżały. Chrząszcz wraca jako karta specjalna.
                if (card.isDecoy) {
                    const original = getCardDetailsById(card.id);
                    sendToGraveyard(p, original ? { ...original, instanceId: card.instanceId } : card);
                } else {
                    sendToGraveyard(p, card);
                }
            });
            p.board[rowType] = stays;
        });

        // Karty Rogu wojennego też idą na cmentarz (jako oryginalne karty specjalne).
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            const hornCard = p.board.horns[rowType];
            if (hornCard && !hornCard.isLeaderHorn) {
                const original = getCardDetailsById(hornCard.id);
                sendToGraveyard(p, original ? { ...original, instanceId: hornCard.instanceId } : hornCard);
            }
        });
        p.board.horns = { melee: null, ranged: null, siege: null };
    });

    weatherCardsOnBoard = [];
    passedPlayers = [];
    roundNumber++;
    isFirstMoveOfRound = true;
    activePlayer = null;
    addLogEntry(`Rozpoczynamy turę ${roundNumber}!`);
    [players.player1, players.player2].forEach(p => customReminders('round', p));

    [players.player1, players.player2].forEach(p => {
        const playerKey = (p === players.player1) ? 'player1' : 'player2';
        if (avengersForNextRound[playerKey].length > 0) {
            addLogEntry(`${p.name} przywołuje wzmocnione jednostki!`);
            avengersForNextRound[playerKey].forEach(avengerInfo => {
                summonTokenOnBoard(p, avengerInfo.cardId);
            });
        }
    });
}

// Prowadzi koniec tury: najpierw wybory przed sprzątaniem planszy, potem po nim.
function continueRoundEnd() {
    const f = roundEndFlow;
    if (!f) return;
    if (f.queue.length) {
        updateAllControls();
        if (typeof window.openFactionChoice === 'function') window.openFactionChoice(getPendingChoice());
        else { const q = f.queue[0]; confirmFactionChoice(q.candidates.slice(0, q.count), true); } // bez interfejsu
        return;
    }
    if (f.stage === 'keep') {
        clearBoardsForNextRound(f.kept);
        f.stage = 'post';
        // Orkowie: w trzeciej turze 2 karty poległe Orków wracają na planszę.
        if (roundNumber === abP('orkowie_revive', 'round')) ['player1', 'player2'].forEach(k => {
            if (!hasAbility(players[k], 'orkowie_revive')) return;
            const c = orcReviveCandidates(players[k]);
            if (c.length) f.queue.push({ kind: 'revive', player: k, count: Math.min(abP('orkowie_revive', 'count'), c.length), candidates: c.map(x => x.instanceId) });
        });
        // Bandyci: po przegranej turze 1 karta z cmentarza przeciwnika do ręki.
        f.losers.forEach(k => {
            if (!hasAbility(players[k], 'bandyci_steal')) return;
            const c = banditStealCandidates(players[k]);
            if (c.length) f.queue.push({ kind: 'steal', player: k, count: Math.min(abP('bandyci_steal', 'count'), c.length), candidates: c.map(x => x.instanceId) });
        });
        return continueRoundEnd();
    }
    roundEndFlow = null;
    updateAllControls();
}

const CHOICE_TEXT = {
    keep: { title: 'Potwory – która karta zostaje na planszy?', banner: 'wybierz kartę Potworów, która zostaje na planszy' },
    revive: { title: 'Orkowie – które karty wracają z cmentarza?', banner: 'wybierz karty Orków, które wracają z cmentarza' },
    steal: { title: 'Bandyci – którą kartę zabierasz z cmentarza przeciwnika?', banner: 'wybierz kartę z cmentarza przeciwnika' }
};
const CHOICE_TEXT_MANY = {
    keep: { title: 'Potwory – które karty zostają na planszy?', banner: 'wybierz karty Potworów, które zostają na planszy' },
    steal: { title: 'Bandyci – które karty zabierasz z cmentarza przeciwnika?', banner: 'wybierz karty z cmentarza przeciwnika' }
};
// Opis bieżącego wyboru dla interfejsu: karty (obiekty) + ile trzeba wybrać.
function getPendingChoice() {
    if (!roundEndFlow || !roundEndFlow.queue.length) return null;
    const q = roundEndFlow.queue[0];
    const p = players[q.player];
    const pool = q.kind === 'keep' ? ['melee', 'ranged', 'siege'].flatMap(r => p.board[r])
        : q.kind === 'revive' ? p.graveyard : players[otherKey(q.player)].graveyard;
    const cards = q.candidates.map(id => pool.find(c => c.instanceId === id)).filter(Boolean);
    const txt = q.count > 1 ? (CHOICE_TEXT_MANY[q.kind] || CHOICE_TEXT[q.kind]) : CHOICE_TEXT[q.kind];
    return { kind: q.kind, player: p, count: q.count, cards, ...txt };
}
function isFactionChoiceActive() { return !!(roundEndFlow && roundEndFlow.queue.length); }

function confirmFactionChoice(instanceIds, skipUndo = false) {
    if (!isFactionChoiceActive()) return false;
    const q = roundEndFlow.queue[0];
    const ids = instanceIds.filter(id => q.candidates.includes(id));
    if (ids.length !== q.count) return false;
    if (!skipUndo) pushUndo(takeSnapshot());
    const p = players[q.player];
    if (q.kind === 'keep') {
        roundEndFlow.kept[q.player].push(...ids);
        const names = ['melee', 'ranged', 'siege'].flatMap(r => p.board[r]).filter(c => ids.includes(c.instanceId)).map(c => c.name);
        addLogEntry(`${p.name} (Potwory): ${names.join(', ')} zostaje na planszy.`);
    } else if (q.kind === 'revive') {
        const back = [];
        ids.forEach(id => {
            const i = p.graveyard.findIndex(c => c.instanceId === id);
            if (i < 0) return;
            const [card] = p.graveyard.splice(i, 1);
            const row = Array.isArray(card.row) ? card.row[0] : card.row;
            const { currentPower, ...clean } = card;
            p.board[row].push({ ...clean, instanceId: nextInstanceId() });
            back.push(card.name);
        });
        addLogEntry(`${p.name} (Orkowie): z cmentarza wracają ${back.join(', ')}.`);
    } else if (q.kind === 'steal') {
        const opp = players[otherKey(q.player)];
        const taken = [];
        ids.forEach(id => {
            const i = opp.graveyard.findIndex(c => c.instanceId === id);
            if (i < 0) return;
            const [card] = opp.graveyard.splice(i, 1);
            const { currentPower, instanceId, ...clean } = card;
            p.availableCards.push(clean);
            taken.push(card.name);
        });
        if (taken.length) addLogEntry(`${p.name} (Bandyci): zabiera ${taken.join(', ')} z cmentarza ${opp.name} do ręki.`);
    }
    roundEndFlow.queue.shift();
    continueRoundEnd();
    return true;
}

// Klasztor: raz na grę można przeczekać swój ruch (bez pasowania).
function canSkipTurn(player) {
    const opp = player === players.player1 ? players.player2 : players.player1;
    return skipsLeft(player) > 0 && !isGameOver && !roundEndFlow &&
        !isMusterModeActive && !isMedicModeActive && !isAgileResurrectionModeActive &&
        !passedPlayers.includes(player) && !passedPlayers.includes(opp) &&
        (isFirstMoveOfRound || activePlayer === player);
}
function skipTurn(player) {
    if (!canSkipTurn(player)) return;
    deactivateDecoyMode();
    handlePlayerAction(player, () => {
        player.skipCount = (player.skipCount || 0) + 1;
        addLogEntry(`${player.name} przeczekuje ruch (${abilityInfo('klasztor_skip').name}).`);
        return true;
    });
}


function checkGameOver() {
    let winner = null;
    if (players.player1.crystalCount <= 0 && players.player2.crystalCount <= 0) { winner = 'Remis'; }
    else if (players.player1.crystalCount <= 0) { winner = players.player2; }
    else if (players.player2.crystalCount <= 0) { winner = players.player1; }
    if (winner) {
        isGameOver = true;
        updateAllControls();
        // ui.js pokazuje okno podsumowania (z możliwością cofnięcia ruchu); bez niego – stary komunikat.
        if (typeof window.showGameSummary === 'function') { window.showGameSummary(winner === 'Remis' ? null : winner); return true; }
        alert(winner === 'Remis' ? "Remis! Obaj gracze przegrali!" : `${winner.name} wygrywa grę!`);
        location.reload(); return true;
    }
    return false;
}

function setupEventListeners() {
    battlefieldScreen.addEventListener('click', (event) => {
        if (!isDecoyModeActive || !activePlayer) return;
        const targetElement = event.target.closest('.card-on-board.targetable');
        
        setTimeout(() => {
            if (!isDecoyModeActive) return;

            if (targetElement) {
                const instanceId = targetElement.dataset.instanceId;
                let found = null;
                for (const r of ['melee', 'ranged', 'siege']) {
                    const card = activePlayer.board[r].find(c => c.instanceId == instanceId);
                    if (card) {
                        found = { card: card, rowKey: r };
                        break;
                    }
                }
                if (found) {
                    executeDecoySwap(activePlayer, found.card);
                }
            } else if (!event.target.closest('.player-controls')) {
                deactivateDecoyMode();
                addLogEntry("Anulowano zagranie Chrząszcza.");
                updateAllControls();
            }
        }, 50);
    });

    // --- Gracz 1 ---
    players.player1.domElements.playCardButton.addEventListener('click', () => playCard(players.player1));
    players.player1.domElements.passRoundButton.addEventListener('click', () => passRound(players.player1));
    players.player1.domElements.activateLeaderButton.addEventListener('click', () => activateLeaderAbility(players.player1));
    players.player1.domElements.cardSelect.addEventListener('change', () => { 
        deactivateDecoyMode(); 
        updatePlayerControlsVisibility(players.player1); 
    });
    players.player1.domElements.graveyardSelect.addEventListener('change', (event) => { 
        if (isMedicModeActive && activePlayer === players.player1) { 
            executeResurrection(players.player1, event.target.value); 
        }
    });
    players.player1.domElements.rowSelect.addEventListener('change', (event) => {
        const player = players.player1;
        if (isAgileResurrectionModeActive && player === activePlayer) {
            const selectedRow = event.target.value;
            if (selectedRow) {
                completeAgileResurrection(player, selectedRow);
            }
        } else {
            player.domElements.playCardButton.disabled = !event.target.value;
        }
    });
    
    // --- Gracz 2 ---
    players.player2.domElements.playCardButton.addEventListener('click', () => playCard(players.player2));
    players.player2.domElements.passRoundButton.addEventListener('click', () => passRound(players.player2));
    players.player2.domElements.activateLeaderButton.addEventListener('click', () => activateLeaderAbility(players.player2));
    players.player2.domElements.cardSelect.addEventListener('change', () => { 
        deactivateDecoyMode(); 
        updatePlayerControlsVisibility(players.player2); 
    });
    players.player2.domElements.graveyardSelect.addEventListener('change', (event) => { 
        if (isMedicModeActive && activePlayer === players.player2) { 
            executeResurrection(players.player2, event.target.value); 
        }
    });
    players.player2.domElements.rowSelect.addEventListener('change', (event) => {
        const player = players.player2;
        if (isAgileResurrectionModeActive && player === activePlayer) {
            const selectedRow = event.target.value;
            if (selectedRow) {
                completeAgileResurrection(player, selectedRow);
            }
        } else {
            player.domElements.playCardButton.disabled = !event.target.value;
        }
    });
}

// === Inicjalizacja gry ===
// Pamiętaj, aby zdefiniować swoją tablicę `allCards` przed wywołaniem tych funkcji!
// Np. dodaj te karty, aby przetestować mechanikę Mściciela:
/*
const allCards = [
    // ... inne karty
    {
        id: 'golem_1',
        name: 'Golem',
        type: 'Unit',
        power: 3,
        faction: 'Neutral',
        row: 'melee',
        abilities: ['avenger'],
        summons: 'golem_fiend_1', // ID karty, którą przyzywa
        isHero: false
    },
    {
        id: 'golem_fiend_1',
        name: 'Większy Golem',
        type: 'Unit',
        power: 9,
        faction: 'Neutral',
        row: 'melee',
        abilities: [],
        isHero: false,
        isToken: true // Oznacza, że karta nie może być w talii startowej
    },
    // ... inne karty
];
*/

setupGame();
setupEventListeners();
