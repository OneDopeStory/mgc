# MGCOS Client Onboarding Flow

**Document type:** Internal process reference  
**Scope:** All three MGCOS tiers — Starter, Pro, Elite  
**Contains:** (1) Day-by-day onboarding timelines, (2) Email sequences, (3) Kickoff call agenda  
**Constraint:** No pricing discussed here. No invented client outcomes.

---

## Part 1 — Onboarding Timelines

### Tier 1: Starter — 7-Day Onboarding

| Day | Owner | Action | Tool / System | Deliverable / Checkpoint | Success Signal |
|-----|-------|--------|---------------|--------------------------|----------------|
| **Day 0** | `[AUTO]` Automated agent | Send signed-contract confirmation and access credentials | Contract management system + email | Welcome email (Email S-1 below) + portal login link | Client opens portal within 24 hrs |
| **Day 1** | Client | Complete intake questionnaire (business context, goals, current stack) | Onboarding portal form | Completed intake form | Form submitted; data auto-routes to MGC team workspace |
| **Day 1** | `[AUTO]` Automated agent | Provision client workspace, create intake summary, assign account lead | CRM + internal task runner | Client workspace live; account lead notified | Workspace creation confirmation logged |
| **Day 2** | MGC Team | Conduct 45-min kickoff call (agenda in Part 3) | Video conferencing + shared agenda doc | Kickoff call notes, confirmed 7-day milestones | Call notes delivered to client within 2 hrs |
| **Day 2** | MGC Team | Configure initial integrations (up to 2) based on intake data | Integration platform | Integration setup checklist completed | Test event fires successfully on each integration |
| **Day 3** | `[AUTO]` Automated agent | Run environment health check; flag any configuration gaps | Automated monitoring suite | Health-check report in client workspace | Green status on all configured integration endpoints |
| **Day 3** | Client | Review integration setup; confirm data is flowing as expected | Client portal dashboard | Client sign-off on integration verification | Client marks checkpoint complete in portal |
| **Day 4** | MGC Team | Deliver quick-start workflow template set (Starter tier: up to 3 workflows) | Workflow builder | Workflow templates live in client environment | Templates accessible and triggerable by client |
| **Day 5** | Client | Run first live workflow using provided templates | Workflow builder | First workflow execution log | Successful execution event logged; no critical errors |
| **Day 6** | MGC Team | Review Day 5 execution logs; resolve any errors; document usage notes | Internal workspace + client portal | Error resolution notes; updated usage guide | All Day-5 errors resolved or escalated with ETA |
| **Day 7** | `[AUTO]` Automated agent | Send go-live confirmation (Email S-3 below) and 30-day check-in calendar invite | Email platform + calendar system | Go-live confirmation delivered to client | Client acknowledges go-live; calendar invite accepted |
| **Day 7** | MGC Team | Internal handoff: transition from onboarding mode to ongoing account management | Internal CRM | Onboarding phase closed; account enters standard support queue | CRM status updated to "Active — Standard Support" |

---

### Tier 2: Pro — 14-Day Onboarding

