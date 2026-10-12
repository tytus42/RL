// Wersja plików – ui.js sprawdza, czy przeglądarka nie wczytała starego script.js z pamięci.
const APP_VERSION = '2026-10-12b';

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
    return { version: APP_VERSION, snap: takeSnapshot(), undo: undoStack.slice(-maxUndo), started: true };
}
function importGameState(o) {
    if (!o || !o.snap) return false;
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
    if (weather) { p = 1; steps.push({ label: `Pogoda: ${weather.name} → 1`, value: p }); }
    if (card.abilities && card.abilities.includes('tight_bond')) {
        const n = row.filter(c => c.abilities && c.abilities.includes('tight_bond') && c.baseId === card.baseId).length;
        if (n > 1) { p *= n; steps.push({ label: `Jedność ×${n}`, value: p }); }
    }
    const morale = row.filter(c => c.abilities && c.abilities.includes('morale_boost') && c.instanceId !== card.instanceId).length;
    if (morale) { p += morale; steps.push({ label: `Wzmocnienie +${morale}`, value: p }); }
    const hornCard = owner.board.horns[rowType];
    const hornUnit = row.find(c => c.type === 'Unit' && c.abilities && c.abilities.includes('horn') && c.instanceId !== card.instanceId);
    if (hornCard || hornUnit) { p *= 2; steps.push({ label: `Róg ×2 (${hornCard ? 'Róg wojenny' : hornUnit.name})`, value: p }); }
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
    const matches = c => c.id !== playedCard.id &&
        !(c.musterRole === 'master' && playedCard.musterRole !== 'master') && (
            (playedCard.musterGroup && c.musterGroup === playedCard.musterGroup) ||
            (playedCard.musterRole === 'master' && String(playedCard.musterGroup).endsWith('*') && c.musterRole === 'slug' && c.faction === playedCard.faction)
        );
    return player.availableCards.filter(matches);
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
                    if (activeWeatherRows.has(rowType)) { power = 1; }
                    
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
        
        if (!isFirstMoveOfRound) {
            endTurnAfterFollowUp(player);
        } else {
            isFirstMoveOfRound = false;
            activePlayer = player;
            updateAllControls();
        }
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

    placeResurrectedCard(player, cardToResurrectWithAgile, chosenRow);

    isAgileResurrectionModeActive = false;
    cardToResurrectWithAgile = null;
    
    if (!isFirstMoveOfRound) {
        endTurnAfterFollowUp(player);
    } else {
        isFirstMoveOfRound = false;
        activePlayer = player;
        updateAllControls();
    }
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
        p.skipUsed = false;
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
        if (p.faction === 'Najemnicy') addLogEntry(`${p.name} (Najemnicy): na starcie możesz wymienić o 1 kartę więcej (3 zamiast 2).`);
    });
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
    activateLeaderButton.disabled = !isPlayerTurn || (player.commander && player.commander.isUsed);
    
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
    if (isMusterModeActive) return;
    deactivateDecoyMode();
    handlePlayerAction(player, () => {
        if (passedPlayers.includes(player)) return false;
        passedPlayers.push(player); addLogEntry(`${player.name} spasował.`);
        updateAllControls();
        if (passedPlayers.length === 2) { endRoundTimer = setTimeout(endRound, 500); }
        return true;
    });
}

function activateLeaderAbility(player) {
    if (isMusterModeActive) return;
    deactivateDecoyMode();
    handlePlayerAction(player, () => {
        if (!player.commander || player.commander.isUsed) return false;
        addLogEntry(`${player.name} używa karty przewodniej: ${player.commander.name}.`);
        // Efekt karty przewodniej gracze wykonują przy stole – kalkulator zaznacza tylko użycie.
        player.commander.isUsed = true; // raz na całą grę
        return true;
    });
}

const otherKey = k => (k === 'player1' ? 'player2' : 'player1');
const isPlainUnit = c => c.type === 'Unit' && !c.isHero && !c.isDecoy;

// Kandydaci do wyborów ze zdolności talii (instanceId kart).
function monsterKeepCandidates(p) {
    return ['melee', 'ranged', 'siege'].flatMap(r => p.board[r]).filter(c => isPlainUnit(c) && c.faction === 'Potwory');
}
function orcReviveCandidates(p) { return p.graveyard.filter(c => isPlainUnit(c) && c.faction === 'Orkowie'); }
function banditStealCandidates(p) { return players[otherKey(playerKeyOf(p))].graveyard.filter(isPlainUnit); }

