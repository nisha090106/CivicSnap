# Priority-Based Community Reports

## 1. Feature Summary

Create a community dashboard centered on an interactive map. The map will show one marker for each active civic issue, combine duplicate submissions into a single canonical report, and let citizens support an existing issue with an upvote. Citizens may see the issue location, category, status, and total upvotes, but they must not see other citizens' comments or identities.

Authorities will see the same report clusters plus private comments, duplicate history, external social evidence, and a calculated priority class:

1. Highest
2. High
3. Medium
4. Low
5. Lowest

Priority will be calculated from CivicSnap upvotes and, where available and verified, engagement on relevant X posts. The final class must remain explainable to an authority officer.

> Product wording: treat X as an external data source using the official X API and its current terms, permissions, rate limits, and retention rules. Do not assume that an "open sourced" API permits unrestricted scraping or storage of post data.

## 2. Current System Starting Point

- `backend/models.py` already stores report coordinates, category, description, status, department, severity, and a legacy `vote_count` field.
- `backend/main.py` creates reports through `POST /api/reports/submit` and exposes citizen, public, and authority report feeds.
- `frontend/src/components/CommunityMap.jsx` already uses Leaflet and renders public reports as map markers.
- `frontend/src/pages/CitizenDashboard.jsx` already fetches `/api/reports/public` and provides a Community Map tab.
- `frontend/src/pages/AuthorityDashboard.jsx` already authenticates authority access and consumes the department-scoped report feed.

The feature should extend these existing paths rather than create a second reporting workflow.

## 3. Product Rules and Privacy Boundary

### Citizen experience

- Open the Community Dashboard and view nearby active issue markers.
- Filter or search by category, status, priority class, distance, and time range.
- Open a marker to see the canonical issue summary, approximate location, status, and upvote total.
- Upvote an issue once per authenticated citizen; allow the citizen to remove their own upvote if product policy permits.
- Add a comment to an issue. The author can see their own submitted comment and authorities can see all comments; other citizens cannot see comment text, author identity, or comment history.
- Never expose citizen email, exact identity, moderation metadata, internal notes, or private external-source matching details in public responses.

### Authority experience

- View reports assigned to the authority's department and jurisdiction.
- Sort by priority score/class, upvotes, age, status, and distance.
- View private comments, duplicate submissions, merge decisions, score factors, and linked X evidence.
- Update status using the existing authority workflow.
- See whether a report's priority came from CivicSnap support, X engagement, or both.

### Moderation and safety

- Require authentication for voting and commenting.
- Enforce one active vote per citizen per canonical report with a database uniqueness constraint.
- Rate-limit votes and comments and add basic abuse/spam controls.
- Provide authority moderation actions for hiding or flagging comments without deleting audit history.
- Keep an audit log for deduplication, merges, vote changes, comment moderation, score recalculation, and external-source linking.

## 4. Canonical Report and Deduplication Design

### Canonical record

Introduce a stable `canonical_report_id` or a separate `report_clusters` table. A cluster represents one real-world issue; the earliest valid report can be the canonical record, while later submissions become linked duplicates. Preserve every original submission for auditability and citizen ownership.

Recommended additions:

- `report_clusters`: canonical report, cluster status, merge confidence, merge reason, created/updated timestamps.
- `report_cluster_members`: source report, canonical cluster, match score, matched fields, created by, created at.
- `reports`: cluster reference and source (`civicsnap` or `x` where an external item is materialized).

### Matching strategy

Run deduplication during submission and again as a background reconciliation job:

1. Normalize category and reason/description into controlled values plus normalized text.
2. Use geospatial distance, not string equality, for location matching. Start with a configurable radius, for example 50 meters, then tune from real data.
3. Require category compatibility and reason similarity. Do not merge reports only because they are nearby.
4. Compare status and time window so an old resolved issue does not automatically absorb a new incident.
5. Produce a confidence score and matched-field explanation.
6. Auto-merge only above a high-confidence threshold; send borderline matches to authority review.
7. Reopen or split a cluster when later evidence shows that the issues are distinct.

