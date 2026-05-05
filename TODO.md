# Fix Doctor Request Sending Issue - eDoc HMS

## Status: ✅ Started by BLACKBOXAI

### Step 1: Create Project TODO [COMPLETED]
- [x] Created this TODO.md file

### Step 2: Fix ConsultationModule.jsx (Primary)
- [x] Read full file 
- [x] Add `getLabCatalog()` fetch (now uses API + logging/errors)
- [x] Enhanced lab catalog dropdown (search/filter/enabled/auto-fill)
- [x] Improve `saveToSupabase()` error handling (RLS/FK detailed toasts/logs)
- [x] Added prominent "🚀 SEND LAB ORDERS" button + auto-refresh tracker
- [x] Specimen auto-fill + clinical notes from catalog

### Step 3: Update DoctorLabs.jsx (Display Fix) [COMPLETED]
- [x] RLS-aware fetch (fallback queries, logging)
- [x] Enhanced empty/error states (Retry button, debug info, guidance)

### Step 4: DoctorLabRequests.jsx [COMPLETED]
- [x] Added RLS logging

### Step 5: Testing & RLS [NEXT]
- [ ] Run dev server
- [ ] Test full flow
- [ ] Manual RLS fix guidance
- [ ] attempt_completion

### Step 4: Minor api.js Updates
- [ ] Ensure `getLabCatalog()` exported/called correctly

### Step 5: Testing & RLS
- [ ] Run `cd frontend && npm install && npm run dev`
- [ ] Test: Doctor login → Appt → Consultation → Add lab → Save → Check DoctorLabs
- [ ] Check Supabase Logs for RLS errors
- [ ] **Manual**: Add RLS policies for doctors (INSERT lab_requests WHERE doctor_id = auth.user.id)
- [ ] Complete: attempt_completion

### Notes
- Likely RLS blocking INSERT/SELECT on lab_requests/prescriptions
- profile.id → doctor.docid mapping critical
- Track progress: Mark [x] as complete
