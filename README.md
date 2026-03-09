
```mermaid
erDiagram
    autorzy {
        integer id PK
        text imie_nazwisko
    }

    ceny {
        integer id PK
        numeric kwota
    }

    kategorie {
        integer id PK
        varchar nazwa
    }

    ksiazki {
        integer id PK
        text tytul
        varchar isbn
        text opis
    }

    lokalizacje {
        integer id PK
        varchar dzial
        varchar regal
        varchar polka
    }

    uzytkownicy {
        integer id PK
        text imie_nazwisko
        text email
        varchar rola
    }

    egzemplarze {
        integer id PK
        integer id_ksiazki FK
        integer id_lokalizacji FK
        varchar status
    }

    historia_egzemplarzy {
        integer id PK
        integer id_egzemplarza FK
        text opis_zdarzenia
        timestamp data_zdarzenia
    }

    ksiazki_autorzy {
        integer id_ksiazki FK
        integer id_autora FK
    }

    ksiazki_ceny {
        integer id_ksiazki FK
        integer id_ceny FK
        timestamp data_obowiazywania
    }

    ksiazki_kategorie {
        integer id_ksiazki FK
        integer id_kategorii FK
    }

    wypozyczenia {
        integer id PK
        integer id_uzytkownika FK
        integer id_egzemplarza FK
        timestamp data_wypozyczenia
        timestamp termin_zwrotu
        timestamp data_zwrotu
    }

    ksiazki ||--o{ egzemplarze : "ma"
    lokalizacje ||--o{ egzemplarze : "przechowuje"
    egzemplarze ||--o{ historia_egzemplarzy : "posiada"
    ksiazki ||--o{ ksiazki_autorzy : "napisana przez"
    autorzy ||--o{ ksiazki_autorzy : "pisze"
    ksiazki ||--o{ ksiazki_ceny : "wyceniana"
    ceny ||--o{ ksiazki_ceny : "dotyczy"
    ksiazki ||--o{ ksiazki_kategorie : "nalezy do"
    kategorie ||--o{ ksiazki_kategorie : "zawiera"
    uzytkownicy ||--o{ wypozyczenia : "wypozycza"
    egzemplarze ||--o{ wypozyczenia : "wypozyczany"
