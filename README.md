# Ryżowy Książę – kalkulator gry (stan na 2026-10-13, wersja 2026-10-13m)

Przeglądarkowy kalkulator punktów do gry fizycznymi kartami, dla dwóch graczy na jednym ekranie. Gracze wybierają karty z arkusza wyboru (brak talii i ręki).
Pliki: `cards.js` (375 kart wg Karty_RL.xlsx), `script.js` (logika), `ui.js` (warstwa interfejsu pod telefon), `index.html`, `style.css`.
Źródło zasad: Instrukcja_RK_2.2.pdf (zasady z instrukcji mają pierwszeństwo przed zasadami na kartach).

## Cel projektu (ważne)
To NIE jest gra komputerowa, tylko **kalkulator przy stole** do grania fizycznymi kartami. Ma ułatwiać liczenie punktów.
- Program nie losuje, nie tasuje i nie wymienia kart – to dzieje się fizycznie przy stole.
- Ruchy w programie odwzorowują ruchy fizyczne graczy, z zachowaniem zasad (kolejność tur, pasowanie, zdolności, koniec rundy).
- Brak talii, ręki, mulligana i limitów budowy talii (22 jednostki, max 10 kart efektów) jest więc celowy, a nie brakiem do uzupełnienia.
- Główne urządzenie: telefon lub tablet leżący na stole.

## Co działa (przetestowane: 44 scenariusze + ok. 400 losowych partii + 28 testów interfejsu)
- Jedność (tight_bond), Wzmocnienie (morale), Róg wojenny (karta i jednostka Lester), pogoda (Lodowa fala, Grom, Rój owadów, Strach, Magia Braci), Światło.
- Wezwanie (muster) z wyjątkami master/slug (Czarny wilk, Hosh-Pak, Saturas).
- **Wezwanie z wyborem kart (2026-10-11):** po zagraniu karty z Wezwaniem otwiera się lista kart z grupy, które kalkulator może dołożyć (domyślnie wszystkie zaznaczone). Gracz odznacza te, których fizycznie nie kładzie; jest przycisk „Zaznacz/Odznacz wszystkie” i „Połóż wybrane (n)” / „Nie kładę żadnej”. Niewybrane karty zostają w puli. Zamknięcie listy nie kończy ruchu – w pasku jest przycisk „Wybierz karty”. W `script.js`: tryb `isMusterModeActive` + `confirmMuster(ids)`; bez `ui.js` przywoływana jest cała grupa.
- **Cofanie i powtarzanie ruchu (2026-10-11):** przyciski „↶ Cofnij” i „Powtórz ↷” w nagłówku „Historia gry” (po prawej) oraz „Cofnij” w oknie końca gry. Nowy ruch kasuje możliwość „Powtórz”. Przed każdą akcją gracza `script.js` zapisuje migawkę całego stanu (`takeSnapshot`/`undoLastMove`, do 300 kroków). Cofa też koniec tury i koniec gry; ruchy dwuetapowe (medyk, Wezwanie) cofają się etapami (najpierw wraca wybór z cmentarza / wybór kart). Po cofnięciu pokazuje się komunikat „Cofnięto: …”.
- **Podsumowanie gry (2026-10-11):** po końcu gry okno z wynikiem, tabelą wyników tur i pełną historią (od początku) w polu tekstowym; przyciski „Kopiuj”, „Pobierz .txt”, „Cofnij ostatni ruch”, „Nowa gra”. Wyniki tur są w `roundResults`.
- **Róg (2026-10-11):** Rogu wojennego nie można położyć na rząd, w którym jest już róg – karta Rogu albo jednostka z umiejętnością rogu (np. Lester). Takie rzędy nie pojawiają się w wyborze.
- Nazewnictwo: w interfejsie i historii „Tura” zamiast „Runda” (pasek: „Tura 1”).
- Chrząszcz jako pierwszy ruch tury (np. na Demonie ognia na starcie tury) – wcześniej nie dało się wybrać celu; poprawione 2026-10-11.
- Leczenie (medyk), karty zwinne, szpiedzy, Chrząszcz, Deszcz ognia (globalny i szeregowy).
- Moc / Wyzwolenie siły (Ulu-Mulu wg wybranego rzędu, Orkowy treser tylko w swoim rzędzie).
- Xardas -> Demon ognia, Orkowa mapa wojenna -> Herszt orków (po zniszczeniu i po rundzie). Tokeny trafiają na cmentarz i można je wskrzesić.
- Dowódca: raz na całą grę, osobna kopia dla każdego gracza (sama zdolność to jeszcze alert).
- Koniec rundy: wszystkie karty z pola (też bohaterowie, róg, Chrząszcz, szpiedzy przeciwnika) idą na cmentarz gracza, na którego polu leżały.
- Poprawione blokady tury (medyk po paście przeciwnika, pasowanie w trybie Chrząszcza) i kolizje ID instancji.

