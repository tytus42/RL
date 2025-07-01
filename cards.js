const allCards = [
    // ==================================================================
    // === KARTY NEUTRALNE
    // ==================================================================
    
    // --- Jednostki Neutralne ---
    { 
        id: 'ciri_1', 
        name: 'Ciri', 
        type: 'Unit', 
        power: 15, 
        isHero: true, 
        faction: 'Neutral', 
        row: 'melee',
        abilities: [],
        description: 'Będzie z tobą po kres świata.'
    },
    { 
        id: 'geralt_of_rivia_1', 
        name: 'Geralt z Rivii', 
        type: 'Unit', 
        power: 15, 
        isHero: true, 
        faction: 'Neutral', 
        row: 'melee',
        abilities: [],
        description: 'Jeśli mam wybierać między jednym złem a drugim, wolę nie wybierać wcale.'
    },
    { 
        id: 'dandelion_1', 
        name: 'Jaskier', 
        type: 'Unit', 
        power: 2, 
        isHero: false, 
        faction: 'Neutral', 
        row: 'melee', 
        abilities: ['morale_boost'],
        description: 'Jaskier, ty to wiesz, jak człowiekowi humor poprawić.'
    },
    { 
        id: 'zoltan_chivay_1', 
        name: 'Zoltan Chivay', 
        type: 'Unit', 
        power: 5, 
        isHero: false, 
        faction: 'Neutral', 
        row: 'melee', 
        abilities: ['scorch_row'],
        description: 'Co, u licha? Dalej, na pohybel skurwysynom!'
    },
    { 
        id: 'avallach_1', 
        name: 'Avallac\'h', 
        type: 'Unit', 
        power: 0, 
        isHero: true, // Szpiedzy-bohaterowie są standardem
        faction: 'Neutral', 
        row: 'melee', 
        abilities: ['spy'],
        description: 'Wiedzący, który podróżuje między światami.'
    },
    { 
        id: 'vesemir_1', 
        name: 'Vesemir', 
        type: 'Unit', 
        power: 6, 
        isHero: false, 
        faction: 'Neutral', 
        row: ['melee', 'ranged'], 
        abilities: ['agile'],
        description: 'Najstarszy i najbardziej doświadczony wiedźmin z Kaer Morhen.'
    },
    {
        id: 'golem_1',
        name: 'Golem',
        type: 'Unit',
        power: 3,
        faction: 'Neutral',
        row: 'melee',
        abilities: ['avenger'],
        summons: 'golem_fiend_1',
        isHero: false,
        description: 'Większy niż wygląda.'
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

    // --- Karty Specjalne Neutralne ---
    { id: 'scorch_fire_rain_1', name: 'Deszcz Ognia', type: 'Special', faction: 'Neutral', abilities: ['scorch_strongest'] },
    { id: 'commanders_horn_1', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: ['horn'] },
    { id: 'decoy_1', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: ['decoy'] },
    { id: 'wyzwolenie_sily_1', name: 'Wyzwolenie siły', type: 'Special', faction: 'Neutral', abilities: ['Wyzwolenie siły'] },

    // --- Karty Pogody ---
    { id: 'biting_frost_1', name: 'Trzaskający Mróz', type: 'Weather', faction: 'Neutral', rowAffected: ['melee'], effectClass: 'frost-effect' },
    { id: 'impenetrable_fog_1', name: 'Gęsta Mgła', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged'], effectClass: 'fog-effect' },
    { id: 'torrential_rain_1', name: 'Ulewny Deszcz', type: 'Weather', faction: 'Neutral', rowAffected: ['siege'],  effectClass: 'rain-effect' },
    { id: 'fear_1', name: 'Strach', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged', 'siege'], effectClass: 'fear-effect' },
    { id: 'clear_sky_1', name: 'Czyste Niebo', type: 'Weather', faction: 'Neutral', rowAffected: null },


    // ==================================================================
    // === KRÓLESTWA PÓŁNOCY (NORTHERN REALMS)
    // ==================================================================

    // --- Dowódcy ---
    { id: 'foltest_1', name: 'Foltest: Król Temerii', type: 'Leader', faction: 'Northern Realms', description: '' },

    // --- Jednostki ---
    { id: 'yennefer_of_vengerberg_1', name: 'Yennefer z Vengerbergu', type: 'Unit', power: 7, isHero: true, faction: 'Northern Realms', row: 'ranged', abilities:['medic'], description: '' },
    { id: 'triss_merigold_1', name: 'Triss Merigold', type: 'Unit', power: 7, isHero: true, faction: 'Northern Realms', row: 'ranged', abilities:[], description: '' },
    { id: 'blue_stripes_commando_1', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: ['tight_bond'], baseId: 'blue_stripes_commando', description: '' },
    { id: 'blue_stripes_commando_2', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: ['tight_bond'], baseId: 'blue_stripes_commando', description: '' },
    { id: 'blue_stripes_commando_3', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: ['tight_bond'], baseId: 'blue_stripes_commando', description: '' },
    { id: 'catapult_1', name: 'Katapulta', type: 'Unit', power: 8, faction: 'Northern Realms', row: 'siege', abilities: ['tight_bond'], baseId: 'catapult', description: '' },
    { id: 'catapult_2', name: 'Katapulta', type: 'Unit', power: 8, faction: 'Northern Realms', row: 'siege', abilities: ['tight_bond'], baseId: 'catapult', description: '' },
    { id: 'field_medic_1', name: 'Felczer', type: 'Unit', power: 5, isHero: false, faction: 'Northern Realms', row: 'ranged', abilities: ['medic'], description: '' },
    

    // ==================================================================
    // === POTWORY (MONSTERS)
    // ==================================================================

    // --- Dowódcy ---
    { id: 'eredin_1', name: 'Eredin', type: 'Leader', faction: 'Monsters', description: 'Wybierz kartę Pogody z talii i zagraj ją natychmiast.' },

    // --- Jednostki ---
    { id: 'imlerith_1', name: 'Imlerith', type: 'Unit', power: 10, isHero: true, faction: 'Monsters', row: 'melee', abilities: [], description: '' },
    { id: 'nekker_1', name: 'Nekker', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'melee', abilities: ['muster'], description: '' },
    { id: 'nekker_2', name: 'Nekker', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'melee', abilities: ['muster'], description: '' },
    { id: 'nekker_3', name: 'Nekker', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'melee', abilities: ['muster'], description: '' },
    { id: 'ghoul_1', name: 'Ghul', type: 'Unit', power: 1, isHero: false, faction: 'Monsters', row: 'melee', abilities: ['muster'], description: '' },
    { id: 'ghoul_2', name: 'Ghul', type: 'Unit', power: 1, isHero: false, faction: 'Monsters', row: 'melee', abilities: ['muster'], description: '' },
    { id: 'wyvern_1', name: 'Wiwerna', type: 'Unit', power: 5, isHero: false, faction: 'Monsters', row: 'ranged', abilities: [], description: '' },
    { id: 'harpy_1', name: 'Harpia', type: 'Unit', power: 2, isHero: false, faction: 'Monsters', row: 'ranged', abilities: [], description: '' },
    { id: 'fiend_1', name: 'Bies', type: 'Unit', power: 6, isHero: false, faction: 'Monsters', row: 'siege', abilities: [], description: '' },
    {
        id: 'kasacz_1',
        name: 'Kąsacz',
        type: 'Unit',
        power: 4,
        faction: 'Monsters',
        row: 'melee',
        abilities: ['Moc'],
        transformId: 'wsciekly_kasacz_1',
        isHero: false,
        description: 'Głodny.'
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
];