| Day | Owner | Action | Tool / System | Deliverable / Checkpoint | Success Signal |
|-----|-------|--------|---------------|--------------------------|----------------|
| **Day 0** | `[AUTO]` Automated agent | Send signed-contract confirmation, portal credentials, and pre-call prep packet | Contract system + email | Welcome email (Email P-1 below) + portal access + prep doc | Client opens portal and downloads prep packet within 24 hrs |
| **Day 1** | Client | Complete extended intake questionnaire (tech stack, team structure, process owners, integration inventory) | Onboarding portal form | Completed intake form with integration inventory | Form submitted; data routes to MGC team and assigned architect |
| **Day 1** | `[AUTO]` Automated agent | Provision Pro workspace, run stack-compatibility pre-check, assign dedicated account lead and solutions architect | CRM + stack checker | Workspace live; compatibility report generated; team notified | No critical compatibility blockers flagged (or escalation sent) |
| **Day 2** | MGC Team + Client | Conduct 45-min kickoff call (agenda in Part 3 — use Pro sections) | Video conferencing | Kickoff notes, confirmed 14-day milestone map, open items log | Notes and milestone map delivered to client same day |
| **Day 3** | MGC Team | Architecture review: map client tech stack against MGCOS integration patterns | Internal architecture tooling | Architecture alignment document | Document shared with client; client confirms it reflects their environment |
| **Day 4** | MGC Team | Configure integrations (Pro tier: up to 5) and establish data routing | Integration platform | Integration configuration complete; routing rules documented | All integration endpoints return successful test events |
| **Day 5** | Client | Validate integration data in portal; identify any data-quality issues | Client portal | Client validation sign-off | Client submits validation checklist; issues (if any) logged |
| **Day 5** | `[AUTO]` Automated agent | Send mid-onboarding check-in (Email P-2 below) | Email platform | Check-in email delivered | Email opened; no unresolved blockers flagged by client |
| **Day 6** | MGC Team | Resolve any validation issues from Day 5; update routing rules as needed | Integration platform | Updated configuration; issue resolution log | All flagged issues resolved or on a documented ETA |
| **Day 7** | MGC Team | Deliver custom workflow set (Pro tier: up to 8 workflows, including 2 custom-built) | Workflow builder | Workflow library live in client environment | All 8 workflows trigger successfully in test mode |
| **Day 8** | Client + MGC Team | Workflow walkthrough session (30 min) — client runs each workflow with MGC support | Video conferencing + workflow builder | Walkthrough session recording; client questions documented | Client team demonstrates ability to trigger and monitor each workflow independently |
| **Day 9–10** | Client | Parallel test period: run workflows in parallel with existing processes | Client's existing tooling + MGCOS | Parallel run log | No critical divergences between old and new process outputs |
| **Day 11** | MGC Team | Review parallel run data; tune workflow logic if needed | Workflow builder + monitoring | Tuning changelog | Updated workflows re-validated by client |
| **Day 12** | MGC Team | Configure reporting dashboard (Pro tier: standard metrics + 2 custom views) | Dashboard / reporting tool | Dashboard live with client's KPI set | Client can access and filter dashboard independently |
| **Day 13** | `[AUTO]` Automated agent | Run full-environment health check across all integrations and workflows | Automated monitoring suite | Health-check report | All systems green; any amber/red items escalated with action plan |
| **Day 14** | `[AUTO]` Automated agent | Send go-live confirmation (Email P-3 below) and schedule 30-day review call | Email platform + calendar | Go-live email; 30-day review calendar invite | Client acknowledges go-live; invite accepted |
| **Day 14** | MGC Team | Internal handoff to account management; onboarding retrospective logged | Internal CRM | Retrospective notes; CRM updated to "Active — Pro Support" | Status updated; any open items transferred to account queue |

---

### Tier 3: Elite — 30-Day Onboarding