## Kreator talii (wersja 2026-10-14a)
- Przycisk **Talie** w prawym górnym rogu ekranu startowego otwiera podstronę (adres `#talie`, działa przycisk „wstecz” przeglądarki).
- Lista zapisanych talii pogrupowana wg frakcji: edycja, kopia, usuwanie (dwa dotknięcia). Zapis w `localStorage` pod `rk-decks`.
- Edytor: nazwa, frakcja (zmiana frakcji usuwa karty starej frakcji, neutralne zostają), wyszukiwarka, filtry (W talii / Jednostki / Bohaterowie / Specjalne / Frakcyjne / Neutralne), wiersz na kartę z licznikiem kopii `− n/max +`.
- Liczniki „Jednostki X/22” i „Karty specjalne Y/10” (przyklejone u góry). Jednostki < 22 albo specjalne > 10 → licznik czerwony i przycisk **Zapisz** zablokowany; pod spodem powód. Bohaterowie liczą się do jednostek, karty doborowe (tokeny) nie trafiają do talii.
- Przycisk talii obok frakcji wybiera talię gracza: „Wszystkie karty” albo zapisana, kompletna talia tej frakcji (`rk-deck-pick-<n>`). Pod frakcją widać nazwę wybranej talii. Na start gry ręka = karty z talii.
- Stare wybory kart (`rk-deck-<n>-<frakcja>`) są przenoszone do listy talii jako „Talia gracza n – frakcja”.
- Opisy zdolności: Nieumarli – zwykłe dobranie karty z talii (może być bohater); Bandyci – dobranie losowej poległej karty przeciwnika do ręki, jednostki **i bohaterowie** (bez kart specjalnych).

## Wskrzeszanie a umiejętności (wersja 2026-10-13m)
Przy wskrzeszeniu Leczeniem działają: Leczenie (łańcuch), Szeregowy deszcz ognia, Deszcz ognia, Szpieg, Mobilność; Jedność/Wzmocnienie/Róg/Moc liczą się same. Wezwanie po wskrzeszeniu nie przyzywa z ręki i talii; dla Nieumarłych jest wariant „Wezwanie z cmentarza” (reszta grupy wraca z cmentarza). Kuchnia polowa i zdolność Orków kładą karty bez uruchamiania umiejętności. (Dodana w 13l osobna opcja „Wezwanie po wskrzeszeniu” z ręki i talii została usunięta – decyzja 2026-10-13: chodziło o wariant z cmentarza.)

## Leczenie: wybór i łańcuch (wersja 2026-10-13k)
- Okno Leczenia jak przy Wezwaniu: kliknięcie tylko zaznacza kartę, wskrzesza przycisk „Wskrześ: …” (albo „Pomiń wskrzeszenie”).
- Łańcuch: wskrzeszony medyk od razu wskrzesza dalej – ten sam gracz, okno cmentarza otwiera się ponownie (`finishResurrection` w `script.js`). Ruch przechodzi na przeciwnika dopiero po ostatnim wskrzeszeniu albo pominięciu. Wcześniej tryb wskrzeszania przechodził na przeciwnika (otwierał się jego cmentarz).
- W trakcie wskrzeszania nie da się spasować; nowa tura zawsze kasuje tryb wskrzeszania.

## Zdolności talii bez edycji + koncept edycji umiejętności kart (wersja 2026-10-13j)
- Zdolności talii (Ustawienia umiejętności → talia) można już tylko włączać i wyłączać – usunięta edycja nazw, opisów, parametrów i własne zdolności (decyzja 2026-10-13: „edycja” miała dotyczyć umiejętności kart). `normalizeRules` zostawia tylko wł./wył.; zapisane wcześniej zmiany nazw/parametrów są pomijane. Parametry w `ABILITY_DEFS` zostają (wartości z instrukcji), logika `customReminders` jest nieużywana.
- Nowy widok „Edycja umiejętności” (przycisk w sekcji „Umiejętności kart”) – **koncept**: lista umiejętności kart (Jedność, Wzmocnienie, Róg, Leczenie, Szpiegostwo, Mobilność, Wezwanie, Szeregowy deszcz ognia, Deszcz ognia, Chrząszcz, Moc/Wyzwolenie siły, przemiana po zniszczeniu) z propozycjami ustawień (`CARD_ABILITY_CONCEPT` w `ui.js`). Kontrolki są wyłączone i nic nie zapisują – do decyzji, które ustawienia mają działać.

## Karty wg tabeli kart (wersja 2026-10-13h)
Statystyki porównane z tabelą wszystkich kart (obraz od użytkownika) i poprawione w `cards.js` i `Karty_RL.xlsx` (arkusz „Zmiany”):
- Karty dodatkowe (beżowe w tabeli; w kodzie `isToken: true` – status bez zmian): uzupełniona siła i rząd – Bilgot 2, Abuyin 3, Peck 4, Preriowy ścierwojad 4, Jaszczuroczłek 5, Topielec spod tamy 5, Pandrodor/Feodaron/Pedrakhan/Finkregh 10 (bohaterowie), Baloro 3 (dystans), Okyl 6, Sergio 5, Ork niewolnik 2 i Ogar 4 (wręcz), Wódz hordy 7 (dystans), Quentin 3 (dystans), Varrag-Kasorg/Unhilqt/Ruuushk 5 (wręcz/dystans, Mobilność), Kamienny strażnik 5, Grimes 3, Gestath 5 i golemy 5 (oblężnicze).
- Zwykłe karty: Parlan 4 (dystans), Isgaroth i Marduk – Mobilność (wręcz/dystans), Gorax i Jorgen – nie są bohaterami, Orkowy bębniarz – Róg (zamiast Wzmocnienia).
- Pisownia: Abuyin, „Wiesz jak często pada tu deszcz?” (id bez zmian).
- Goblin wojownik: rola `slug` (jak pozostałe gobliny). Zasada ról: master przyzywa całą swoją grupę (grupa z `*` – wszystkie slugi tej talii), slug i karta bez roli przyzywają tylko karty swojej grupy bez mastera.
- Bez zmian mimo tabeli: Xardas (zamiana w Demona Ognia – instrukcja), Szkielet goblin i Ork wojownik (Wezwanie – instrukcja str. 18 wymienia je wśród kart z Wezwaniem; Hosh-Pak przyzywa orków wojowników).

