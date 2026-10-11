# Ryżowy Książę – kalkulator gry (stan na 2026-10-11, popołudnie)

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
- **Cofanie ruchu (2026-10-11):** przycisk „↶ Cofnij” w pasku wyniku (pod numerem tury) i w oknie końca gry. Przed każdą akcją gracza `script.js` zapisuje migawkę całego stanu (`takeSnapshot`/`undoLastMove`, do 300 kroków). Cofa też koniec tury i koniec gry; ruchy dwuetapowe (medyk, Wezwanie) cofają się etapami (najpierw wraca wybór z cmentarza / wybór kart). Po cofnięciu pokazuje się komunikat „Cofnięto: …”.
- **Podsumowanie gry (2026-10-11):** po końcu gry okno z wynikiem, tabelą wyników tur i pełną historią (od początku) w polu tekstowym; przyciski „Kopiuj”, „Pobierz .txt”, „Cofnij ostatni ruch”, „Nowa gra”. Wyniki tur są w `roundResults`.
- **Róg (2026-10-11):** Rogu wojennego nie można położyć na rząd, w którym jest już róg – karta Rogu albo jednostka z umiejętnością rogu (np. Lester). Takie rzędy nie pojawiają się w wyborze.
- Nazewnictwo: w interfejsie i historii „Tura” zamiast „Runda” (pasek: „Tura 1”).
- Leczenie (medyk), karty zwinne, szpiedzy, Chrząszcz, Deszcz ognia (globalny i szeregowy).
- Moc / Wyzwolenie siły (Ulu-Mulu wg wybranego rzędu, Orkowy treser tylko w swoim rzędzie).
- Xardas -> Demon ognia, Orkowa mapa wojenna -> Herszt orków (po zniszczeniu i po rundzie). Tokeny trafiają na cmentarz i można je wskrzesić.
- Dowódca: raz na całą grę, osobna kopia dla każdego gracza (sama zdolność to jeszcze alert).
- Koniec rundy: wszystkie karty z pola (też bohaterowie, róg, Chrząszcz, szpiedzy przeciwnika) idą na cmentarz gracza, na którego polu leżały.
- Poprawione blokady tury (medyk po paście przeciwnika, pasowanie w trybie Chrząszcza) i kolizje ID instancji.

## Interfejs pod telefon (2026-10-10)
Nowy `ui.js` (ładowany po `script.js`) + przebudowane `index.html` i `style.css`. `ui.js` czyta stan i steruje ukrytymi listami `<select>` tymi samymi zdarzeniami co wcześniej.
- Układ telefonu: jedna kolumna w kolejności jak przy stole (panel gracza 1, plansza 1, pogoda, plansza 2, panel gracza 2). Od 900 px układ szeroki.
- Przyklejony pasek wyniku: imiona, kryształy, sumy, numer tury, przycisk Cofnij, czyja kolej i komunikat trybu (Chrząszcz / medyk / wybór rzędu / Wezwanie). Pasek „ostatnia akcja” i napis „Siła” przy sumie usunięte 2026-10-11.
- Wybór karty w arkuszu od dołu: wyszukiwarka, filtry (rząd, bohaterowie, specjalne, pogoda), te same karty zgrupowane z licznikiem (np. Zombie ×5).
- Rząd wybiera się dużymi przyciskami; przycisk „Zagraj: <karta>”.
- Medyk: cmentarz otwiera się sam, z opcją „Pomiń wskrzeszenie”. Cmentarz można też przeglądać przyciskiem „Cmentarz (n)”.
- Pasowanie wymaga drugiego dotknięcia (ochrona przed przypadkowym pasem).
- Sterowanie gracza, który czeka, jest zwinięte na telefonie.
- Imiona graczy na ekranie konfiguracji (pamiętane w localStorage).
- Blokada wygaszania ekranu (Wake Lock) w trakcie gry; ostrzeżenie przed zamknięciem karty w środku partii.
- Czcionka nagłówków: `Gothic_II_NK.ttf` z repo (gdy brak pliku – szeryfowa zastępcza).

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

## Zostawione na później
- Zdolności wszystkich dowódców (m.in. Zastępy Innosa, Oko Innosa, Zew hordy, Beliar z nami) – obecnie alert „Implementacja w toku".
- Zdolności 7 talii (str. 19 instrukcji): remis dla Khorinis, zostająca karta Potworów, dodatkowa wymiana Najemników, pominięcie tury Klasztoru, powrót 2 kart u Orków, dobór po przegranej Bandytów, dobór po wygranej Nieumarłych. (W kalkulatorze część z nich może sprowadzać się do przypomnienia dla graczy, bo karty dobierają fizycznie.)
- Zwycięzca rundy zaczyna następną (obecnie może zacząć każdy).
- Remis w rundzie: celowo bez zmian (obaj gracze tracą kryształ).
- Komunikaty `alert()` („Wybierz rząd”, dowódca) – do zamiany na okienka w stylu aplikacji (koniec gry ma już własne okno).

## Decyzje (potwierdzone 2026-10-09)
- Mobilność (agile): rząd wybiera się przy zagrywaniu karty i przy jej wskrzeszeniu – tak działa kod.
- Ork szaman (`scorch`): Globalny deszcz ognia – zostaje.
- Szeregowy deszcz ognia: do progu 10 pkt wliczają się bohaterowie w rzędzie – zostaje.

## Uwagi do danych
- W `cards.js` zmieniono względem Excela: Najemnik x4 ma tight_bond, Ork wojownik x3 nie jest tokenem, dodano dowódcę Zastępy Innosa, usunięto Cavalorn_token, Goblin wojownik bez musterRole, Strach jako Weather, ID Barania_kielbasa_1..3, Grom ma `effectClass: 'rain-effect'` (poprawione w `cards.js` 2026-10-11, obejście w `ui.js` usunięte). Warto zsynchronizować Excel.

## Hosting (publikacja online)
Projekt to czysty HTML/CSS/JS bez backendu, więc wystarczy darmowy hosting statyczny.
- **Istniejące repozytorium: github.com/tytus42/RL** (publiczne, GitHub Pages włączone, adres **tytus42.github.io/RL/**). Trzeba podmienić `index.html`, `cards.js`, `script.js`, `style.css`, `ui.js` (i ew. `NOTATKA.md`). W repo jest `Gothic_II_NK.ttf` – `style.css` z niej korzysta.
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
