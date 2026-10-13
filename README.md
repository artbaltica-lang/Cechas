# Cechas

Darbų lenta ir forumas tiems, kas dirba su dirbtiniu intelektu, neuroniniais tinklais ir svetainių administravimu.

Dalyviai registruojasi, ieško darbo, siūlo darbą ir bendrauja forume.

## Paleidimas

```bash
npm install
npm run dev
```

Svetainė atsidaro adresu http://127.0.0.1:5173/

## Duomenų bazė

Lentelės aprašytos faile `supabase/migrations/20261013190000_init.sql`. Kaip jas atkurti naujame Supabase projekte, parašyta `docs/database.md`.

Nukopijuokite `.env.example` į `.env` ir įrašykite projekto adresą bei anon raktą. Failo `.env` į GitHub nedėkite. `service_role` rakto React programoje nenaudokite.