| Day | Owner | Action | Tool / System | Deliverable / Checkpoint | Success Signal |
|-----|-------|--------|---------------|--------------------------|----------------|
| **Day 0** | `[AUTO]` Automated agent | Send signed-contract confirmation, portal credentials, executive welcome packet, and dedicated Slack channel invite | Contract system + email + Slack | Welcome email (Email E-1 below) + portal + Slack channel active | Client exec team accepts Slack invite and opens portal within 24 hrs |
| **Day 1** | Client | Complete strategic intake form (org structure, strategic priorities, existing systems, key stakeholders, success metrics) | Onboarding portal + optional async video brief | Strategic intake document | Form submitted; video brief (if recorded) uploaded to client workspace |
| **Day 1** | MGC Team | Internal pre-kickoff briefing: review intake, assign full engagement team (account lead, solutions architect, QA lead) | Internal workspace | Engagement team briefed; roles documented | All team members confirm assignment; client workspace permissions set |
| **Day 1** | `[AUTO]` Automated agent | Provision Elite workspace, run full stack pre-check, generate preliminary integration map | CRM + stack checker | Elite workspace live; preliminary integration map in client portal | Workspace provisioned; no unresolved critical blockers |
| **Day 2** | MGC Team + Client | Conduct 45-min executive kickoff call (use Elite sections in Part 3 agenda) | Video conferencing | Kickoff notes; 30-day milestone map; stakeholder map | All deliverables shared same day; client exec signs off on milestone map |
| **Day 3–4** | MGC Team | Deep-dive discovery: architecture workshops (async or live, per client preference) | Collaboration platform + architecture tooling | System architecture document; gap analysis | Client technical lead reviews and approves architecture document |
| **Day 5** | MGC Team | Deliver custom integration plan: full stack mapping, data flow diagrams, phased rollout sequence | Diagramming + documentation tools | Integration plan document | Document delivered; client stakeholder signs off before Day 7 |
| **Day 6–8** | MGC Team | Integration build phase: configure all integrations (Elite: unlimited), establish data pipelines, set access controls | Integration platform + security tooling | Integration build complete; access control matrix documented | All integration endpoints validated; security review passed |
| **Day 7** | Client | Technical stakeholder review: validate integration configurations against internal standards | Client portal + shared documentation | Client technical sign-off | Sign-off received; any exceptions documented |
| **Day 8** | `[AUTO]` Automated agent | Run automated compliance and security scan across all configured integrations | Security scanning suite | Compliance scan report | Report delivered; any findings triaged with client within 24 hrs |
| **Day 9–10** | MGC Team | Resolve any compliance findings; document remediation steps | Integration platform + security tooling | Remediation log | All findings resolved or accepted-with-rationale by client |
| **Day 10** | `[AUTO]` Automated agent | Send mid-onboarding check-in (Email E-2 below) | Email platform | Check-in email with current milestone status | Email opened; no unresolved escalations outstanding |
| **Day 11–14** | MGC Team | Custom workflow development: build client-specific workflows (Elite: unlimited, including AI-assisted automations) | Workflow builder + AI agent tooling | Full workflow library in client environment | All workflows pass QA testing in staging environment |
| **Day 13** | MGC Team + Client | Workflow review session: client team runs through each workflow family with MGC QA lead | Video conferencing + workflow builder | Session recording; approved workflow list; change request log | Client QA stakeholder formally approves workflow set |
| **Day 14–16** | Client + MGC Team | Staged rollout phase 1: deploy workflows to a subset of live processes | Production environment | Phase 1 rollout report | Phase 1 processes running without critical errors for 48 hrs |
| **Day 17** | MGC Team | Review Phase 1 data; identify tuning opportunities; brief client | Monitoring + analytics | Phase 1 tuning report | Report delivered; client approves any proposed changes |
| **Day 17–18** | MGC Team | Apply Phase 1 tuning; re-validate affected workflows | Workflow builder | Updated workflow configurations | Re-validation passes; client confirms |
| **Day 19–22** | Client + MGC Team | Staged rollout phase 2: expand to remaining live processes | Production environment | Phase 2 rollout log | All production workflows running successfully for 72 hrs |
| **Day 20** | MGC Team | Configure custom reporting suite and executive dashboard (Elite: fully custom, unlimited views) | Dashboard / reporting tool | Dashboard live with client's complete KPI set | Client exec team can access, filter, and export dashboard independently |
| **Day 22–24** | MGC Team | Train client team: run role-specific training sessions (operations, technical admin, executive overview) | Video conferencing + documentation | Training session recordings; role-based quick-reference guides | Each stakeholder group completes training and signs attendance log |
| **Day 25** | `[AUTO]` Automated agent | Run full-environment health check: all integrations, workflows, dashboards, security posture | Automated monitoring suite | Full health report | All systems green; any exceptions have documented remediation plans |
| **Day 26–28** | Client | Independent operation period: client runs all processes without MGC hands-on support; MGC on standby | Client's production environment | Daily operation logs (auto-generated) | Client completes 3 days of independent operation with no critical escalations |
| **Day 28** | MGC Team | Pre-go-live review: assess independent operation logs; confirm readiness | Internal workspace | Go-live readiness checklist | All checklist items green; client and MGC both sign off |
| **Day 29** | MGC Team | Finalize account documentation: runbooks, escalation paths, SLA details, contact matrix | Documentation platform | Complete account runbook delivered to client | Client confirms receipt and reviews runbook |
| **Day 30** | `[AUTO]` Automated agent | Send go-live confirmation (Email E-3 below); schedule 30-day and 90-day review calls | Email platform + calendar | Go-live email; both review calls on calendar | Client acknowledges go-live; both invites accepted |
| **Day 30** | MGC Team | Full onboarding retrospective: document lessons learned, update internal templates, brief ongoing account team | Internal workspace + CRM | Retrospective document; CRM updated to "Active — Elite Support" | Ongoing account team briefed; no open onboarding items |

