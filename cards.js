const allCards = [
    // === KARTY NEUTRALNE ===
    { id: 'ciri_1', name: 'Ciri', type: 'Unit', power: 15, isHero: true, faction: 'Neutral', row: 'melee' },
    { id: 'geralt_of_rivia_1', name: 'Geralt z Rivii', type: 'Unit', power: 15, isHero: true, faction: 'Neutral', row: 'melee' },
    { id: 'dandelion_1', name: 'Jaskier', type: 'Unit', power: 2, isHero: false, faction: 'Neutral', row: 'melee', abilities: 'morale_boost' },
    { id: 'dandelion_2', name: 'Jaskier', type: 'Unit', power: 2, isHero: false, faction: 'Neutral', row: 'melee', abilities: 'morale_boost' },
    { id: 'zoltan_chivay_1', name: 'Zoltan Chivay', type: 'Unit', power: 5, isHero: false, faction: 'Neutral', row: 'melee', abilities: 'scorch_row' },
    { id: 'avallach_1', name: 'Avallac\'h', type: 'Unit', power: 0, isHero: false, faction: 'Neutral', row: 'melee', abilities: 'spy' },
    { id: 'vesemir_1', name: 'Vesemir', type: 'Unit', power: 6, isHero: false, faction: 'Neutral', row: ['melee', 'ranged'], abilities: ['agile', 'morale_boost'] },
    {
    id: 'wyzwolenie_sily_1',
    name: 'Wyzwolenie siły',
    type: 'Special',
    faction: 'Neutral',
    abilities: ['Wyzwolenie siły'] // <-- Zdolność aktywująca mechanikę
},
    // Przykład karty ze zdolnością "Mściciel"
{
    id: 'golem_1',
    name: 'Golem',
    type: 'Unit',
    power: 3,
    faction: 'Neutral',
    row: 'melee',
    abilities: ['avenger'],
    summons: 'golem_fiend_1', // <-- NOWA WŁAŚCIWOŚĆ: ID karty, którą przyzywa
    isHero: false
},

// Karta-token, przyzywana przez Golema
{
    id: 'golem_fiend_1',
    name: 'Większy Golem',
    type: 'Unit',
    power: 9,
    faction: 'Neutral',
    row: 'melee',
    abilities: [],
    isHero: false,
    isToken: true // <-- NOWA WŁAŚCIWOŚĆ: Oznacza, że karta nie może być w talii startowej
},
    // === KARTY SPECJALNE (NEUTRALNE) ===
    { id: 'scorch_fire_rain_1', name: 'Deszcz Ognia', type: 'Special', faction: 'Neutral', abilities: 'scorch_strongest' },
    { id: 'scorch_fire_rain_2', name: 'Deszcz Ognia', type: 'Special', faction: 'Neutral', abilities: 'scorch_strongest' },
    { id: 'commanders_horn_1', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: 'horn' },
    { id: 'commander_horn_2', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: 'horn' },
    { id: 'decoy_1', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: 'decoy' },
    { id: 'decoy_2', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: 'decoy' },
    
    // === KARTY POGODY (NEUTRALNE) ===
    { id: 'biting_frost_1', name: 'Trzaskający Mróz', type: 'Weather', faction: 'Neutral', rowAffected: ['melee'] },
    { id: 'impenetrable_fog_1', name: 'Gęsta Mgła', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged'] },
    { id: 'torrential_rain_1', name: 'Ulewny Deszcz', type: 'Weather', faction: 'Neutral', rowAffected: ['siege'] },
    { id: 'fear_1', name: 'Strach', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged', 'siege'] },
    { id: 'clear_sky_1', name: 'Czyste Niebo', type: 'Weather', faction: 'Neutral', rowAffected: null },
    
    // === KRÓLESTWA PÓŁNOCY (NORTHERN REALMS) ===
    { id: 'foltest_1', name: 'Foltest: Król Temerii', type: 'Leader', faction: 'Northern Realms' },
    { id: 'yennefer_of_vengerberg_1', name: 'Yennefer z Vengerbergu', type: 'Unit', power: 7, isHero: true, faction: 'Northern Realms', row: 'ranged' },
    { id: 'triss_merigold_1', name: 'Triss Merigold', type: 'Unit', power: 7, isHero: true, faction: 'Northern Realms', row: 'ranged' },
    { id: 'blue_stripes_commando_1', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: 'tight_bond', baseId: 'blue_stripes_commando' },
    { id: 'blue_stripes_commando_2', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: 'tight_bond', baseId: 'blue_stripes_commando' },
    { id: 'blue_stripes_commando_3', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: 'tight_bond', baseId: 'blue_stripes_commando' },
    { id: 'catapult_1', name: 'Katapulta', type: 'Unit', power: 8, faction: 'Northern Realms', row: 'siege', abilities: 'tight_bond', baseId: 'catapult' },
    { id: 'catapult_2', name: 'Katapulta', type: 'Unit', power: 8, faction: 'Northern Realms', row: 'siege', abilities: 'tight_bond', baseId: 'catapult' },
    { id: 'field_medic_1', name: 'Felczer', type: 'Unit', power: 5, isHero: false, faction: 'Northern Realms', row: 'ranged', abilities: 'medic' },
    { id: 'field_medic_2', name: 'Felczer', type: 'Unit', power: 5, isHero: false, faction: 'Northern Realms', row: 'ranged', abilities: 'medic' },
    
      { id: 'eredin_1', name: 'Eredin', type: 'Leader', faction: 'Monsters', abilityDesc: 'Wybierz kartę Pogody z talii i zagraj ją natychmiast.' },

    // ============================================
    // =============== POTWORY - JEDNOSTKI ===============
    // ============================================
    // --- Wręcz (Melee) ---
    { id: 'imlerith_1', name: 'Imlerith', type: 'Unit', power: 10, isHero: true, faction: 'Monsters', row: 'melee' },
    { id: 'nekker_1', name: 'Nekker', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'melee', abilities: 'muster' },
    { id: 'nekker_2', name: 'Nekker', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'melee', abilities: 'muster' },
    { id: 'nekker_3', name: 'Nekker', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'melee', abilities: 'muster' },
    { id: 'ghoul_1', name: 'Ghul', type: 'Unit', power: 1, isHero: false, faction: 'Monsters', row: 'melee', abilities: 'muster' },
    { id: 'ghoul_2', name: 'Ghul', type: 'Unit', power: 1, isHero: false, faction: 'Monsters', row: 'melee', abilities: 'muster' },
    // --- Dystans (Ranged) ---
    { id: 'wyvern_1', name: 'Wiwerna', type: 'Unit', power: 5, isHero: false, faction: 'Monsters', row: 'ranged' },
    { id: 'harpy_1', name: 'Harpia', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'ranged' },
    // --- Oblężnicze (Siege) ---
    { id: 'fiend_1', name: 'Bies', type: 'Unit', power: 6, isHero: false, faction: 'Monsters', row: 'siege' },
    {
    id: 'kasacz_1',
    name: 'Kąsacz',
    type: 'Unit',
    power: 4,
    faction: 'Monsters',
    row: 'melee',
    abilities: ['Moc'], // <-- Zdolność "Moc"
    transformId: 'wsciekly_kasacz_1', // <-- ID karty, w którą się zamieni
    isHero: false
},
{
    id: 'wsciekly_kasacz_1', // <-- ID musi pasować do 'transformId' z poprzedniej karty
    name: 'Wściekły Kąsacz',
    type: 'Unit',
    power: 8,
    faction: 'Monsters',
    row: 'melee',
    abilities: [], // Zazwyczaj ulepszona wersja nie ma już specjalnych zdolności
    isHero: false,
    isToken: true // <-- Ważne, aby nie można było jej dobrać
},

];
