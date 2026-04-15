# IEP Evaluation Prompts
## Built for Orvared - Arthur's Document Processing Framework

---

## LAYER 1: SUMMARIZE

**Prompt:**
```
You are a special education expert analyzing an IEP document. Provide a comprehensive summary including:

### Student Information
- Student name/ID (if visible)
- Grade level
- Primary disability category
- Secondary disability categories (if any)

### Present Levels (PLAAFP)
- Academic strengths and needs
- Functional strengths and needs
- How disability affects curriculum participation
- Current performance on state assessments

### Annual Goals
- Total number of goals
- Goal areas (reading, writing, math, speech, behavior, functional, etc.)
- Are goals measurable? (brief assessment)

### Services
- Special education hours/week
- Related services (OT, PT, speech, counseling, etc.)
- Service delivery model (push-in, pull-out, consult)

### Accommodations & Modifications
- Testing accommodations
- Classroom accommodations
- Any modifications to curriculum

### LRE
- Percentage of time in general education
- Any separate setting time

### Transition (if applicable)
- Postsecondary goals (employment, education/training, independent living)
- Transition services listed

### Dates
- IEP meeting date
- Annual review date
- ESY consideration (if noted)

### Summary Output:
Present in clean bullet format. If any section is missing or unclear, note "Not specified" or "Missing."
```

---

## LAYER 2: COMPARE (vs. Prior IEP or Legal Standard)

**Prompt - Version Comparison:**
```
Compare two IEP documents and identify ALL changes between the prior IEP and current IEP.

### Changes to Identify:

**Present Levels:**
- What changed in academic performance?
- What changed in functional performance?
- New information added?

**Goals:**
- Goals that were REMOVED
- Goals that were ADDED  
- Goals that were MODIFIED (show before/after)
- Goals kept the same

**Services:**
- Service changes (frequency, duration, location)
- Providers added/removed
- Minutes changes

**Placement:**
- LRE percentage change
- Any setting changes

**Accommodations:**
- Added accommodations
- Removed accommodations

**Transition:**
- New postsecondary goals
- New transition services

### Output Format:
Use table format:
| Category | Prior | Current | Change Type |
|----------|-------|---------|-------------|
| [field] | [prior] | [current] | Added/Removed/Modified |

If no prior IEP provided, respond: "No prior IEP available for comparison. Use evaluation layer instead."
```

**Prompt - Legal Standard Comparison:**
```
Compare this IEP against IDEA legal requirements and flag any deficiencies.

### Check Against:
1. All 13 disability categories considered?
2. Present levels address disability impact?
3. Measurable annual goals (at least one per area needing SDI)?
4. Goals have baseline, criteria, conditions?
5. Services include: type, frequency, duration, location, provider?
6. LRE statement present?
7. State assessment accommodations noted?
8. Progress reporting method specified?
9. Transition services (if age 14+ courses, age 16+ services)?
10. Prior Written Notice attached?

### Output:
| Requirement | Present? | Notes |
|-------------|----------|-------|
| [requirement] | Yes/No | [details] |

Flag as CRITICAL any missing required elements.
```

---

## LAYER 3: EVALUATE (Legal Compliance)

**Prompt:**
```
You are a special education legal expert. Evaluate this IEP for compliance with IDEA and [STATE] regulations.

### Federal IDEA Requirements:
- FAPE provided?
- Procedural safeguards followed?
- IEP team composition correct?
- Prior Written Notice provided before any change?
- Parental consent obtained for evaluation and services?

### State-Specific ([STATE] must be specified):

**Texas Check:**
- PWN within 5 school days?
- Evaluation within 45 school days + 30 calendar days for ARD?
- ARD notice 7 days (5 for discipline)?
- Dyslexia screened/addressed if indicated?

**Kentucky Check:**
- PWN "reasonable time" (interpret as 5 school days minimum)?
- ARC notice 7 days?
- Evaluation 60 school days?

**Colorado Check:**
- Consent can be revoked (not retroactive)?
- Abbreviated school day requires IEP team approval?
- Out-of-home placement rules followed?

### Quality Assessment:
- Goals: Measurable? Baseline documented? Ambitious enough for Endrew F. standard?
- Services: Specific enough? (not "as needed")
- LRE: Is placement least restrictive appropriate?

### Issue Flags:
| Issue | Severity | Legal Reference |
|-------|----------|-----------------|
| [issue] | Critical/Moderate | [IDEA cite] |

### Recommendation:
Brief statement on whether IEP appears legally compliant and what should be addressed.
```