## Podsumowanie i tryb turniejowy (wersja 2026-10-13g)
- Okno podsumowania: tabela tur bez kolumny „Wygrał” (zwycięzca tury jest wyróżniony w swojej kolumnie). Historia gry domyślnie ukryta; przyciski **Pokaż/Ukryj · Kopiuj · Zapisz** (Zapisz = plik .txt).
- **Tryb turniejowy** (Ustawienia umiejętności → Zasady ogólne; `RULES.general.tournament`, instrukcja str. 6): gdy mecz kończy się remisem (obaj tracą ostatni kryształ), obaj dostają po 1 krysztale i grają dodatkową rundę (w historii: „przetasujcie talie, każdy wykłada po 4 karty”); kolejny remis – kolejna runda. Wliczany do zmian, zestawów, zapisu partii i podsumowania.

## Karty przewodnie – efekty (wersja 2026-10-13f)
Kalkulator wykonuje teraz efekty kart przewodnich (instrukcja str. 11–13). `LEADER_EFFECTS` w `script.js`, `leaderUsable(p)` (czy można + powód), `useLeader(p, payload)`, w `ui.js` `startLeader(pl)` (okna wyboru) i `LEADER_HOW` (opis w oknie dowódcy). Użycie dowódcy to ruch (oddaje turę), raz na grę.
- Podwojenie rzędu do końca tury, jak Róg wojenny (decyzja 2026-10-13): Oko Innosa (oblężnicze), Żądza krwi i Mroczny rytuał (wręcz), Święta Aura Innosa (dystans). Kładzione w polu rogu (`isLeaderHorn`), po turze znika, nie trafia na cmentarz; nie można użyć, gdy w rzędzie jest już róg (karta albo jednostka jak Lester) i odwrotnie – po nim nie położysz Rogu.
- Szeregowy deszcz ognia na rząd przeciwnika (z progiem 10): Zastępy Innosa (oblężnicze), Innos Pan Ognia (dystans), Święty Młot Innosa, Ukryci wśród drzew, Moc Dworu Irdorath (wręcz).
- Święty płomień: usuwa runy (jak Światło); nie da się użyć, gdy na planszy nie ma run.
- Runy z talii – tylko gdy runa jest w talii gracza (decyzja): Nie boję się, gdy ciemno jest (Rój owadów), Wiesz jak często pada tu deszcz? (Grom), Tarcza Dominique (Lodowa fala), Zew puszczy (wybór: Światło / Lodowa fala / Grom / Rój owadów). Karta znika z talii, trafia na planszę i cmentarz jak zagrana runa.
- Instynkt stadny: jednostka ze swojego cmentarza na stół jak Leczenie – działa jej umiejętność (decyzja).
- Właściciel Ziemski: jednostka z cmentarza przeciwnika do ręki (wybór).
- Kuchnia polowa: po jednej jednostce z cmentarza każdego gracza wraca na jego planszę (wybór albo „Losuj”).
- Wojna totalna: cały cmentarz przeciwnika trafia do `destroyed` – nie do wskrzeszenia.
- Zew hordy: kąsacze → wściekłe kąsacze, wiarusi → fanatyczni wiarusi (bazowe karty znikają, nie na cmentarz).
- Klasztorny rygor: wybrane jednostki z Mobilnością przechodzą do drugiego rzędu.
- Selekcja naturalna, Szybki zwiad: efekt przy stole – przypomnienie w historii.
- Pasywne: Drzewa mają uszy (wszyscy szpiedzy ×2, krok w „wyjaśnieniu siły”), Beliar z nami (pogoda ÷2), Nabór nowicjuszy i Wrota piekieł (przypomnienie o 11 kartach na starcie).
- Układy i Chłopcy z Kolonii: karta przewodnia przeciwnika nie działa wcale – także pasywna (decyzja 2026-10-13); gdy obaj mają takie karty, obie są zablokowane. Informacja w historii na starcie i w oknie dowódcy.

## Narożnik bohatera (wersja 2026-10-13e)
Jak na kartach: tylko bohater ma szeroki, rzeźbiony złoty narożnik (`.cf-orn`, maska: pas u góry + pas z lewej + tarcza za kółkiem siły); jego szarfa zaczyna się pod narożnikiem. Zwykła karta: kółko siły ze srebrnym pierścieniem i dwoma małymi zdobieniami (`.cf-power::before/::after`), szarfa biegnie od górnej krawędzi za kółkiem.

