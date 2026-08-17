# Roles & Access Management — Proposed Design

## Purpose
Umbrella is three services — the platform (login, users, org setup), GXP, and LIMS. This document proposes one consistent, simple rule for who can see and do what, across all three. For approval before implementation.

## The problem today
- **"Admin"** (a platform-level account type) automatically gets full access to *every* service's data — not because it was granted, but as an accidental side effect of how the account type is defined. There's no way to give two Admins different access per service.
- Each service (GXP, LIMS) has its own "assign a role to a user" screen, which looks like it controls access — but for an Admin account, it silently does nothing (the blanket access above already applies). This makes access assignment confusing and easy to distrust.
- LIMS and GXP were also built slightly inconsistently under the hood, which we're aligning as part of this change.

## The proposed model

**One platform-level tier that means "full access to everything, in every service":** `Super Admin`. Reserved for a small number of true system administrators. Nothing else grants blanket access.

**Everyone else starts with nothing.** A newly created platform account can log in and see their own profile and company info — and nothing else — until access is explicitly granted.

**Each service owns granting its own access**, using the screens that already exist:
- GXP → GXP's own Users + Roles screens
- LIMS → Lab Users + Lab Roles screens
- Platform-level things (departments, designations, company setup, managing accounts) → the platform's own Roles screen

Granting someone the "Warehouse Manager" role in GXP gives them GXP's warehouse permissions — nothing more. Granting a different role in LIMS is separate and independent. Two people can have completely different, independently-configured access in each service. This is true for every account except `Super Admin`.

**Groups still scope *data*, not just actions.** Within a service, if a person belongs to a group, they see records tagged to that group (and its sub-groups). If they belong to no group, they see everything they have permission to act on. This already works today in LIMS and carries forward unchanged.

## What this looks like in practice
1. IT admin creates a platform account for a new hire — logs in, sees only their profile. No access anywhere yet.
2. Lab manager goes to LIMS → Lab Users, picks that person, assigns them the "Analyst" Lab Role and the "Chemistry" group. They now see the LIMS menu and only Chemistry-group records.
3. Separately, if that same person also needs GXP access, someone goes to GXP → Users and assigns a GXP role there. Independent decision, independent screen.
4. If they need neither, neither menu appears. No unused/confusing tabs.

## What changes to get here
- Retire "Admin" as a blanket-access account type; keep only `Super Admin` as the one bypass-everything tier.
- Each service's menu (sidebar) becomes visible based on that service's own access records — not a separate, easy-to-forget platform permission list.
- One-time migration to move any existing "Admin" accounts to the new model without losing intended access.

## What stays the same
- LIMS's Lab Users / Lab Roles / Lab Groups screens — unchanged, already correct.
- GXP's Users / Roles screens — unchanged, already correct.
- Group-based data scoping — unchanged.

## Scales to future services
Today, adding a new service means remembering to register its permissions with the platform and wire up a menu check — a manual step that's easy to miss (it was missed for LIMS). Under this model, a new service only needs its own Users + Roles screens and its own "does this person have access" check — nothing in the platform layer or in GXP/LIMS has to change. `Super Admin` covers it automatically; everyone else starts blank, same as always.

## Approval

| | Name | Date |
|---|---|---|
| Approved by |  |  |
