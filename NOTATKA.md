# Ryżowy Książę – kalkulator gry (stan na 2026-10-09)

Przeglądarkowy kalkulator punktów do gry fizycznymi kartami, dla dwóch graczy na jednym ekranie. Gracze wybierają karty z listy rozwijanej (brak talii i ręki).
Pliki: `cards.js` (375 kart wg Karty_RL.xlsx), `script.js` (logika), `index.html`, `style.css`.
Źródło zasad: Instrukcja_RK_2.2.pdf (zasady z instrukcji mają pierwszeństwo przed zasadami na kartach).

## Cel projektu (ważne)
To NIE jest gra komputerowa, tylko **kalkulator przy stole** do grania fizycznymi kartami. Ma ułatwiać liczenie punktów.
- Program nie losuje, nie tasuje i nie wymienia kart – to dzieje się fizycznie przy stole.
- Ruchy w programie odwzorowują ruchy fizyczne graczy, z zachowaniem zasad (kolejność tur, pasowanie, zdolności, koniec rundy).
- Brak talii, ręki, mulligana i limitów budowy talii jest więc celowy, a nie brakiem do uzupełnienia.
- Główne urządzenie: telefon lub tablet leżący na stole.

## Co działa (przetestowane: 44 scenariusze + ok. 400 losowych partii)
- Jedność (tight_bond), Wzmocnienie (morale), Róg wojenny (karta i jednostka Lester), pogoda (Lodowa fala, Grom, Rój owadów, Strach, Magia Braci), Światło.
- Wezwanie (muster) z wyjątkami master/slug (Czarny wilk, Hosh-Pak, Saturas).
- Leczenie (medyk), karty zwinne, szpiedzy, Chrząszcz, Deszcz ognia (globalny i szeregowy).
- Moc / Wyzwolenie siły (Ulu-Mulu wg wybranego rzędu, Orkowy treser tylko w swoim rzędzie).
- Xardas -> Demon ognia, Orkowa mapa wojenna -> Herszt orków (po zniszczeniu i po rundzie). Tokeny trafiają na cmentarz i można je wskrzesić.
- Dowódca: raz na całą grę, osobna kopia dla każdego gracza (sama zdolność to jeszcze alert).
- Koniec rundy: wszystkie karty z pola (też bohaterowie, róg, Chrząszcz, szpiedzy przeciwnika) idą na cmentarz gracza, na którego polu leżały.
- Poprawione blokady tury (medyk po paście przeciwnika, pasowanie w trybie Chrząszcza) i kolizje ID instancji.

## Zostawione na później
- Zdolności wszystkich dowódców (m.in. Zastępy Innosa, Oko Innosa, Zew hordy, Beliar z nami) – obecnie alert „Implementacja w toku".
- Zdolności 7 talii (str. 19 instrukcji): remis dla Khorinis, zostająca karta Potworów, dodatkowa wymiana Najemników, pominięcie tury Klasztoru, powrót 2 kart u Orków, dobór po przegranej Bandytów, dobór po wygranej Nieumarłych. (W kalkulatorze część z nich może sprowadzać się do przypomnienia dla graczy, bo karty dobierają fizycznie.)
- Zwycięzca rundy zaczyna następną (obecnie może zacząć każdy).
- Remis w rundzie: celowo bez zmian (obaj gracze tracą kryształ).

## Decyzje (potwierdzone 2026-10-09)
- Mobilność (agile): rząd wybiera się przy zagrywaniu karty i przy jej wskrzeszeniu – tak działa kod.
- Ork szaman (`scorch`): Globalny deszcz ognia – zostaje.
- Szeregowy deszcz ognia: do progu 10 pkt wliczają się bohaterowie w rzędzie – zostaje.

## Uwagi do danych
- W `cards.js` zmieniono względem Excela: Najemnik x4 ma tight_bond, Ork wojownik x3 nie jest tokenem, dodano dowódcę Zastępy Innosa, usunięto Cavalorn_token, Goblin wojownik bez musterRole, Strach jako Weather, ID Barania_kielbasa_1..3. Warto zsynchronizować Excel.

## Hosting (publikacja online)
Projekt to czysty HTML/CSS/JS bez backendu, więc wystarczy darmowy hosting statyczny.
- **Repozytorium: github.com/tytus42/RL**, strona: **tytus42.github.io/RL/** (GitHub Pages włączone). W repo jest też czcionka `Gothic_II_NK.ttf` – przyda się przy designie.
- **GitHub Pages** (rekomendowane na stałe): repozytorium, Settings -> Pages -> gałąź `main`. Adres `login.github.io/nazwa-repo`, aktualizacja po każdym pushu, historia zmian w gicie.
- **Netlify Drop** (najszybsze na próbę): app.netlify.com/drop, przeciągnąć folder `gwint`. Bez konta link jest tymczasowy.
- Cloudflare Pages / Vercel: też działają, ale dla tego projektu nic nie wnoszą ponad powyższe.
- Przed publikacją: plik startowy musi się nazywać `index.html` (jest), a wielkość liter w nazwach plików ma znaczenie na serwerze (`cards.js` != `Cards.js`).
- Serwer (WebSocket) potrzebny byłby dopiero przy grze przez sieć na osobnych urządzeniach – nie jest to cel projektu.

## Pomysły pod użycie przy stole (do zrobienia)
1. **Układ pod telefon/tablet**: obecnie jedna kolumna dopiero poniżej 900 px, listy rozwijane i małe karty na planszy są niewygodne na telefonie.
2. **Praca offline (PWA)**: `manifest.json` + prosty service worker, instalacja na ekranie głównym, działanie bez zasięgu.
3. **Zapis stanu w `localStorage`**: odświeżenie strony kasuje dziś całą partię, zapis ochroni przed przypadkowym zamknięciem karty w środku rundy.
4. **Cofnięcie ostatniego ruchu (undo)**: pomyłki w klikaniu przy odwzorowywaniu fizycznych ruchów będą się zdarzać.

## Następny temat: grafika i design (index.html + style.css)
Obecny wygląd jest tekstowy: karty to proste prostokąty z nazwą i siłą, bez grafik kart. Projektować z myślą o telefonie leżącym na stole (duże elementy dotykowe, szybki wybór karty zamiast długich list rozwijanych).
