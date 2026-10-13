# Cechas — demonstracija

## Ką atidaryti

Iš aplanko `ceh`: `npm install`, nukopijuoti `.env.example` į `.env`, įrašyti projekto adresą ir anon raktą, tada `npm run dev`. Adresas — http://127.0.0.1:5173/

Sąsaja lietuvių kalba. Ekrano nuotraukos yra `docs/screenshots/`.

## Rodymo eiga

1. Pagrindinis puslapis. Trys įėjimai: rasti darbą, pasiūlyti darbą, forumas. Žemiau — naujausi įrašai iš bendros bazės.
2. Lenta. Filtras pagal sritį siaurina sąrašą. Tuščioje srityje tekstas «Šioje srityje kol kas tuščia».
3. Skelbimas. Svečias jį skaito. Keitimo mygtukų jis nemato: jie atsiranda tik autoriui.
4. «Pasiūlyti darbą» be prisijungimo. Puslapis prašo pirmiausia registruotis.
5. Forumas ir tema. Svečias skaito temą ir mato prašymą prisijungti, kad galėtų atsakyti.
6. Registracija: vardas, el. paštas, slaptažodis. Prisijungus galima sukurti skelbimą, temą ir atsakymą, pakeisti vardą puslapyje «Paskyra» ir ištrinti paskyrą.

## Ką paaiškinti

Duomenys nelaikomi naršyklėje. Puslapiai kreipiasi į Supabase per `src/services/store.js`. Tą patį sąrašą mato visi, kas atidarė svetainę.

Slaptažodis nėra profilio laukas. Jį priima `supabase.auth`. Eilutė lentelėje `profiles` atsiranda trigeriu kartu su paskyra, ir jų `id` bendras.

Riba «tik savo» nustatyta Postgres. Politikos lygina `author_id` su `auth.uid()`. Paslėptas mygtukas sąsajoje šio tikrinimo nepakeičia. Svetimas `author_id` įrašant nepraeina. Autorius ir sukūrimo laikas po paskelbimo nesikeičia: tai sustabdo trigeris.

El. paštas matomas tik profilio savininkui. Skelbimo kortelėje ir temoje vardas imamas iš rodinio `profile_names`, kuriame pašto nėra.

Dalyvio ir temos trynimas pakopinis. Kartu su tema dingsta ir kitų žmonių atsakymai jos viduje. Savo skelbimą, temą ir atsakymą autorius trina atskirai. Tai leidžia antroji migracija, `20261013203000_crud.sql`.

Saugykloje nėra `.env`, slaptažodžių ir `service_role` rakto. Į klientą patenka tik anon raktas, o ką jam galima, nustato politikos.

Pirmoji versija — atvira lenta ir forumas. Atsiliepimai, susirašinėjimas, paieška ir moderavimas į ją neįeina ir savo lentelių neturi.