## Załamanie szarfy (wersja 2026-10-13d)
Koniec szarfy jak na kartach: tuż przed metalową listwą tablicy (jeszcze na ilustracji) szarfa skośnie przesuwa się w lewo – uskok o szerokość jasnego brzegu kończy się na górnej krawędzi listwy – potem przechodzi przez listwę i dalej biegnie z herbem w cienkim białym pierścieniu i kończy szpicem; jasne brzegi biegną wzdłuż całego kształtu, także szpica. Kształt to SVG w `.cf-sash-end` (viewBox 152×340 = 15,2×34 cqw, start 5,2cqw nad tablicą); główna szarfa `.cf-sash` kończy się tam, gdzie zaczyna się załamanie. Szarfa: ciemny kolor talii (`--sash-dark`) z jasnymi brzegami (`--sash-edge`).

## Kółko szeregu (wersja 2026-10-13b)
Jak na kartach: jednostka, która może stać w kilku rzędach, ma jedno niebieskie kółko szeregu z obiema ikonkami (wariant z osobnymi kółkami z wersji 13a został wycofany). Rozmiary kółek jak w 12l (siła 21cqw, pozostałe 18cqw). Symbol Mobilności: ↕ (jak na kartach). Herb na końcu szarfy jest okrągły.

## Wygląd karty wg prawdziwych kart (wersja 2026-10-12l)
Wzorowane na zdjęciu kart: gruba czarna ramka (złota u bohatera), metalowy narożnik i pierścień wokół kółka siły (złote u bohatera; karty specjalne bez ornamentu), siła na jasnym, kamiennym krążku z ciemną liczbą (zielony/czerwony, gdy zmieniona), szereg – niebieskie kółko, umiejętności – ciemne kółka z metalowym pierścieniem. Szarfa: ciemny kolor talii z jaśniejszymi brzegami, schodzi na tablicę z „załamaniem” (cień zagięcia), kończy się herbem talii i szpicem. Herby zastępcze to proste znaczki SVG (`EMBLEM_SVG` w `ui.js`); grafiki: `grafiki/herby/<talia>.png` (`CARD_ART.emblem`). Tablica: pergamin z metalową listwą u góry, ciemna nazwa i cytat. Wymiary elementów w jednostkach `cqw` (procent szerokości karty) – karta skaluje się w całości. Karta przewodnia w oknie dowódcy ma tę samą pergaminową tablicę.

## Wygląd kart bez szarfy (wersja 2026-10-12k)
Jak na prawdziwych kartach: szarfę w kolorze talii mają tylko jednostki talii. Neutralne jednostki i karty specjalne/pogody (Chrząszcz, Róg wojenny, Deszcz ognia, runy) nie mają szarfy – kółka zostają w lewym górnym rogu, tablica z nazwą na całą szerokość. Karta specjalna ma jedno kółko z symbolem (pogoda – symbol runy, inne – umiejętność). Klasa `.no-sash` na `#cf-frame`.

## Ustawienia umiejętności (wersja 2026-10-12j)
Na ekranie startowym przycisk **⚙ Ustawienia umiejętności: …** (status: „instrukcja”, nazwa zestawu albo „własne (N zmian)”). Okno ma trzy poziomy:
1. **Lista talii** + zestawy ustawień (wybór z listy, „Zapisz” pod nową nazwą, „Usuń”, „Przywróć instrukcję”). Przy każdej talii: ile zdolności jest aktywnych i ile zmian.
2. **Strona talii**: wszystkie zdolności tej talii – z instrukcji (domyślnie wł.), propozycje (domyślnie wył.) i własne – każda z przełącznikiem i przyciskiem ✎. „+ Dodaj własną zdolność”, „Przywróć instrukcję talii”. Zdolności z tej samej grupy wykluczają się (Khorinis: remis = tura / remis = mecz).
3. **Edycja zdolności**: nazwa, opis, parametry (suwaki / lista / przełącznik), podgląd. W opisie `{klucz}` wstawia wartość, `{klucz|kartę|karty|kart}` liczbę z odmianą. Własne zdolności: kalkulator nie zna ich działania – pokazuje je w oknie talii i przypomina w historii (start gry / start każdej tury / po wygranej / po przegranej / po remisie / bez przypomnienia).

Definicje: `ABILITY_DEFS` w `script.js` (id, talia, pochodzenie, domyślnie wł./wył., nazwa, opis, parametry). Stan: `RULES = { abilities: { id: { on, params, name, desc } }, custom: [...] }` – zapisywane są tylko zmiany względem instrukcji (`rk-rules`, zestawy w `rk-rule-presets`). Pomocnicze: `abilityInfo(id)`, `abOn(id)`, `abP(id, klucz)`, `hasAbility(gracz, id)`, `fillAbilityText`.
Zdolności i parametry:
- Khorinis: `khorinis_draw` (instr.) remis = wygrana tury; `khorinis_draw_match` (propozycja) remis = wygrana meczu (Khorinis vs Khorinis – zwykły remis).
- Potwory: `potwory_keep` – ile kart zostaje (1–3, instr. 1).
- Najemnicy: `najemnicy_mulligan` – o ile kart więcej przy wymianie (1–3, instr. 1; przypomnienie).
- Klasztor: `klasztor_skip` – ile razy (1–3) na grę / turę (instr. 1 na grę); `klasztor_agile_weather` (propozycja) – Mobilność pod pogodą × mnożnik (2–4) po efekcie pogody.
- Orkowie: `orkowie_revive` – ile kart (1–4, instr. 2) i w której turze (2–3, instr. 3); `orkowie_beliar` – dowódca Beliar z nami: pogoda dzieli siłę przez 2 (instr.; wcześniej kalkulator tego nie liczył).
- Bandyci: `bandyci_steal` – ile kart (1–3, instr. 1), czy remis = przegrana (instr. tak).
- Nieumarli: `nieumarli_draw` – ile kart po wygranej (1–3, instr. 1; przypomnienie); `nieumarli_muster_grave` (propozycja) – wskrzeszona jednostka z Wezwaniem zabiera z cmentarza resztę swojej grupy.
Ustawienia są stałe przez całą partię: zapisywane w zapisie partii, wypisane w historii na starcie (gdy różne od instrukcji) i w podsumowaniu .txt („Umiejętności: …”). Okno zdolności talii w grze pokazuje tylko włączone zdolności (z nazwami i opisami z ustawień).
Nowa zaprogramowana zdolność = wpis w `ABILITY_DEFS` + warunek `hasAbility(...)` w logice (+ ewentualnie `ABILITY_HOW` w `ui.js`).

