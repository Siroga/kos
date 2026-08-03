# Uživatelská příručka: Nastavení Bluetooth Tiskárny

Tato příručka popisuje postup nastavení a obsluhy Bluetooth tiskárny v aplikaci KOS prostřednictvím stránky **Nastavení**.

---

## 1. Přístup do Nastavení

1. Na hlavní stránce klikněte na tlačítko **Nastavení** (nebo přejděte na adresu `/settings`).
2. Při každém vstupu budete vyzváni k zadání hesla (`Zadejte heslo`).
3. Zadejte platné heslo. Po úspěšném ověření se zobrazí stránka nastavení.

---

## 2. Připojení nové Bluetooth tiskárny

1. Ujistěte se, že je Bluetooth tiskárna zapnutá a nachází se v dosahu Raspberry Pi.
2. Na stránce nastavení v sekci **Bluetooth Tiskárna** klikněte na tlačítko **Hledat tiskárny**.
3. Spustí se 10sekundové vyhledávání (tlačítko zobrazí odpočet `Hledám... (10s)`).
4. V seznamu **Nalezená zařízení** vyhledajte vaši tiskárnu.
5. Klikněte na tlačítko **Připojit** u vybrané tiskárny.
6. Aplikace provede spárování a připojení. Po dokončení se stav změní na **Připojeno** (zelený indikátor).

---

## 3. Zkušební tisk (Test Print)

1. Po úspěšném připojení tiskárny klikněte na tlačítko **Zkušební tisk**.
2. Tiskárna vytiskne testovací lístek s textem `ZKUŠEBNÍ TISK` a časovým razítkem.
3. Pokud tisk proběhne v pořádku, tiskárna je připravena k provozu pro pokladnu a objednávky.

---

## 4. Odpojení tiskárny

1. Pokud potřebujete tiskárnu odpojit nebo změnit za jiný kus, klikněte na tlačítko **Odpojit**.
2. Uložená MAC adresa se vymaže a automatické připojování se pozastaví.

---

## 5. Řešení problémů

| Problém | Příčina | Řešení |
|---|---|---|
| **Upozornění: Bluetooth-adaptér je vypnutý** | Bluetooth na Raspberry Pi je neaktivní. | Obraťte se na správce systému pro zapnutí Bluetooth adaptéru. |
| **Tiskárna se neobjevuje v seznamu** | Tiskárna je vypnutá nebo mimo dosah. | Zapněte tiskárnu, posuňte ji blíže k Raspberry Pi a klikněte znovu na *Hledat tiskárny*. |
| **Stav připojení je Odpojeno (Červený indikátor)** | Tiskárna se odpojila nebo ztratila napájení. | Systém se automaticky pokouší tiskárnu znovu připojit každých 10 sekund. Ujistěte se, že je tiskárna zapnutá. |
