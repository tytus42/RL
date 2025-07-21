// === Elementy DOM ===
const gameSetupScreen = document.getElementById('game-setup-screen');
const battlefieldScreen = document.getElementById('battlefield-screen');
const startGameButton = document.getElementById('startGameButton');
const globalWeatherRow = document.getElementById('global-weather-row');
const historyLog = document.getElementById('history-log');
const copyHistoryButton = document.getElementById('copyHistoryButton');
const copyNotification = document.getElementById('copy-notification');
const gameOverOverlay = document.getElementById('game-over-overlay');
const winnerMessage = document.getElementById('winner-message');
const newGameButton = document.getElementById('newGameButton');

// Obiekty graczy
let players = {
    player1: { name: 'Gracz 1', faction: null, crystalCount: 2, power: 0, commander: null, graveyard: [], availableCards: [], board: { melee: [], ranged: [], siege: [], horns: { melee: null, ranged: null, siege: null } }, factionAbilityUsed: false, factionAbilityUsedThisGame: false, commanderAbilityUsedThisGame: false },
    player2: { name: 'Gracz 2', faction: null, crystalCount: 2, power: 0, commander: null, graveyard: [], availableCards: [], board: { melee: [], ranged: [], siege: [], horns: { melee: null, ranged: null, siege: null } }, factionAbilityUsed: false, factionAbilityUsedThisGame: false, commanderAbilityUsedThisGame: false }
};
Object.keys(players).forEach(pKey => {
    const pNum = pKey.slice(-1);
    players[pKey].domElements = {
        factionDisplay: document.getElementById(`player${pNum}-faction-display`), crystalCount: document.getElementById(`player${pNum}-crystal-count`),
        powerDisplay: document.getElementById(`player${pNum}-power`), commanderName: document.getElementById(`player${pNum}-commander-name`),
        activateLeaderButton: document.getElementById(`activateLeader${pNum}`), cardSelect: document.getElementById(`player${pNum}-card-select`),
        rowSelect: document.getElementById(`player${pNum}-row-select`), playCardButton: document.getElementById(`playCardButton${pNum}`),
        graveyardSelect: document.getElementById(`player${pNum}-graveyard-select`), passRoundButton: document.getElementById(`passRoundButton${pNum}`),
        factionAbilityButton: document.getElementById(`factionAbilityButton${pNum}`),
        meleeRow: document.getElementById(`player${pNum}-melee-row`), rangedRow: document.getElementById(`player${pNum}-ranged-row`),
        siegeRow: document.getElementById(`player${pNum}-siege-row`), meleeHorn: document.getElementById(`player${pNum}-melee-horn`),
        rangedHorn: document.getElementById(`player${pNum}-ranged-horn`), siegeHorn: document.getElementById(`player${pNum}-siege-horn`),
        meleeScore: document.getElementById(`player${pNum}-melee-score`), rangedScore: document.getElementById(`player${pNum}-ranged-score`),
        siegeScore: document.getElementById(`player${pNum}-siege-score`),
    }
});

// Zmienne stanu gry
let activePlayer = null, roundNumber = 1, passedPlayers = [], weatherCardsOnBoard = [], isFirstMoveOfRound = true;
let lastRoundLoser = null;
let nextRoundSummonsQueue = [];
let factionAbilityQueue = [];
let endOfRoundAbilityQueue = [];
let isFactionAbilitySetupInProgress = false;
let isDecoyModeActive = false;
let isMedicModeActive = false;
let isAgileResurrectionModeActive = false;
let cardToResurrectWithAgile = null;
let isMonsterAbilityActive = false;
let monsterPlayerToChoose = null;
let isOrcsAbilityActive = false;
let orcsPlayerToChoose = null;
let orcsCardsToKeep = [];
let isBanditsAbilityActive = false;
let banditsPlayerToChoose = null;
let isGraveyardDrawModeActive = false;
let graveyardDrawPlayer = null;
let isOpponentGraveyardDrawModeActive = false;
let opponentGraveyardDrawPlayer = null;
let isDoubleMedicActive = false;
let doubleMedicPlayer = null;
let doubleMedicStage = 0;
let isLeaderAgileMoveActive = false;
let leaderAgileMovePlayer = null;
let isLeaderWeatherActive = false;
let leaderWeatherPlayer = null;

// === MAPY IKON ===
const abilityIconMap = {
    medic: '❤️', muster: '🎺', tight_bond: '🔗', morale_boost: '➕',
    scorch_row: '🔥', spy: '👁️', avenger: '💀', Moc: '💪', horn: '📯',
    decoy: '🎭', 'Wyzwolenie siły': '💥', scorch_strongest: '☄️', agile: '↔️',
    summon_next_round: '⏳'
};

