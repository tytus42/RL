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
let isMonsterAbilityActive = false;
let monsterPlayerToChoose = null;
let isSkelligeAbilityActive = false; // NOWY STAN
let skelligePlayerToChoose = null; // NOWY STAN
let skelligeCardsToKeep = []; // NOWY STAN

// === MAPY IKON ===
const abilityIconMap = {
    medic: '❤️', muster: '🎺', tight_bond: '🔗', morale_boost: '➕',
    scorch_row: '🔥', spy: '👁️', avenger: '💀', Moc: '💪', horn: '📯',
    decoy: '🎭', 'Wyzwolenie siły': '💥', scorch_strongest: '☄️', agile: '↔️'
};

const rowIconMap = {
    melee: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.414 5.586a2 2 0 0 0-2.828 0L7 14.172V11a1 1 0 0 0-2 0v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2H8.828l8.586-8.586a2 2 0 0 0 0-2.828Z"/></svg>`,
    ranged: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.621 3.172a1 1 0 0 0-1.04-.21l-14 7a1 1 0 0 0 .13 1.885l7.071 2.829 2.829 7.07a1 1 0 0 0 1.885.13l7-14a1 1 0 0 0-.21-1.04Z"/></svg>`,
    siege: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h20v2H2v-2Zm2-8a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Zm16 0a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1ZM6.03 4.22a1 1 0 0 0-1.363 1.45l4.243 4.242a1 1 0 0 0 1.414 0l4.243-4.242a1 1 0 1 0-1.414-1.414L12 6.586 7.447 4.177a1 1 0 0 0-1.414.043Z"/></svg>`
};

// === Funkcje pomocnicze ===
function translateRowName(rowKey) { const names = { melee: 'Wręcz', ranged: 'Dystans', siege: 'Oblężnicze' }; return names[rowKey] || rowKey; }
function getCardDetailsById(cardId) { return allCards.find(card => card.id === cardId); }

function addLogEntry(message) {
    const p = document.createElement('p');
    p.textContent = `[Runda ${roundNumber}] ${message}`;
    if (historyLog.firstChild) { historyLog.insertBefore(p, historyLog.firstChild); }
    else { historyLog.appendChild(p); }
}

function handleCardRemoval(card) {
    if (card.abilities && card.abilities.includes('avenger') && card.summons) {
        addLogEntry(`Mściciel aktywowany! ${card.name} zostaje zastąpiony!`);
        const summonedCardInfo = getCardDetailsById(card.summons);
        if (summonedCardInfo) {
            const newUnit = { ...summonedCardInfo, instanceId: Date.now() + Math.random() };
            addLogEntry(`Na jego miejsce pojawia się: ${newUnit.name}!`);
            return newUnit;
        }
    }
    return null;
}

function executePowerRelease(player) {
    addLogEntry(`${player.name} uwalnia moc swoich jednostek!`);
    ['melee', 'ranged', 'siege'].forEach(rowType => {
        const newRow = [];
        player.board[rowType].forEach(card => {
            if (card.abilities && card.abilities.includes('Moc') && card.transformId) {
                const transformedCardInfo = getCardDetailsById(card.transformId);
                if (transformedCardInfo) {
                    addLogEntry(`${card.name} transformuje w ${transformedCardInfo.name}!`);
                    const newCard = { ...transformedCardInfo, instanceId: Date.now() + Math.random() };
                    newRow.push(newCard);
                } else {
                    newRow.push(card);
                }
            } else {
                newRow.push(card);
            }
        });
        player.board[rowType] = newRow;
    });
}


