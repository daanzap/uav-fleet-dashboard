# Sunday UAT Sign-off Checklist

Run these **4 PRD acceptance tests** on **Staging** before production release.  
Details: `READY_TO_TEST.md` § PRD Acceptance Tests, `PRD.md` §5.

| # | Test | Steps | Pass? |
|---|------|--------|------|
| 1 | **Isolation** | Log in as Marketing → no R&D/Training vehicles visible | ☐ |
| 2 | **Shared Pool** | Log in as R&D → Training vehicles visible and bookable | ☐ |
| 3 | **Snapshot** | Book vehicle → change hw_config → booking still shows old snapshot | ☐ |
| 4 | **Conflict** | Overlap booking → warning shown, submit still allowed and succeeds | ☐ |

**Sign-off:** All 4 passed on staging = ready for production.