## Zmiany 2026-10-12 (wersja 2026-10-12h)
- **Nazwa rozgrywki:** podtytuł na ekranie startowym to pole tekstowe (`#event-input`, zapamiętywane w `rk-event`), np. „Turniej 2026 – ćwierćfinał”. Trafia do podsumowania („Rozgrywka: …”), do okienka wznowienia i do nazwy pliku. Razem z informacją, czy imiona zostały wpisane, jest zapisywana w zapisie partii (`meta`).
- **Nazwa pliku .txt:** `[nazwa rozgrywki]_[nick1-vs-nick2]_RRRR-MM-DD_GG-MM.txt` – części pomijane, gdy puste (nicki tylko, gdy wpisano choć jedno imię); bez polskich znaków i spacji. Bez żadnej z nich: `ryzowy-ksiaze_RRRR-MM-DD_GG-MM.txt`.
- **Ekran startowy:** talia ustawiana kwadratowym przyciskiem ⚙ obok wyboru frakcji; własna talia = podświetlony przycisk z plakietką liczby kart, szczegóły w podpowiedzi (title).
- **Okno zdolności talii:** u góry podgląd rewersu karty (kolor talii, kratka, ramka, emblemat – bez napisów), pod nim (w poziomie obok) podpis: nazwa talii, opis, przycisk Użyj. Grafika rewersu: `grafiki/rewersy/<frakcja>.webp` (`CARD_ART.back`).
- **Okno karty przewodniej:** podgląd karty bez szarfy – grafika (`grafiki/karty/<id dowódcy>.webp`), nazwa i podpis (opis zdolności) zamiast cytatu; zużyta karta jest wyszarzona.
- **Proporcje kart 63 × 88 mm** (widok karty ze stołu, rewers, karta przewodnia) – zachowane także na niskich ekranach.
- Widok karty: wszystko pod kartą (w poziomie – obok karty) siedzi w jednej zwartej kolumnie `.cf-info`; wcześniej w poziomie opisy rozkładały się na wysokość karty (siatka dzieliła ją na wiersze), więc karty z mniejszą liczbą opisów wyglądały na „rozsiane”. Nazwa karty przesunięta tuż pod ilustrację.
- Widok karty: nazwa w stałym polu u góry tablicy (1–2 linie), cytat zawsze zaczyna się w tym samym miejscu pod nią – oba wyśrodkowane w poziomie. Kółka (siła, szereg, umiejętności) wyśrodkowane na szarfie. Wyliczenie siły bez tytułu „Dlaczego N punktów?” – sama lista kroków w kolejności liczenia: siła bazowa → pogoda (=1) → Jedność (×n) → Wzmocnienie (+n) → Róg (×2); obok każdego kroku wynik po nim. Grupowanie Jedności w wyjaśnieniu używa tego samego klucza co liczenie siły.
- Poprawki widoku karty: nazwa i cytat bez ramek, wyśrodkowane (pusty cytat jest ukryty); wskazówka o powiązanych kartach („Jedność z: …”) pod kartą zamiast na tablicy; usunięta linijka „talia · na polu: gracz”; trójkąt w narożniku tylko u bohatera (złoty), zwykła karta nie ma trójkąta.
- Potwierdzone decyzje: remis to dla Bandytów przegrana runda (biorą kartę z cmentarza przeciwnika); pominięcie tury Klasztoru – raz na grę.
- **Widok karty wg „Struktury karty” z instrukcji:** 1. Ramka (u bohatera złota, razem z narożnikiem), 2. Siła – koło (zielone/czerwone, gdy zmieniona), 3. Postać – górne ~70% karty (na razie kolor talii + inicjał), 4. Szereg – koło z symbolem rzędu, 5. Umiejętności – kolejne koła pod szeregiem (symbole ⛓ ⬆ ⚑ ✚ 👁 ⇄ 🔥 📯 🪲 ♻ ϟ ✦ albo grafiki z `CARD_ART`), 6. Pasek – pionowa szarfa w kolorze talii zakończona szpicem, 7. Nazwa + wskazówka o powiązanych kartach („Jedność z: …”, „Wzywa: …”, „Zamienia się w: …”, „Działa na: …”), 8. Tablica – dolna płyta z żelazną (u bohatera złotą) obwódką, 9. Opis – cytat dekoracyjny (puste pole czeka na tekst). Talia i miejsce na stole są pod kartą.
- **Pełny widok karty:** kliknięcie (albo prawy przycisk) karty na stole – w rzędzie, w polu rogu albo pogody – otwiera kartę w dużym formacie: siła (zielona/czerwona, gdy zmieniona), rząd, ilustracja, umiejętności, nazwa, talia, opis dekoracyjny, objaśnienia umiejętności i rozwinięta sekcja „Dlaczego N punktów?” (bazowa → pogoda → Jedność → Wzmocnienie → Róg). Bohater ma złotą ramkę. W trybie wyboru celu Chrząszcza kliknięcie nadal wybiera cel. Zastąpiło to wcześniejsze „przytrzymaj kartę”.
- **Miejsca na grafiki:** w `ui.js` obiekt `CARD_ART` – po ustawieniu `enabled: true` ilustracje są brane z `grafiki/karty/<id karty>.webp`, a ikony umiejętności z `grafiki/umiejetnosci/<klucz>.png` (np. `tight_bond.png`, `morale_boost.png`). Brak pliku = wygląd zastępczy (kolor talii + inicjał, nazwa umiejętności). Opis dekoracyjny – pole `description` w `cards.js`.
- Nazwy umiejętności w interfejsie jak w instrukcji: „Jedność” (zamiast „Więź”), „Mobilność” (zamiast „Zwinna”).
- **Stan gracza kolorem zamiast znacznika** (`turn-badge` ukryty): gracz z ruchem – panel wypełniony kolorem talii z poświatą (plansza też obwiedziona); czekający – neutralny, przygaszony; spasował – szary, kreskowany, dopisek „· pas” przy imieniu. Ten sam język w pasku wyniku.
- **Suma w stałym polu na 3 cyfry** (`.sb-total`, `.ps-total`: szerokość 3,1ch, wyśrodkowana, ciemne tło) – liczba nie przesuwa się przy 1/2/3 cyfrach. W pionie sumy stoją przy środku paska („42 | 38”), w poziomie – po prawej w wierszu gracza.
- Usunięty numer tury z paska wyniku (`sb-round`) – widać po kryształach; numer tury jest w komunikacie na starcie tury, w historii i w podsumowaniu.
- Telefon poziomo (niski ekran): kryształy i suma są w nagłówku panelu każdego gracza (`.ps-score`); pasek wyniku pojawia się tylko z komunikatem trybu (Chrząszcz, medyk, Wezwanie, zdolności talii).
- Arkusz wyboru kart w poziomie: dwie kolumny – po lewej wyszukiwarka, sortowanie i filtry, po prawej lista kart (2 kolumny, od 1100 px 3).
- Nowe w arkuszu (wybór karty i edytor talii): filtry umiejętności (Więź, Wzmocnienie, Wezwanie, Medyk, Szpieg, Mobilność, Deszcz ognia, Róg, Moc/Wyzwolenie, Przywołanie, Chrząszcz – pokazywane tylko te, które są w kartach) oraz sortowanie: Grupami / A–Z / Siła ↓ / Siła ↑ (zapamiętywane).

