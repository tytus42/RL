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

// === MAPY IKON ===
const abilityIconMap = {
    medic: '❤️', muster: '🎺', tight_bond: '🔗', morale_boost: '➕',
    scorch_row: '🔥', spy: '👁️', avenger: '💀', Moc: '💪', horn: '📯',
    decoy: '🎭', 'Wyzwolenie siły': '💥', scorch_strongest: '☄️', agile: '↔️'
};

const rowIconMap = {
    melee: `<svg viewBox="0 0 300 300" fill="currentColor"><path d="M258,2l-16,48L97.06,181.76l-7.23-11.14l-11.68-7.58L210,18L258,2z M101.029,238.26l11.314-11.314l-31.176-48.02 l-48.02-31.176l-11.314,11.314l31.386,31.386l-34.26,37.693c-4.464-0.586-9.138,0.82-12.568,4.249 c-5.858,5.858-5.858,15.355,0,21.213c5.858,5.858,15.355,5.858,21.213,0c3.428-3.428,4.834-8.1,4.25-12.562l37.695-34.262 L101.029,238.26z"/></svg>`,
    ranged: `<svg viewBox="0 0 512 512" fill="currentColor"><path d="M89.594 18.094l-10.75 10.75.03.03 27.532 333.563-83.03 92.938 33.25 33.25 90.155-80.563 336.19 24.907c.06.062.124.124.186.186l.156-.156h.032v-.03l10.562-10.564c-1.676-1.676-3.122-3.437-4.687-5.156-21.332-25.55-25.416-63.24-35.47-109.125-8.323-37.99-21.225-81.042-53.094-125.03l-38.062 50.81c.005.008-.005.026 0 .032 28.988 36.074 46.027 67.766 59.72 96.25 15.017 31.247 26.122 59 44.467 83.688L165.314 391.5 337.53 237.594l64.376-85.97-41.53-41.53-85.907 64.312L122.81 344.094 98.156 45.25c24.68 18.33 52.425 29.426 83.656 44.438 28.49 13.693 60.2 30.72 96.282 59.718l50.812-38.062c-43.99-31.86-87.04-44.736-125.03-53.063C157.987 48.224 120.3 44.113 94.75 22.78c-1.72-1.564-3.48-3.01-5.156-4.686zm317.03.312c-3.385.028-6.862.406-10.28.97-4.558.75-8.992 1.837-12.813 3.093-3.82 1.254-6.776 2.302-9.717 4.624a7.184 7.184 0 0 0-2.72 6.187l5.032 62.345a7.184 7.184 0 0 0 2.063 4.53l33.656 33.626a7.184 7.184 0 0 0 4.5 2.095l62.344 5.03a7.184 7.184 0 0 0 6.218-2.718c2.335-2.944 3.367-5.895 4.625-9.718 1.26-3.824 2.343-8.255 3.095-12.814.752-4.56 1.18-9.198.875-13.625-.305-4.425-1.012-8.99-4.844-12.81L422.78 23.343c-3.822-3.824-8.384-4.54-12.81-4.844-1.108-.076-2.216-.103-3.345-.094zm.126 14.375c.8-.006 1.563.016 2.25.064 2.404.165 3.74.915 3.72.78l65.655 65.657c-.138-.023.616 1.318.78 3.72.19 2.746-.062 6.526-.686 10.313-.626 3.786-1.595 7.62-2.595 10.656-.412 1.25-.524 1.272-.938 2.186l-54.78-4.375-29.938-29.936-4.376-54.813c.913-.41.94-.495 2.187-.905 3.037-.998 6.872-1.97 10.658-2.594 2.84-.466 5.662-.728 8.062-.75zm-47.97 120.44l-18.936 31.593-204.5 204.468-8.844-.655-1.188-14.563 201.875-201.906 31.594-18.937z"/></svg>`,
    siege: `<svg viewBox="0 0 512 512" fill="currentColor"><g><path d="M197.62,238.574v-45.828c-14.75,5.27-31.722,11.334-49.026,17.522L197.62,238.574z"/><path d="M122.679,275.084c0.007,9.827,1.453,19.409,4.319,28.605l49.549-28.605l-49.549-28.605 C124.132,255.675,122.679,265.264,122.679,275.084z"/><path d="M260.854,275.084l13.474,7.776c1.99-0.713,3.627-1.297,4.856-1.732c5.046-1.807,17.963-7.022,35.192-14.112 c-0.577-7.015-1.902-13.881-3.98-20.536L260.854,275.084z"/><path d="M256.066,186.594c-5.25-2.214-10.703-3.96-16.292-5.203v57.183l49.46-28.551 C279.937,199.918,268.63,191.904,256.066,186.594z"/><path d="M297.275,158.573c-22.404-15.145-49.535-24.014-78.574-24.007c-19.355-0.007-37.881,3.932-54.704,11.049 c-25.236,10.676-46.656,28.469-61.8,50.887c-15.158,22.404-24.021,49.535-24.014,78.581c0,19.348,3.932,37.875,11.056,54.696 c10.676,25.236,28.469,46.656,50.88,61.8c22.411,15.158,49.536,24.02,78.582,24.014c19.348,0,37.875-3.932,54.703-11.049 c25.236-10.683,46.656-28.476,61.8-50.887c15.151-22.412,24.014-49.535,24.007-78.574c0.007-19.355-3.932-37.882-11.05-54.703 C337.486,195.137,319.693,173.718,297.275,158.573z M230.408,170.356c10.302,1.134,20.129,3.728,29.304,7.613 c17.521,7.403,32.611,19.498,43.783,34.636l-67.444,38.941c-1.752-1.29-3.626-2.404-5.644-3.287V170.356z M159.787,187.68 c13.793-9.304,29.826-15.416,47.199-17.338v77.916c-2.01,0.883-3.892,1.997-5.637,3.287l-67.464-38.955 C141.042,202.9,149.79,194.431,159.787,187.68z M113.314,275.084c0-14.601,2.954-28.421,8.279-41.02 c0.17-0.408,0.38-0.801,0.556-1.208l67.464,38.954c-0.115,1.073-0.19,2.16-0.19,3.274c0,1.1,0.074,2.186,0.19,3.259l-67.491,38.982 C116.458,304.408,113.321,290.147,113.314,275.084z M206.986,379.805c-10.296-1.141-20.13-3.735-29.297-7.614 c-17.522-7.409-32.612-19.498-43.79-34.635l67.45-38.934c1.745,1.29,3.626,2.404,5.637,3.28V379.805z M218.7,286.792 c-6.472,0-11.715-5.243-11.715-11.708c0-6.472,5.243-11.715,11.715-11.715c6.465,0,11.708,5.243,11.708,11.715 C230.408,281.549,225.166,286.792,218.7,286.792z M277.608,362.473c-13.793,9.31-29.82,15.429-47.199,17.344v-77.916 c2.017-0.876,3.892-1.99,5.644-3.28l67.457,38.941C296.351,347.261,287.611,355.723,277.608,362.473z M315.808,316.095 c-0.17,0.408-0.38,0.795-0.557,1.202L247.78,278.35c0.116-1.08,0.197-2.166,0.197-3.266c0-1.114-0.081-2.2-0.197-3.274 l67.498-38.968c5.664,12.916,8.802,27.171,8.808,42.241C324.08,289.685,321.132,303.498,315.808,316.095z"/><path d="M61.959,275.084c-0.007-15.416,2.296-30.316,6.458-44.428l-31.321,11.192 c-4.265,1.528-6.492,6.166-5.093,10.431c-19.858,9.874-40.055,37.026-28.741,68.693c11.315,31.654,44.158,39.872,65.767,34.914 c1.63,4.197,6.289,6.357,10.554,4.842l6.438-2.302c-4.462-7.09-8.428-14.526-11.728-22.33 C66.346,317.332,61.959,296.666,61.959,275.084z"/><path d="M477.772,96.406l-14.506,5.182c-10.16,3.634-6.479,9.854-24.394,16.251c-1.827,0.652-5.494,1.834-10.581,3.423 c-2.139-2.825-5.901-4.088-9.412-2.839c-3.26,1.168-5.345,4.164-5.501,7.43c-31.546,9.602-54.351,15.402-95.75,27.742 c19.681,16.041,35.436,36.707,45.481,60.47c3.898,9.216,6.933,18.9,9.018,28.923c35.097-14.954,45.393-22.071,71.396-32.781 c2.187,2.424,5.705,3.429,8.964,2.255c3.511-1.257,5.616-4.625,5.481-8.157c4.937-1.996,8.523-3.409,10.356-4.06 c17.908-6.411,19.008,0.733,29.169-2.894L512,192.169L477.772,96.406z"/></g></svg>`
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

// ==================================================================
// === ZMODYFIKOWANA FUNKCJA TWORZĄCA KARTY ===
// ==================================================================
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-on-board');
    cardDiv.dataset.instanceId = card.instanceId;

    if (card.isHero) cardDiv.classList.add('hero-card');
    if (card.faction) cardDiv.classList.add(`faction-${card.faction.toLowerCase().replace(/\s+/g, '-')}`);
    
    // Obsługa kart Specjalnych i Pogody (prosty wygląd)
    if (card.type === 'Special' || card.type === 'Weather') {
        cardDiv.classList.add(`${card.type.toLowerCase()}-card`);
        cardDiv.innerHTML = `<div class="card-name-simple">${card.name}</div>`;
    } 
    // Obsługa Rogu Dowódcy (specjalny wygląd karty)
    else if (card.type === 'Horn') {
        cardDiv.classList.add('horn-card-styled');
        cardDiv.innerHTML = `
            <div class="card-left-column">
                <div class="card-power-container-empty"></div>
                <div class="card-row-icon-container">
                     <div class="ability-icon main-icon">${abilityIconMap['horn'] || '❓'}</div>
                </div>
            </div>
            <div class="card-right-column">
                <div class="card-info-footer">
                    <div class="card-description">Podwaja siłę wszystkich jednostek w tym rzędzie.</div>
                    <div class="card-name">${card.name}</div>
                </div>
            </div>
        `;
    }
    // Obsługa wszystkich kart Jednostek
    else if (card.type === 'Unit') {
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
                    const cardNameToMuster = cardInstance.name;
                    const cardsToSummon = player.availableCards.filter(card => card.name === cardNameToMuster);
                    if (cardsToSummon.length > 0) {
                        addLogEntry(`Zbiórka! ${player.name} przywołuje ${cardsToSummon.length} dodatkowe karty ${cardNameToMuster}.`);
                        player.availableCards = player.availableCards.filter(card => card.name !== cardNameToMuster);
                        cardsToSummon.forEach(summonedCardData => {
                            const summonedCardInstance = { ...summonedCardData, instanceId: Date.now() + Math.random() };
                            player.board[targetRow].push(summonedCardInstance);
                        });
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

function endRound() {
    addLogEntry("Runda zakończona!");
    const p1Power = calculatePlayerPower(players.player1), p2Power = calculatePlayerPower(players.player2);
    if (p1Power > p2Power) { players.player2.crystalCount--; addLogEntry(`${players.player1.name} wygrywa rundę!`); }
    else if (p2Power > p1Power) { players.player1.crystalCount--; addLogEntry(`${players.player2.name} wygrywa rundę!`); }
    else { players.player1.crystalCount--; players.player2.crystalCount--; addLogEntry(`Remis!`); }
    
    if (checkGameOver()) return;

    [players.player1, players.player2].forEach(p => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            const newRow = [];
            const cardsInRow = [...p.board[rowType]];

            cardsInRow.forEach(card => {
                const replacement = handleCardRemoval(card);
                if (replacement) {
                    newRow.push(replacement);
                } else {
                    p.graveyard.push(card);
                }
            });
            p.board[rowType] = newRow;
        });

        p.board.horns = { melee: null, ranged: null, siege: null };
        if (p.commander) p.commander.activatedThisRound = false;
    });
    
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
// Np. dodaj te karty, aby przetestować mechaniki
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
        summons: 'golem_fiend_1',
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
        isToken: true
    },
    {
        id: 'kasacz_1',
        name: 'Kąsacz',
        type: 'Unit',
        power: 4,
        faction: 'Monsters',
        row: 'melee',
        abilities: ['Moc'],
        transformId: 'wsciekly_kasacz_1',
        isHero: false
    },
    {
        id: 'wsciekly_kasacz_1',
        name: 'Wściekły Kąsacz',
        type: 'Unit',
        power: 8,
        faction: 'Monsters',
        row: 'melee',
        abilities: [],
        isHero: false,
        isToken: true
    },
    {
        id: 'wyzwolenie_sily_1',
        name: 'Wyzwolenie siły',
        type: 'Special',
        faction: 'Neutral',
        abilities: ['Wyzwolenie siły']
    },
    // ... inne karty
];
*/

setupGame();
setupEventListeners();
