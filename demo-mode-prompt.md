# Demo Mode Implementation Prompt for Lovable

## Overview

Create a fully functional demo mode for Orvared that allows potential users to explore the platform without creating an account. The demo should replicate the full Phase 1 experience but in read-only mode.

---

## Two Demo Versions Needed

### 1. Demo Advocate (Advocate Plan)
**URL:** /demo/advocate or /demo

This demo showcases the full advocacy workflow:
- Client management (CRM)
- Case management
- Student records
- IEP processing with AI
- Document center
- Time tracking
- Billing/Invoices
- Dashboard with metrics

### 2. Demo Evaluator (Evaluator Plan)
**URL:** /demo/evaluator

This demo showcases the evaluation workflow:
- Evaluation management
- Student records
- Evaluation documents
- AI review/analysis
- Reporting
- Dashboard with metrics

---

## Pre-Populated Data Requirements

### Demo Advocate Data (Realistic Names)

**Clients:**
| Name | Email | Phone | Status |
|------|-------|-------|--------|
| Sarah Mitchell | sarah.mitchell@email.com | (512) 555-0123 | Active |
| Michael Torres | m.torres@email.com | (512) 555-0456 | Active |
| Jennifer Wong | j.wong@email.com | (512) 555-0789 | Active |

**Students (linked to clients):**
| Name | DOB | Grade | School |
|------|-----|-------|--------|
| Ethan Mitchell | 2015-03-12 | 4th | Oak Hills Elementary |
| Lily Torres | 2018-06-25 | 1st | Oak Hills Elementary |
| Noah Wong | 2016-11-08 | 3rd | Riverside Elementary |

**Cases:**
| Student | Status | Opened | Last Activity |
|---------|--------|--------|---------------|
| Ethan Mitchell | Active | 2025-09-15 | 2026-03-20 |
| Lily Torres | Active | 2026-01-10 | 2026-03-18 |

**Case Documents (IEPs):**
- 2 current IEPs with full content
- 3 prior year IEPs
- 5 evaluation reports
- Correspondence folder with 8 letters

**Time Entries (Sample):**
- 10 time entries from past 30 days
- Mix of meeting, document review, call categories
- Various durations (15min - 2hrs)

**Invoices:**
- 2 paid invoices
- 1 pending invoice
- Payment history

**Notes/Insights:**
- 15 case notes
- 5 AI-generated insights

---

### Demo Evaluator Data (Realistic Names)

**Evaluations:**
| Student | Type | Status | Completed |
|---------|------|--------|-----------|
| Emma Johnson | Triennial | Complete | 2026-02-15 |
| Liam Smith | Initial | Complete | 2026-02-28 |
| Olivia Brown | Reevaluation | In Progress | - |

**Students:**
| Name | DOB | Grade | School |
|------|-----|-------|--------|
| Emma Johnson | 2012-08-22 | 8th | Westview Middle |
| Liam Smith | 2019-04-15 | K | Sunshine Elementary |
| Olivia Brown | 2014-01-30 | 6th | Westview Middle |

**Evaluation Documents:**
- Psychological reports (3)
- Speech/language evaluations (2)
- OT evaluations (1)
- Progress reports (4)
- IEPs from prior years (5)

**Notes:**
- 8 evaluator notes
- 3 AI analysis outputs

---

## Functionality Requirements

### What Users CAN Do:
- ✅ Navigate between all pages
- ✅ View dashboard with metrics
- ✅ Open and view client records
- ✅ Open and view student records  
- ✅ Open and view case details
- ✅ View documents (read-only)
- ✅ View IEP content and AI analysis
- ✅ View time entries and invoices
- ✅ Click on navigation menu items
- ✅ View dropdown menus
- ✅ See all UI components
- ✅ Use search (results shown)
- ✅ Switch between demo Advocate and demo Evaluator

### What Users CANNOT Do:
- ❌ Add new clients
- ❌ Add new students
- ❌ Create new cases
- ❌ Upload documents
- ❌ Add/edit notes
- ❌ Add time entries
- ❌ Create invoices
- ❌ Edit any records
- ❌ Delete anything
- ❌ Use AI to generate new content
- ❌ Save any changes

### Implementation Approach:

**1. Create Demo Authentication (Bypass)**
- No login required
- Demo user with read-only role
- Session stored in localStorage/demo cookie

**2. Create Demo Routing**
- `/demo` - redirects to `/demo/advocate`
- `/demo/advocate` - full advocate dashboard
- `/demo/evaluator` - full evaluator dashboard
- Both routes load demo data instead of empty state