## Paczka 2026-10-11 (wieczór)
- **Talia (opcjonalnie):** na ekranie konfiguracji przycisk „Talia: …” – zaznaczasz karty, które masz fizycznie (Zaznacz/Odznacz wszystkie, wyszukiwarka, filtry). Zapamiętywana w przeglądarce osobno dla gracza 1/2 i frakcji. W grze lista kart i Wezwanie biorą tylko karty z talii. Brak ustawienia = wszystkie karty.
- **Zapis partii:** stan gry zapisuje się sam w localStorage (z ostatnimi 15 krokami cofania). Po odświeżeniu/zamknięciu strony na ekranie startowym jest „Wznów grę” / „Usuń zapis”. Start nowej gry i „Nowa gra” w podsumowaniu kasują zapis. Ostrzeżenie przed zamknięciem strony usunięte (niepotrzebne).
- **Rozbicie siły:** przytrzymanie karty na planszy (albo prawy przycisk myszy) pokazuje wyliczenie: bazowa → pogoda → Jedność → Wzmocnienie → Róg, oraz umiejętności karty.
- **Podświetlenie zmian wyniku:** liczby przy rzędach i sumy błyskają na zielono/czerwono przy zmianie.
- **Komunikaty w aplikacji zamiast `alert()`** („Wybierz rząd!”, „W tym rzędzie działa już róg!”) – czerwony dymek.
- **Wibracje** (Android): krótka przy ruchu, dłuższa na koniec tury. iPhone nie obsługuje.
- **Układ poziomy** (komputer, tablet, telefon obrócony; `orientation: landscape` i szerokość ≥ 600 px): po lewej panel – od góry: wynik (sumy, kryształy), gracz 1, pogoda, gracz 2; po prawej pole bitwy – plansza gracza 1 nad planszą gracza 2, rzędy równej wysokości. Obie części mieszczą się na ekranie bez przewijania (sprawdzone: 844×390, 1024×768, 1366×768, 1920×1080); historia pod spodem. Na niskim ekranie (telefon) panel czekającego gracza jest zwinięty. Pasek wyniku jest w HTML wewnątrz lewej kolumny (na telefonie pionowo nadal przyklejony u góry).

