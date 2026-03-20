# 📱 PadEdit - Ultimate Mobile Code Editor

**PadEdit** to potężny, wieloplatformowy edytor kodu na urządzenia z systemem Android i iOS. Został zaprojektowany z myślą o programistach, którzy potrzebują elastycznego narzędzia do pisania, edytowania i zarządzania kodem bezpośrednio ze swojego smartfona lub tabletu.

## ✨ Główne funkcje

*   🎨 **Zaawansowane kolorowanie składni:** Wykorzystuje silnik **Monaco Editor** (znany z VS Code). Automatycznie rozpoznaje język programowania na podstawie rozszerzenia pliku lub inteligentnej analizy jego zawartości (dzięki `highlight.js`).
*   🌐 **Edycja plików na żywo przez FTP/SFTP:** Wbudowany, w pełni funkcjonalny klient pozwalający na łączenie się z serwerami (w tym bezpieczne połączenia SFTP), przeglądanie katalogów, pobieranie, edytowanie i natychmiastowe nadpisywanie plików zdalnych.
*   🐙 **Pełna integracja z Git / GitHub:** Klonuj repozytoria, twórz commity, wysyłaj (push) i pobieraj (pull) zmiany bez wychodzenia z aplikacji.
*   ⌨️ **Klawiatura dla programistów:** Niestandardowy, pływający pasek narzędzi (Toolbar) umieszczony nad systemową klawiaturą, zapewniający błyskawiczny dostęp do najczęściej używanych znaków programistycznych.
*   📁 **Rozbudowane zarządzanie projektami (Workspaces):** Twórz przestrzenie robocze (Workspaces), zarządzaj plikami lokalnymi w oparciu o bazę **SQLite** oraz bezpieczny zapis w pamięci telefonu.
*   🤖 **Zaawansowany Asystent AI:** Integracja z wieloma silnikami sztucznej inteligencji (**OpenAI, Anthropic, Gemini**). AI posiada pełny kontekst edytowanego pliku i potrafi generować, uzupełniać lub analizować zaznaczony kod.
*   💻 **Interaktywny Terminal SSH:** Wbudowany emulator terminala oparty na **Xterm.js**, pozwalający na logowanie do zdalnych serwerów po SSH i korzystanie z programów pełnoekranowych (takich jak `vim`, `htop`, `mc`).
*   🗄️ **Klient Baz Danych (MySQL, MSSQL, Oracle):** Graficzny interfejs do pisania zapytań SQL i podglądu wyników w przejrzystych tabelach (wymaga uruchomienia lekkiego API Proxy w Node.js).
*   ▶️ **Lokalne wykonywanie skryptów:** Możliwość odpalania skryptów JavaScript i Python (poprzez środowisko Pyodide) bezpośrednio na urządzeniu w wirtualnej konsoli.

## 🛠️ Technologie i Architektura

Projekt został zbudowany przy użyciu nowoczesnego stosu technologicznego:
*   **Framework:** React Native / Expo
*   **Język:** TypeScript
*   **Edytor:** Monaco Editor (uruchamiany w zoptymalizowanym komponencie WebView)
*   **Natywne moduły:** `react-native-tcp-socket`, `react-native-ssh-sftp`
*   **Zarządzanie stanem/danymi:** AsyncStorage, Expo SQLite, Expo FileSystem
*   **Git:** `isomorphic-git` z odpowiednimi polyfillami dla środowiska mobilnego
*   **Powiadomienia:** `expo-notifications` (obsługa Push dla CI/CD)

## 🚀 Uruchomienie lokalne

Z uwagi na wykorzystanie natywnych gniazd TCP (TCP sockets) dla obsługi klienta FTP, aplikacja wymaga zbudowania natywnej aplikacji deweloperskiej (Custom Dev Client), a nie standardowego środowiska Expo Go.

```bash
# 1. Sklonuj repozytorium
git clone git@github.com:deser1/PadEdit.git

# 2. Przejdź do folderu
cd PadEdit

# 3. Zainstaluj zależności
npm install

# 4. Uruchom natywny build na wybraną platformę (wymaga Android Studio lub Xcode)
npx expo run:android
# lub
npx expo run:ios
```

### 🗄️ Uruchomienie serwera API (dla klienta baz danych)
Ponieważ urządzenia mobilne nie powinny (i w React Native z racji braków natywnych bibliotek Node nie potrafią) łączyć się bezpośrednio do portów TCP baz danych (np. MySQL 3306), przygotowany został lekki serwer pośredniczący (Proxy) w technologii Node.js/Express.

Serwer ten pełni rolę "tunelu" – odbiera z telefonu żądanie HTTP zawierające adres docelowej bazy danych i komendę SQL, a następnie fizycznie łączy się z **dowolną zewnętrzną bazą danych**, autoryzuje się, wykonuje zapytanie i zwraca gotowy JSON do aplikacji.

