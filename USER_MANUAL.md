# 📖 Hair Studio CRM - Instrukcja Obsługi

Witaj w swoim nowoczesnym systemie zarządzania salonem! Ten dokument pomoże Ci w pełni wykorzystać możliwości aplikacji, od planowania wizyt po inteligentne prognozowanie stanów magazynowych.

---

## 📅 Kalendarz i Umawianie Wizyt
Kalendarz to serce Twojego salonu. Pozwala na szybkie zarządzanie czasem i dokumentację pracy.

### 3. Cennik Usług
W tej sekcji definiujesz swoją ofertę.
- **Dodawanie/Edycja**: Każda usługa ma nazwę, czas trwania oraz cenę domyślną.
- **Kolory**: Możesz przypisać **unikalny kolor** do każdej usługi. Kolor ten będzie widoczny w Kalendarzu, co ułatwia orientację w planie dnia.
- **Zastosowanie**: Dane z cennika są używane do automatycznego wyliczania czasu trwania wizyty w kalendarzu.

### Dodawanie wizyty:
1. Kliknij w wybraną godzinę w kalendarzu.
2. **Wybór Klienta**: Wybierz klientkę z listy lub kliknij "Nowy Klient", aby szybko dodać osobę (wymagany numer telefonu +48).
3. **Karta Techniczna Klienta (Receptura)**: 
   - To **fioletowe pole** służy do zapisywania stałych formuł (np. mieszanki farb).
   - Treść wpisana tutaj automatycznie zapisuje się w profilu klientki i będzie widoczna przy każdej kolejnej wizycie!
4. **Zużyte Produkty**: 
   - Jeśli zużyłaś farby lub inne produkty, kliknij "+ Dodaj produkt / farbę". Możesz teraz **wyszukać produkt** wpisując jego nazwę lub markę, co znacznie przyspiesza pracę przy dużej ilości zapasów. System automatycznie przeliczy koszt i zdejmie ilość ze stanu po zapisaniu wizyty.
5. **Zdjęcia Przed/Po**: Możesz wgrać do 4 zdjęć dokumentujących efekt Twojej pracy.

---

## 👥 Baza Klientów
Miejsce, w którym budujesz historię relacji z klientkami.

### Funkcje:
- **Import CSV**: Jeśli masz listę klientów w Excelu, możesz ją wgrać masowo. Pobierz najpierw "Wzór CSV", uzupełnij go i zaimportuj.
- **Profil Klienta**: Po kliknięciu w klientkę zobaczysz jej:
  - **LTV (Suma wydana)**: Ile łącznie zarobiłaś na tej osobie.
  - **Historię wizyt**: Wszystkie daty, ceny i ceny materiałów.
  - **Notatki / Receptury**: Stały podgląd na karty techniczne.

---

## 📦 Magazyn i Produkty
Aplikacja nie tylko liczy produkty, ale myśli za Ciebie.

### Inteligentne Przewidywanie (AI Logic):
System analizuje historię: "Jeśli klientka Kasia zawsze używa 30g farby X, a ma wizytę za 3 dni, to czy starczy mi produktu?".
- **WG TERMINARZA**: Ostrzeżenie, że produkt skończy się konkretnego dnia, bo masz wtedy zapisaną osobę, która go używa.
- **WG HISTORII**: Prognoza oparta na średnim dziennym zużyciu.

### Zarządzanie:
- **Uzupełnij stan**: Kliknij ikonę odświeżania (strzałki), aby dodać nową dostawę do aktualnego stanu.
- **Eksportuj Braki**: Kliknij przycisk, aby wygenerować **listę zakupową** (CSV) z produktami, których masz mniej niż 30%.

---

## 💸 Wydatki i Koszty
Kontroluj, gdzie uciekają Twoje pieniądze.

- **Wydatki Stałe**: Czynsz, ZUS, media. System automatycznie sugeruje ich dodanie na początku każdego miesiąca.
- **Filtracja**: Możesz przeglądać wydatki miesiąc po miesiącu, filtrując je na "Stałe" lub "Jednorazowe".
- **Dashboard**: Górne boksy pokazują sumę kosztów dla aktualnie wybranego miesiąca.

---

## 📊 Raporty i Analizy
Pełny wgląd w finanse Twojego biznesu.

- **Dwa tryby widoku**: 
  - **Miesięczny**: Wykres z podziałem na dni.
  - **Manualny**: Wybierz dowolny zakres dat (np. od 15-go do 15-go).
- **Ranking Klientów**: Zobacz, kto przynosi Ci największy **zysk netto** (po odjęciu kosztów materiałów!).
- **Bilans**: Przejrzyste zestawienie Przychodów, Kosztów i Przychodu Netto (ile zostaje w Twojej kieszeni).

---

## 💾 Bezpieczeństwo - Kopia Zapasowa
Twoje dane są przechowywane lokalnie w przeglądarce (są bezpieczne i prywatne). 
**Zalecenie**: Raz w tygodniu wejdź w Ustawienia/Profil i kliknij **"Pobierz Kopię Zapasową (JSON)"**. W razie awarii komputera, możesz wgrać ten plik i odzyskać wszystko w sekundę.

---

> [!TIP]
> **Skrót**: Jeśli chcesz szybko znaleźć recepturę danej klientki, nie musisz wchodzić w bazę klientów — po prostu kliknij w jej wizytę w kalendarzu, a karta techniczna pojawi się od razu!