## Panel gracza: przyciski talii i dowódcy (2026-10-11)
- Zamiast napisów „Frakcja: …” i „Dowódca: … [Użyj]” są dwa przyciski: „⚑ <talia>” i „♛ <karta przewodnia>”.
- Kliknięcie otwiera okno z opisem zdolności (teksty z instrukcji, str. 11–13 i 19) i przyciskiem „Użyj” – tylko gdy zdolność się aktywuje (Klasztor: przeczekanie; dowódcy aktywowani). Dowódcy pasywni i zdolności automatyczne mają tylko opis.
- „Użyj” dowódcy zaznacza użycie (raz na grę) i oddaje ruch – sam efekt gracze wykonują przy stole (zdolności dowódców nie są jeszcze liczone przez kalkulator). Usunięty stary `alert` „Implementacja w toku”.
- Przycisk świeci kolorem gracza, gdy można go użyć; po użyciu jest przekreślony.
- Czcionka nieco mniejsza: 14,5 px na telefonie, 15 px na szerokim ekranie.

## Kolory frakcji (2026-10-11)
Akcenty gracza (ramki panelu i planszy, imię, znacznik „Twój ruch”, pasek wyniku, nagłówki w podsumowaniu, ekran konfiguracji) mają kolor jego talii – z kolorów wierszy z nazwą talii w Karty_RL.xlsx:
Khorinis #E69138, Potwory #6AA84F, Najemnicy #4285F4, Klasztor #EA4335, Orkowie #FFFF00, Bandyci #999999, Nieumarli #9900FF (Neutralne #A61C00).
- Ustawia je `ui.js` (`FACTION_COLORS`, `applyFactionColors`) przez zmienne CSS `--p1/--p2`, `--pN-text` (rozjaśniona wersja do tekstu, np. fiolet Nieumarłych) i `--pN-on` (kolor tekstu na tle akcentu).
- Gdy obaj gracze mają tę samą talię, gracz 2 dostaje jaśniejszy (lub ciemniejszy) odcień.
- Kolory rzędów (wręcz/dystans/oblężnicze) bez zmian.

## Wersje plików (ważne przy publikacji)
- `index.html` ładuje pliki z dopiskiem wersji (`script.js?v=2026-10-13m` itd.), a `script.js` (`APP_VERSION`) i `ui.js` (`UI_VERSION`) mają ten sam numer. Przy każdej zmianie trzeba podbić numer we wszystkich trzech miejscach.
- Powód: 2026-10-11 po wgraniu nowych plików nie dało się zagrać żadnej karty – przeglądarka/GitHub Pages podawała stary `script.js` z pamięci, a nowy `ui.js` się na nim wywracał (nie powstawał przycisk wyboru karty). Teraz przy niezgodnych wersjach pokazuje się czerwony komunikat „Wczytały się pliki z różnych wersji” z przyciskiem „Odśwież”.
- Wgrywać zawsze komplet: `index.html`, `cards.js`, `script.js`, `ui.js`, `style.css`.

## Interfejs pod telefon (2026-10-10)
Nowy `ui.js` (ładowany po `script.js`) + przebudowane `index.html` i `style.css`. `ui.js` czyta stan i steruje ukrytymi listami `<select>` tymi samymi zdarzeniami co wcześniej.
- Układ telefonu: jedna kolumna w kolejności jak przy stole (panel gracza 1, plansza 1, pogoda, plansza 2, panel gracza 2). Od 900 px układ szeroki.
- Przyklejony pasek wyniku: imiona, kryształy, sumy, numer tury, czyja kolej i komunikat trybu (Chrząszcz / medyk / wybór rzędu / Wezwanie). Pasek „ostatnia akcja” i napis „Siła” przy sumie usunięte 2026-10-11.
- Wybór karty w arkuszu od dołu: wyszukiwarka, filtry (rząd, bohaterowie, specjalne, pogoda), te same karty zgrupowane z licznikiem (np. Zombie ×5).
- Rząd wybiera się dużymi przyciskami; przycisk „Zagraj: <karta>”.
- Medyk: cmentarz otwiera się sam, z opcją „Pomiń wskrzeszenie”. Cmentarz można też przeglądać przyciskiem „Cmentarz (n)”.
- Pasowanie wymaga drugiego dotknięcia (ochrona przed przypadkowym pasem).
- Sterowanie gracza, który czeka, jest zwinięte na telefonie.
- Imiona graczy na ekranie konfiguracji (pamiętane w localStorage).
- Blokada wygaszania ekranu (Wake Lock) w trakcie gry; ostrzeżenie przed zamknięciem karty w środku partii.
- Czcionka: `Gothic_II_NK.ttf` z repo („Gothic II – Noc Kruka”) – od 2026-10-11 w całej aplikacji (teksty, przyciski, listy, historia, podsumowanie). Ma polskie znaki; brakuje jej tylko symboli ✓ ↶ ↷ · (biorą się z czcionki systemowej). Jedna grubość – sztuczne pogrubianie wyłączone (`font-synthesis: none`). Gdy brak pliku – szeryfowa zastępcza. Pasek wyniku dopasowany do szerszej czcionki (360 px).