**3. Pre-populate Demo Database**
- Use a seed script to load demo data
- Include realistic names, dates, content
- Make data look realistic (not lorem ipsum)

**4. Disable All Write Actions**
- Add a `canEdit` check on all mutations
- If in demo mode, show toast: "Demo mode - changes not saved"
- Or simply disable all buttons that would write to DB

**5. Add Demo Banner**
- Show persistent banner at top: "Demo Mode - Read Only"
- Include link to "Sign Up for Full Access"

**6. Add Call-to-Action**
- In demo, show prominent buttons:
  - "Start Free Trial" (links to signup)
  - "See Pricing" (links to pricing page)
- Place after key workflows

---

## UI Requirements

### Phase 1 Features - All Viewable in Demo

All Phase 1 features are viewable in demo mode. Users can click through and explore all areas:

| Feature | Viewable in Demo | Notes |
|---------|-----------------|-------|
| Case Management | ✅ | Full navigation, view details |
| Document & Timeline Organization | ✅ | View all documents, timeline |
| Billing & Invoicing | ✅ | View invoices, time entries |
| Client CRM | ✅ | View client list and details |
| Student Management | ✅ | View student records |
| IEP Tools | ✅ | View AI analysis (cannot generate new) |
| Law Library | ⚠️ | Limited - see note below |
| Analytics & Reporting | ✅ | View dashboards and reports |

**Law Library Boundaries:**
- Users CAN view the Law Library tab
- Users CAN view the Crosswalk tab  
- Users CANNOT access deeper content (state-specific pages, etc.)
- Only these two tabs are accessible - clicking deeper sections shows "Sign up for full access"

### Demo Banner (Persistent)
```
┌─────────────────────────────────────────────┐
│  📺 Demo Mode - Explore Orvared             │
│  This is a read-only demo. [Sign Up] to     │
│  add your own clients and cases.            │
└─────────────────────────────────────────────┘
```

### Demo Landing Page (Optional)
Before entering demo, show selection:
```
┌─────────────────────────────────────────────┐
│           Try Orvared Free Demo             │
│                                             │
│   Choose a demo to explore:                 │
│                                             │
│   [ 🏛️ Advocate Demo ]   [ 🔬 Evaluator Demo ]    │
│   For IEP Advocacy         For Evaluation   │
│   Case Management          Documentation    │
│   Billing & Invoicing      Reporting        │
│                                             │
│   No account required • Takes 2 minutes    │
└─────────────────────────────────────────────┘
```

### Navigation
- Full sidebar navigation (same as logged-in)
- All links work and navigate
- Active states show correctly

### Dashboard
- Show pre-populated metrics
- Recent activity shows realistic data
- Quick action buttons present (but may show "Sign up to use")

---

## Technical Implementation

### Route Structure
```
/demo                  → Landing page to select demo
/demo/advocate         → Full advocate dashboard
/demo/evaluator        → Full evaluator dashboard  
/demo/*                → Any sub-path works (view-only)
```

### Demo Data Service
```typescript
// Example: src/lib/demo-data.ts
export const getDemoAdvocateData = () => ({
  clients: [...],
  students: [...],
  cases: [...],
  documents: [...],
  timeEntries: [...],
  invoices: [...],
  // etc
});

export const getDemoEvaluatorData = () => ({
  evaluations: [...],
  students: [...],
  documents: [...],
  // etc
});
```

### Demo Check Hook
```typescript
const useDemoMode = () => {
  const isDemo = usePathname().startsWith('/demo');
  const isReadOnly = true; // always read-only in demo
  return { isDemo, isReadOnly };
};
```

### Disable Write Actions
```typescript
// In mutations, check demo mode
if (isDemoMode) {
  toast.error("Demo mode - sign up to make changes");
  return;
}
```

---

## Acceptance Criteria

1. ✅ Two working demos accessible from `/demo/advocate` and `/demo/evaluator`
2. ✅ Pre-populated with realistic, non-placeholder data
3. ✅ Full navigation works between all pages
4. ✅ All data is viewable in detail
5. ✅ No write actions work - all show "Demo mode" feedback
6. ✅ Demo banner always visible
7. ✅ CTA to sign up clearly visible
8. ✅ Can switch between advocate and evaluator demos
9. ✅ Looks and feels like the real product
10. ✅ Fast loading - data pre-loaded, no real DB queries needed

---

## Deliverables

1. Demo landing page for selection
2. Demo Advocate route with full data
3. Demo Evaluator route with full data  
4. Demo data service with realistic seed data
5. Demo mode check throughout app
6. Read-only enforcement on all mutations
7. Persistent demo banner
8. CTA components for sign-up
9. Clean demo landing page design