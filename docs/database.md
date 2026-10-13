# Kaip atkurti Cechas bazę

Pradinis SQL yra aplanke `supabase/migrations/`. Pirmasis failas sukuria `profiles`, `jobs`, `topics`, `replies`, ryšius, apribojimus ir skaitymo bei kūrimo taisykles iš `docs/mvp.md`. Antrasis leidžia autoriui keisti ir trinti savo eilutes.

Slaptažodis šiose lentelėse nekuriamas. `service_role` raktas į saugyklą ir į React programą nededamas.

## Nauja aplinka

1. Sukurkite tuščią Supabase projektą.
2. Atidarykite SQL Editor.
3. Įklijuokite ir vykdykite abu failus iš `supabase/migrations/` iš eilės: pirma `20261013190000_init.sql`, tada `20261013203000_crud.sql`. Antrasis failas leidžia autoriui keisti ir trinti savo skelbimą, temą ir atsakymą.
4. Projekto nustatymuose nukopijuokite Project URL ir anon public key.
5. Svetainės šaknyje nukopijuokite `.env.example` į `.env` ir įrašykite ten šias dvi reikšmes.

Failas `.env` jau nurodytas `.gitignore`. Į GitHub patenka tik `.env.example` su pavyzdžiais, ne su tikrais raktais.

Jau sukurtoje bazėje pirmojo failo kartoti nereikia: `create table` sustos, nes lentelės jau yra. Antrąjį failą šioje bazėje reikia įvykdyti vieną kartą.

## Registracija po atkūrimo

Vardas perduodamas kuriant prisijungimą, atskiro įrašo į `profiles` nereikia:

```js
supabase.auth.signUp({
  email,
  password,
  options: { data: { name } }
})
```

Savo paskyros trynimas kviečia `delete_own_account()`. Kartu su ja dingsta profilis, skelbimai, temos ir atsakymai.

## Saugumo taisyklės

Prieigą sprendžia bazė, ne mygtukai puslapyje. Lentelėse `profiles`, `jobs`, `topics` ir `replies` įjungta eilučių apsauga. Rolėms `anon` ir `authenticated` pirma nuimtos visos teisės, tada suteiktos tik reikalingos.

| Kas | Ką galima |
|---|---|
| Svečias | Skaityti skelbimus, temas, atsakymus ir rodinį `profile_names` |
| Prisijungęs dalyvis | Tą patį, taip pat skaityti ir keisti savo profilio vardą, ištrinti savo profilį |
| Prisijungęs dalyvis | Sukurti skelbimą, temą ir atsakymą tik su savo `author_id` |
| Eilutės autorius | Keisti ir trinti savo skelbimą, savo temą ir savo atsakymą |
| Kitas žmogus | Svetimos eilutės nekeičia ir netrina |

El. paštas yra `profiles` ir skaitomas tik iš savo eilutės: politika `profiles_select_own` lygina `id` su `auth.uid()`. Vardus kortelėms atiduoda rodinys `profile_names`, jame pašto nėra.

Slaptažodis į šias lenteles nerašomas. Jį saugo `auth.users`. Profilį sukuria trigeris `handle_new_user` registracijos metu. Funkcija `delete_own_account()` trina tik prisijungusį naudotoją.

Po paskelbimo negalima pakeisti autoriaus, sukūrimo laiko ir atsakymo temos: tai sustabdo trigeriai `guard_profile_update` ir `guard_author_update`.

Į React perduodami `VITE_SUPABASE_URL` ir `VITE_SUPABASE_ANON_KEY`. `service_role` raktas ir bazės slaptažodis į saugyklą, į `.env.example` ir į klientą nededami. Failas `.env` į Git neįeina.
