# ICD-10 Full Dataset Setup

## Quick Start (Subset)
1. Supabase Dashboard → SQL Editor
2. Run `seed_icd10.sql` → 1,000+ codes ready

## Full 70k Codes (Production)
1. Download: https://icd.who.int/browse10/2019/en → Export CSV/JSON → `icd10_full.json`
2. `npm init -y && npm i @supabase/supabase-js`
3. Edit `populate_full_icd10.js`: Add service_role key
4. `node populate_full_icd10.js`

## Verify
```
SELECT COUNT(*) FROM icd10;  -- 70k
```

## Test App
```
cd frontend && npm run dev
```
`/icd-prototype` or consultations → Search works with full data.
