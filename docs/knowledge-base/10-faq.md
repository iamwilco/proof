# PROOF Knowledge Base - Frequently Asked Questions

---

## General Questions

### What is PROOF?

PROOF (Public Registry of Outcomes & On-chain Funding) is a transparency platform for Cardano's Project Catalyst treasury. It tracks funded proposals, team accountability, milestone completion, and community feedback to make treasury spending visible and accountable.

### Who built PROOF?

PROOF was built to address the transparency gap in Cardano treasury governance. The goal is to help voters make informed decisions, recognize successful builders, and identify concerning patterns.

### Is PROOF official?

No. PROOF is an independent community tool, not affiliated with IOG, the Cardano Foundation, or Project Catalyst officially. Data is sourced from public APIs and community contributions.

### Is PROOF free to use?

Yes. All public features (browsing projects, viewing profiles, using the graph) are free without an account. Creating an account to contribute reviews and concerns is also free.

---

## Data Questions

### Where does the data come from?

| Data Type | Source |
|-----------|--------|
| Proposals | Catalyst Explorer API |
| Milestones | Milestones portal (manual export) |
| Voting | Catalyst voting records |
| GitHub metrics | GitHub API |
| On-chain data | Blockfrost API |
| Reviews/Concerns | Community submissions |

### How current is the data?

- **Proposals**: Synced daily
- **GitHub**: Updated on-demand
- **Milestones**: Periodic manual updates
- **Community content**: Real-time

Each data field includes a `lastSeenAt` timestamp showing when it was last verified.

### Is the data accurate?

We strive for accuracy, but:
- Source data may contain errors
- Identity resolution has ~86% confidence threshold
- Some historical data is incomplete

Every piece of data shows its source. Report errors via the concern system.

### Can I download the data?

Currently, no bulk export is available. API access may be offered in the future for researchers and builders.

---

## Account Questions

### Do I need an account?

No account needed to browse. Create an account to:
- Write reviews
- Submit concerns
- Bookmark projects
- Build reputation

### How do I create an account?

1. Click **Login** in the navigation
2. Choose: Magic Link (email), Google, or Cardano Wallet
3. Follow the prompts

### Can I delete my account?

Yes. Go to Profile Settings → Delete Account. Your reviews and concerns will remain but be anonymized.

### What data do you store about me?

- Email (if using email auth)
- Wallet address (if using wallet auth)
- Display name and profile info you provide
- Reviews, concerns, and activity
- Session information

We don't sell data or show ads.

---

## Scoring Questions

### How is the accountability score calculated?

The score (0-100) combines:
- **Completion** (30%): Projects completed vs. started
- **Delivery** (25%): On-time milestone rate
- **Community** (20%): Review ratings
- **Efficiency** (15%): Value vs. funding
- **Communication** (10%): Reports and responsiveness

### What do the badges mean?

| Badge | Score | Meaning |
|-------|-------|---------|
| 🟢 TRUSTED | 80-100 | Consistently delivers |
| 🔵 RELIABLE | 60-79 | Generally delivers |
| 🟡 UNPROVEN | 40-59 | Limited history |
| 🔴 CONCERNING | 0-39 | Pattern of issues |

### Why is someone marked UNPROVEN?

UNPROVEN means limited data, not poor performance. New proposers start here until they build history.

### Can scores be gamed?

Scores are based on:
- Objective metrics (completion, timelines)
- Community input (with reputation weighting)
- Multiple data sources

Gaming is difficult but not impossible. Report suspicious patterns.

### How is ROI calculated?

```
ROI = Outcome Score / Normalized Funding

Outcome Score = (GitHub × 40%) + (Deliverables × 30%) + (On-chain × 30%)
```

ROI measures observable outcomes relative to funding, not absolute value.

### My score seems wrong. What can I do?

1. Check the score breakdown on your profile
2. Verify the underlying data is correct
3. If data is wrong, submit a dispute with evidence
4. Moderators will review and adjust if warranted

---

## Review Questions

### How do I write a good review?

- Be specific with evidence
- Separate facts from opinions
- Consider scope and funding level
- Be constructive, not inflammatory

### Can project teams remove reviews?

No. Reviews cannot be removed by project teams. They can:
- Respond to reviews
- Report guideline violations

Only moderators can remove policy-violating content.

### What happens if I write a bad review?

If your review violates guidelines:
- First offense: Warning, possible removal
- Repeated: Account restrictions

"Bad" in terms of critical but fair? That's allowed and encouraged.

### Do reviews affect scores?

Yes. Average review ratings contribute to the Community Score component of accountability.

---

## Concern Questions

### What's the difference between a review and a concern?

| Review | Concern |
|--------|---------|
| General assessment | Specific issue |
| Rating + text | Category + evidence |
| Opinion-based | Fact-based |
| Anyone can write | Needs evidence |

### What happens after I submit a concern?

1. Concern appears on project page
2. Project team is notified
3. Team can respond
4. Moderators may escalate to flag
5. Issue can be marked resolved

### Can I remain anonymous?

No. Your display name appears on concerns. This prevents abuse and encourages accountability.

---

## Flag Questions

### What triggers an automated flag?

| Flag | Trigger |
|------|---------|
| repeat_delays | Person has >2 incomplete projects |
| similar_proposal | >76% text similarity |
| abandoned | No activity in 6+ months |
| overdue_milestone | Milestone past due |

### Are flags punitive?

Flags are informational, not punitive. They surface patterns for community awareness. A flag doesn't prevent future funding.

### How do I dispute a flag?

Flagged projects can:
1. Respond with explanation
2. Provide evidence of progress
3. Request moderator review

Valid explanations reduce flag visibility.

---

## Technical Questions

### What browsers are supported?

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Why is the graph slow?

The network graph can be resource-intensive with many nodes. Try:
- Filtering to fewer node types
- Zooming to specific areas
- Using a desktop browser

### Is there an API?

Internal APIs exist but are not publicly documented. Contact us if you're building something complementary.

### Is the code open source?

[TBD - depends on your decision]

---

## Privacy & Security

### Is my wallet address public?

If you authenticate via wallet, your address is stored but only visible if you choose to display it publicly.

### Can I use PROOF anonymously?

You can browse without an account. To contribute, you need an account, and your display name will be shown.

### How is my data protected?

- Passwords are not stored (magic link/OAuth)
- Sessions expire after 30 days
- Data stored on Supabase with encryption at rest
- No third-party trackers

---

## Getting Help

### How do I report a bug?

Contact admin via `/contact` or submit a concern on the affected entity.

### How do I request a feature?

Use the community feedback form on the site.

### How do I become a moderator?

Moderators are selected from trusted community members. Build reputation through quality contributions.

### Who do I contact for press/partnerships?

Email the project maintainer (contact info on site footer).