**Jak z tego korzystać:**
1. Przejdź do folderu `server-api`:
```bash
cd server-api
```
2. Zainstaluj paczki dla serwera:
```bash
npm install
```
3. Uruchom serwer na komputerze lokalnym lub własnym VPS:
```bash
node index.js
```
4. Serwer domyślnie uruchomi się na porcie `3000`. 
5. W aplikacji mobilnej PadEdit:
   * W oknie **Baza Danych** kliknij ikonę ustawień (trybik). Wpisz w pole API adres serwera uruchomionego w kroku 3 (np. `http://192.168.1.100:3000` lub adres Twojego VPS).
   * Następnie w głównym oknie logowania wpisz dane docelowej bazy danych (jej rzeczywisty Host IP, użytkownika i hasło). Jeśli baza jest na tym samym serwerze co skrypt API, wpisz `localhost` lub `127.0.0.1`.

Dzięki tej architekturze jedna instancja serwera API wystarczy, aby z telefonu móc zarządzać dowolną ilością zdalnych serwerów bazodanowych na świecie.

## 📦 Budowanie wersji Release (Produkcyjnej)

Aby wygenerować gotową paczkę dla użytkowników (np. plik `.apk` dla Androida lub `.ipa` dla iOS), zaleca się użycie usługi **EAS Build** (Expo Application Services). Pozwala to uniknąć problemów z konfiguracją lokalnego środowiska.

**Krok 1:** Zainstaluj globalnie narzędzie EAS CLI:
```bash
npm install -g eas-cli
```

**Krok 2:** Zaloguj się na darmowe konto Expo (expo.dev):
```bash
eas login
```

**Krok 3:** Zainicjuj projekt w EAS (utworzy to plik `eas.json`):
```bash
eas build:configure
```

**Krok 4:** Uruchom budowanie:

*   **Dla Androida (.aab / .apk):**
    ```bash
    eas build -p android --profile production
    ```
*   **Dla iOS (.ipa):**
    ```bash
    eas build -p ios --profile production
    ```

*(Alternatywnie, jeśli posiadasz skonfigurowane Android Studio lub Xcode, możesz użyć komend lokalnych: `npx expo run:android --variant release` lub `npx expo run:ios --configuration Release`).*

### 🛠️ Rozwiązywanie problemów z budowaniem (Troubleshooting)
W nowoczesnych wersjach Expo (SDK 52+) i React Native (0.76+) domyślnie włączona jest Nowa Architektura (New Architecture). Niektóre starsze moduły natywne (np. `react-native-ssh-sftp`) mogą nie być z nią w pełni kompatybilne i powodować błędy Gradle (np. `Gradle build failed with unknown error`). 

W tym projekcie zastosowano następujące rozwiązania, aby zminimalizować te problemy:
1. **Łatki (Patches):** Używamy biblioteki `patch-package`, aby w locie łatać stare pliki `build.gradle` z paczek (m.in. usuwając martwe repozytorium `jcenter()`, dodając wymaganą przestrzeń nazw `namespace` i aktualizując metodę importu React Native). Zmiany te nakładane są automatycznie przy użyciu komendy `npm install` na podstawie plików z folderu `patches/`. W przypadku błędów kompilacji, upewnij się, że proces `postinstall` z `patch-package` zakończył się sukcesem.
2. **Wsparcie Nowej Architektury:** Dzięki powyzszym łatkom projekt kompiluje się z włączoną Nową Architekturą (która jest wymagana przez niektóre nowe pakiety, takie jak `react-native-worklets`).

## 📝 Planowany rozwój (Roadmap)
- [x] Implementacja protokołu SFTP (Secure FTP).
- [x] Rozbudowa obsługi wielu kart (zakładek) dla otwartych plików.
- [x] Połączenie asystenta AI z prawdziwym API (OpenAI, Anthropic, Gemini).
- [x] Emulacja prostego terminala do uruchamiania skryptów Node.js / Python lokalnie.
- [x] Wsparcie dla zdalnego wykonywania kodu (SSH Terminal).
- [x] Rozbudowa opcji zarządzania wieloma projektami (Workspace).
- [x] Rozbudowa terminala SSH o pełną obsługę interaktywnych programów (np. htop, vim).
- [x] Obsługa systemowego schowka i Drag&Drop w edytorze.
- [x] Integracja bazy danych SQLite dla lokalnych projektów.
- [x] Wsparcie dla powiadomień Push z serwerów CI/CD.
- [x] Klient do wizualnego zarządzania zewnętrznymi relacyjnymi bazami danych (MySQL, MS SQL, Oracle).
