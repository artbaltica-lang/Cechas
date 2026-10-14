# Rezultatas. Forumo įrašo rašymas

Pasirinkta viena funkcija: temos paskelbimas ir atsakymas joje.

## Flow schema tekstu

```
Sąsaja
  /forum  →  «Nauja tema»  →  /forum/new
  tema    →  laukas «Atsakymas»  →  «Atsakyti»
        │
        ▼
Logika   src/services/store.js
  addTopic   prisijungimas, pavadinimas ≥ 4, tekstas ≥ 10
  addReply   prisijungimas, tekstas ≥ 2
  author_id imamas iš prisijungimo, ne iš formos
        │
        ▼
DB / API   Supabase
  insert į topics arba replies
  politika: author_id = auth.uid()
  bazės ilgio taisyklės
        │
        ▼
Sąsajos atnaujinimas
  getTopic perskaito eilutę ir autoriaus vardą
  nauja tema  →  perėjimas į /forum/:id
  atsakymas   →  tas pats puslapis, tekstas atsiranda po tema, laukas išsivalo
```

Svečias sustoja sąsajoje. Iki logikos ir bazės užklausa neina.

## Sluoksniai

| Sluoksnis | Kur | Ką daro |
|---|---|---|
| Sąsaja | `src/pages/Forum.jsx` | Forma, mygtukai, klaidos tekstas, svečio ekranas |
| Logika | `addTopic`, `addReply` faile `src/services/store.js` | Ar prisijungta, ilgis, tarpų nukirpimas, savo `author_id` |
| DB / API | Supabase lentelės `topics` ir `replies` | Įrašas ir taisyklė, kad autorius yra prisijungęs dalyvis |
| Sąsajos atnaujinimas | `getTopic`, tada puslapio būsena | Parodomas naujas tekstas ir vardas |

## Klaidos būsenos

| Būsena | Kur sustoja | Ką mato dalyvis |
|---|---|---|
| Neprisijungęs, nauja tema | Sąsaja | «Pirmiausia registracija», mygtukas «Sukurti paskyrą» |
| Neprisijungęs, atsakymas | Sąsaja | «Norėdami atsakyti, prisijunkite arba registruokitės.» |
| Pavadinimas trumpesnis nei 4 simboliai | Logika | «Suteikite temai trumpą pavadinimą.» |
| Temos tekstas trumpesnis nei 10 simbolių | Logika | «Parašykite, apie ką norite kalbėti.» |
| Atsakymas trumpesnis nei 2 simboliai | Logika | «Parašykite atsakymą.» |
| Bazė atmeta svetimą autorių | DB / API | «Šio įrašo keisti negalima.» |

Tuščią formą sustabdo ir pati naršyklė: laukai pažymėti kaip privalomi. Per trumpas, bet jau įrašytas tekstas praeina naršyklę ir sustoja logikoje. Eilutė bazėje tada neatsiranda.

## Testų sąrašas

| Nr. | Scenarijus | Duomenys | Laukiama | Rezultatas |
|---|---|---|---|---|
| 1 | Svečias spaudžia «Nauja tema» | Neprisijungęs | Registracijos ekranas, formos nėra, į `topics` nerašoma | Patikrinta. Puslapis parodė «Pirmiausia registracija» ir «Sukurti paskyrą» |
| 2 | Prisijungęs dalyvis paskelbia temą | Pavadinimas `Kur rasti pirmą užduotį`, tekstas bent vienas sakinys | Atsidaro `/forum/:id` su pavadinimu, tekstu ir vardu. Sąraše tema matoma | Reikia prisijungimo. Scenarijus paruoštas |
| 3 | Per trumpas tekstas | Pavadinimas `DI`, žinutė `Trumpai.` | Klaida «Suteikite temai trumpą pavadinimą.», puslapis nepasikeičia | Reikia prisijungimo. Scenarijus paruoštas |
| 4 | Prisijungęs dalyvis atsako | `Aš pradėjau nuo mažos svetainės.` | Atsakymas atsiranda po tema, laukas tuščias, sąraše skaičius +1 | Reikia prisijungimo. Scenarijus paruoštas |
| 5 | Svečias atidaro esamą temą | Tema «darbas» | Tekstas matomas, atsakymo lauko nėra | Patikrinta. Matyti tekstas ir «Norėdami atsakyti, prisijunkite arba registruokitės.» |