const rowIconMap = {
    melee: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 0H13L3.70711 9.29289L2.20711 7.79289L0.792893 9.20711L3.08579 11.5L1.5835 13.0023C1.55586 13.0008 1.52802 13 1.5 13C0.671573 13 0 13.6716 0 14.5C0 15.3284 0.671573 16 1.5 16C2.32843 16 3 15.3284 3 14.5C3 14.472 2.99923 14.4441 2.99771 14.4165L4.5 12.9142L6.79289 15.2071L8.20711 13.7929L6.70711 12.2929L16 3V0Z"/></svg>`,
    ranged: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M23.9806 1.19613C24.0462 0.868272 23.9436 0.529333 23.7071 0.292909C23.4707 0.056486 23.1318 -0.0461365 22.8039 0.0194355L17.8039 1.01944C17.2624 1.12775 16.9111 1.65457 17.0194 2.19613C17.1278 2.73769 17.6546 3.08891 18.1961 2.9806L19.9575 2.62832L16.8761 5.70976C14.2376 3.39988 10.7823 2.00002 7.00003 2.00002H1.00003C0.447744 2.00002 2.91966e-05 2.44773 2.91966e-05 3.00002C2.91966e-05 3.5523 0.447744 4.00002 1.00003 4.00002C1.00003 4.25594 1.09766 4.51186 1.29292 4.70712L9.58582 13L8.58582 14H5.00003C4.73481 14 4.48046 14.1054 4.29292 14.2929L0.292922 18.2929C0.00692444 18.5789 -0.0786313 19.009 0.0761497 19.3827C0.230931 19.7564 0.595567 20 1.00003 20H4.00003V23C4.00003 23.4045 4.24367 23.7691 4.61735 23.9239C4.99102 24.0787 5.42114 23.9931 5.70714 23.7071L9.70714 19.7071C9.89467 19.5196 10 19.2652 10 19V15.4142L11 14.4142L19.2929 22.7071C19.4882 22.9024 19.7441 23 20 23C20 23.5523 20.4477 24 21 24C21.5523 24 22 23.5523 22 23V17C22 13.2178 20.6002 9.76247 18.2903 7.12397L21.3717 4.04254L21.0194 5.8039C20.9111 6.34546 21.2624 6.87228 21.8039 6.9806C22.3455 7.08891 22.8723 6.73769 22.9806 6.19613L23.9806 1.19613ZM15.4582 7.12759C13.1847 5.17792 10.2299 4.00002 7.00003 4.00002H3.41424L11 11.5858L15.4582 7.12759ZM12.4142 13L16.8725 8.5418C18.8221 10.8153 20 13.7701 20 17V20.5858L12.4142 13ZM5.41424 16H6.58582L4.58581 18H3.41424L5.41424 16ZM8.00003 18.5858L6.00003 20.5858V19.4142L8.00003 17.4142V18.5858Z" fill="currentColor"></path> </g></svg>`,
    siege: `<svg viewBox="0 0 512 512" fill="currentColor"><path d="M511.739,209.093L485.904,96.418c-1.082-4.723-4.763-6.418-6.295-6.927c-0.659-0.22-1.768-0.5-3.11-0.5 c-1.781,0-3.973,0.495-6.081,2.282l-16.449,13.961c-1.562,1.325-3.465,2.182-5.492,2.472l-14.677,2.103l25.207,109.933 l14.128-4.503c1.95-0.622,4.039-0.679,6.02-0.167l20.889,5.399c4.699,1.214,7.892-1.275,9.048-2.4 C510.247,216.946,512.823,213.817,511.739,209.093z"></path> </g> </g> <g> <g> <path d="M412.209,112.902l-306.747,43.941c-23.801,3.251-44.372,15.886-57.992,35.588c-11.381,16.464-16.404,35.726-14.633,55.235 l-20.176,4.627c-0.396,0.09-0.776,0.21-1.157,0.328c-8.089,2.488-13.01,10.826-11.089,19.206 c1.731,7.55,8.446,12.662,15.875,12.662c1.206,0,2.432-0.135,3.658-0.416l0.263-0.06l21.665-4.969 c5.99,11.692,14.631,21.757,25.453,29.547c-0.003-0.363-0.014-0.724-0.014-1.087c0-75.674,61.566-137.24,137.24-137.24 c58.915,0,109.273,37.318,128.691,89.555l104.977-33.456L412.209,112.902z"></path> </g> </g> <g> <g> <path d="M204.557,192c-63.69,0-115.504,51.815-115.504,115.504s51.815,115.505,115.504,115.505s115.504-51.815,115.504-115.505 S268.246,192,204.557,192z M204.557,368.187c-33.461,0-60.682-27.223-60.682-60.682c0-33.46,27.221-60.682,60.682-60.682 c33.461,0,60.684,27.223,60.684,60.682C265.24,340.965,238.018,368.187,204.557,368.187z"></path> </g> </g> <g> <g> <path d="M204.557,268.558c-21.474,0-38.946,17.472-38.946,38.946c0,21.476,17.472,38.946,38.946,38.946 c21.476,0,38.946-17.472,38.946-38.946C243.503,286.03,226.032,268.558,204.557,268.558z"></path> </g> </g> </g></svg>`
};