---

## LAYER 4: DEVELOP (Generate New Content)

**Prompt - Goal Development:**
```
Based on the student's needs identified in this IEP, generate [NUMBER] measurable annual goals.

### Input Information:
- Disability: [category]
- Present levels: [from PLAAFP]
- Areas of need: [reading/writing/math/etc.]
- Grade level: [grade]
- Prior goals (if any): [list]

### Requirements for Each Goal:
1. Condition - How will goal be taught/delivered?
2. Behavior - What will student do? (observable)
3. Criterion - How much/how well to demonstrate mastery?
4. Timeline - By when will goal be mastered?

### Format:
**Goal Area: [Reading Comprehension]**
- **Condition:** Given a grade-level passage and comprehension questions...
- **Behavior:** Student will answer comprehension questions...
- **Criterion:** With 80% accuracy across 3 consecutive data points...
- **Timeline:** By May 2026 (end of school year)

Generate goals that are:
- Aligned with grade-level standards
- Based on present levels documented
- Ambitious per Endrew F. (appropriately challenging)
```

**Prompt - Service Recommendations:**
```
Based on the student's disability and needs, recommend appropriate special education and related services.

### Consider:
- Primary disability category
- Present level needs
- Least Restrictive Environment
- Evidence-based practices for this disability

### Output Format:
| Service | Frequency | Duration | Location | Provider |
|---------|-----------|----------|----------|----------|
| [service] | [hrs/week] | [mins/session] | [classroom/resource/etc] | [certified provider] |

Also note:
- Push-in vs pull-out considerations
- Related service needs (OT, PT, Speech, Counseling)
- ESY consideration if regression a concern
```

**Prompt - PWN (Prior Written Notice) Drafting:**
```
Draft Prior Written Notice for [PROPOSED ACTION] regarding [STUDENT NAME].

### Include all 7 required elements:
1. Description of action proposed or refused
2. Explanation of why action is proposed/refused
3. Description of evaluation/records used as basis
4. Description of other options considered + why rejected
5. Description of other factors relevant
6. Statement of procedural safeguards
7. Sources for parents to contact

### Context:
- Current IEP in place: [yes/no]
- Reason for change: [parent request / annual review / transition / etc]
- Parent concerns: [if any]

### Tone:
Professional, parent-friendly language, legally compliant.
```

---

## STATE CONTEXT PROMPTS

Add to evaluation based on state:

**For Texas:**
```
Texas Education Code references:
- 19 TAC §89.1055 - IEP requirements
- TEC §28.0062 - K-3 phonics requirement
- TEC §38.003 - Dyslexia identification
- 45 school days for FIIE + 30 calendar days for ARD meeting
- 5 school days for PWN (unless parent agrees to shorter)
```

**For Kentucky:**
```
Kentucky 707 KAR references:
- 1:300 - Child Find, evaluation
- 1:310 - Eligibility
- 1:320 - IEP requirements
- 1:340 - Procedural safeguards
- 1:350 - Placement/LRE
- 60 school days for initial evaluation
```

**For Colorado:**
```
Colorado 1 CCR 301-8 references:
- Consent revocation not retroactive
- Abbreviated school day requires IEP team approval
- Out-of-home placement: school of origin AU retained
- Age 3 to 21 eligibility
- Developmental delay: ages 3-8 only
```

---

## USAGE BY ARTHUR

When Coach uploads a document, I'll:

1. **First:** Identify document type (IEP, evaluation, correspondence, etc.)
2. **Then:** Use appropriate prompt layer
3. **Optionally:** Layer multiple prompts (summarize + evaluate, or compare + develop)

Each prompt is designed to be used with Claude/OpenAI and produces structured output for Orvared's case management system.