---

## Part 2 — Onboarding Email Sequences

> **Tone guide:** Direct, efficient, enterprise-grade. No fluff. Respect the client's time. Every email has exactly one primary CTA.

---

### Starter Tier Emails

---

#### Email S-1 — Welcome / Day 0

**Subject:** You're in — here's how your first 7 days work  
**Preview text:** Access live. Your kickoff call slot is waiting.

**Body:**

Welcome to MGCOS Starter.

Your workspace is live. Use the button below to access it now — your login credentials are pre-set.

Here is what happens over the next 7 days:

- **Day 1:** Complete your intake questionnaire (10 minutes). This is the input your account lead uses to configure your integrations.
- **Day 2:** 45-minute kickoff call with your account lead. You'll confirm your first integrations and set your 7-day milestones.
- **Days 3–6:** MGC configures your integrations and delivers your workflow templates. You'll validate and run your first live workflow before Day 6.
- **Day 7:** Go-live confirmation. You'll be in standard support from that point forward.

One request: complete the intake questionnaire before your kickoff call. It makes the call significantly more productive for both sides.

Questions before Day 2? Reply directly to this email.

**Primary CTA:** Access Your Workspace →

---

#### Email S-2 — Mid-Onboarding Check-In (Day 5)

**Subject:** Day 5 check-in: your integrations are live  
**Preview text:** One task remaining before go-live.

**Body:**

You are now five days into your Starter onboarding. Here is where things stand:

Your integrations are configured and your workflow templates are in your environment. Today is your first day running a live workflow.

Before Day 7, one item is on your side: run at least one workflow using the templates your account lead delivered. The execution log auto-generates — no manual reporting needed. If anything does not behave as expected, flag it in your portal and your account lead will resolve it before go-live.

If today's workflow run goes smoothly, you are on track for a Day 7 go-live with no extensions needed.

One thing to check: confirm that your portal dashboard is showing live data from your connected integrations. If the data looks off, that is the signal to open a support ticket now rather than on Day 7.

Any blockers? Reply here or log them directly in your portal.

**Primary CTA:** Run Your First Workflow →

---

#### Email S-3 — Go-Live Confirmation (Day 7)

**Subject:** MGCOS Starter is live — you're in standard support  
**Preview text:** Onboarding complete. Here's what comes next.

**Body:**

Your 7-day Starter onboarding is complete.

Your integrations are running. Your workflows are live. You are now in MGC's standard support queue, which means:

- Support requests go through your portal (response SLA per your agreement)
- Your account lead remains your primary contact for strategic questions
- Your 30-day check-in call is on your calendar — use it to flag anything that needs tuning

Two things to do in the next 48 hours:

1. Run a full review of your workflow execution logs — your first week of live data is the most diagnostic
2. Bookmark your dashboard. It is the fastest way to catch any configuration drift early

The onboarding is closed, but this is not a handoff to silence. If something is not working as expected, reach out. The cost of catching an issue now is far lower than correcting it at 60 days.

**Primary CTA:** View Your Dashboard →

---

### Pro Tier Emails

---

#### Email P-1 — Welcome / Day 0

**Subject:** MGCOS Pro is active — your engagement starts now  
**Preview text:** Workspace live. Pre-kickoff prep packet attached.

**Body:**

Welcome to MGCOS Pro.

Your workspace is provisioned and your dedicated account lead and solutions architect have been assigned. You will meet both on your Day 2 kickoff call.

