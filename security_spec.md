# Security Specification — PUSDALOPS-PB BPBD Kota Palembang

## 1. Data Invariants
1. **Identity & RBAC**: Auth claims never grant roles directly except verified bootstrapped admin email (`rsudgandus.elektromedis@gmail.com`). All role checks look up `/users/{uid}` and `/admins/{uid}`. Users cannot self-assign `Admin` or `Operator Pusdalops` on signup.
2. **PII Isolation**: `/users/{userId}` contains `email`. Read (`get`) is restricted strictly to `isOwner(userId) || isAdmin()`. List queries on `/users` are restricted to `isBootstrappedAdmin() || resource.data.uid == request.auth.uid`.
3. **1:1 Incident Integrity & Immutability**: `/incidents/{incidentId}` requires `agencyCode == 'BPBD-PLG'`, valid `identitas`, `dataKejadian`, `korban`, `penanganan`, `createdBy == request.auth.uid` on create, and immutable `createdAt`, `createdBy`, `id`, `agencyCode` on update.
4. **Relational Integrity**: `/handling_logs/{logId}` and `/documentations/{docId}` require `exists(/databases/$(database)/documents/incidents/$(incoming().incidentId))` on create so orphaned logs/docs cannot be written.
5. **Terminal State Locking**: When `existing().penanganan.statusPenanganan == 'Selesai'`, non-Admin/non-Operator updates are rejected (Admin/Operator retain correction capability for operational adjustments).
6. **Temporal Integrity**: `createdAt` and `updatedAt` are strictly validated against `request.time`.
7. **Size & Type Bounds**: Every string has explicit `.size()` bounds; IDs match `^[a-zA-Z0-9_\\-]+$`; numeric counts allow `null` (not yet known) or non-negative bounded values.

## 2. The "Dirty Dozen" Attack Payloads
1. Unauthenticated read/write to `/incidents/inc-1` -> PERMISSION_DENIED
2. Unverified email user attempting write to `/incidents/inc-1` -> PERMISSION_DENIED
3. Self-escalation: Petugas creating `/users/{uid}` with `role: 'Admin'` -> PERMISSION_DENIED
4. Privilege modification: Petugas updating their own `/users/{uid}` to change `role: 'Operator Pusdalops'` -> PERMISSION_DENIED
5. PII leak: Non-admin user reading `/users/other-user-uid` -> PERMISSION_DENIED
6. Shadow/Ghost field injection: Creating `/incidents/inc-1` with extra field `isApproved: true` -> PERMISSION_DENIED
7. Identity spoofing: Creating `/incidents/inc-1` with `createdBy: 'someone-else'` -> PERMISSION_DENIED
8. Timestamp forgery: Creating `/incidents/inc-1` with client-forged `createdAt` instead of `request.time` -> PERMISSION_DENIED
9. ID poisoning: Creating `/incidents/bad$id..1500chars` -> PERMISSION_DENIED
10. Orphaned documentation write: Creating `/documentations/doc-1` referencing non-existent `incidentId` -> PERMISSION_DENIED
11. Negative victim count: Writing `korban.meninggal: -5` -> PERMISSION_DENIED
12. Terminal lock bypass: Non-admin/non-operator attempting to mutate an incident already marked `'Selesai'` -> PERMISSION_DENIED