### Poprawione błędy wyglądu i UX
- Strona wychodziła poza ekran w poziomie (468 px przy 390 px).
- Na karty zostawało ok. 25% szerokości rzędu (siła całkowita + wynik + puste pole rogu po 50–90 px).
- Napisy rzędów na środku nachodziły na karty i były ucinane („Oblężnicze”).
- Sterowanie było ok. 1000 px nad planszą; nie było widać, czyja jest tura.
- Listy rozwijane z czcionką < 16 px powodowały automatyczne powiększanie na iPhonie.
- Historia nie miała `grid-area` i rosła bez ograniczenia; teraz zwijana, z limitem wysokości.
- Efekty `:hover` „przyklejały się” na ekranach dotykowych.
- Start gry bez wybranej frakcji/dowódcy był możliwy (`return alert` w `forEach` nie przerywał startu) – teraz przycisk jest nieaktywny do pełnej konfiguracji.
- Historia pokazywała angielskie nazwy rzędów („do rzędu siege”) – `ui.js` tłumaczy je w nowych wpisach.

## Zdolności talii (2026-10-11, instrukcja str. 19)
- **Khorinis** – remis w turze = wygrana Khorinis (gdy obaj grają Khorinis – zwykły remis). Automatycznie.
- **Potwory** – po każdej turze 1 karta Potworów (jednostka, nie bohater, nie neutralna) zostaje na planszy w następnej turze. Okno wyboru z przyciskiem „Losuj” (przy stole losuje sędzia), potem „Zatwierdź”.
- **Najemnicy** – dodatkowa wymiana karty na starcie: tylko przypomnienie w historii (dzieje się fizycznie).
- **Klasztor** – przycisk „Przeczekaj”: raz na grę oddaje ruch bez pasowania. Niedostępny, gdy przeciwnik już spasował.
- **Orkowie** – na starcie 3. tury 2 karty Orków z cmentarza wracają na planszę (okno wyboru + „Losuj”). Karty zwinne trafiają do pierwszego z rzędów.
- **Bandyci** – po przegranej turze (remis też liczy się jako przegrana) 1 karta z cmentarza przeciwnika (nie bohater) trafia do puli Bandytów – można ją zagrać.
- **Nieumarli** – po wygranej turze przypomnienie w historii: „dobierz 1 losową kartę z talii” (fizycznie).
- W `script.js`: `endRound` → `roundEndFlow` (kolejka wyborów przed i po sprzątaniu planszy) → `confirmFactionChoice(instanceIds)`; `canSkipTurn`/`skipTurn`. Bez `ui.js` wybór jest automatyczny (pierwsze karty).
- Wszystko działa z Cofnij/Powtórz.
- Decyzje do potwierdzenia: remis = przegrana dla Bandytów; przeczekanie Klasztoru raz na grę (nie raz na turę).

## Zostawione na później
- Zwycięzca rundy zaczyna następną (obecnie może zacząć każdy).
- Remis w rundzie: obaj gracze tracą kryształ; czwarta runda przy remisie meczu – opcjonalnie w trybie turniejowym.

## Decyzje (potwierdzone 2026-10-09)
- Mobilność (agile): rząd wybiera się przy zagrywaniu karty i przy jej wskrzeszeniu – tak działa kod.
- Ork szaman (`scorch`): Globalny deszcz ognia – zostaje.
- Szeregowy deszcz ognia: do progu 10 pkt wliczają się bohaterowie w rzędzie – zostaje.

## Uwagi do danych
- W `cards.js` zmieniono względem Excela: Najemnik x4 ma tight_bond, Ork wojownik x3 nie jest tokenem, dodano dowódcę Zastępy Innosa, usunięto Cavalorn_token, Goblin wojownik bez musterRole, Strach jako Weather, ID Barania_kielbasa_1..3, Grom ma `effectClass: 'rain-effect'` (poprawione w `cards.js` 2026-10-11, obejście w `ui.js` usunięte). Warto zsynchronizować Excel.

## Hosting (publikacja online)
Projekt to czysty HTML/CSS/JS bez backendu, więc wystarczy darmowy hosting statyczny.
- **Istniejące repozytorium: github.com/tytus42/RL** (publiczne, GitHub Pages włączone, adres **tytus42.github.io/RL/**). Trzeba podmienić `index.html`, `cards.js`, `script.js`, `style.css`, `ui.js` (i ew. `README.md`). W repo jest `Gothic_II_NK.ttf` – `style.css` z niej korzysta.
- Podmiana z telefonu: github.com w widoku na komputer -> Add file -> Upload files (pliki o tej samej nazwie są nadpisywane) -> Commit changes. Stare wersje zostają w historii commitów.
- Netlify Drop (app.netlify.com/drop) – szybka alternatywa na próbę.
- Wielkość liter w nazwach plików ma znaczenie na serwerze (`cards.js` != `Cards.js`).
- Serwer (WebSocket) potrzebny byłby dopiero przy grze przez sieć na osobnych urządzeniach – nie jest to cel projektu.

## Pomysły pod użycie przy stole (do zrobienia)
1. ~~Układ pod telefon/tablet~~ – zrobione 2026-10-10.
2. **Praca offline (PWA)**: `manifest.json` + prosty service worker, instalacja na ekranie głównym, działanie bez zasięgu.
3. **Zapis stanu w `localStorage`**: odświeżenie strony kasuje dziś całą partię (jest już ostrzeżenie przed zamknięciem, ale nie zapis).
4. ~~Cofnięcie ostatniego ruchu (undo)~~ – zrobione 2026-10-11.
5. Grafiki kart w arkuszu wyboru i na planszy (obecnie siła + nazwa).