Before that call, one action on your side: complete the extended intake questionnaire in your portal. It covers your tech stack, team structure, integration inventory, and process priorities. Budget 20–30 minutes. The quality of your kickoff call is directly proportional to the completeness of that form.

Also attached to this email: your pre-kickoff prep packet. It contains the kickoff agenda, a brief on what the first 14 days will cover, and a checklist of technical information you will want on hand for Day 2 (API credentials, data owner contacts, current integration documentation).

Your 14-day milestone map will be confirmed on the kickoff call. Nothing gets built before that conversation.

Access your workspace now using the button below.

**Primary CTA:** Open Your Portal →

---

#### Email P-2 — Mid-Onboarding Check-In (Day 5)

**Subject:** Day 5 status: integrations complete, workflows next  
**Preview text:** Validation sign-off needed before we proceed.

**Body:**

You are at the midpoint of your first week. Here is where your Pro onboarding stands.

Completed: your integrations are configured and your data routing is set. The next step is yours — your account lead needs your validation sign-off in the portal before the workflow build begins.

Why this matters: the workflow templates are built from your integration data. If there are any data-quality issues, catching them now (Day 5) costs 30 minutes. Catching them on Day 11 costs days.

Log in to your portal, review the integration data flowing in, and complete the validation checklist. If anything looks off, flag it — your solutions architect will resolve it before Day 6.

Assuming clean validation today, your workflow library will be delivered by Day 7. The Day 8 walkthrough session will put your team through each workflow hands-on.

Any questions about the validation process? Reply directly or reach your account lead through the portal.

**Primary CTA:** Complete Your Validation Checklist →

---

#### Email P-3 — Go-Live Confirmation (Day 14)

**Subject:** MGCOS Pro is live — 30-day review call is scheduled  
**Preview text:** 14-day onboarding complete. What happens next.

**Body:**

Your 14-day Pro onboarding is complete. All integrations are running in production. Your workflow library is live. Your reporting dashboard is active.

You are now in Pro support. Your dedicated account lead remains your primary contact. Support response SLAs are per your agreement.

Three actions for your first week in production:

1. **Run your dashboard daily.** The first two weeks of live data establish your baseline — deviations from that baseline are early indicators of configuration drift or process gaps.
2. **Use the training materials.** Your walkthrough session was recorded and is in your portal. Share it with any team members who weren't in the Day 8 session.
3. **Prepare for your 30-day review.** Your calendar invite is already sent. Come with data: what is working, what needs tuning, and what you want to add in the next quarter.

The 30-day review is a working session, not a check-in call. Prepare accordingly.

**Primary CTA:** Access Your Dashboard →

---

### Elite Tier Emails

---

#### Email E-1 — Welcome / Day 0

**Subject:** MGCOS Elite engagement confirmed — your team is ready  
**Preview text:** Workspace live. Dedicated Slack channel active.

**Body:**

Welcome to MGCOS Elite.

Your engagement team is assigned: you have a dedicated account lead, solutions architect, and QA lead. All three are in your dedicated Slack channel, which is now active.

Your workspace is provisioned. Your 30-day onboarding begins today.

Before your Day 2 executive kickoff call, one request: complete the strategic intake form in your portal. It covers organizational structure, strategic priorities, existing systems, key stakeholders, and the success metrics your leadership team is accountable for. This is the foundation for everything built in the next 30 days. Budget 45 minutes for it, or delegate it to your technical lead with instructions to include executive context.

Your kickoff call on Day 2 will be 45 minutes. We will confirm your 30-day milestone map and ensure alignment across your stakeholder group before any build work begins.

Your engagement team is in Slack now if you have questions before Day 2.

**Primary CTA:** Open Your Portal →

---

#### Email E-2 — Mid-Onboarding Check-In (Day 10)

**Subject:** Day 10 status: integrations complete, workflow build underway  
**Preview text:** Compliance scan clear. Phase 1 rollout on track for Day 14.

**Body:**

You are ten days into your Elite onboarding. Here is a precise status update.

**Complete:** Full integration build across your environment. Compliance and security scan passed with all findings resolved. Your engagement team has signed off on the integration configuration.