function endRound() {
    addLogEntry("Tura zakończona!");
    endRoundTimer = null;
    const p1Power = calculatePlayerPower(players.player1), p2Power = calculatePlayerPower(players.player2);
    let winner = p1Power > p2Power ? 'player1' : p2Power > p1Power ? 'player2' : 'draw';
    // Khorinis: wygrywa turę w przypadku remisu (gdy tylko jeden gracz gra Khorinis).
    if (winner === 'draw') {
        const k1 = players.player1.faction === 'Khorinis', k2 = players.player2.faction === 'Khorinis';
        if (k1 !== k2) {
            winner = k1 ? 'player1' : 'player2';
            addLogEntry(`Remis ${p1Power}:${p2Power} – ${players[winner].name} wygrywa dzięki zdolności talii Khorinis.`);
        }
    }
    roundResults.push({ round: roundNumber, p1: p1Power, p2: p2Power, winner });
    if (winner === 'draw') { players.player1.crystalCount--; players.player2.crystalCount--; addLogEntry(`Remis!`); }
    else { players[otherKey(winner)].crystalCount--; addLogEntry(`${players[winner].name} wygrywa turę!`); }

    if (checkGameOver()) return;

    // Nieumarli: dobór 1 losowej karty z talii po wygranej turze (fizycznie przy stole).
    if (winner !== 'draw' && players[winner].faction === 'Nieumarli') {
        addLogEntry(`${players[winner].name} (Nieumarli): dobierz 1 losową kartę z talii.`);
    }

    // Przegrani tury (remis = przegrana obu) – dla Bandytów.
    const losers = winner === 'draw' ? ['player1', 'player2'] : [otherKey(winner)];
    roundEndFlow = { stage: 'keep', queue: [], kept: { player1: [], player2: [] }, losers };
    // Potwory: po każdej turze jedna karta Potworów zostaje na planszy.
    ['player1', 'player2'].forEach(k => {
        if (players[k].faction !== 'Potwory') return;
        const c = monsterKeepCandidates(players[k]);
        if (c.length) roundEndFlow.queue.push({ kind: 'keep', player: k, count: 1, candidates: c.map(x => x.instanceId) });
    });
    continueRoundEnd();
}

function clearBoardsForNextRound(kept) {
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
            if (hornCard) {
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
        if (roundNumber === 3) ['player1', 'player2'].forEach(k => {
            if (players[k].faction !== 'Orkowie') return;
            const c = orcReviveCandidates(players[k]);
            if (c.length) f.queue.push({ kind: 'revive', player: k, count: Math.min(2, c.length), candidates: c.map(x => x.instanceId) });
        });
        // Bandyci: po przegranej turze 1 karta z cmentarza przeciwnika do ręki.
        f.losers.forEach(k => {
            if (players[k].faction !== 'Bandyci') return;
            const c = banditStealCandidates(players[k]);
            if (c.length) f.queue.push({ kind: 'steal', player: k, count: 1, candidates: c.map(x => x.instanceId) });
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
// Opis bieżącego wyboru dla interfejsu: karty (obiekty) + ile trzeba wybrać.
function getPendingChoice() {
    if (!roundEndFlow || !roundEndFlow.queue.length) return null;
    const q = roundEndFlow.queue[0];
    const p = players[q.player];
    const pool = q.kind === 'keep' ? ['melee', 'ranged', 'siege'].flatMap(r => p.board[r])
        : q.kind === 'revive' ? p.graveyard : players[otherKey(q.player)].graveyard;
    const cards = q.candidates.map(id => pool.find(c => c.instanceId === id)).filter(Boolean);
    return { kind: q.kind, player: p, count: q.count, cards, ...CHOICE_TEXT[q.kind] };
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
        const i = opp.graveyard.findIndex(c => c.instanceId === ids[0]);
        if (i >= 0) {
            const [card] = opp.graveyard.splice(i, 1);
            const { currentPower, instanceId, ...clean } = card;
            p.availableCards.push(clean);
            addLogEntry(`${p.name} (Bandyci): zabiera ${card.name} z cmentarza ${opp.name} do ręki.`);
        }
    }
    roundEndFlow.queue.shift();
    continueRoundEnd();
    return true;
}

// Klasztor: raz na grę można przeczekać swój ruch (bez pasowania).
function canSkipTurn(player) {
    const opp = player === players.player1 ? players.player2 : players.player1;
    return player.faction === 'Klasztor' && !player.skipUsed && !isGameOver && !roundEndFlow &&
        !isMusterModeActive && !isMedicModeActive && !isAgileResurrectionModeActive &&
        !passedPlayers.includes(player) && !passedPlayers.includes(opp) &&
        (isFirstMoveOfRound || activePlayer === player);
}
function skipTurn(player) {
    if (!canSkipTurn(player)) return;
    deactivateDecoyMode();
    handlePlayerAction(player, () => {
        player.skipUsed = true;
        addLogEntry(`${player.name} przeczekuje ruch (zdolność talii Klasztoru).`);
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
