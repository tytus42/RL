const allCards = [
    // ==================================================================
    // === DOWÓDCY (LEADERS)
    // ==================================================================
    {
        id: 'foltest_bronze',
        name: 'Foltest',
        type: 'Leader',
        faction: 'Northern Realms',
        abilities: [],
        description: 'Zniszcz najsilniejszą/najsilniejsze jednostki oblężnicze wroga, jeśli suma ich siły wynosi 10 lub więcej.'
    },
    {
        id: 'foltest_silver',
        name: 'Foltest',
        type: 'Leader',
        faction: 'Northern Realms',
        abilities: [],
        description: 'Wybierz kartę mgły z talii i zagraj ją natychmiast.'
    },
    {
        id: 'foltest_gold',
        name: 'Foltest',
        type: 'Leader',
        faction: 'Northern Realms',
        abilities: [],
        description: 'Podwaja siłę wszystkich twoich jednostek oblężniczych.'
    },
    {
        id: 'eredin_bronze',
        name: 'Eredin',
        type: 'Leader',
        faction: 'Monsters',
        abilities: [],
        description: 'Wybierz dowolną kartę pogody z talii i zagraj ją natychmiast.'
    },
    {
        id: 'eredin_silver',
        name: 'Eredin',
        type: 'Leader',
        faction: 'Monsters',
        abilities: [],
        description: 'Odrzuć 2 karty i dobierz 1 nową.'
    },
    {
        id: 'eredin_gold',
        name: 'Eredin',
        type: 'Leader',
        faction: 'Monsters',
        abilities: [],
        description: 'Podwaja siłę wszystkich twoich jednostek walczących w zwarciu.'
    },
    {
        id: 'francesca_bronze',
        name: 'Francesca Findabair',
        type: 'Leader',
        faction: 'Scoia\'tael',
        abilities: [],
        description: 'Przesuń jednostki z rzędu oblężniczego do rzędu dystansowego.'
    },
    {
        id: 'francesca_silver',
        name: 'Francesca Findabair',
        type: 'Leader',
        faction: 'Scoia\'tael',
        abilities: [],
        description: 'Zniszcz najsilniejszą/najsilniejsze jednostki dystansowe wroga, jeśli suma ich siły wynosi 10 lub więcej.'
    },
    {
        id: 'francesca_gold',
        name: 'Francesca Findabair',
        type: 'Leader',
        faction: 'Scoia\'tael',
        abilities: [],
        description: 'Podwaja siłę wszystkich twoich jednostek dystansowych.'
    },
    {
        id: 'emhyr_bronze',
        name: 'Emhyr var Emreis',
        type: 'Leader',
        faction: 'Nilfgaardian Empire',
        abilities: [],
        description: 'Dobierz kartę z cmentarza przeciwnika.'
    },
    {
        id: 'emhyr_silver',
        name: 'Emhyr var Emreis',
        type: 'Leader',
        faction: 'Nilfgaardian Empire',
        abilities: [],
        description: 'Anuluj zdolność dowódcy przeciwnika.'
    },
    {
        id: 'emhyr_gold',
        name: 'Emhyr var Emreis',
        type: 'Leader',
        faction: 'Nilfgaardian Empire',
        abilities: [],
        description: 'Wybierz losową jednostkę z ręki przeciwnika.'
    },
    {
        id: 'crach_an_craite_bronze',
        name: 'Crach an Craite',
        type: 'Leader',
        faction: 'Skellige',
        abilities: [],
        description: 'Przetasuj do 2 kart z cmentarza z powrotem do talii.'
    },
    {
        id: 'crach_an_craite_silver',
        name: 'Crach an Craite',
        type: 'Leader',
        faction: 'Skellige',
        abilities: [],
        description: 'Niszczy jednostki osłabione przez pogodę.'
    },

    // ==================================================================
    // === KARTY NEUTRALNE
    // ==================================================================
    { id: 'geralt_of_rivia', name: 'Geralt z Rivii', type: 'Unit', power: 15, faction: 'Neutral', row: 'melee', abilities: [], isHero: true, description: 'Jeśli mam wybierać między jednym złem a drugim, wolę nie wybierać wcale.' },
    { id: 'ciri', name: 'Ciri', type: 'Unit', power: 15, faction: 'Neutral', row: 'melee', abilities: [], isHero: true, description: 'Będzie z tobą po kres świata.' },
    { id: 'yennefer_of_vengerberg', name: 'Yennefer z Vengerbergu', type: 'Unit', power: 7, faction: 'Neutral', row: 'ranged', abilities: ['medic'], isHero: true, description: 'Nigdy nie tęsknię za porankami. Albo budzę się tuż przed południem, albo wcale.' },
    { id: 'triss_merigold', name: 'Triss Merigold', type: 'Unit', power: 7, faction: 'Neutral', row: 'ranged', abilities: [], isHero: true, description: 'Nie potrafię być dla ciebie tylko przyjaciółką, Geralt.' },
    { id: 'avallach', name: "Avallac'h", type: 'Unit', power: 0, faction: 'Neutral', row: 'melee', abilities: ['spy'], isHero: true, description: 'Wiedzący, który podróżuje między światami.' },
    { id: 'villentretenmerth', name: 'Villentretenmerth', type: 'Unit', power: 7, faction: 'Neutral', row: 'melee', abilities: ['scorch_row'], isHero: false, description: 'Złoty smok, rzadszy niż diament.' },
    { id: 'vesemir', name: 'Vesemir', type: 'Unit', power: 6, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, description: 'Najstarszy i najbardziej doświadczony wiedźmin z Kaer Morhen.' },
    { id: 'zoltan_chivay', name: 'Zoltan Chivay', type: 'Unit', power: 5, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, description: 'Co, u licha? Dalej, na pohybel skurwysynom!' },
    { id: 'emiel_regis', name: 'Emiel Regis', type: 'Unit', power: 5, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, description: 'Wampiry wyższe mają niezwykłe zdolności regeneracyjne.' },
    { id: 'dandelion', name: 'Jaskier', type: 'Unit', power: 2, faction: 'Neutral', row: 'melee', abilities: ['morale_boost'], isHero: false, description: 'Jaskier, ty to wiesz, jak człowiekowi humor poprawić.' },

    // ==================================================================
    // === KARTY SPECJALNE
    // ==================================================================
    { id: 'scorch', name: 'Pożoga', type: 'Special', faction: 'Neutral', abilities: ['scorch_strongest'], description: 'Zniszcz najsilniejszą/najsilniejsze karty na polu bitwy.' },
    { id: 'commanders_horn', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: ['horn'], description: 'Podwaja siłę wszystkich jednostek w rzędzie. Działa jednorazowo.' },
    { id: 'decoy', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: ['decoy'], description: 'Zamień na jednostkę na polu bitwy, aby wróciła na rękę.' },
    { id: 'biting_frost', name: 'Trzaskający Mróz', type: 'Weather', faction: 'Neutral', rowAffected: ['melee'], effectClass: 'frost-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki w zwarciu na 1.' },
    { id: 'impenetrable_fog', name: 'Gęsta Mgła', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged'], effectClass: 'fog-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki dystansowej na 1.' },
    { id: 'torrential_rain', name: 'Ulewny Deszcz', type: 'Weather', faction: 'Neutral', rowAffected: ['siege'], effectClass: 'rain-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie oblężniczym na 1.' },
    { id: 'clear_weather', name: 'Czyste Niebo', type: 'Weather', faction: 'Neutral', rowAffected: null, description: 'Usuwa wszystkie efekty pogodowe.' },

    // ==================================================================
    // === KRÓLESTWA PÓŁNOCY (NORTHERN REALMS)
    // ==================================================================
    { id: 'john_natalis', name: 'Jan Natalis', type: 'Unit', power: 10, faction: 'Northern Realms', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'vernon_roche', name: 'Vernon Roche', type: 'Unit', power: 10, faction: 'Northern Realms', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'philippa_eilhart', name: 'Filippa Eilhart', type: 'Unit', power: 10, faction: 'Northern Realms', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'esterad_thyssen', name: 'Esterad Thyssen', type: 'Unit', power: 10, faction: 'Northern Realms', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'keira_metz', name: 'Keira Metz', type: 'Unit', power: 5, faction: 'Northern Realms', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'siegfried_of_denesle', name: 'Zygfryd z Denesle', type: 'Unit', power: 5, faction: 'Northern Realms', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'yarpen_zigrin', name: 'Yarpen Zigrin', type: 'Unit', power: 2, faction: 'Northern Realms', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'sheldon_skaggs', name: 'Sheldon Skaggs', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'prince_stennis', name: 'Książę Stennis', type: 'Unit', power: 5, faction: 'Northern Realms', row: 'melee', abilities: ['spy'], isHero: false, description: '' },
    { id: 'thaler', name: 'Talar', type: 'Unit', power: 1, faction: 'Northern Realms', row: 'siege', abilities: ['spy'], isHero: false, description: '' },
    { id: 'dun_banner_medic', name: 'Medyk Chorągwi Burej', type: 'Unit', power: 5, faction: 'Northern Realms', row: 'siege', abilities: ['medic'], isHero: false, description: '' },
    { id: 'blue_stripes_commando', name: 'Komandos Niebieskich Pasów', type: 'Unit', power: 4, faction: 'Northern Realms', row: 'melee', abilities: ['tight_bond'], baseId: 'blue_stripes_commando', description: '' },
    { id: 'catapult', name: 'Katapulta', type: 'Unit', power: 8, faction: 'Northern Realms', row: 'siege', abilities: ['tight_bond'], baseId: 'catapult', description: '' },
    { id: 'trebuchet', name: 'Trebusz', type: 'Unit', power: 6, faction: 'Northern Realms', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'ballista', name: 'Balista', type: 'Unit', power: 6, faction: 'Northern Realms', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'siege_tower', name: 'Wieża oblężnicza', type: 'Unit', power: 6, faction: 'Northern Realms', row: 'siege', abilities: [], isHero: false, description: '' },

    // ==================================================================
    // === POTWORY (MONSTERS)
    // ==================================================================
    { id: 'imlerith', name: 'Imlerith', type: 'Unit', power: 10, faction: 'Monsters', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'leshen', name: 'Leszy', type: 'Unit', power: 10, faction: 'Monsters', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'draug', name: 'Draug', type: 'Unit', power: 10, faction: 'Monsters', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'kayran', name: 'Keyran', type: 'Unit', power: 8, faction: 'Monsters', row: ['melee', 'ranged'], abilities: ['agile', 'morale_boost'], isHero: true, description: '' },
    { id: 'werewolf', name: 'Wilkołak', type: 'Unit', power: 5, faction: 'Monsters', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'fiend', name: 'Bies', type: 'Unit', power: 6, faction: 'Monsters', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'griffin', name: 'Gryf', type: 'Unit', power: 5, faction: 'Monsters', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'forktail', name: 'Widłogon', type: 'Unit', power: 5, faction: 'Monsters', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'plague_maiden', name: 'Morowa Dziewica', type: 'Unit', power: 5, faction: 'Monsters', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'earth_elemental', name: 'Żywiołak ziemi', type: 'Unit', power: 6, faction: 'Monsters', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'fire_elemental', name: 'Żywiołak ognia', type: 'Unit', power: 6, faction: 'Monsters', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'celaeno_harpy', name: 'Harpia Celeano', type: 'Unit', power: 2, faction: 'Monsters', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'gargoyle', name: 'Gargulec', type: 'Unit', power: 2, faction: 'Monsters', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'cockatrice', name: 'Kuroliszek', type: 'Unit', power: 2, faction: 'Monsters', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'harpy', name: 'Harpia', type: 'Unit', power: 2, faction: 'Monsters', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'ghoul', name: 'Ghul', type: 'Unit', power: 1, faction: 'Monsters', row: 'melee', abilities: ['muster'], baseId: 'ghoul', description: '' },
    { id: 'nekker', name: 'Nekker', type: 'Unit', power: 2, faction: 'Monsters', row: 'melee', abilities: ['muster'], baseId: 'nekker', description: '' },
    { id: 'foglet', name: 'Mglak', type: 'Unit', power: 2, faction: 'Monsters', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'wyvern', name: 'Wiwerna', type: 'Unit', power: 2, faction: 'Monsters', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'vampire_bruxa', name: 'Wampir: Bruxa', type: 'Unit', power: 4, faction: 'Monsters', row: 'melee', abilities: ['muster'], baseId: 'vampire', description: '' },
    { id: 'vampire_fleder', name: 'Wampir: Fleder', type: 'Unit', power: 4, faction: 'Monsters', row: 'melee', abilities: ['muster'], baseId: 'vampire', description: '' },
    { id: 'vampire_garkain', name: 'Wampir: Garkain', type: 'Unit', power: 4, faction: 'Monsters', row: 'melee', abilities: ['muster'], baseId: 'vampire', description: '' },
    { id: 'vampire_ekimmara', name: 'Wampir: Ekimma', type: 'Unit', power: 4, faction: 'Monsters', row: 'melee', abilities: ['muster'], baseId: 'vampire', description: '' },
    { id: 'arachas', name: 'Arachas', type: 'Unit', power: 4, faction: 'Monsters', row: 'ranged', abilities: ['muster'], baseId: 'arachas', description: '' },
    { id: 'arachas_behemoth', name: 'Behemot', type: 'Unit', power: 6, faction: 'Monsters', row: 'siege', abilities: ['muster'], baseId: 'arachas', description: '' },

    // ==================================================================
    // === NILFGAARD
    // ==================================================================
    { id: 'letho_of_gulet', name: 'Letho z Gulety', type: 'Unit', power: 10, faction: 'Nilfgaardian Empire', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'menno_coehoorn', name: 'Menno Coehoorn', type: 'Unit', power: 10, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['medic'], isHero: true, description: '' },
    { id: 'moorvran_voorhis', name: 'Morvran Voorhis', type: 'Unit', power: 10, faction: 'Nilfgaardian Empire', row: 'siege', abilities: [], isHero: true, description: '' },
    { id: 'tibor_eggebracht', name: 'Tibor Eggebracht', type: 'Unit', power: 10, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'albrich', name: 'Albrich', type: 'Unit', power: 2, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'assire_var_anahid', name: 'Assire var Anahid', type: 'Unit', power: 6, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'cynthia', name: 'Cynthia', type: 'Unit', power: 4, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'fringilla_vigo', name: 'Fringilla Vigo', type: 'Unit', power: 6, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'shilard_fitz_oesterlen', name: 'Shilard Fitz-Oesterlen', type: 'Unit', power: 7, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['spy'], isHero: false, description: '' },
    { id: 'stefan_skellen', name: 'Stefan Skellen', type: 'Unit', power: 9, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['spy'], isHero: false, description: '' },
    { id: 'vattier_de_rideaux', name: 'Vattier de Rideaux', type: 'Unit', power: 4, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['spy'], isHero: false, description: '' },
    { id: 'vanhemar', name: 'Vanhemar', type: 'Unit', power: 4, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'renuald_aep_matsen', name: 'Renuald aep Matsen', type: 'Unit', power: 5, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'cahir_aep_ceallach', name: 'Cahir aep Ceallach', type: 'Unit', power: 6, faction: 'Nilfgaardian Empire', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'puttkammer', name: 'Puttkammer', type: 'Unit', power: 3, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'sweers', name: 'Sweers', type: 'Unit', power: 2, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'vremde', name: 'Vremde', type: 'Unit', power: 2, faction: 'Nilfgaardian Empire', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'zerrikanian_fire_scorpion', name: 'Skorpion', type: 'Unit', power: 5, faction: 'Nilfgaardian Empire', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'rotten_mangonel', name: 'Zgniła Mangonela', type: 'Unit', power: 3, faction: 'Nilfgaardian Empire', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'black_infantry_archer', name: 'Łucznik', type: 'Unit', power: 10, faction: 'Nilfgaardian Empire', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'heavy_zerrikanian_fire_scorpion', name: 'Ciężki Skorpion', type: 'Unit', power: 10, faction: 'Nilfgaardian Empire', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'impera_brigade_guard', name: 'Gwardzista', type: 'Unit', power: 3, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['tight_bond'], baseId: 'impera_brigade', description: '' },
    { id: 'nausicaa_cavalry_rider', name: 'Jeździec', type: 'Unit', power: 2, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['tight_bond'], baseId: 'nausicaa_cavalry', description: '' },
    { id: 'young_emissary', name: 'Młody Emisariusz', type: 'Unit', power: 5, faction: 'Nilfgaardian Empire', row: 'melee', abilities: ['tight_bond'], baseId: 'young_emissary', description: '' },

    // ==================================================================
    // === SCOIA'TAEL
    // ==================================================================
    { id: 'isengrim_faolitarna', name: 'Isengrim Faolitarna', type: 'Unit', power: 10, faction: 'Scoia\'tael', row: 'melee', abilities: ['morale_boost'], isHero: true, description: '' },
    { id: 'eithne', name: 'Eithne', type: 'Unit', power: 10, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'saskia', name: 'Saskia', type: 'Unit', power: 9, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'iorveth', name: 'Iorweth', type: 'Unit', power: 10, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'yaevinn', name: 'Yaevinn', type: 'Unit', power: 6, faction: 'Scoia\'tael', row: ['melee', 'ranged'], abilities: ['agile'], isHero: false, description: '' },
    { id: 'riordain', name: 'Riordain', type: 'Unit', power: 1, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'toruviel', name: 'Toruviel', type: 'Unit', power: 2, faction: 'Scoia\'tael', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'ciaran_aep_easnillien', name: 'Ciaran aep Easnillien', type: 'Unit', power: 3, faction: 'Scoia\'tael', row: ['melee', 'ranged'], abilities: ['agile'], isHero: false, description: '' },
    { id: 'filavandrel_aen_fidhail', name: 'Filavandrel aen Fidhail', type: 'Unit', power: 6, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'dennis_cranmer', name: 'Dennis Cranmer', type: 'Unit', power: 6, faction: 'Scoia\'tael', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'dol_blathanna_archer', name: 'Łucznik', type: 'Unit', power: 6, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'havekar_smuggler', name: 'Przemytnik', type: 'Unit', power: 5, faction: 'Scoia\'tael', row: 'melee', abilities: ['muster'], baseId: 'havekar', description: '' },
    { id: 'vrihedd_brigade_recruit', name: 'Rekrut', type: 'Unit', power: 4, faction: 'Scoia\'tael', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'elven_skirmisher', name: 'Harocwnik', type: 'Unit', power: 2, faction: 'Scoia\'tael', row: 'ranged', abilities: ['muster'], baseId: 'elven_skirmisher', description: '' },
    { id: 'dwarven_skirmisher', name: 'Zoltan', type: 'Unit', power: 3, faction: 'Scoia\'tael', row: 'melee', abilities: ['muster'], baseId: 'dwarven_skirmisher', description: '' },
    { id: 'havekar_healer', name: 'Medyk', type: 'Unit', power: 0, faction: 'Scoia\'tael', row: 'ranged', abilities: ['medic'], isHero: false, description: '' },

    // ==================================================================
    // === SKELLIGE
    // ==================================================================
    { id: 'ermion', name: 'Myszowór', type: 'Unit', power: 8, faction: 'Skellige', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'hjalmar', name: 'Hjalmar', type: 'Unit', power: 10, faction: 'Skellige', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'cerys', name: 'Cerys', type: 'Unit', power: 10, faction: 'Skellige', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'birna_bran', name: 'Birna Bran', type: 'Unit', power: 2, faction: 'Skellige', row: 'melee', abilities: ['medic'], isHero: false, description: '' },
    { id: 'olaf', name: 'Olaf', type: 'Unit', power: 12, faction: 'Skellige', row: ['melee', 'ranged'], abilities: ['agile'], isHero: false, description: '' },
    { id: 'berserker', name: 'Berserker', type: 'Unit', power: 4, faction: 'Skellige', row: 'melee', abilities: ['Moc'], transformId: 'vildkaarl', isHero: false, description: '' },
    { id: 'vildkaarl', name: 'Vildkaarl', type: 'Unit', power: 8, faction: 'Skellige', row: 'melee', abilities: [], isHero: false, isToken: true, description: '' },
    { id: 'young_berserker', name: 'Młody Berserker', type: 'Unit', power: 2, faction: 'Skellige', row: 'melee', abilities: ['Moc'], transformId: 'young_vildkaarl', isHero: false, description: '' },
    { id: 'young_vildkaarl', name: 'Młody Vildkaarl', type: 'Unit', power: 4, faction: 'Skellige', row: 'melee', abilities: [], isHero: false, isToken: true, description: '' },
    { id: 'donar_an_hindar', name: 'Donar an Hindar', type: 'Unit', power: 4, faction: 'Skellige', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'udalryk', name: 'Udalryk', type: 'Unit', power: 4, faction: 'Skellige', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'svanrige', name: 'Svanrige', type: 'Unit', power: 4, faction: 'Skellige', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'holger_blackhand', name: 'Holger Czarnoręki', type: 'Unit', power: 4, faction: 'Skellige', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'clan_drummond_shieldmaiden', name: 'Wojowniczka', type: 'Unit', power: 4, faction: 'Skellige', row: 'melee', abilities: ['tight_bond'], baseId: 'clan_drummond', description: '' },
    { id: 'light_longship', name: 'Drakkar', type: 'Unit', power: 4, faction: 'Skellige', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'war_longship', name: 'Okręt Bojowy', type: 'Unit', power: 6, faction: 'Skellige', row: 'ranged', abilities: [], isHero: false, description: '' },
    { id: 'skellige_storm', name: 'Sztorm na Skellige', type: 'Weather', faction: 'Skellige', rowAffected: ['ranged', 'siege'], effectClass: 'rain-effect', description: 'Ustawia siłę wszystkich jednostek w rzędach dystansowym i oblężniczym na 1.' }
];