**In progress:** Custom workflow development begins now. Your workflow library will include all agreed automation families, including AI-assisted workflows where scoped.

**Coming up:** Day 13 workflow review session — your QA stakeholder and your MGC QA lead will run through each workflow family together. Day 14 begins Phase 1 staged rollout to a subset of your live processes.

One reminder: your Day 13 attendee list should include whoever owns QA approval authority on your side. This is not an informational session — it is the formal approval gate before production deployment.

If your stakeholder map has changed since Day 2, let your account lead know today so we can update the session invite list.

**Primary CTA:** View Your Onboarding Dashboard →

---

#### Email E-3 — Go-Live Confirmation (Day 30)

**Subject:** MGCOS Elite is fully live — here is what your engagement team is tracking  
**Preview text:** 30-day onboarding complete. 30-day and 90-day reviews are scheduled.

**Body:**

Your 30-day Elite onboarding is complete.

Every integration is running. Your full workflow library is in production. Your custom reporting suite is live. Your team has completed role-specific training. You have three days of independent operation on record.

You are now in Elite support. Your dedicated account lead, solutions architect, and QA lead remain your primary contacts. SLAs and escalation paths are documented in your account runbook, which was delivered on Day 29.

Two structured checkpoints are already on your calendar:

- **30-day review** — a working session to assess your first month of production data and identify any tuning priorities
- **90-day review** — a strategic session to evaluate expansion opportunities and align on the next quarter's priorities

Come to both with data. Your dashboard is the source of truth.

One final note: the 30-day mark is when configuration drift becomes detectable. Your account lead will flag any anomalies in your weekly monitoring report — but the fastest signal is always your own operational awareness. If something feels off before your review, escalate. Do not wait for a scheduled call.

**Primary CTA:** Access Your Executive Dashboard →

---

## Part 3 — Kickoff Call Agenda Template

**Format:** 45-minute video call  
**Required attendees:** Client decision-maker, client technical lead (if applicable); MGC account lead  
**Additional attendees:** MGC solutions architect (Pro and Elite only); client QA stakeholder (Elite only)  
**Preparation required:** Client completes intake questionnaire before this call

> **Tier-specific sections are marked:** `[ALL TIERS]` `[PRO + ELITE ONLY]` `[ELITE ONLY]`

---

### Pre-Call Checklist (Facilitator — MGC Account Lead)

- [ ] Intake questionnaire completed and reviewed
- [ ] Client portal provisioned and accessible
- [ ] Milestone map draft prepared for review
- [ ] Kickoff notes template open and ready
- [ ] Screen share tested

---

### Section 1 — Introductions `[ALL TIERS]`

**Duration:** 5 minutes  
**Owner:** MGC Account Lead  
**Purpose:** Establish the working relationship and set the tone for the engagement.

**Agenda items:**
- Account lead introduces themselves and their role
- Invite client to introduce decision-maker and technical lead
- Confirm the 45-minute agenda and the one expected outcome: a confirmed milestone map

**Discovery questions:**
1. "Who from your team will be the day-to-day operational owner of MGCOS — meaning, who checks the dashboard and is first to notice if something is off?"
2. "Who has final approval authority if we need a quick decision during the build phase?"
3. "Is there anyone on your team who should receive all onboarding communications who isn't on this call?"

---

### Section 2 — Business Context Discovery `[ALL TIERS]`

**Duration:** 15 minutes  
**Owner:** MGC Account Lead (with MGC Solutions Architect listening — Pro and Elite)  
**Purpose:** Understand the client's operational context, priorities, and definition of success well enough to build the right thing, in the right order.

**Discovery questions — all tiers:**
1. "What is the primary problem you hired MGCOS to solve? Not the feature set — the outcome."
2. "What does good look like at Day 30 / Day 90? What would make you say this was worth it?"
3. "What has gotten in the way of solving this problem before — either with other tools or internally?"

**Discovery questions — Pro + Elite (additional):** `[PRO + ELITE ONLY]`

