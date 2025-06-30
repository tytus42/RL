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

// === Funkcje pomocnicze ===
function translateRowName(rowKey) { const names = { melee: 'Wręcz', ranged: 'Dystans', siege: 'Oblężnicze' }; return names[rowKey] || rowKey; }
function getCardDetailsById(cardId) { return allCards.find(card => card.id === cardId); }

function addLogEntry(message) {
    const p = document.createElement('p');
    p.textContent = `[Runda ${roundNumber}] ${message}`;
    if (historyLog.firstChild) { historyLog.insertBefore(p, historyLog.firstChild); } 
    else { historyLog.appendChild(p); }
}
function executeGlobalScorch() {
    addLogEntry("Na pole bitwy spada Deszcz Ognia!");

    // 1. Zbierz wszystkie jednostki (nie-bohaterów) z całej planszy
    let wszystkieJednostkiNaPlanszy = [];
    [players.player1, players.player2].forEach(player => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            player.board[rowType].forEach(card => {
                if (card.type === 'Unit' && !card.isHero && !card.isSpecialUnit) {
                    // Dodajemy informację o właścicielu i rzędzie, przyda się później
                    wszystkieJednostkiNaPlanszy.push({ card, owner: player, row: rowType });
                }
            });
        });
    });

    // Jeśli nie ma celów (np. na planszy są tylko bohaterowie), zakończ
    if (wszystkieJednostkiNaPlanszy.length === 0) {
        addLogEntry("...ale nie znalazł żadnych celów (na planszy nie ma jednostek lub są tylko bohaterowie).");
        return;
    }

    // 2. Znajdź najwyższą siłę wśród tych jednostek
    let maxMoc = 0;
    wszystkieJednostkiNaPlanszy.forEach(item => {
        const moc = item.card.currentPower ?? item.card.power;
        if (moc > maxMoc) {
            maxMoc = moc;
        }
    });

    // 3. Znajdź wszystkie jednostki, które mają tę najwyższą siłę
    const kartyDoZniszczenia = wszystkieJednostkiNaPlanszy.filter(item => {
        const moc = item.card.currentPower ?? item.card.power;
        return moc === maxMoc;
    });

    // 4. Zniszcz te jednostki
    if (kartyDoZniszczenia.length > 0) {
        addLogEntry(`Deszcz Ognia niszczy najsilniejsze jednostki o sile ${maxMoc}!`);
        kartyDoZniszczenia.forEach(itemToDestroy => {
            const { card, owner, row } = itemToDestroy;

            // Znajdź dokładny indeks karty w rzędzie właściciela
            const cardIndex = owner.board[row].findIndex(c => c.instanceId === card.instanceId);
            
            if (cardIndex > -1) {
                // Usuń kartę z planszy i przenieś na cmentarz
                const [destroyedCard] = owner.board[row].splice(cardIndex, 1);
                owner.graveyard.push(destroyedCard);
                addLogEntry(`- Zniszczono: ${destroyedCard.name} (${owner.name}).`);
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
                if (card.ability === 'tight_bond') {
                    const baseId = card.baseId || card.id.split('_')[0];
                    if (!bondGroups[baseId]) {
                        bondGroups[baseId] = [];
                    }
                    bondGroups[baseId].push(card);
                }
            });
            
            const moraleGiversInRow = cardsInRow.filter(c => c.ability === 'morale_boost');
            const moraleBoostValue = moraleGiversInRow.length;

            cardsInRow.forEach(card => {
                delete card.currentPower;
                if (card.type === 'Unit' && !card.isHero && card.name !== 'Wabik') {
                    let power = card.power;
                    if (activeWeatherRows.has(rowType)) { power = 1; }
                    
                    const baseId = card.baseId || card.id.split('_')[0];
                    if (card.ability === 'tight_bond' && bondGroups[baseId] && bondGroups[baseId].length > 1) {
                        power *= bondGroups[baseId].length;
                    }
                    
                    if (moraleBoostValue > 0) {
                        if (card.ability !== 'morale_boost') { power += moraleBoostValue; } 
                        else { power += (moraleBoostValue - 1); }
                    }
                    
                    if (isHornActive) { power *= 2; }
                    if (power !== card.power) { card.currentPower = power; }
                }
            });

             if (activeWeatherRows.has(rowType)) {
                const weatherCard = weatherCardsOnBoard.find(c => c.rowAffected.includes(rowType));
                if (weatherCard) {
                     const weatherClassMap = { 'biting_frost': 'frost-effect', 'impenetrable_fog': 'fog-effect', 'torrential_rain': 'rain-effect', 'fear': 'fear-effect' };
                     const weatherBaseId = weatherCard.id.split('_')[0];
                     if(weatherClassMap[weatherBaseId]) {
                         player.domElements[rowType + 'Row'].classList.add(weatherClassMap[weatherBaseId]);
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
        
        const decoyCardIndex = player.availableCards.findIndex(c => c.ability === 'decoy');
        if (decoyCardIndex > -1) { 
            const [decoyCard] = player.availableCards.splice(decoyCardIndex, 1);
            const decoyUnit = { ...decoyCard, instanceId: Date.now() + Math.random(), power: 0, type: 'Unit', name: 'Wabik', isSpecialUnit: true };
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
            if (!cardOnBoard.isHero && cardOnBoard.type === 'Unit') {
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
        switchActivePlayer();
        return;
    };
    
    handlePlayerAction(player, () => {
        const cardIndex = player.graveyard.findIndex(c => c.id === resurrectedCardId);
        if (cardIndex === -1) return false;
        const [resurrectedCard] = player.graveyard.splice(cardIndex, 1);
        
        addLogEntry(`${player.name} wskrzesił kartę: ${resurrectedCard.name}.`);
        
        const cardInstance = { ...resurrectedCard, instanceId: Date.now() + Math.random() };
        
        let targetRow;
        if (Array.isArray(cardInstance.row)) {
            targetRow = prompt(`Wybierz rząd dla wskrzeszonej karty ${cardInstance.name}: ${cardInstance.row.join(', ')}`);
            if (!cardInstance.row.includes(targetRow)) {
                alert("Nieprawidłowy rząd! Karta wraca na cmentarz.");
                player.graveyard.push(resurrectedCard);
                return true; 
            }
        } else {
            targetRow = cardInstance.row;
        }

        if (cardInstance.ability === 'spy') {
            const opponent = (player === players.player1) ? players.player2 : players.player1;
            opponent.board[targetRow].push(cardInstance);
            addLogEntry(`...i zagrał ją jako Szpiega na stronę przeciwnika.`);
        } else {
            player.board[targetRow].push(cardInstance);
            addLogEntry(`...i położył ją w rzędzie ${translateRowName(targetRow)}.`);
            if (cardInstance.ability === 'medic') {
                const hasValidTargets = player.graveyard.some(c => c.type === 'Unit' && !c.isHero && c.name !== 'Wabik');
                if (hasValidTargets) { isMedicModeActive = true; }
            }
            if (cardInstance.ability === 'scorch_row') {
              executeRowScorch(player, targetRow);
          }
        }
        return true;
    }, true);
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
        if(!p.faction || !leaderId) { return alert("Proszę wybrać frakcję i dowódcę dla obu graczy!"); }
        p.commander = getCardDetailsById(leaderId);
        p.availableCards = allCards.filter(card => card.type !== 'Leader' && (card.faction === p.faction || card.faction === 'Neutral')).map(c => ({...c}));
    });
    gameSetupScreen.style.display = 'none'; battlefieldScreen.style.display = 'grid';
    isFirstMoveOfRound = true; activePlayer = null;
    addLogEntry(`Gra rozpoczęta! Runda ${roundNumber}.`);
    updateAllControls();
}

function updatePlayerControlsVisibility(player) {
    const { cardSelect, rowSelect, playCardButton, passRoundButton, activateLeaderButton, graveyardSelect } = player.domElements;
    graveyardSelect.disabled = true;

    if (isMedicModeActive && player === activePlayer) {
        cardSelect.disabled = true; rowSelect.disabled = true; playCardButton.style.display = 'none';
        passRoundButton.disabled = true; activateLeaderButton.disabled = true;
        populateGraveyardSelect(player);
        return;
    }
    if (passedPlayers.includes(player) || (isDecoyModeActive && player !== activePlayer)) {
        cardSelect.disabled = true; rowSelect.disabled = true; playCardButton.disabled = true; passRoundButton.disabled = true; activateLeaderButton.disabled = true;
        return;
    }
    let isPlayerTurn = isFirstMoveOfRound || (player === activePlayer);
    if (isDecoyModeActive && player === activePlayer) {
        cardSelect.disabled = false; playCardButton.disabled = true; rowSelect.disabled = true; passRoundButton.disabled = true; activateLeaderButton.disabled = true;
        return;
    }
    cardSelect.disabled = !isPlayerTurn; passRoundButton.disabled = !isPlayerTurn;
    activateLeaderButton.disabled = !isPlayerTurn || (player.commander && player.commander.activatedThisRound);
    
    const selectedOption = cardSelect.options[cardSelect.selectedIndex];
    playCardButton.disabled = true; playCardButton.style.display = 'inline-block';
    rowSelect.disabled = true; rowSelect.innerHTML = '<option value="">-- Wybierz Rząd --</option>';
    if (!selectedOption || !selectedOption.value || !isPlayerTurn) { return; }
    
    const cardId = selectedOption.value;
    let selectedCard = getCardDetailsById(cardId);
    if (!selectedCard) return;

    if (selectedCard.ability === 'decoy') {
        const hasValidTargets = player.board.melee.some(c => !c.isHero && c.type === 'Unit') || player.board.ranged.some(c => !c.isHero && c.type === 'Unit') || player.board.siege.some(c => !c.isHero && c.type === 'Unit');
        playCardButton.disabled = !hasValidTargets;
        if (!hasValidTargets) addLogEntry("Brak celów dla Wabika na planszy.");
        return;
    }
    if (selectedCard.type === 'Unit') {
        rowSelect.innerHTML = ''; rowSelect.disabled = false;
        if (Array.isArray(selectedCard.row)) {
            rowSelect.add(new Option('-- Wybierz Rząd --', ''));
            selectedCard.row.forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
            playCardButton.disabled = !rowSelect.value;
        } else {
            rowSelect.add(new Option(translateRowName(selectedCard.row), selectedCard.row));
            rowSelect.disabled = true; playCardButton.disabled = false;
        }
    } else if (selectedCard.type === 'Special' && selectedCard.name === 'Róg Dowódcy') {
        rowSelect.innerHTML = ''; rowSelect.disabled = false;
        rowSelect.add(new Option('-- Wybierz Rząd --', ''));
        ['melee', 'ranged', 'siege'].forEach(rowKey => rowSelect.add(new Option(translateRowName(rowKey), rowKey)));
        playCardButton.disabled = !rowSelect.value;
    } else if (selectedCard.type === 'Weather' || selectedCard.type === 'Special') {
        playCardButton.disabled = false;
    }
}

function handlePlayerAction(player, action, isFollowUpAction = false) {
    if (!isFollowUpAction) {
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

    // Oblicz sumę siły w rzędzie przeciwnika (wliczając bohaterów)
    const totalPowerInRow = targetRow.reduce((sum, card) => sum + (card.currentPower ?? card.power), 0);
    
    if (totalPowerInRow >= 10) {
        // Znajdź najsilniejsze karty, ale tylko te, które nie są bohaterami
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

        // Znajdź wszystkie karty z tą siłą i przenieś je na cmentarz
        const cardsToDestroy = targetRow.filter(card => !card.isHero && (card.currentPower ?? card.power) === maxPower);
        
        cardsToDestroy.forEach(card => {
            const index = opponent.board[cardRow].findIndex(c => c.instanceId === card.instanceId);
            if (index > -1) {
                const [destroyedCard] = opponent.board[cardRow].splice(index, 1);
                opponent.graveyard.push(destroyedCard);
                addLogEntry(`Szeregowy deszcz ognia zniszczył kartę: ${destroyedCard.name}.`);
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
    
    if (cardToPlayInfo.ability === 'decoy') {
        activateDecoyMode(player);
        return;
    }

    handlePlayerAction(player, () => {
        const rowSelect = player.domElements.rowSelect;
        const targetRow = rowSelect.value;
        if ((cardToPlayInfo.type === 'Unit' || cardToPlayInfo.name === 'Róg Dowódcy') && !targetRow) { alert("Wybierz rząd!"); return false; }
        
        const cardIndex = player.availableCards.findIndex(c => c.id === selectedCardId);
        if (cardIndex === -1) { return false; }
        const [cardData] = player.availableCards.splice(cardIndex, 1);
        const cardInstance = { ...cardData, instanceId: Date.now() + Math.random() };

        if (cardInstance.ability === 'spy') {
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
            addLogEntry(`${player.name} zagrał ${cardInstance.name} do rzędu ${targetRow}.`);
           // =================== POCZĄTEK NOWEJ LOGIKI DLA "ZBIÓRKI" ===================
          if (cardInstance.ability === 'muster') {
              const cardNameToMuster = cardInstance.name;
              
              // Znajdź wszystkie karty o tej samej nazwie w puli gracza
              const cardsToSummon = player.availableCards.filter(card => card.name === cardNameToMuster);
              
              if (cardsToSummon.length > 0) {
                  addLogEntry(`Zbiórka! ${player.name} przywołuje ${cardsToSummon.length} dodatkowe karty ${cardNameToMuster}.`);

                  // Usuń przywołane karty z puli dostępnych kart
                  player.availableCards = player.availableCards.filter(card => card.name !== cardNameToMuster);

                  // Dodaj każdą z przywołanych kart do tego samego rzędu
                  cardsToSummon.forEach(summonedCardData => {
                      const summonedCardInstance = { ...summonedCardData, instanceId: Date.now() + Math.random() };
                      player.board[targetRow].push(summonedCardInstance);
                  });
              }
          }
          // =================== KONIEC NOWEJ LOGIKI DLA "ZBIÓRKI" ===================

            if (cardInstance.ability === 'scorch_row') {
                executeRowScorch(player, targetRow);
            }
            if (cardInstance.ability === 'medic') {
                const hasValidTargets = player.graveyard.some(c => c.type === 'Unit' && !c.isHero);
                if (hasValidTargets) { isMedicModeActive = true; } 
                else { addLogEntry("Medyk nie znalazł celów na cmentarzu."); }
            }
        } else if (cardInstance.type === 'Special') {
    let shouldGoToGraveyard = true;
    addLogEntry(`${player.name} zagrał kartę specjalną: ${cardInstance.name}.`);

    // Sprawdzamy zdolność karty specjalnej
    switch (cardInstance.ability) {
        case 'horn':
            // Róg Dowódcy jest "przyklejany" do rzędu, więc nie idzie na cmentarz
            player.board.horns[targetRow] = { ...cardInstance, type: 'Horn', name: 'Róg' };
            shouldGoToGraveyard = false;
            break;

        case 'scorch_strongest':
            executeGlobalScorch(); // Wywołujemy naszą nową funkcję!
            break;
            
        case 'decoy':
            // Logika wabika jest obsługiwana gdzie indziej, ale tu zapobiegamy pójściu na cmentarz
            shouldGoToGraveyard = false;
            break;
    }

    // Karty specjalne (poza Rogiem i Wabikiem) trafiają na cmentarz po użyciu
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

function endRound() {
    addLogEntry("Runda zakończona!");
    const p1Power = calculatePlayerPower(players.player1), p2Power = calculatePlayerPower(players.player2);
    if (p1Power > p2Power) { players.player2.crystalCount--; addLogEntry(`${players.player1.name} wygrywa rundę!`); } 
    else if (p2Power > p1Power) { players.player1.crystalCount--; addLogEntry(`${players.player2.name} wygrywa rundę!`); } 
    else { players.player1.crystalCount--; players.player2.crystalCount--; addLogEntry(`Remis!`); }
    
    if (checkGameOver()) return;

    [players.player1, players.player2].forEach(p => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            p.graveyard.push(...p.board[rowType]); p.board[rowType] = [];
        });
        p.board.horns = { melee: null, ranged: null, siege: null };
        if (p.commander) p.commander.activatedThisRound = false;
    });
    weatherCardsOnBoard = []; passedPlayers = [];
    roundNumber++; isFirstMoveOfRound = true; activePlayer = null;
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

    players.player1.domElements.playCardButton.addEventListener('click', () => playCard(players.player1));
    players.player1.domElements.passRoundButton.addEventListener('click', () => passRound(players.player1));
    players.player1.domElements.activateLeaderButton.addEventListener('click', () => activateLeaderAbility(players.player1));
    players.player1.domElements.cardSelect.addEventListener('change', () => { deactivateDecoyMode(); updatePlayerControlsVisibility(players.player1); });
    players.player1.domElements.rowSelect.addEventListener('change', (event) => { players.player1.domElements.playCardButton.disabled = !event.target.value; });
    players.player1.domElements.graveyardSelect.addEventListener('change', (event) => { if(isMedicModeActive && activePlayer === players.player1) { executeResurrection(players.player1, event.target.value); }});
    
    players.player2.domElements.playCardButton.addEventListener('click', () => playCard(players.player2));
    players.player2.domElements.passRoundButton.addEventListener('click', () => passRound(players.player2));
    players.player2.domElements.activateLeaderButton.addEventListener('click', () => activateLeaderAbility(players.player2));
    players.player2.domElements.cardSelect.addEventListener('change', () => { deactivateDecoyMode(); updatePlayerControlsVisibility(players.player2); });
    players.player2.domElements.rowSelect.addEventListener('change', (event) => { players.player2.domElements.playCardButton.disabled = !event.target.value; });
    players.player2.domElements.graveyardSelect.addEventListener('change', (event) => { if(isMedicModeActive && activePlayer === players.player2) { executeResurrection(players.player2, event.target.value); }});
}

// === Inicjalizacja gry ===
setupGame();
setupEventListeners();