function executeGlobalScorch() {
    addLogEntry("Na pole bitwy spada Deszcz Ognia!");
    let wszystkieJednostkiNaPlanszy = [];
    [players.player1, players.player2].forEach(player => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            player.board[rowType].forEach(card => {
                if (card.type === 'Unit' && !card.isHero && card.name !== 'Wabik') {
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
        kartyDoZniszczenia.forEach(itemToDestroy => {
            const { card, owner, row } = itemToDestroy;
            const cardIndex = owner.board[row].findIndex(c => c.instanceId === card.instanceId);
            if (cardIndex > -1) {
                const [destroyedCard] = owner.board[row].splice(cardIndex, 1);
                addLogEntry(`- Zniszczono: ${destroyedCard.name} (${owner.name}).`);
                const replacement = handleCardRemoval(destroyedCard);
                if (replacement) {
                    owner.board[row].splice(cardIndex, 0, replacement);
                } else {
                    owner.graveyard.push(destroyedCard);
                }
            }
        });
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
            const isHornActive = !!player.board.horns[rowType];
            const cardsInRow = player.board[rowType];
            
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
                if (card.type === 'Unit' && !card.isHero && card.name !== 'Wabik') {
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
                    
                    if (isHornActive) { power *= 2; }
                    if (power !== card.power) { card.currentPower = power; }
                }
            });

            if (activeWeatherRows.has(rowType)) {
                const weatherCard = weatherCardsOnBoard.find(c => c.rowAffected.includes(rowType));
                if (weatherCard && weatherCard.effectClass) {
                    player.domElements[rowType + 'Row'].classList.add(weatherCard.effectClass);
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

    if (card.isHero) cardDiv.classList.add('hero-card');
    if (card.faction) cardDiv.classList.add(`faction-${card.faction.toLowerCase().replace(/\s+/g, '-')}`);
    
    if (card.type !== 'Unit') {
        cardDiv.classList.add(`${card.type.toLowerCase()}-card`);
        cardDiv.innerHTML = `<div class="card-name-simple">${card.name}</div>`;
    } 
    else {
        const finalPower = card.currentPower ?? card.power;
        let powerClass = '';
        if (finalPower < card.power) powerClass = 'power-nerfed';
        else if (finalPower > card.power) powerClass = 'power-boosted';

        let rowIconHTML = '';
        if (Array.isArray(card.row)) {
            rowIconHTML = card.row.map(r => `<div class="card-row-icon">${rowIconMap[r] || ''}</div>`).join('');
        } else {
            rowIconHTML = `<div class="card-row-icon">${rowIconMap[card.row] || ''}</div>`;
        }

        let abilitiesHTML = '';
        if (card.abilities && Array.isArray(card.abilities) && card.abilities.length > 0) {
            abilitiesHTML = card.abilities.map(ability => 
                `<div class="ability-icon" title="${ability}">${abilityIconMap[ability] || '❓'}</div>`
            ).join('');
        }

        cardDiv.innerHTML = `
            <div class="card-left-column">
                <div class="card-power-container">
                    <span class="power-value ${powerClass}">${finalPower}</span>
                </div>
                <div class="card-row-icon-container">${rowIconHTML}</div>
                <div class="card-abilities">${abilitiesHTML}</div>
            </div>
            <div class="card-right-column">
                <div class="card-info-footer">
                    <div class="card-description">${card.description || ''}</div>
                    <div class="card-name">${card.name}</div>
                </div>
            </div>
        `;
    }

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
    if ((isMedicModeActive || isSkelligeAbilityActive) && player === activePlayer) {
        select.disabled = false;
        select.innerHTML = '<option value="">-- Wybierz cel --</option>';
        player.graveyard.forEach(card => {
            const option = new Option(`${card.name} (${card.type}, ${card.power})`, card.id);
            if (card.type !== 'Unit' || card.isHero || card.name === 'Wabik') {
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
            const decoyUnit = { ...decoyCard, instanceId: Date.now() + Math.random(), power: 0, type: 'Unit', name: 'Wabik' };
            boardRow.push(decoyUnit);
        }
        
        addLogEntry(`${player.name} użył Wabika na karcie ${returnedCard.name}.`);
        updateAllControls();
        return true;
    });
}

function activateDecoyMode(player) {
    if (isDecoyModeActive) deactivateDecoyMode();
    isDecoyModeActive = true;
    addLogEntry(`${player.name} przygotowuje Wabika... Kliknij cel na swojej planszy.`);
    updatePlayerControlsVisibility(player);
    ['melee', 'ranged', 'siege'].forEach(rowKey => {
        player.board[rowKey].forEach(cardOnBoard => {
            if (!cardOnBoard.isHero && cardOnBoard.type === 'Unit' && cardOnBoard.name !== 'Wabik') {
                const cardElement = player.domElements[rowKey + 'Row'].querySelector(`[data-instance-id="${cardOnBoard.instanceId}"]`);
                if (cardElement) { cardElement.classList.add('targetable'); }
            }
        });
    });
}

function executeResurrection(player, resurrectedCardId) {
    isMedicModeActive = false;
    if (!resurrectedCardId) {
        addLogEntry(`${player.name} anulował wskrzeszenie.`);
        if (!isFirstMoveOfRound) switchActivePlayer();
        return;
    }

    const cardIndex = player.graveyard.findIndex(c => c.id === resurrectedCardId);
    if (cardIndex === -1) return;

    const [resurrectedCard] = player.graveyard.splice(cardIndex, 1);
    addLogEntry(`${player.name} przygotowuje do wskrzeszenia: ${resurrectedCard.name}.`);
    
    const cardInstance = { ...resurrectedCard, instanceId: Date.now() + Math.random() };

    if (Array.isArray(cardInstance.row) && cardInstance.row.length > 1) {
        isAgileResurrectionModeActive = true;
        cardToResurrectWithAgile = cardInstance;
        updatePlayerControlsVisibility(player);
    } else {
        const targetRow = Array.isArray(cardInstance.row) ? cardInstance.row[0] : cardInstance.row;
        const wasMedicChain = placeResurrectedCard(player, cardInstance, targetRow);
        
        if (!wasMedicChain) {
            if (!isFirstMoveOfRound) {
                switchActivePlayer();
            } else {
                isFirstMoveOfRound = false;
                activePlayer = player;
                updateAllControls();
            }
        }
    }
}

function placeResurrectedCard(player, cardInstance, targetRow) {
    const hasAbilities = cardInstance.abilities && cardInstance.abilities.length > 0;
    let triggeredMedic = false;

    if (hasAbilities && cardInstance.abilities.includes('spy')) {
        const opponent = (player === players.player1) ? players.player2 : players.player1;
        opponent.board[targetRow].push(cardInstance);
        addLogEntry(`${player.name} wskrzesił Szpiega: ${cardInstance.name} i zagrał go na stronę przeciwnika.`);
    } else {
        player.board[targetRow].push(cardInstance);
        addLogEntry(`${player.name} wskrzesił ${cardInstance.name} i położył ją w rzędzie ${translateRowName(targetRow)}.`);
        
        if (hasAbilities) {
            if (cardInstance.abilities.includes('medic')) {
                const hasValidTargets = player.graveyard.some(c => c.type === 'Unit' && !c.isHero && c.name !== 'Wabik');
                if (hasValidTargets) {
                    isMedicModeActive = true;
                    triggeredMedic = true;
                }
            }
            if (cardInstance.abilities.includes('scorch_row')) {
                executeRowScorch(player, targetRow);
            }
        }
    }
    updateAllControls();
    return triggeredMedic;
}

function completeAgileResurrection(player, chosenRow) {
    if (!isAgileResurrectionModeActive || !cardToResurrectWithAgile) return;

    const wasMedicChain = placeResurrectedCard(player, cardToResurrectWithAgile, chosenRow);

    isAgileResurrectionModeActive = false;
    cardToResurrectWithAgile = null;
    
    if (!wasMedicChain) {
        if (!isFirstMoveOfRound) {
            switchActivePlayer();
        } else {
            isFirstMoveOfRound = false;
            activePlayer = player;
            updateAllControls();
        }
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
        p.commander = getCardDetailsById(leaderId);
        p.availableCards = allCards.filter(card => 
            card.type !== 'Leader' && 
            !card.isToken &&
            (card.faction === p.faction || card.faction === 'Neutral')
        ).map(c => ({ ...c }));
    });
    gameSetupScreen.style.display = 'none';
    battlefieldScreen.style.display = 'grid';
    isFirstMoveOfRound = true;
    activePlayer = null;
    addLogEntry(`Gra rozpoczęta! Runda ${roundNumber}.`);
    updateAllControls();
}

function updatePlayerControlsVisibility(player) {
    const { cardSelect, rowSelect, playCardButton, passRoundButton, activateLeaderButton, graveyardSelect } = player.domElements;

    playCardButton.style.display = 'inline-block';
    playCardButton.disabled = true;
    rowSelect.disabled = true;
    rowSelect.innerHTML = '<option value="">-- Wybierz Rząd --</option>';
    graveyardSelect.disabled = true;

    if (isMonsterAbilityActive && player === monsterPlayerToChoose) {
        cardSelect.disabled = true;
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;
        return;
    }
    
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
    activateLeaderButton.disabled = !isPlayerTurn || (player.commander && player.commander.activatedThisRound);
    
    const selectedOption = cardSelect.options[cardSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value || !isPlayerTurn) return;

    const selectedCard = getCardDetailsById(selectedOption.value);
    if (!selectedCard) return;

    if (selectedCard.abilities && selectedCard.abilities.includes('decoy')) {
        playCardButton.disabled = !(player.board.melee.some(c => !c.isHero && c.name !== 'Wabik') || player.board.ranged.some(c => !c.isHero && c.name !== 'Wabik') || player.board.siege.some(c => !c.isHero && c.name !== 'Wabik'));
    } else if (selectedCard.type === 'Unit' && Array.isArray(selectedCard.row)) {
        rowSelect.disabled = false;
        selectedCard.row.forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
        playCardButton.disabled = !rowSelect.value;
    } else if (selectedCard.abilities && selectedCard.abilities.includes('horn')) {
        rowSelect.disabled = false;
        ['melee', 'ranged', 'siege'].forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
        playCardButton.disabled = !rowSelect.value;
    } else {
        playCardButton.disabled = false;
    }
}


function handlePlayerAction(player, action, isFollowUpAction = false) {
    if (!isFollowUpAction) {
        if (isMonsterAbilityActive) return;
        if (isMedicModeActive) { action(); return; }
        if (isDecoyModeActive) { action(); return; }
        if (!isFirstMoveOfRound && (player !== activePlayer || passedPlayers.includes(player))) { return; }
        if (isFirstMoveOfRound && passedPlayers.includes(player)) return;
    }
    
    const actionSucceeded = action();
    
    if (!actionSucceeded) { return updateAllControls(); }
    if (isFirstMoveOfRound) { isFirstMoveOfRound = false; activePlayer = player; }
    
    if (isMedicModeActive || isDecoyModeActive) { return updateAllControls(); }

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
        
        cardsToDestroy.forEach(card => {
            const index = opponent.board[cardRow].findIndex(c => c.instanceId === card.instanceId);
            if (index > -1) {
                const [destroyedCard] = opponent.board[cardRow].splice(index, 1);
                addLogEntry(`Szeregowy deszcz ognia zniszczył kartę: ${destroyedCard.name}.`);
                const replacement = handleCardRemoval(destroyedCard);
                if (replacement) {
                    opponent.board[cardRow].splice(index, 0, replacement);
                } else {
                    opponent.graveyard.push(destroyedCard);
                }
            }
        });
    } else {
        addLogEntry("Szeregowy deszcz ognia nie aktywował się (suma siły w rzędzie < 10).");
    }
}

function playCard(player) {
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

        const needsRowSelection = Array.isArray(cardToPlayInfo.row) || (cardToPlayInfo.abilities && cardToPlayInfo.abilities.includes('horn'));

        if (needsRowSelection) {
            targetRow = rowSelect.value;
            if (!targetRow) {
                alert("Wybierz rząd!");
                return false;
            }
        } else if (cardToPlayInfo.type === 'Unit') {
            targetRow = cardToPlayInfo.row;
        }
        
        const cardIndex = player.availableCards.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) { return false; }
        const [cardData] = player.availableCards.splice(cardIndex, 1);
        const cardInstance = { ...cardData, instanceId: Date.now() + Math.random() };
        const hasAbilities = cardInstance.abilities && cardInstance.abilities.length > 0;

        if (hasAbilities && cardInstance.abilities.includes('spy')) {
            const opponent = (player === players.player1) ? players.player2 : players.player1;
            opponent.board[targetRow].push(cardInstance);
            addLogEntry(`${player.name} zagrał Szpiega: ${cardInstance.name} na stronę przeciwnika.`);
        } else if (cardInstance.type === 'Weather') {
            if (cardInstance.name === 'Czyste Niebo') { weatherCardsOnBoard = []; }
            else { if (!weatherCardsOnBoard.find(c => c.id === cardInstance.id)) { weatherCardsOnBoard.push(cardInstance); } }
            addLogEntry(`${player.name} zagrał ${cardInstance.name}.`);
            player.graveyard.push(cardInstance);
        } else if (cardInstance.type === 'Unit') {
            player.board[targetRow].push(cardInstance);
            addLogEntry(`${player.name} zagrał ${cardInstance.name} do rzędu ${translateRowName(targetRow)}.`);
            
            if (hasAbilities) {
                if (cardInstance.abilities.includes('muster')) {
                    const musterId = cardInstance.baseId;
                    if (musterId) {
                        let cardsToSummon = player.availableCards.filter(card => card.baseId === musterId);
                        if (cardInstance.name.includes("Gaunter O'Dimm: Darkness")) {
                            cardsToSummon = cardsToSummon.filter(card => card.name !== "Gaunter O'Dimm");
                        }
                        if (cardsToSummon.length > 0) {
                            addLogEntry(`Zbiórka! ${player.name} przywołuje dodatkowe jednostki.`);
                            const summonedIds = cardsToSummon.map(c => c.id);
                            player.availableCards = player.availableCards.filter(card => !summonedIds.includes(card.id));
                            cardsToSummon.forEach(summonedCardData => {
                                const summonedCardInstance = { ...summonedCardData, instanceId: Date.now() + Math.random() };
                                player.board[summonedCardData.row].push(summonedCardInstance);
                                addLogEntry(`- Przywołano: ${summonedCardInstance.name} do rzędu ${translateRowName(summonedCardData.row)}.`);
                            });
                        }
                    }
                }
                if (cardInstance.abilities.includes('scorch_row')) {
                    executeRowScorch(player, targetRow);
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
                executePowerRelease(player);
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
    handlePlayerAction(player, () => {
        if (passedPlayers.includes(player)) return false;
        passedPlayers.push(player); addLogEntry(`${player.name} spasował.`);
        updateAllControls();
        if (passedPlayers.length === 2) { setTimeout(endRound, 500); }
        return true;
    });
}

function activateLeaderAbility(player) {
    handlePlayerAction(player, () => {
        if (!player.commander || player.commander.activatedThisRound) return false;
        addLogEntry(`Zdolność dowódcy ${player.commander.name} aktywowana!`);
        alert(`Zdolność dowódcy ${player.commander.name} aktywowana! (Implementacja w toku)`);
        player.commander.activatedThisRound = true;
        return true;
    });
}

// ==================================================================
// === ZMODYFIKOWANE FUNKCJE DLA ZDOLNOŚCI FRAKCJI ===
// ==================================================================
function endRound() {
    addLogEntry("Runda zakończona!");
    const p1Power = calculatePlayerPower(players.player1), p2Power = calculatePlayerPower(players.player2);
    
    let winner = null;
    if (p1Power > p2Power) winner = players.player1;
    else if (p2Power > p1Power) winner = players.player2;

    if (winner) {
        const loser = (winner === players.player1) ? players.player2 : players.player1;
        loser.crystalCount--;
        addLogEntry(`${winner.name} wygrywa rundę!`);
    } else {
        const p1IsNilfgaard = players.player1.faction === 'Nilfgaardian Empire';
        const p2IsNilfgaard = players.player2.faction === 'Nilfgaardian Empire';

        if (p1IsNilfgaard && !p2IsNilfgaard) {
            addLogEntry(`Remis! ${players.player1.name} wygrywa dzięki zdolności frakcji Nilfgaard!`);
            players.player2.crystalCount--;
        } else if (p2IsNilfgaard && !p1IsNilfgaard) {
            addLogEntry(`Remis! ${players.player2.name} wygrywa dzięki zdolności frakcji Nilfgaard!`);
            players.player1.crystalCount--;
        } else {
            addLogEntry(`Remis!`);
            players.player1.crystalCount--;
            players.player2.crystalCount--;
        }
    }
    
    if (checkGameOver()) return;

    const monsterPlayer = [players.player1, players.player2].find(p => p.faction === 'Monsters');
    const hasValidMonsterCards = monsterPlayer && [...monsterPlayer.board.melee, ...monsterPlayer.board.ranged, ...monsterPlayer.board.siege].some(c => !c.isHero && !c.isToken);

    if (hasValidMonsterCards) {
        isMonsterAbilityActive = true;
        monsterPlayerToChoose = monsterPlayer;
        addLogEntry(`${monsterPlayer.name}, wybierz kartę, która ma zostać na następną rundę.`);
        activateMonsterAbilitySelection(monsterPlayer);
        return;
    }
    
    const skelligePlayer = [players.player1, players.player2].find(p => p.faction === 'Skellige');
    if (roundNumber === 2 && skelligePlayer && skelligePlayer.graveyard.some(c => !c.isHero && !c.isToken)) {
        isSkelligeAbilityActive = true;
        skelligePlayerToChoose = skelligePlayer;
        addLogEntry(`${skelligePlayer.name}, wybierz do 2 kart z cmentarza, które wrócą w następnej rundzie.`);
        activateSkelligeAbilitySelection(skelligePlayer);
        return;
    }

    proceedToNextRound();
}

function activateMonsterAbilitySelection(player) {
    updateAllControls();
    ['melee', 'ranged', 'siege'].forEach(rowKey => {
        player.board[rowKey].forEach(cardOnBoard => {
            if (!cardOnBoard.isHero && !cardOnBoard.isToken) {
                const cardElement = player.domElements[rowKey + 'Row'].querySelector(`[data-instance-id="${cardOnBoard.instanceId}"]`);
                if (cardElement) {
                    cardElement.classList.add('targetable');
                }
            }
        });
    });
}

function executeMonsterAbility(player, cardToKeep) {
    addLogEntry(`${player.name} wybrał kartę ${cardToKeep.name}, która pozostanie na planszy.`);
    cardToKeep.isKeptByFaction = true;
    isMonsterAbilityActive = false;
    monsterPlayerToChoose = null;
    
    document.querySelectorAll('.targetable').forEach(el => el.classList.remove('targetable'));

    proceedToNextRound();
}

function activateSkelligeAbilitySelection(player) {
    activePlayer = player; // Ustaw gracza Skellige jako aktywnego na czas wyboru
    updateAllControls();
    player.domElements.graveyardSelect.disabled = false;
    addLogEntry(`Wybrano ${skelligeCardsToKeep.length}/2 kart.`);
}

function executeSkelligeAbility(player, cardId) {
    if (skelligeCardsToKeep.length >= 2) return;

    const cardIndex = player.graveyard.findIndex(c => c.id === cardId);
    if (cardIndex > -1) {
        const [selectedCard] = player.graveyard.splice(cardIndex, 1);
        skelligeCardsToKeep.push(selectedCard);
        addLogEntry(`${player.name} wybrał kartę: ${selectedCard.name}. Wybrano ${skelligeCardsToKeep.length}/2.`);
        
        if (skelligeCardsToKeep.length === 2) {
            isSkelligeAbilityActive = false;
            skelligePlayerToChoose = null;
            proceedToNextRound();
        } else {
            populateGraveyardSelect(player); // Odśwież listę, aby usunąć wybraną kartę
        }
    }
}


function proceedToNextRound() {
    [players.player1, players.player2].forEach(p => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            const newRow = [];
            const cardsInRow = [...p.board[rowType]];

            cardsInRow.forEach(card => {
                if (card.isKeptByFaction) {
                    newRow.push(card);
                    delete card.isKeptByFaction;
                } else {
                    const replacement = handleCardRemoval(card);
                    if (replacement) {
                        newRow.push(replacement);
                    } else {
                        p.graveyard.push(card);
                    }
                }
            });
            p.board[rowType] = newRow;
        });

        p.board.horns = { melee: null, ranged: null, siege: null };
        if (p.commander) p.commander.activatedThisRound = false;
    });
    
    // Przywołaj karty Skellige na początku rundy 3
    if (roundNumber === 2 && skelligeCardsToKeep.length > 0) {
        const skelligePlayer = [players.player1, players.player2].find(p => p.faction === 'Skellige');
        if (skelligePlayer) {
            addLogEntry(`${skelligePlayer.name} przywołuje wojowników zza grobu!`);
            skelligeCardsToKeep.forEach(card => {
                const cardInstance = { ...card, instanceId: Date.now() + Math.random() };
                const targetRow = Array.isArray(card.row) ? card.row[0] : card.row; // Uproszczone umieszczenie
                skelligePlayer.board[targetRow].push(cardInstance);
                addLogEntry(`- ${card.name} powraca na pole bitwy!`);
            });
        }
    }
    skelligeCardsToKeep = [];

    weatherCardsOnBoard = []; 
    passedPlayers = [];
    roundNumber++; 
    isFirstMoveOfRound = true; 
    activePlayer = null;
    addLogEntry(`Rozpoczynamy rundę ${roundNumber}!`);

    updateAllControls();
}


function checkGameOver() {
    let winner = null;
    if (players.player1.crystalCount <= 0 && players.player2.crystalCount <= 0) { winner = 'Remis'; }
    else if (players.player1.crystalCount <= 0) { winner = players.player2; }
    else if (players.player2.crystalCount <= 0) { winner = players.player1; }
    if (winner) {
        alert(winner === 'Remis' ? "Remis! Obaj gracze przegrali!" : `${winner.name} wygrywa grę!`);
        location.reload(); return true;
    }
    return false;
}

function setupEventListeners() {
    battlefieldScreen.addEventListener('click', (event) => {
        if (isMonsterAbilityActive) {
            const targetElement = event.target.closest('.card-on-board.targetable');
            if (targetElement) {
                const instanceId = targetElement.dataset.instanceId;
                let found = null;
                for (const r of ['melee', 'ranged', 'siege']) {
                    const card = monsterPlayerToChoose.board[r].find(c => c.instanceId == instanceId);
                    if (card) {
                        found = card;
                        break;
                    }
                }
                if (found) {
                    executeMonsterAbility(monsterPlayerToChoose, found);
                }
            }
            return;
        }

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
                addLogEntry("Anulowano zagranie Wabika.");
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
        if (isSkelligeAbilityActive && skelligePlayerToChoose === players.player1) {
            executeSkelligeAbility(players.player1, event.target.value);
        } else if (isMedicModeActive && activePlayer === players.player1) { 
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
        if (isSkelligeAbilityActive && skelligePlayerToChoose === players.player2) {
            executeSkelligeAbility(players.player2, event.target.value);
        } else if (isMedicModeActive && activePlayer === players.player2) { 
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
// Np. dodaj te karty, aby przetestować mechaniki
/*
const allCards = [
    // ... inne karty
];
*/

setupGame();
setupEventListeners();
