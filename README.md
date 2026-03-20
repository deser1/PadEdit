# 📱 PadEdit - Ultimate Mobile Code Editor

**PadEdit** to potężny, wieloplatformowy edytor kodu na urządzenia z systemem Android i iOS. Został zaprojektowany z myślą o programistach, którzy potrzebują elastycznego narzędzia do pisania, edytowania i zarządzania kodem bezpośrednio ze swojego smartfona lub tabletu.

## ✨ Główne funkcje

*   🎨 **Zaawansowane kolorowanie składni:** Wykorzystuje silnik **Monaco Editor** (znany z VS Code). Automatycznie rozpoznaje język programowania na podstawie rozszerzenia pliku lub inteligentnej analizy jego zawartości (dzięki `highlight.js`).
*   🌐 **Edycja plików na żywo przez FTP:** Wbudowany, w pełni funkcjonalny klient FTP. Pozwala na łączenie się z serwerami, przeglądanie katalogów, pobieranie, edytowanie i natychmiastowe nadpisywanie plików zdalnych.
*   🐙 **Pełna integracja z Git / GitHub:** Klonuj repozytoria, twórz commity, wysyłaj (push) i pobieraj (pull) zmiany bez wychodzenia z aplikacji.
*   ⌨️ **Klawiatura dla programistów:** Niestandardowy, pływający pasek narzędzi (Toolbar) umieszczony nad systemową klawiaturą, zapewniający błyskawiczny dostęp do najczęściej używanych znaków programistycznych (np. `{}`, `[]`, `()`, `<`, `>`, Tab, i innych).
*   📁 **Rozbudowane zarządzanie plikami:** Twórz i usuwaj pliki, organizuj lokalne projekty, nadpisuj zmiany, a także eksportuj pliki bezpośrednio do pamięci urządzenia lub udostępniaj je dalej.
*   🤖 **Asystent AI (Opcja Premium):** Wbudowany generator kodu oparty na sztucznej inteligencji, pomagający w tworzeniu fragmentów kodu na podstawie opisu tekstowego.

## 🛠️ Technologie i Architektura

Projekt został zbudowany przy użyciu nowoczesnego stosu technologicznego:
*   **Framework:** React Native / Expo
*   **Język:** TypeScript
*   **Edytor:** Monaco Editor (uruchamiany w zoptymalizowanym komponencie WebView z pominięciem natywnych problemów z kompozycją klawiatury Gboard/iOS)
*   **Natywne moduły:** `react-native-tcp-socket` dla obsługi prawdziwych połączeń FTP (wymija ograniczenia Expo Go)
*   **Zarządzanie stanem/danymi:** AsyncStorage, Expo FileSystem, Expo Sharing, Expo Document Picker
*   **Git:** `isomorphic-git` z odpowiednimi polyfillami dla środowiska mobilnego

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

## 📝 Planowany rozwój (Roadmap)
- [ ] Implementacja protokołu SFTP (Secure FTP).
- [ ] Rozbudowa obsługi wielu kart (zakładek) dla otwartych plików.
- [ ] Połączenie asystenta AI z prawdziwym API (np. OpenAI / Anthropic).
- [ ] Emulacja prostego terminala do uruchamiania skryptów Node.js / Python lokalnie.