A duplicate submission should return the canonical report ID and explain that the citizen's support was attached to the existing issue, without revealing private comments.

## 5. Priority Model

Use a normalized score so the UI class and authority ordering are deterministic. Store the inputs and score version for explainability.

Example first version:

```text
civic_support = capped_log(1 + unique_upvotes)
external_support = capped_log(1 + verified_x_engagement)
age_factor = bounded_age_factor(report_age)
severity_factor = configured_category_or_ai_severity
priority_score =
  0.50 * civic_support +
  0.20 * external_support +
  0.20 * severity_factor +
  0.10 * age_factor
```

Recommended safeguards:

- Count unique authenticated accounts, not raw requests.
- Cap or logarithmically scale large engagement values so one viral post cannot overwhelm local evidence.
- Only use X engagement from a matched post that passes location/category/reason validation.
- Do not use follower count as a proxy for public need.
- Recalculate on vote, comment moderation, report merge, status change, and verified X refresh.
- Version the formula and retain a score breakdown.

Initial configurable class thresholds should be agreed with authorities and stored in configuration, not hard-coded in React. Example labels are `highest`, `high`, `medium`, `low`, and `lowest`; thresholds must be calibrated against historical reports before production use.

## 6. X Integration

Create an asynchronous X ingestion service rather than making the report submission request wait for external API calls.

### Ingestion flow

1. A scheduled worker searches permitted X content using approved API access and query terms such as CivicSnap, supported issue categories, and configured locality terms.
2. Normalize returned post IDs, author information permitted by policy, timestamp, text, coordinates or place metadata when available, and public engagement metrics.
3. Run matching against open CivicSnap report clusters using location, category, reason, time, and text signals.
4. Store only the minimum permitted data and the X post ID, source URL, retrieval time, match confidence, and engagement snapshot.
5. Link high-confidence matches to a cluster; queue uncertain matches for authority review.
6. Refresh engagement on a schedule and make score updates idempotent.
7. Handle API errors, deleted posts, revoked access, rate limits, and policy changes without blocking CivicSnap reporting.

Suggested tables:

- `external_reports`: provider, external ID, canonical URL, normalized content metadata, retrieval state, timestamps.
- `external_report_links`: external report, cluster, match confidence, match status, reviewer, audit timestamps.
- `external_engagement_snapshots`: external report, like/repost/reply/quote counts, captured time, source payload hash if allowed.

Never present an unverified X post as proof. Display it to authorities as supporting evidence with source, timestamp, match confidence, and last refresh time.

## 7. Backend Implementation Plan

### Phase 1: Data model and migration

- Add cluster, member, vote, comment, audit, external report, link, and engagement snapshot tables.
- Add indexes for latitude/longitude, category, status, department, cluster ID, priority score, and timestamps.
- Add unique constraints for one vote per citizen per cluster and one external link per provider/post/cluster.
- Keep `vote_count` temporarily as a derived compatibility field, then migrate all reads to aggregated votes.
- Add a migration strategy instead of relying only on startup `ALTER TABLE` statements.

### Phase 2: Domain services

- Add `deduplication_service.py` for normalization, geospatial candidate lookup, similarity scoring, and merge/review decisions.
- Add `priority_service.py` for score calculation, class thresholds, versioning, and breakdowns.
- Add `external_ingestion_service.py` for X API polling, normalization, matching, retries, and rate-limit handling.
- Add idempotency keys for report submission, vote creation, and external ingestion.

### Phase 3: API contracts

Add endpoints following the existing `/api/reports` namespace:

