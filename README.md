```mermaid
flowchart TD
    Start([Użytkownik chce wypożyczyć książkę]) --> Szukaj[Wyszukiwanie w systemie\n(Tabela: ksiazki)]
    
    Szukaj --> Sprawdz{Sprawdzenie statusu\n(Tabela: egzemplarze)}
    
    Sprawdz -- Status: 'dostepna' --> UtworzWyp[Rejestracja wypożyczenia\n(Tabela: wypozyczenia)]
    Sprawdz -- Brak dostępnych --> KoniecBrak([Brak możliwości wypożyczenia])
    
    UtworzWyp --> PrzypiszUzytkownika[Przypisanie czytelnika\n(id_uzytkownika)]
    UtworzWyp --> PrzypiszEgzemplarz[Przypisanie konkretnej sztuki\n(id_egzemplarza)]
    
    PrzypiszUzytkownika & PrzypiszEgzemplarz --> ZmienStatus[Zmiana statusu egzemplarza\nna 'wypożyczony']
    
    ZmienStatus --> DodajHistorie[Zapis operacji w logach\n(Tabela: historia_egzemplarzy)]
    
    DodajHistorie --> KoniecSukces([Wydanie książki czytelnikowi])

    classDef tableAction fill:#2980b9,stroke:#2c3e50,stroke-width:2px,color:#fff;
    class UtworzWyp,ZmienStatus,DodajHistorie tableAction;