4. "Who are the internal stakeholders most affected by this implementation — and are any of them skeptical or resistant? How should we handle that?"
5. "Are there any political, compliance, or contractual constraints on your side that could affect our build decisions or timeline?"

**Discovery questions — Elite (additional):** `[ELITE ONLY]`

6. "What does your executive leadership team need to see in the first 90 days to consider this engagement a success? Is that different from what your operations team needs to see?"
7. "Are there strategic initiatives on your roadmap in the next 6 months that MGCOS should be aware of so we can design for them rather than against them?"

**Facilitator note:** This section is diagnostic, not prescriptive. Listen for gaps between what the intake form said and what the client says in the room. Gaps are the most important signal.

---

### Section 3 — Technical Setup Review `[ALL TIERS]`

**Duration:** 10 minutes  
**Owner:** MGC Account Lead (Starter); MGC Solutions Architect (Pro + Elite)  
**Purpose:** Confirm the technical environment, validate integration assumptions, and surface any blockers before build work begins.

**Discovery questions — all tiers:**
1. "Walk me through your current tech stack at a high level — what are the two or three systems this needs to connect to on Day 1?"
2. "Are there any access or permission constraints we should know about before we start configuring integrations — firewall rules, SSO requirements, API rate limits?"

**Discovery questions — Pro + Elite (additional):** `[PRO + ELITE ONLY]`

3. "Who on your team can grant API access to your core systems? Are they available this week if we need to move quickly?"
4. "Do you have a staging or sandbox environment, or are we working directly in production?"
5. "Are there any compliance frameworks (SOC 2, HIPAA, GDPR, etc.) that govern how your data moves through third-party systems?"

**Discovery questions — Elite (additional):** `[ELITE ONLY]`

6. "Does your security or IT team need to review our integration architecture before we proceed? If so, what is their typical review timeline?"
7. "Are there internal change management processes — CAB approvals, change windows — that affect when we can deploy to production?"

**Facilitator note:** Do not attempt to resolve technical blockers on this call. Log them in the open items tracker and assign an owner and resolution ETA before the call ends.

---

### Section 4 — Milestone Map Review `[ALL TIERS]`

**Duration:** 10 minutes  
**Owner:** MGC Account Lead  
**Purpose:** Walk through the day-by-day milestone map (pre-populated from intake data), confirm client understanding, identify any conflicts, and get verbal sign-off.

**Agenda items:**
- Share screen: walk through the tier-appropriate milestone table (from Part 1 of this document)
- Highlight client-owned actions and their due dates
- Identify any conflicts with client availability (travel, blackout dates, internal deadlines)
- Adjust the map if needed — document any changes in the kickoff notes
- Get verbal confirmation: "Does this milestone map look achievable from your side?"

**Discovery questions:**
1. "Are there any dates in this timeline where your team will be unavailable or at reduced capacity — holidays, offsites, product launches?"
2. "Is there a hard deadline on your side — a board meeting, a client commitment, a budget cycle — that we should be designing around?"

**Tier-specific note:** `[ELITE ONLY]`  
For Elite clients, also confirm the stakeholder availability for the Day 13 workflow review session and the Day 26–28 independent operation period. Both require named owners.

---

### Section 5 — Q&A and Next Steps `[ALL TIERS]`

**Duration:** 5 minutes  
**Owner:** MGC Account Lead  
**Purpose:** Close cleanly. No open questions leave this call without an owner and a deadline.

**Agenda items:**
- Open floor for client questions
- Review the open items log captured during the call — confirm owner and resolution deadline for each item
- Confirm the one client action due before the next MGC touchpoint (typically: complete validation checklist or run first workflow)
- Set expectation for next communication: when the client should expect to hear from MGC next and through what channel

**Closing questions:**
1. "What is the one thing, if it does not go well, that would make this onboarding feel like a failure for your team?"
2. "Is there anything we didn't cover today that you expected to cover?"

**Facilitator note:** Send kickoff notes to the client within 2 hours of the call. Notes must include: confirmed milestone map, complete open items log (with owners and deadlines), and any decisions or scope changes agreed during the call.

---

*End of MGCOS Onboarding Flow document.*