- `GET /api/community/reports`: public canonical markers with safe fields and filters.
- `GET /api/community/reports/{id}`: public canonical report detail without private comments.
- `POST /api/community/reports/{id}/upvote`: create or toggle the authenticated citizen's vote.
- `POST /api/community/reports/{id}/comments`: create a private-to-authorities comment.
- `GET /api/reports/{id}/comments`: authority-only comments endpoint.
- `GET /api/reports/authority`: include priority class, score breakdown, cluster size, and external evidence summary for authorized departments.
- `POST /api/reports/{id}/merge` and `POST /api/reports/{id}/split`: authority-only review actions.
- `POST /api/external/x/sync` or an internal worker trigger: authority/admin-only operational endpoint.

Every endpoint must enforce role, department, and jurisdiction checks at the backend; frontend hiding is not a privacy control.

### Phase 4: Frontend

- Extend `CommunityMap` to render canonical clusters, priority/status marker styling, clustering at low zoom, loading/error states, and selected-report detail.
- Add Community Dashboard filters and a list/map synchronized selection model.
- Add an upvote control that shows only the aggregate count and the current user's vote state.
- Add a comment form that confirms comments are sent to authorities and does not render other citizens' comments.
- Extend `AuthorityDashboard` with priority sorting, five-class filters, score explanation, private comments, duplicate history, and external evidence.
- Keep map marker payloads minimal and avoid loading private authority data into citizen components.

## 8. Testing and Acceptance Criteria

### Backend tests

- Two submissions within the configured radius with matching category and reason form one cluster.
- Nearby reports with different categories or reasons remain separate.
- A duplicate submission preserves the original report and returns the canonical ID.
- A citizen cannot vote twice through repeated requests or concurrent requests.
- Votes from different citizens update the aggregate exactly once.
- Citizen report responses contain no comment text, comment author, email, or private X match details.
- Authority responses are department- and jurisdiction-scoped and include private fields only for authorized users.
- Priority classes are deterministic at threshold boundaries and score breakdowns match stored inputs.
- X ingestion is idempotent, respects rate limits, handles deleted/unavailable posts, and does not block report submission.
- Merge, split, moderation, and score recalculation actions create audit records.

### Frontend tests

- The map displays one marker per canonical cluster, not one per duplicate submission.
- A citizen can see and change their upvote state but never sees another user's comment text.
- An authority can inspect comments, duplicate members, score factors, and linked X evidence.
- Empty, loading, API failure, invalid coordinates, and permission-denied states are usable.
- Map and list filters produce the same result set.

### Operational acceptance

- Define target API latency for map loading and vote submission.
- Add metrics for duplicate rate, review queue size, vote abuse, X sync success, match confidence, and priority distribution.
- Add structured logs with report/cluster IDs but no unnecessary personal content.
- Document X credentials, data retention, deletion handling, and legal/privacy review before enabling production ingestion.

## 9. Rollout Sequence

1. Ship schema, cluster IDs, and read-only canonical map output behind a feature flag.
2. Enable deduplication in shadow mode and compare suggested merges with authority review.
3. Enable citizen upvotes and private comments with rate limits and audit logging.
4. Enable the five-class priority score using CivicSnap signals only; calibrate thresholds.
5. Add X ingestion in a limited locality and display it only to authorities.
6. Compare priority outcomes with authority decisions, tune weights, and expand gradually.
7. Remove compatibility reads of the legacy `vote_count` only after the new vote aggregation is stable.

## 10. Open Decisions

- What geographic radius and time window define a likely duplicate for each category?
- Should citizens be allowed to remove an upvote, and should resolved clusters remain votable?
- Which authority role can merge, split, moderate, and override priority?
- Should comments be visible to the commenting citizen after submission, or authority-only even for the author?
- What evidence is sufficient to match an X post when no coordinates are available?
- Which X API tier, retention policy, and deletion workflow are available for the deployment?
- Should severity from the existing AI pipeline influence priority immediately, or only after authority calibration?
- Which priority thresholds and response-time targets correspond to the five classes?
