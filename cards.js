const allCards = [
    // ==================================================================
    // === KARTY NEUTRALNE
    // ==================================================================
        { id: 'cirilla_fiona_elen_riannon', name: 'Cirilla Fiona Elen Riannon', type: 'Unit', power: 15, faction: 'Neutral', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'cow_1', name: 'Cow', type: 'Unit', power: 0, faction: 'Neutral', row: 'ranged', abilities: ['avenger'], summons: 'bovine_defense_force_1', isHero: false, description: 'Muu.' },
    { id: 'bovine_defense_force_1', name: 'Bovine Defense Force', type: 'Unit', power: 8, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, isToken: true, description: 'Chrońcie krowy!' },
    { id: 'dandelion', name: 'Dandelion', type: 'Unit', power: 2, faction: 'Neutral', row: 'melee', abilities: ['horn'], isHero: false, description: 'Jaskier, ty to wiesz, jak człowiekowi humor poprawić.' },
    { id: 'emiel_regis', name: 'Emiel Regis Rohellec Terzieff', type: 'Unit', power: 5, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, description: 'Wampiry wyższe mają niezwykłe zdolności regeneracyjne.' },
    { id: 'gaunter_odimm', name: "Gaunter O'Dimm", type: 'Unit', power: 2, faction: 'Neutral', row: 'siege', abilities: ['muster'], baseId: 'gaunter_odimm', isHero: false, description: 'Pan Lusterko.' },
    { id: 'gaunter_odimm_darkness_1', name: "Gaunter O'Dimm: Darkness", type: 'Unit', power: 4, faction: 'Neutral', row: 'ranged', abilities: ['muster'], baseId: 'gaunter_odimm', isHero: false, description: '' },
    { id: 'gaunter_odimm_darkness_2', name: "Gaunter O'Dimm: Darkness", type: 'Unit', power: 4, faction: 'Neutral', row: 'ranged', abilities: ['muster'], baseId: 'gaunter_odimm', isHero: false, description: '' },
    { id: 'gaunter_odimm_darkness_3', name: "Gaunter O'Dimm: Darkness", type: 'Unit', power: 4, faction: 'Neutral', row: 'ranged', abilities: ['muster'], baseId: 'gaunter_odimm', isHero: false, description: '' },
    { id: 'geralt_of_rivia', name: 'Geralt of Rivia', type: 'Unit', power: 15, faction: 'Neutral', row: 'melee', abilities: [], isHero: true, description: 'Jeśli mam wybierać między jednym złem a drugim, wolę nie wybierać wcale.' },
    { id: 'mysterious_elf', name: "Mysterious Elf", type: 'Unit', power: 0, faction: 'Neutral', row: 'melee', abilities: ['spy'], isHero: true, description: '(a.k.a Avallac\'h)' },
    { id: 'olgierd_von_everec', name: 'Olgierd von Everec', type: 'Unit', power: 6, faction: 'Neutral', row: ['melee', 'ranged'], abilities: ['agile', 'morale_boost'], isHero: false, description: 'At least you now know I dont easily lose my head' },
    { id: 'triss_merigold', name: 'Triss Merigold', type: 'Unit', power: 7, faction: 'Neutral', row: 'melee', abilities: [], isHero: true, description: 'Nie potrafię być dla ciebie tylko przyjaciółką, Geralt.' },
    { id: 'vesemir', name: 'Vesemir', type: 'Unit', power: 6, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, description: 'Najstarszy i najbardziej doświadczony wiedźmin z Kaer Morhen.' },
    { id: 'villentretenmerth', name: 'Villentretenmerth', type: 'Unit', power: 7, faction: 'Neutral', row: 'melee', abilities: ['scorch_row'], isHero: false, description: 'Złoty smok, rzadszy niż diament.' },
    { id: 'yennefer_of_vengerberg', name: 'Yennefer of Vengerberg', type: 'Unit', power: 7, faction: 'Neutral', row: 'ranged', abilities: ['medic'], isHero: true, description: 'Nigdy nie tęsknię za porankami. Albo budzę się tuż przed południem, albo wcale.' },
    { id: 'zoltan_chivay', name: 'Zoltan Chivay', type: 'Unit', power: 5, faction: 'Neutral', row: 'melee', abilities: [], isHero: false, description: 'Co, u licha? Dalej, na pohybel skurwysynom!' },
    // === KARTY SPECJALNE NEUTRALNE
    { id: 'scorch_1', name: 'Pożoga', type: 'Special', faction: 'Neutral', abilities: ['scorch_strongest'], description: 'Zniszcz najsilniejszą/najsilniejsze karty na polu bitwy.' },
    { id: 'scorch_2', name: 'Pożoga', type: 'Special', faction: 'Neutral', abilities: ['scorch_strongest'], description: 'Zniszcz najsilniejszą/najsilniejsze karty na polu bitwy.' },
    { id: 'scorch_3', name: 'Pożoga', type: 'Special', faction: 'Neutral', abilities: ['scorch_strongest'], description: 'Zniszcz najsilniejszą/najsilniejsze karty na polu bitwy.' },
    { id: 'commanders_horn_1', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: ['horn'], description: 'Podwaja siłę wszystkich jednostek w rzędzie. Działa jednorazowo.' },
    { id: 'commanders_horn_2', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: ['horn'], description: 'Podwaja siłę wszystkich jednostek w rzędzie. Działa jednorazowo.' },
    { id: 'commanders_horn_3', name: 'Róg Dowódcy', type: 'Special', faction: 'Neutral', abilities: ['horn'], description: 'Podwaja siłę wszystkich jednostek w rzędzie. Działa jednorazowo.' },
    { id: 'decoy_1', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: ['decoy'], description: 'Zamień na jednostkę na polu bitwy, aby wróciła na rękę.' },
    { id: 'decoy_2', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: ['decoy'], description: 'Zamień na jednostkę na polu bitwy, aby wróciła na rękę.' },
    { id: 'decoy_3', name: 'Wabik', type: 'Special', faction: 'Neutral', abilities: ['decoy'], description: 'Zamień na jednostkę na polu bitwy, aby wróciła na rękę.' },
    { id: 'biting_frost_1', name: 'Trzaskający Mróz', type: 'Weather', faction: 'Neutral', rowAffected: ['melee'], effectClass: 'frost-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki w zwarciu na 1.' },
    { id: 'biting_frost_2', name: 'Trzaskający Mróz', type: 'Weather', faction: 'Neutral', rowAffected: ['melee'], effectClass: 'frost-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki w zwarciu na 1.' },
    { id: 'biting_frost_3', name: 'Trzaskający Mróz', type: 'Weather', faction: 'Neutral', rowAffected: ['melee'], effectClass: 'frost-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki w zwarciu na 1.' },
    { id: 'impenetrable_fog_1', name: 'Gęsta Mgła', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged'], effectClass: 'fog-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki dystansowej na 1.' },
    { id: 'impenetrable_fog_2', name: 'Gęsta Mgła', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged'], effectClass: 'fog-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki dystansowej na 1.' },
    { id: 'impenetrable_fog_3', name: 'Gęsta Mgła', type: 'Weather', faction: 'Neutral', rowAffected: ['ranged'], effectClass: 'fog-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie walki dystansowej na 1.' },
    { id: 'torrential_rain_1', name: 'Ulewny Deszcz', type: 'Weather', faction: 'Neutral', rowAffected: ['siege'], effectClass: 'rain-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie oblężniczym na 1.' },
    { id: 'torrential_rain_2', name: 'Ulewny Deszcz', type: 'Weather', faction: 'Neutral', rowAffected: ['siege'], effectClass: 'rain-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie oblężniczym na 1.' },
    { id: 'torrential_rain_3', name: 'Ulewny Deszcz', type: 'Weather', faction: 'Neutral', rowAffected: ['siege'], effectClass: 'rain-effect', description: 'Ustawia siłę wszystkich jednostek w rzędzie oblężniczym na 1.' },
    { id: 'clear_weather_1', name: 'Czyste Niebo', type: 'Weather', faction: 'Neutral', rowAffected: null, description: 'Usuwa wszystkie efekty pogodowe.' },
    { id: 'clear_weather_2', name: 'Czyste Niebo', type: 'Weather', faction: 'Neutral', rowAffected: null, description: 'Usuwa wszystkie efekty pogodowe.' },
    { id: 'clear_weather_3', name: 'Czyste Niebo', type: 'Weather', faction: 'Neutral', rowAffected: null, description: 'Usuwa wszystkie efekty pogodowe.' },

    // ==================================================================
    // === 1. KHORINIS
    // ==================================================================
    { id: 'andre_leader', name: 'Lord Andre', type: 'Leader', faction: 'Khorinis', abilities: ['leader_cancel_ability'], description: 'Anuluj zdolność dowódcy przeciwnika.' },
    { id: 'hagen_leader', name: 'Lord Hagen', type: 'Leader', faction: 'Khorinis', abilities: ['leader_siege_boost'], description: 'Podwaja siłę wszystkich twoich jednostek oblężniczych.' },
    { id: 'khorinis_hero_1', name: 'Lee', type: 'Unit', power: 10, faction: 'Khorinis', row: 'melee', abilities: [], isHero: true, description: 'Najemnik, który odnalazł swoje miejsce.' },
    { id: 'khorinis_hero_2', name: 'Gorn', type: 'Unit', power: 10, faction: 'Khorinis', row: 'melee', abilities: [], isHero: true, description: 'Siła i honor.' },
    { id: 'khorinis_guard_1', name: 'Strażnik Miejski', type: 'Unit', power: 4, faction: 'Khorinis', row: 'melee', abilities: ['muster'], baseId: 'khorinis_guard', isHero: false, description: 'Za króla i za Khorinis!' },
    { id: 'khorinis_guard_2', name: 'Strażnik Miejski', type: 'Unit', power: 4, faction: 'Khorinis', row: 'melee', abilities: ['muster'], baseId: 'khorinis_guard', isHero: false, description: 'Za króla i za Khorinis!' },
    { id: 'khorinis_guard_3', name: 'Strażnik Miejski', type: 'Unit', power: 4, faction: 'Khorinis', row: 'melee', abilities: ['muster'], baseId: 'khorinis_guard', isHero: false, description: 'Za króla i za Khorinis!' },
    { id: 'khorinis_militia_1', name: 'Milicjant', type: 'Unit', power: 3, faction: 'Khorinis', row: 'melee', abilities: ['tight_bond'], baseId: 'khorinis_militia', isHero: false, description: 'Chłopaki z portu zawsze trzymają się razem.' },
    { id: 'khorinis_militia_2', name: 'Milicjant', type: 'Unit', power: 3, faction: 'Khorinis', row: 'melee', abilities: ['tight_bond'], baseId: 'khorinis_militia', isHero: false, description: 'Chłopaki z portu zawsze trzymają się razem.' },
    { id: 'khorinis_crossbowman_1', name: 'Kusznik Straży', type: 'Unit', power: 5, faction: 'Khorinis', row: 'ranged', abilities: ['morale_boost'], isHero: false, description: 'Jeden za wszystkich, wszyscy za jednego!' },
    { id: 'khorinis_spy_1', name: 'Szpieg Królewski', type: 'Unit', power: 4, faction: 'Khorinis', row: 'melee', abilities: ['spy'], isHero: false, description: 'Wiadomości to też broń.' },
    { id: 'khorinis_trebuchet_1', name: 'Trebusz', type: 'Unit', power: 6, faction: 'Khorinis', row: 'siege', abilities: [], isHero: false, description: 'Mury wroga nie wytrzymają tego natarcia.' },

    // ==================================================================
    // === 2. POTWORY (MONSTERS)
    // ==================================================================
    { id: 'eredin_leader', name: 'Eredin', type: 'Leader', faction: 'Potwory', abilities: ['leader_play_weather'], description: 'Wybierz dowolną kartę pogody z talii i zagraj ją natychmiast.' },
    { id: 'imlerith_hero', name: 'Imlerith', type: 'Unit', power: 10, faction: 'Potwory', row: 'melee', abilities: [], isHero: true, description: '' },
    { id: 'leshen_hero', name: 'Leszy', type: 'Unit', power: 10, faction: 'Potwory', row: 'ranged', abilities: [], isHero: true, description: '' },
    { id: 'kayran_hero', name: 'Keyran', type: 'Unit', power: 8, faction: 'Potwory', row: ['melee', 'ranged'], abilities: ['agile', 'morale_boost'], isHero: true, description: '' },
    { id: 'fiend_1', name: 'Bies', type: 'Unit', power: 6, faction: 'Potwory', row: 'melee', abilities: [], isHero: false, description: '' },
    { id: 'earth_elemental_1', name: 'Żywiołak ziemi', type: 'Unit', power: 6, faction: 'Potwory', row: 'siege', abilities: [], isHero: false, description: '' },
    { id: 'vampire_1', name: 'Wampir: Bruxa', type: 'Unit', power: 4, faction: 'Potwory', row: 'melee', abilities: ['muster'], baseId: 'vampire', description: '' },
    { id: 'vampire_2', name: 'Wampir: Fleder', type: 'Unit', power: 4, faction: 'Potwory', row: 'melee', abilities: ['muster'], baseId: 'vampire', description: '' },
    { id: 'arachas_1', name: 'Arachas', type: 'Unit', power: 4, faction: 'Potwory', row: 'ranged', abilities: ['muster'], baseId: 'arachas', description: '' },
    { id: 'arachas_2', name: 'Arachas', type: 'Unit', power: 4, faction: 'Potwory', row: 'ranged', abilities: ['muster'], baseId: 'arachas', description: '' },
    { id: 'arachas_behemoth_1', name: 'Behemot', type: 'Unit', power: 6, faction: 'Potwory', row: 'siege', abilities: ['muster'], baseId: 'arachas', description: '' },
    { id: 'nekker_1', name: 'Nekker', type: 'Unit', power: 2, faction: 'Potwory', row: 'melee', abilities: ['muster'], baseId: 'nekker', description: '' },
    { id: 'nekker_2', name: 'Nekker', type: 'Unit', power: 2, faction: 'Potwory', row: 'melee', abilities: ['muster'], baseId: 'nekker', description: '' },

    // ==================================================================
    // === 3. NAJEMNICY
    // ==================================================================
    { id: 'mercs_leader_lee', name: 'Lee', type: 'Leader', faction: 'Najemnicy', abilities: ['hero_scorch_row_power_15'], description: 'Niszczy wszystkie jednostki w rzędzie o łącznej sile 15 lub więcej.' },
    { id: 'mercs_hero_1', name: 'Geralt: Najemnik', type: 'Unit', power: 10, faction: 'Najemnicy', row: 'melee', abilities: [], isHero: true, description: 'Każdy ma swoją cenę.' },
    { id: 'mercs_crossbowman_1', name: 'Najemny Kusznik', type: 'Unit', power: 4, faction: 'Najemnicy', row: 'ranged', abilities: ['scorch_row'], isHero: false, description: 'Zapłać, a strzała znajdzie swój cel.' },
    { id: 'mercs_veteran_1', name: 'Doświadczony Weteran', type: 'Unit', power: 6, faction: 'Najemnicy', row: ['melee', 'ranged'], abilities: ['agile'], isHero: false, description: 'Walczył w każdej wojnie, po każdej stronie.' },
    { id: 'mercs_spy_1', name: 'Zwiadowca', type: 'Unit', power: 2, faction: 'Najemnicy', row: 'melee', abilities: ['spy'], isHero: false, description: 'Wie wszystko, widzi wszystko. Za odpowiednią cenę.' },
    { id: 'mercs_medic_1', name: 'Felczer', type: 'Unit', power: 3, faction: 'Najemnicy', row: 'ranged', abilities: ['medic'], isHero: false, description: 'Połata cię za kilka monet.' },
    { id: 'mercs_sword_1', name: 'Miecz do Wynajęcia', type: 'Unit', power: 5, faction: 'Najemnicy', row: 'melee', abilities: ['tight_bond'], baseId: 'mercs_sword', isHero: false, description: 'Lojalni tylko wobec złota.' },
    { id: 'mercs_sword_2', name: 'Miecz do Wynajęcia', type: 'Unit', power: 5, faction: 'Najemnicy', row: 'melee', abilities: ['tight_bond'], baseId: 'mercs_sword', isHero: false, description: 'Lojalni tylko wobec złota.' },

    // ==================================================================
    // === 4. KLASZTOR
    // ==================================================================
    { id: 'firemage_leader_corristo', name: 'Corristo', type: 'Leader', faction: 'Klasztor', abilities: ['hero_double_weather_damage'], description: 'Wszystkie efekty pogodowe na planszy zadają podwójne obrażenia.' },
    { id: 'firemage_hero_1', name: 'Xardas', type: 'Unit', power: 10, faction: 'Klasztor', row: 'ranged', abilities: [], isHero: true, description: 'Wiedza to potęga.' },
    { id: 'firemage_novice_1', name: 'Nowicjusz Ognia', type: 'Unit', power: 2, faction: 'Klasztor', row: 'ranged', abilities: ['medic'], isHero: false, description: 'Nawet najmniejsza iskra może rozpalić wielki ogień.' },
    { id: 'firemage_healer_1', name: 'Uzdrowiciel', type: 'Unit', power: 3, faction: 'Klasztor', row: 'ranged', abilities: ['clear_weather'], isHero: false, description: 'Ogień oczyszcza, ogień leczy.' },
    { id: 'firemage_fireball_1', name: 'Kula Ognia', type: 'Special', faction: 'Klasztor', abilities: ['scorch_strongest'], description: 'Spopiela najsilniejszego przeciwnika na polu bitwy.' },
    { id: 'firemage_mage_1', name: 'Mag Ognia', type: 'Unit', power: 6, faction: 'Klasztor', row: 'ranged', abilities: [], isHero: false, description: 'Władca płomieni.' },
    { id: 'firemage_mage_2', name: 'Mag Ognia', type: 'Unit', power: 6, faction: 'Klasztor', row: 'ranged', abilities: [], isHero: false, description: 'Władca płomieni.' },

    // ==================================================================
    // === 5. ORKOWIE
    // ==================================================================
    { id: 'orcs_leader_warchief', name: 'Wódz Orków', type: 'Leader', faction: 'Orkowie', abilities: ['hero_power_equals_unit_count'], description: 'Jego siła jest równa liczbie wszystkich jednostek na twojej planszy.' },
    { id: 'orcs_hero_1', name: 'Ur-Shak', type: 'Unit', power: 10, faction: 'Orkowie', row: 'melee', abilities: [], isHero: true, description: 'Honor i siła!' },
    { id: 'orcs_warrior_1', name: 'Orkowy Wojownik', type: 'Unit', power: 6, faction: 'Orkowie', row: 'melee', abilities: ['tight_bond'], baseId: 'orcs_warrior', isHero: false, description: 'Więcej nas, więcej siły!' },
    { id: 'orcs_warrior_2', name: 'Orkowy Wojownik', type: 'Unit', power: 6, faction: 'Orkowie', row: 'melee', abilities: ['tight_bond'], baseId: 'orcs_warrior', isHero: false, description: 'Więcej nas, więcej siły!' },
    { id: 'orcs_axeman_1', name: 'Orkowy Topornik', type: 'Unit', power: 5, faction: 'Orkowie', row: 'melee', abilities: ['muster'], baseId: 'orcs_axeman', isHero: false, description: 'Zew bitwy wzywa braci!' },
    { id: 'orcs_axeman_2', name: 'Orkowy Topornik', type: 'Unit', power: 5, faction: 'Orkowie', row: 'melee', abilities: ['muster'], baseId: 'orcs_axeman', isHero: false, description: 'Zew bitwy wzywa braci!' },
    { id: 'orcs_shaman_1', name: 'Szaman', type: 'Unit', power: 4, faction: 'Orkowie', row: 'ranged', abilities: ['medic'], isHero: false, description: 'Duchy przodków nas poprowadzą.' },
    { id: 'orcs_berserker_1', name: 'Berserker', type: 'Unit', power: 4, faction: 'Orkowie', row: 'melee', abilities: ['Moc'], transformId: 'orcs_vildkaarl', isHero: false, description: '' },
    { id: 'orcs_vildkaarl', name: 'Vildkaarl', type: 'Unit', power: 8, faction: 'Orkowie', row: 'melee', abilities: [], isHero: false, isToken: true, description: '' },

    // ==================================================================
    // === 6. BANDYCI
    // ==================================================================
    { id: 'bandits_leader_raven', name: 'Raven', type: 'Leader', faction: 'Bandyci', abilities: ['hero_steal_unit'], description: 'Przenieś jedną nie-bohaterską jednostkę przeciwnika na swoją stronę.' },
    { id: 'bandits_hero_1', name: 'Thorus', type: 'Unit', power: 10, faction: 'Bandyci', row: 'melee', abilities: [], isHero: true, description: 'W obozie panują moje zasady.' },
    { id: 'bandits_spy_1', name: 'Szpion Bandytów', type: 'Unit', power: 1, faction: 'Bandyci', row: 'ranged', abilities: ['spy'], isHero: false, description: 'Twoje sekrety są moimi skarbami.' },
    { id: 'bandits_archer_1', name: 'Łucznik Bandytów', type: 'Unit', power: 4, faction: 'Bandyci', row: 'ranged', abilities: ['scorch_row'], isHero: false, description: 'Zawsze celuje w najsłabszych.' },
    { id: 'bandits_thug_1', name: 'Oprych', type: 'Unit', power: 5, faction: 'Bandyci', row: 'melee', abilities: ['tight_bond'], baseId: 'bandits_thug', isHero: false, description: 'Razem jesteśmy silniejsi.' },
    { id: 'bandits_thug_2', name: 'Oprych', type: 'Unit', power: 5, faction: 'Bandyci', row: 'melee', abilities: ['tight_bond'], baseId: 'bandits_thug', isHero: false, description: 'Razem jesteśmy silniejsi.' },
    { id: 'bandits_decoy_1', name: 'Podstęp', type: 'Special', faction: 'Bandyci', abilities: ['decoy'], description: 'Nasz najlepszy trik.' },

    // ==================================================================
    // === 7. NIEUMARLI
    // ==================================================================
    { id: 'undead_leader_seeker', name: 'Poszukiwacz', type: 'Leader', faction: 'Nieumarli', abilities: ['hero_resurrect_from_opponent_graveyard'], description: 'Wskrześ 2 jednostki z cmentarza przeciwnika po swojej stronie z siłą 1.' },
    { id: 'undead_hero_1', name: 'Smok Ożywieniec', type: 'Unit', power: 10, faction: 'Nieumarli', row: 'ranged', abilities: [], isHero: true, description: 'Nawet śmierć go nie powstrzyma.' },
    { id: 'undead_skeleton_1', name: 'Szkielet', type: 'Unit', power: 1, faction: 'Nieumarli', row: 'melee', abilities: ['muster_from_graveyard'], baseId: 'undead_skeleton', isHero: false, description: 'Śmierć to dopiero początek.' },
    { id: 'undead_skeleton_2', name: 'Szkielet', type: 'Unit', power: 1, faction: 'Nieumarli', row: 'melee', abilities: ['muster_from_graveyard'], baseId: 'undead_skeleton', isHero: false, description: 'Śmierć to dopiero początek.' },
    { id: 'undead_skeleton_3', name: 'Szkielet', type: 'Unit', power: 1, faction: 'Nieumarli', row: 'melee', abilities: ['muster_from_graveyard'], baseId: 'undead_skeleton', isHero: false, description: 'Śmierć to dopiero początek.' },
    { id: 'undead_necromancer_1', name: 'Nekromanta', type: 'Unit', power: 3, faction: 'Nieumarli', row: 'ranged', abilities: ['medic'], isHero: false, description: 'Powstań, sługo!' },
    { id: 'undead_zombie_1', name: 'Zombie', type: 'Unit', power: 6, faction: 'Nieumarli', row: 'melee', abilities: ['special_power_decay'], isHero: false, description: 'Silny, ale nietrwały. Rozpada się z każdą chwilą.' },
    { id: 'undead_ghost_1', name: 'Duch', type: 'Unit', power: 2, faction: 'Nieumarli', row: 'ranged', abilities: [], isHero: false, description: 'Przenika przez mury, by cię dopaść.' },
];