const dropdownRowIconMap = {
    melee: '🗡️',
    ranged: '🏹',
    siege: '⚙️'
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

function executePowerRelease(player, triggeringCard) {
    const targetIds = Array.isArray(triggeringCard.transformTargetId) ? triggeringCard.transformTargetId : [triggeringCard.transformTargetId];
    
    if (!targetIds || targetIds.length === 0) {
        addLogEntry(`Karta ${triggeringCard.name} nie ma określonego celu transformacji.`);
        return;
    }

    addLogEntry(`${player.name} uwalnia moc za pomocą ${triggeringCard.name}!`);
    let transformedCount = 0;

    ['melee', 'ranged', 'siege'].forEach(rowType => {
        const newRow = [];
        player.board[rowType].forEach(card => {
            if (card.abilities && card.abilities.includes('Moc') && targetIds.includes(card.baseId) && card.transformId) {
                const transformedCardInfo = getCardDetailsById(card.transformId);
                if (transformedCardInfo) {
                    addLogEntry(`${card.name} transformuje w ${transformedCardInfo.name}!`);
                    const newCard = { ...transformedCardInfo, instanceId: Date.now() + Math.random() };
                    newRow.push(newCard);
                    transformedCount++;
                } else {
                    newRow.push(card);
                }
            } else {
                newRow.push(card);
            }
        });
        player.board[rowType] = newRow;
    });

    if (transformedCount === 0) {
        addLogEntry("...ale nie znaleziono odpowiednich celów do transformacji.");
    }
}

function executeGlobalPowerRelease(player) {
    addLogEntry(`${player.name} uwalnia moc wszystkich swoich jednostek!`);
    let transformedCount = 0;

    ['melee', 'ranged', 'siege'].forEach(rowType => {
        const newRow = [];
        player.board[rowType].forEach(card => {
            if (card.abilities && card.abilities.includes('Moc') && card.transformId) {
                const transformedCardInfo = getCardDetailsById(card.transformId);
                if (transformedCardInfo) {
                    addLogEntry(`${card.name} transformuje w ${transformedCardInfo.name}!`);
                    const newCard = { ...transformedCardInfo, instanceId: card.instanceId };
                    newRow.push(newCard);
                    transformedCount++;
                } else {
                    newRow.push(card);
                }
            } else {
                newRow.push(card);
            }
        });
        player.board[rowType] = newRow;
    });

    if (transformedCount === 0) {
        addLogEntry("...ale nie znaleziono żadnych celów do transformacji.");
    }
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
            player.board[rowType].forEach(card => {
                delete card.currentPower;
            });
        });
    });

    [players.player1, players.player2].forEach(player => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            const unleasherInRow = player.board[rowType].find(c => c.abilities && c.abilities.includes('Wyzwolenie siły'));
            const unleasherInHorn = player.board.horns[rowType];
            let powerUnleasher = unleasherInRow;
            
            if (!powerUnleasher && unleasherInHorn && unleasherInHorn.abilities && unleasherInHorn.abilities.includes('Wyzwolenie siły')) {
                powerUnleasher = unleasherInHorn;
            }

            if (powerUnleasher) {
                const targetIds = Array.isArray(powerUnleasher.transformTargetId) ? powerUnleasher.transformTargetId : [triggeringCard.transformTargetId];
                
                player.board[rowType].forEach((card, index) => {
                    if (!card.isTransformed && card.abilities && card.abilities.includes('Moc') && targetIds.includes(card.baseId) && card.transformId) {
                        const transformedCardInfo = getCardDetailsById(card.transformId);
                        if (transformedCardInfo) {
                            addLogEntry(`${card.name} transformuje w ${transformedCardInfo.name} pod wpływem ${powerUnleasher.name}!`);
                            player.board[rowType][index] = { 
                                ...transformedCardInfo, 
                                instanceId: card.instanceId,
                                isTransformed: true 
                            };
                        }
                    }
                });
            }
        });
    });

    const isGlobalSpyBoostActive = players.player1.commander?.spyBoostActive || players.player2.commander?.spyBoostActive;

    [players.player1, players.player2].forEach(player => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            player.domElements[rowType + 'Row'].classList.remove('frost-effect', 'fog-effect', 'rain-effect', 'fear-effect');
            
            let isHornActive = !!player.board.horns[rowType];
            if (isHornActive && player.board.horns[rowType].abilities && player.board.horns[rowType].abilities.includes('Wyzwolenie siły')) {
                isHornActive = false;
            }
            
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
                if (card.type === 'Unit' && !card.isHero && card.name !== 'Wabik') {
                    let power = card.power;
                    if (activeWeatherRows.has(rowType)) {
                        if (player.commander && player.commander.abilities && player.commander.abilities.includes('leader_weather_resistance')) {
                            power = Math.ceil(power / 2);
                        } else {
                            power = 1;
                        }
                    }
                    
                    if (isGlobalSpyBoostActive && card.abilities && card.abilities.includes('spy')) {
                        power *= 2;
                    }

                    const baseIdForBond = card.baseId || card.id.split('_')[0];
                    if (card.abilities && card.abilities.includes('tight_bond') && bondGroups[baseIdForBond] && bondGroups[baseIdForBond].length > 1) {
                        power *= bondGroups[baseIdForBond].length;
                    }
                    
                    if (moraleBoostValue > 0) {
                        power += moraleBoostValue;
                        if (card.abilities && card.abilities.includes('morale_boost')) {
                            power -= 1;
                        }
                    }
                    
                    if (isHornActive) { power *= 2; }
                    
                    if (power !== card.power) {
                        card.currentPower = power;
                    }
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
            const cardElement = createCardElement(card);
            if (isMonsterAbilityActive && player === monsterPlayerToChoose && !card.isHero && !card.isToken) {
                cardElement.classList.add('targetable');
            }
            rowElement.appendChild(cardElement);
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

    if (card.imageUrl) {
        cardDiv.style.backgroundImage = `url('${card.imageUrl}')`;
    } else {
        if (card.faction) {
            cardDiv.classList.add(`faction-${card.faction.toLowerCase().replace(/\s+/g, '-')}`);
        }
    }

    if (card.isHero) cardDiv.classList.add('hero-card');

    if (card.type !== 'Unit') {
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


function populateAvailableCardsSelect(player, filterType = null) {
    const select = player.domElements.cardSelect;
    const previouslySelected = select.value;
    select.innerHTML = '<option value="">-- Wybierz kartę z puli --</option>';
    
    let cardsToShow = player.availableCards;
    if (filterType) {
        cardsToShow = player.availableCards.filter(card => card.type === filterType);
    }

    cardsToShow.sort((a, b) => a.name.localeCompare(b.name)).forEach(card => {
        let optionText = card.name;
        
        if (card.type === 'Unit') {
            optionText += ` (${card.power})`;
        }
        
        let icons = '';
        if (card.row) {
            if (Array.isArray(card.row)) {
                icons += card.row.map(r => dropdownRowIconMap[r] || '').join('');
            } else {
                icons += dropdownRowIconMap[card.row] || '';
            }
        }

        if (card.abilities) {
            icons += ' ' + card.abilities.map(ab => abilityIconMap[ab] || '❓').join(' ');
        }

        if (icons) {
            optionText += ` | ${icons.trim()}`;
        }
        
        select.add(new Option(optionText, card.id));
    });
    select.value = previouslySelected;
}

function populateGraveyardSelect(player) {
    const select = player.domElements.graveyardSelect;
    select.innerHTML = `<option value="">-- Cmentarz --</option>`;

    if ((isBanditsAbilityActive && player === banditsPlayerToChoose) || (isOpponentGraveyardDrawModeActive && player === opponentGraveyardDrawPlayer) || (isDoubleMedicActive && doubleMedicStage === 2 && player === doubleMedicPlayer)) {
        const opponent = (player === players.player1) ? players.player2 : players.player1;
        select.disabled = false;
        select.innerHTML = '<option value="">-- Wybierz kartę --</option>';
        opponent.graveyard.forEach(card => {
            const option = new Option(`${card.name} (${card.type}, ${card.power || ''})`, card.id);
            if (card.isHero || (isDoubleMedicActive && card.type !== 'Unit')) { 
                option.disabled = true;
            }
            select.add(option);
        });
    } else if ((isMedicModeActive || isOrcsAbilityActive || isGraveyardDrawModeActive || (isDoubleMedicActive && doubleMedicStage === 1 && player === doubleMedicPlayer)) && activePlayer === player) {
        select.disabled = false;
        select.innerHTML = '<option value="">-- Wybierz cel --</option>';
        player.graveyard.forEach(card => {
            const option = new Option(`${card.name} (${card.type}, ${card.power || ''})`, card.id);
            if ((isMedicModeActive || isDoubleMedicActive) && (card.type !== 'Unit' || card.isHero || card.name === 'Wabik')) {
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
        if (isFactionAbilitySetupInProgress) {
            processFactionAbilityQueue();
        } else if (!isFirstMoveOfRound) {
            switchActivePlayer();
        }
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
            if (isFactionAbilitySetupInProgress) {
                processFactionAbilityQueue();
            } else if (!isFirstMoveOfRound) {
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
        if (isFactionAbilitySetupInProgress) {
            processFactionAbilityQueue();
        } else if (!isFirstMoveOfRound) {
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
    const { cardSelect, rowSelect, playCardButton, passRoundButton, activateLeaderButton, graveyardSelect, factionAbilityButton } = player.domElements;

    passRoundButton.textContent = 'Pasuj';
    if (factionAbilityButton) {
        factionAbilityButton.style.display = 'none';
        factionAbilityButton.disabled = true;
        factionAbilityButton.title = '';
    }

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

    if ((isMedicModeActive || isOrcsAbilityActive || isBanditsAbilityActive || isGraveyardDrawModeActive || isOpponentGraveyardDrawModeActive || isDoubleMedicActive) && player === activePlayer) {
        cardSelect.disabled = true;
        rowSelect.disabled = true;
        playCardButton.style.display = 'none';
        passRoundButton.disabled = true; 
        activateLeaderButton.disabled = true;
        populateGraveyardSelect(player);
        
        if (isOrcsAbilityActive && player === orcsPlayerToChoose) {
            passRoundButton.textContent = 'Zatwierdź wybór';
            passRoundButton.disabled = false;
        }
        return;
    }
    
    if (isLeaderAgileMoveActive && player === activePlayer) {
        cardSelect.style.display = 'none';
        graveyardSelect.style.display = 'none';
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;

        rowSelect.disabled = false;
        rowSelect.innerHTML = '<option value="">-- Wybierz Rząd --</option>';
        ['melee', 'ranged', 'siege'].forEach(rowKey => {
            rowSelect.add(new Option(translateRowName(rowKey), rowKey));
        });

        playCardButton.textContent = "Przenieś";
        playCardButton.disabled = !rowSelect.value;
        return;
    } else {
        cardSelect.style.display = 'block';
        graveyardSelect.style.display = 'block';
        playCardButton.textContent = 'Zagraj Kartę';
    }

    if (passedPlayers.includes(player) || (isDecoyModeActive && player !== activePlayer)) {
        cardSelect.disabled = true;
        passRoundButton.disabled = true;
        activateLeaderButton.disabled = true;
        return;
    }

    let isPlayerTurn = isFirstMoveOfRound || (player === activePlayer);
    
    const opponent = (player === players.player1) ? players.player2 : players.player1;
    const isLeaderAbilityBlockedByOpponent = opponent.commander && opponent.commander.abilities && opponent.commander.abilities.includes('leader_cancel_opponent_ability');
    const isOwnLeaderAbilityPassive = player.commander && player.commander.abilities && (player.commander.abilities.includes('leader_cancel_opponent_ability') || player.commander.abilities.includes('leader_weather_resistance'));
    
    let isLeaderHornSlotOccupied = false;
    if (player.commander && player.commander.abilities) {
        const ability = player.commander.abilities[0];
        let targetRow = null;
        if (ability === 'leader_melee_boost') targetRow = 'melee';
        if (ability === 'leader_ranged_boost') targetRow = 'ranged';
        if (ability === 'leader_siege_boost') targetRow = 'siege';
        if (targetRow && player.board.horns[targetRow]) {
            isLeaderHornSlotOccupied = true;
        }
    }

    cardSelect.disabled = !isPlayerTurn;
    passRoundButton.disabled = !isPlayerTurn;
    activateLeaderButton.disabled = !isPlayerTurn || 
                                (player.commander && player.commanderAbilityUsedThisGame) || 
                                isLeaderAbilityBlockedByOpponent || 
                                isOwnLeaderAbilityPassive ||
                                isLeaderHornSlotOccupied;
    
    if (isLeaderAbilityBlockedByOpponent) {
        activateLeaderButton.title = "Zdolność zablokowana przez lidera przeciwnika";
    } else if (isOwnLeaderAbilityPassive) {
        activateLeaderButton.title = player.commander.description;
    } else if (isLeaderHornSlotOccupied) {
        activateLeaderButton.title = "Nie można użyć, róg jest już w tym rzędzie.";
    } else {
        activateLeaderButton.title = "";
    }
    
    if (factionAbilityButton) {
        switch(player.faction) {
            case 'Klasztor':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.disabled = !isPlayerTurn || player.factionAbilityUsedThisGame;
                factionAbilityButton.title = 'Pomiń turę bez pasowania (raz na grę).';
                break;
            case 'Khorinis':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.title = 'Zdolność pasywna: Wygrywasz rundę w przypadku remisu.';
                break;
            case 'Potwory':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.title = 'Zdolność pasywna: Po przegranej rundzie, jedna jednostka zostaje na planszy.';
                break;
            case 'Orkowie':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.title = 'Zdolność pasywna: Na początku 3 rundy, 3 jednostki wracają z cmentarza.';
                break;
            case 'Bandyci':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.title = 'Zdolność pasywna: Po przegranej rundzie dobierz 1 kartę z cmentarza wroga.';
                break;
            case 'Najemnicy':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.title = 'Zdolność pasywna: Możliwość wymiany jednej karty więcej na starcie gry.';
                break;
            case 'Nieumarli':
                factionAbilityButton.style.display = 'inline-block';
                factionAbilityButton.title = 'Zdolność pasywna: Dobór 1 losowej karty z talii po wygranej rundzie.';
                break;
        }
    }

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
        if (isMonsterAbilityActive || isOrcsAbilityActive || isBanditsAbilityActive) return;
        if (isMedicModeActive) { action(); return; }
        if (isDecoyModeActive) { action(); return; }
        if (!isFirstMoveOfRound && (player !== activePlayer || passedPlayers.includes(player))) { return; }
        if (isFirstMoveOfRound && passedPlayers.includes(player)) return;
    }
    
    const actionSucceeded = action();
    
    if (!actionSucceeded) { return updateAllControls(); }
    if (isFirstMoveOfRound) { isFirstMoveOfRound = false; activePlayer = player; }
    
    if (isMedicModeActive || isDecoyModeActive || isOrcsAbilityActive || isBanditsAbilityActive || isGraveyardDrawModeActive || isOpponentGraveyardDrawModeActive || isDoubleMedicActive || isLeaderAgileMoveActive || isLeaderWeatherActive) { return updateAllControls(); }

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
            addLogEntry(`${player.name} zagrał ${cardInstance.name}.`);
            if (cardInstance.name === 'Światło') {
                weatherCardsOnBoard = [];
                player.graveyard.push(cardInstance);
            } else {
                const existingWeather = weatherCardsOnBoard.find(c => c.effectClass === cardInstance.effectClass);
                if (existingWeather) {
                    addLogEntry(`Efekt ${cardInstance.name} jest już aktywny. Karta trafia na cmentarz.`);
                    player.graveyard.push(cardInstance);
                } else {
                    weatherCardsOnBoard.push(cardInstance);
                }
            }
        } else if (cardInstance.type === 'Unit') {
            player.board[targetRow].push(cardInstance);
            addLogEntry(`${player.name} zagrał ${cardInstance.name} do rzędu ${translateRowName(targetRow)}.`);
            
            if (hasAbilities) {
                if (cardInstance.abilities.includes('muster')) {
                    const musterId = cardInstance.baseId;
                    if (musterId) {
                        let cardsToSummon = player.availableCards.filter(card => card.baseId === musterId);
                        if (cardInstance.musterRole === 'slug') {
                            cardsToSummon = cardsToSummon.filter(card => card.musterRole !== 'master');
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
                if (player.board.horns[targetRow]) {
                    addLogEntry(`Róg już jest w tym rzędzie!`);
                    player.availableCards.push(cardData);
                    return false;
                }
                player.board.horns[targetRow] = { ...cardInstance };
                shouldGoToGraveyard = false;
            }
            
            if (hasAbilities && cardInstance.abilities.includes('scorch_strongest')) {
                executeGlobalScorch();
            }
            
            if (hasAbilities && cardInstance.abilities.includes('Wyzwolenie siły')) {
                executePowerRelease(player, cardInstance);
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
    if (isOrcsAbilityActive && player === orcsPlayerToChoose) {
        finalizeOrcsSelection(player);
        return;
    }

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
        if (!player.commander || player.commanderAbilityUsedThisGame) return false;
        
        const ability = player.commander.abilities[0];
        addLogEntry(`${player.name} aktywuje zdolność dowódcy: ${player.commander.name}!`);
        
        let targetRow;
        let weatherCardId;
        let scorchRow;

        switch (ability) {
            case 'leader_melee_boost':
                targetRow = 'melee';
                break;
            case 'leader_ranged_boost':
                targetRow = 'ranged';
                break;
            case 'leader_siege_boost':
                targetRow = 'siege';
                break;
            case 'leader_play_frost':
                weatherCardId = 'biting_frost_1';
                break;
            case 'leader_play_fog':
                weatherCardId = 'impenetrable_fog_1';
                break;
            case 'leader_play_rain':
                weatherCardId = 'torrential_rain_1';
                break;
            case 'leader_play_fear':
                weatherCardId = 'fear_sower_1';
                break;
            case 'leader_clear_weather':
                weatherCardsOnBoard = [];
                addLogEntry('Wszystkie efekty pogodowe zostały usunięte.');
                break;
            case 'leader_destroy_opponent_graveyard':
                const opponent = (player === players.player1) ? players.player2 : players.player1;
                opponent.graveyard = [];
                addLogEntry(`${player.name} niszczy cmentarz przeciwnika!`);
                break;
            case 'leader_unleash_all_power':
                executeGlobalPowerRelease(player);
                break;
            case 'leader_scorch_melee':
                scorchRow = 'melee';
                break;
            case 'leader_scorch_ranged':
                scorchRow = 'ranged';
                break;
            case 'leader_scorch_siege':
                scorchRow = 'siege';
                break;
            case 'leader_spy_boost':
                player.commander.spyBoostActive = true;
                addLogEntry(`${player.name} wzmacnia wszystkich szpiegów na planszy!`);
                break;
            case 'leader_draw_from_graveyard':
                isGraveyardDrawModeActive = true;
                graveyardDrawPlayer = player;
                addLogEntry(`${player.name} przygotowuje się do wyciągnięcia karty ze swojego cmentarza.`);
                break;
            case 'leader_draw_from_opponent_graveyard':
                isOpponentGraveyardDrawModeActive = true;
                opponentGraveyardDrawPlayer = player;
                addLogEntry(`${player.name} przygotowuje się do wyciągnięcia karty z cmentarza przeciwnika.`);
                break;
            case 'leader_double_medic':
                isDoubleMedicActive = true;
                doubleMedicPlayer = player;
                doubleMedicStage = 1;
                addLogEntry(`${player.name} rozpoczyna podwójne wskrzeszenie.`);
                break;
            case 'leader_agile_move':
                isLeaderAgileMoveActive = true;
                leaderAgileMovePlayer = player;
                addLogEntry(`${player.name} przygotowuje się do przegrupowania zwinnych jednostek.`);
                break;
            case 'leader_play_any_weather':
                isLeaderWeatherActive = true;
                leaderWeatherPlayer = player;
                addLogEntry(`${player.name} przygotowuje się do zagrania karty pogodowej.`);
                break;
            case 'leader_simulate_use':
                addLogEntry(`${player.name} symuluje użycie zdolności.`);
                break;
            default:
                if (!player.commander.abilities.includes('leader_cancel_opponent_ability')) {
                     alert(`Zdolność dowódcy "${ability}" nie została jeszcze zaimplementowana.`);
                     return false;
                }
        }

        if (targetRow) {
            if (player.board.horns[targetRow]) {
                alert("Nie można użyć zdolności, róg jest już w tym rzędzie!");
                return false;
            }
            const hornCardInfo = getCardDetailsById('commanders_horn_1'); 
            if (!hornCardInfo) {
                console.error("Nie znaleziono karty Róg Dowódcy w allCards.");
                return false;
            }
            player.board.horns[targetRow] = { ...hornCardInfo, instanceId: Date.now() + Math.random() };
            addLogEntry(`Dowódca umieszcza Róg wojenny w rzędzie ${translateRowName(targetRow)}!`);
        }

        if (weatherCardId) {
            const weatherCardInfo = getCardDetailsById(weatherCardId);
            if (weatherCardInfo) {
                const existingWeather = weatherCardsOnBoard.find(c => c.effectClass === weatherCardInfo.effectClass);
                if (existingWeather) {
                    addLogEntry(`Efekt ${weatherCardInfo.name} jest już aktywny! Zdolność została zużyta.`);
                } else {
                    weatherCardsOnBoard.push(weatherCardInfo);
                    addLogEntry(`Dowódca przywołuje ${weatherCardInfo.name}!`);
                }
            } else {
                console.error(`Nie znaleziono karty pogody o ID: ${weatherCardId}`);
                return false;
            }
        }

        if (scorchRow) {
            executeRowScorch(player, scorchRow);
        }

        player.commanderAbilityUsedThisGame = true;
        return true;
    });
}

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
        lastRoundLoser = loser;
    } else {
        const p1IsKhorinis = players.player1.faction === 'Khorinis';
        const p2IsKhorinis = players.player2.faction === 'Khorinis';

        if (p1IsKhorinis && !p2IsKhorinis) {
            addLogEntry(`Remis! ${players.player1.name} wygrywa dzięki zdolności frakcji Khorinis!`);
            players.player2.crystalCount--;
            lastRoundLoser = players.player2;
        } else if (p2IsKhorinis && !p1IsKhorinis) {
            addLogEntry(`Remis! ${players.player2.name} wygrywa dzięki zdolności frakcji Khorinis!`);
            players.player1.crystalCount--;
            lastRoundLoser = players.player1;
        } else {
            addLogEntry(`Remis!`);
            players.player1.crystalCount--;
            players.player2.crystalCount--;
            lastRoundLoser = null;
        }
    }

    nextRoundSummonsQueue = [];
    [players.player1, players.player2].forEach(p => {
        ['melee', 'ranged', 'siege'].forEach(rowType => {
            p.board[rowType].forEach(card => {
                if (card.abilities && card.abilities.includes('summon_next_round') && card.nextRoundSummonId) {
                    nextRoundSummonsQueue.push({ owner: p, summonId: card.nextRoundSummonId, summonerRow: rowType });
                }
            });
        });
    });
    
    if (checkGameOver()) return;

    triggerEndOfRoundAbilities();
}

function checkGameOver() {
    let winner = null;
    if (players.player1.crystalCount <= 0 && players.player2.crystalCount <= 0) { winner = 'Remis'; }
    else if (players.player1.crystalCount <= 0) { winner = players.player2; }
    else if (players.player2.crystalCount <= 0) { winner = players.player1; }
    if (winner) {
        showGameOverScreen(winner);
        return true;
    }
    return false;
}

function showGameOverScreen(winner) {
    gameOverOverlay.style.display = 'flex';
    winnerMessage.textContent = winner === 'Remis' ? "Remis!" : `Wygrywa ${winner.name}!`;
    newGameButton.style.display = 'inline-block';
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

    copyHistoryButton.addEventListener('click', () => {
        const range = document.createRange();
        range.selectNode(historyLog);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        copyNotification.classList.add('show');
        setTimeout(() => {
            copyNotification.classList.remove('show');
        }, 2000);
    });

    newGameButton.addEventListener('click', () => {
        location.reload();
    });

    // --- Gracz 1 ---
    players.player1.domElements.playCardButton.addEventListener('click', () => {
        if (isLeaderAgileMoveActive && activePlayer === players.player1) {
            const selectedRow = players.player1.domElements.rowSelect.value;
            if (selectedRow) {
                executeLeaderAgileMove(players.player1, selectedRow);
            }
        } else {
            playCard(players.player1);
        }
    });
    players.player1.domElements.passRoundButton.addEventListener('click', () => passRound(players.player1));
    players.player1.domElements.activateLeaderButton.addEventListener('click', () => activateLeaderAbility(players.player1));
    if (players.player1.domElements.factionAbilityButton) {
        players.player1.domElements.factionAbilityButton.addEventListener('click', () => activateFactionAbility(players.player1));
    }
    players.player1.domElements.cardSelect.addEventListener('change', () => { 
        deactivateDecoyMode(); 
        updatePlayerControlsVisibility(players.player1); 
    });
    players.player1.domElements.graveyardSelect.addEventListener('change', (event) => { 
        if (isGraveyardDrawModeActive && graveyardDrawPlayer === players.player1) {
            executeGraveyardDraw(players.player1, event.target.value);
        } else if (isOpponentGraveyardDrawModeActive && opponentGraveyardDrawPlayer === players.player1) {
            executeOpponentGraveyardDraw(players.player1, event.target.value);
        } else if (isDoubleMedicActive && doubleMedicPlayer === players.player1) {
            executeDoubleMedic(players.player1, event.target.value);
        } else if (isBanditsAbilityActive && banditsPlayerToChoose === players.player1) {
            finalizeBanditsSelection(players.player1, event.target.value);
        } else if (isOrcsAbilityActive && orcsPlayerToChoose === players.player1) {
            executeOrcsAbility(players.player1, event.target.value);
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
    players.player2.domElements.playCardButton.addEventListener('click', () => {
        if (isLeaderAgileMoveActive && activePlayer === players.player2) {
            const selectedRow = players.player2.domElements.rowSelect.value;
            if (selectedRow) {
                executeLeaderAgileMove(players.player2, selectedRow);
            }
        } else {
            playCard(players.player2);
        }
    });
    players.player2.domElements.passRoundButton.addEventListener('click', () => passRound(players.player2));
    players.player2.domElements.activateLeaderButton.addEventListener('click', () => activateLeaderAbility(players.player2));
    if (players.player2.domElements.factionAbilityButton) {
        players.player2.domElements.factionAbilityButton.addEventListener('click', () => activateFactionAbility(players.player2));
    }
    players.player2.domElements.cardSelect.addEventListener('change', () => { 
        deactivateDecoyMode(); 
        updatePlayerControlsVisibility(players.player2); 
    });
    players.player2.domElements.graveyardSelect.addEventListener('change', (event) => { 
        if (isGraveyardDrawModeActive && graveyardDrawPlayer === players.player2) {
            executeGraveyardDraw(players.player2, event.target.value);
        } else if (isOpponentGraveyardDrawModeActive && opponentGraveyardDrawPlayer === players.player2) {
            executeOpponentGraveyardDraw(players.player2, event.target.value);
        } else if (isDoubleMedicActive && doubleMedicPlayer === players.player2) {
            executeDoubleMedic(players.player2, event.target.value);
        } else if (isBanditsAbilityActive && banditsPlayerToChoose === players.player2) {
            finalizeBanditsSelection(players.player2, event.target.value);
        } else if (isOrcsAbilityActive && orcsPlayerToChoose === players.player2) {
            executeOrcsAbility(players.player2, event.target.value);
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

// ==================================================================
// === ZDOLNOŚCI FRAKCJI
// ==================================================================

function activateFactionAbility(player) {
    if (player.faction === 'Klasztor' && !player.factionAbilityUsedThisGame) {
        handlePlayerAction(player, () => {
            addLogEntry(`${player.name} używa medytacji i przeczekuje turę.`);
            player.factionAbilityUsedThisGame = true;
            switchActivePlayer();
            return false;
        }, true);
    }
}

function activateMonsterAbilitySelection(player) {
    updateAllControls();
}

function executeMonsterAbility(player, cardToKeep) {
    addLogEntry(`${player.name} wybrał kartę ${cardToKeep.name}, która pozostanie na planszy.`);
    cardToKeep.isKeptByFaction = true;
    isMonsterAbilityActive = false;
    monsterPlayerToChoose = null;
    
    document.querySelectorAll('.targetable').forEach(el => el.classList.remove('targetable'));

    processEndOfRoundAbilityQueue();
}

function finalizeOrcsSelection(player) {
    if (!isOrcsAbilityActive || player !== orcsPlayerToChoose) return;

    addLogEntry(`${player.name} zakończył wybór wojowników.`);
    let medicChainTriggered = false;

    if (orcsCardsToKeep.length > 0) {
        addLogEntry(`${player.name} wzywa posiłki!`);
        orcsCardsToKeep.forEach(card => {
            const cardInstance = { ...card, instanceId: Date.now() + Math.random() };
            const targetRow = Array.isArray(card.row) ? card.row[0] : card.row;
            
            player.board[targetRow].push(cardInstance);
            addLogEntry(`- ${card.name} dołącza do armii!`);

            if (!medicChainTriggered && cardInstance.abilities && cardInstance.abilities.includes('medic')) {
                const hasValidTargets = player.graveyard.some(c => c.type === 'Unit' && !c.isHero && c.name !== 'Wabik');
                if (hasValidTargets) {
                    isMedicModeActive = true;
                    medicChainTriggered = true;
                    addLogEntry(`${cardInstance.name} aktywuje swoją zdolność medyka!`);
                }
            }
        });
    }

    isOrcsAbilityActive = false;
    orcsPlayerToChoose = null;
    orcsCardsToKeep = [];
    
    if (!medicChainTriggered) {
        processFactionAbilityQueue();
    } else {
        updateAllControls();
    }
}


function executeOrcsAbility(player, cardId) {
    if (orcsCardsToKeep.length >= 3) return;

    const cardIndex = player.graveyard.findIndex(c => c.id === cardId);
    if (cardIndex > -1) {
        const [selectedCard] = player.graveyard.splice(cardIndex, 1);
        orcsCardsToKeep.push(selectedCard);
        addLogEntry(`${player.name} wybrał wojownika: ${selectedCard.name}. Wybrano ${orcsCardsToKeep.length}/3.`);
        
        if (orcsCardsToKeep.length === 3) {
            finalizeOrcsSelection(player);
        } else {
            updateAllControls();
        }
    }
}

function finalizeBanditsSelection(player, cardId) {
    if (!isBanditsAbilityActive || player !== banditsPlayerToChoose) return;

    const opponent = (player === players.player1) ? players.player2 : players.player1;
    const cardIndex = opponent.graveyard.findIndex(c => c.id === cardId);
    if (cardIndex > -1) {
        const [stolenCard] = opponent.graveyard.splice(cardIndex, 1);
        player.availableCards.push(stolenCard);
        addLogEntry(`${player.name} kradnie kartę ${stolenCard.name} z cmentarza przeciwnika!`);
    }

    isBanditsAbilityActive = false;
    banditsPlayerToChoose = null;
    lastRoundLoser = null;

    startNewRoundSequence();
}

function executeGraveyardDraw(player, cardId) {
    if (!isGraveyardDrawModeActive || player !== graveyardDrawPlayer) return;

    if (!cardId) {
        addLogEntry(`${player.name} anulował wybór karty z cmentarza.`);
        isGraveyardDrawModeActive = false;
        graveyardDrawPlayer = null;
        switchActivePlayer();
        return;
    }

    const cardIndex = player.graveyard.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const [drawnCard] = player.graveyard.splice(cardIndex, 1);
    player.availableCards.push(drawnCard);
    addLogEntry(`${player.name} pobrał kartę ${drawnCard.name} ze swojego cmentarza.`);

    isGraveyardDrawModeActive = false;
    graveyardDrawPlayer = null;
    
    switchActivePlayer();
}

function executeOpponentGraveyardDraw(player, cardId) {
    if (!isOpponentGraveyardDrawModeActive || player !== opponentGraveyardDrawPlayer) return;

    const opponent = (player === players.player1) ? players.player2 : players.player1;

    if (!cardId) {
        addLogEntry(`${player.name} anulował wybór karty z cmentarza przeciwnika.`);
        isOpponentGraveyardDrawModeActive = false;
        opponentGraveyardDrawPlayer = null;
        switchActivePlayer();
        return;
    }

    const cardIndex = opponent.graveyard.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const [drawnCard] = opponent.graveyard.splice(cardIndex, 1);
    player.availableCards.push(drawnCard);
    addLogEntry(`${player.name} pobrał kartę ${drawnCard.name} z cmentarza przeciwnika.`);

    isOpponentGraveyardDrawModeActive = false;
    opponentGraveyardDrawPlayer = null;
    
    switchActivePlayer();
}

function executeDoubleMedic(player, cardId) {
    if (!isDoubleMedicActive || player !== doubleMedicPlayer) return;

    if (!cardId) {
        addLogEntry(`${player.name} anulował wskrzeszenie.`);
        isDoubleMedicActive = false;
        doubleMedicPlayer = null;
        doubleMedicStage = 0;
        switchActivePlayer();
        return;
    }

    if (doubleMedicStage === 1) {
        const cardIndex = player.graveyard.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const [resurrectedCard] = player.graveyard.splice(cardIndex, 1);
        const cardInstance = { ...resurrectedCard, instanceId: Date.now() + Math.random() };
        const targetRow = Array.isArray(cardInstance.row) ? cardInstance.row[0] : cardInstance.row;
        player.board[targetRow].push(cardInstance);
        addLogEntry(`${player.name} wskrzesił ${cardInstance.name} dla siebie.`);
        
        doubleMedicStage = 2;
        addLogEntry(`${player.name}, wybierz kartę z cmentarza przeciwnika.`);
        updateAllControls();

    } else if (doubleMedicStage === 2) {
        const opponent = (player === players.player1) ? players.player2 : players.player1;
        const cardIndex = opponent.graveyard.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const [resurrectedCard] = opponent.graveyard.splice(cardIndex, 1);
        const cardInstance = { ...resurrectedCard, instanceId: Date.now() + Math.random() };
        const targetRow = Array.isArray(cardInstance.row) ? cardInstance.row[0] : cardInstance.row;
        opponent.board[targetRow].push(cardInstance);
        addLogEntry(`${player.name} wskrzesił ${cardInstance.name} dla przeciwnika.`);

        isDoubleMedicActive = false;
        doubleMedicPlayer = null;
        doubleMedicStage = 0;
        
        switchActivePlayer();
    }
}

function executeLeaderAgileMove(player, targetRow) {
    handlePlayerAction(player, () => {
        addLogEntry(`${player.name} przegrupowuje swoje zwinne jednostki do rzędu ${translateRowName(targetRow)}.`);
        let movedCount = 0;

        ['melee', 'ranged', 'siege'].forEach(sourceRowType => {
            if (sourceRowType === targetRow) return;

            const cardsToMove = [];
            const remainingCards = [];

            player.board[sourceRowType].forEach(card => {
                if (card.abilities && card.abilities.includes('agile') && Array.isArray(card.row) && card.row.includes(targetRow)) {
                    cardsToMove.push(card);
                } else {
                    remainingCards.push(card);
                }
            });

            if (cardsToMove.length > 0) {
                player.board[sourceRowType] = remainingCards;
                player.board[targetRow].push(...cardsToMove);
                movedCount += cardsToMove.length;
            }
        });

        if (movedCount > 0) {
            addLogEntry(`Przeniesiono ${movedCount} jednostek.`);
        } else {
            addLogEntry(`Brak jednostek do przeniesienia.`);
        }

        player.commanderAbilityUsedThisGame = true;
        isLeaderAgileMoveActive = false;
        leaderAgileMovePlayer = null;

        return true;
    });
}

function triggerEndOfRoundAbilities() {
    endOfRoundAbilityQueue = [];
    [players.player1, players.player2].forEach(p => {
        const hasValidMonsterCards = p.faction === 'Potwory' && 
                                   [...p.board.melee, ...p.board.ranged, ...p.board.siege].some(c => !c.isHero && !c.isToken);
        if (hasValidMonsterCards) {
            endOfRoundAbilityQueue.push(p);
        }
    });
    
    processEndOfRoundAbilityQueue();
}

function processEndOfRoundAbilityQueue() {
    if (endOfRoundAbilityQueue.length > 0) {
        const player = endOfRoundAbilityQueue.shift();
        isMonsterAbilityActive = true;
        monsterPlayerToChoose = player;
        addLogEntry(`${player.name}, twoja zdolność frakcyjna pozwala ci zachować jedną jednostkę. Wybierz którą.`);
        updateAllControls();
    } else {
        proceedToNextRound();
    }
}

function proceedToNextRound() {
    [players.player1, players.player2].forEach(p => {
        if (p.faction !== 'Klasztor') {
             p.factionAbilityUsed = false;
        }

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
        if (p.commander) {
            p.commander.spyBoostActive = false;
        }
    });
    
    weatherCardsOnBoard = []; 
    passedPlayers = [];
    roundNumber++; 
    isFirstMoveOfRound = true; 
    activePlayer = null;
    
    startNewRoundSequence();
}

function startNewRoundSequence() {
    if (nextRoundSummonsQueue.length > 0) {
        addLogEntry("Na polu bitwy pojawiają się nowe jednostki!");
        nextRoundSummonsQueue.forEach(summon => {
            const cardInfo = getCardDetailsById(summon.summonId);
            if (cardInfo) {
                const newUnit = { ...cardInfo, instanceId: Date.now() + Math.random() };
                const targetRow = Array.isArray(newUnit.row) ? newUnit.row[0] : newUnit.row;
                summon.owner.board[targetRow].push(newUnit);
                addLogEntry(`${summon.owner.name} przywołuje ${newUnit.name}!`);
            }
        });
        nextRoundSummonsQueue = [];
    }

    factionAbilityQueue = [];
    isFactionAbilitySetupInProgress = true;

    const banditPlayer = lastRoundLoser && lastRoundLoser.faction === 'Bandyci' ? lastRoundLoser : null;
    const opponent = banditPlayer ? (banditPlayer === players.player1 ? players.player2 : players.player1) : null;

    if (banditPlayer && opponent && opponent.graveyard.some(c => !c.isHero)) {
        factionAbilityQueue.push({player: banditPlayer, type: 'bandits'});
    }

    if (roundNumber === 3) {
        const orcsPlayers = [players.player1, players.player2].filter(p => 
            p.faction === 'Orkowie' && 
            !p.factionAbilityUsedThisGame &&
            p.graveyard.some(c => c.type === 'Unit' && !c.isHero && !c.isToken)
        );
        orcsPlayers.forEach(p => factionAbilityQueue.push({player: p, type: 'orcs'}));
    }
    
    processFactionAbilityQueue();
}

function processFactionAbilityQueue() {
    if (factionAbilityQueue.length > 0) {
        const abilityToProcess = factionAbilityQueue.shift();
        const player = abilityToProcess.player;

        if (abilityToProcess.type === 'bandits') {
            isBanditsAbilityActive = true;
            banditsPlayerToChoose = player;
            activePlayer = player;
            addLogEntry(`${player.name}, twoja zdolność pozwala ci dobrać kartę z cmentarza wroga.`);
            updateAllControls();
        } else if (abilityToProcess.type === 'orcs') {
            isOrcsAbilityActive = true;
            orcsPlayerToChoose = player;
            activePlayer = player;
            player.factionAbilityUsedThisGame = true;
            addLogEntry(`Rozpoczyna się Runda 3! ${player.name}, twoja zdolność frakcyjna została aktywowana.`);
            addLogEntry(`Wybierz do 3 wojowników z cmentarza, którzy dołączą do armii, a następnie zatwierdź wybór.`);
            updateAllControls();
        }
    } else {
        isFactionAbilitySetupInProgress = false;
        lastRoundLoser = null;
        addLogEntry(`Rozpoczynamy rundę ${roundNumber}!`);
        updateAllControls();
    }
}


// === Inicjalizacja gry ===
setupGame();
setupEventListeners();
