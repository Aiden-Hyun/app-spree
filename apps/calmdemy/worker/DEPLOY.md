# Content Factory Deployment (V2, Local Companion)

## Scope

This deployment guide covers the V2-only content factory runtime.

- Worker runtime: local companion + local V2 worker
- External contract: `content_jobs`
- Cloud VM/cloud-function paths: removed

## Prerequisites

- Python venv at `worker/.venv`
- Firebase Admin credentials available (`GOOGLE_APPLICATION_CREDENTIALS` or `worker/service-account-key.json`)
- App dependencies installed (`npm install` in app root)

## 1) Deploy Firestore Rules/Indexes

From `apps/calmdemy`:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 2) Start Companion

From `apps/calmdemy/worker`:

```bash
python3 local_companion.py
```

Companion starts/stops `local_worker.py` automatically based on `worker_control/local` and queue state.

## 3) Optional Runtime Tuning

Set env vars in `worker/.env` as needed:

- `V2_ENABLE_DISPATCH=true`
- `V2_POLL_INTERVAL_SECONDS=1.0`
- `V2_MAX_STEP_RETRIES=2`
- `V2_STACK_ID=local-v2`
- `V2_VENV=.venv`

## 4) Verify Worker Health

- `worker_status/local-v2` heartbeat updates
- `worker_stacks_status/local` shows running PID
- `worker_log_tails/local-v2` streams logs

## 5) Validate End-to-End

1. Start app: `npx expo start`.
2. Create job from Admin Content Factory.
3. Confirm timeline entries in Job Detail from `factory_step_runs`.
4. Validate content appears in target collection after completion.

## Troubleshooting

### No jobs being picked up

- Check `worker_control/local.desiredState` is `running` or `auto`.
- Check `content_jobs` doc has `status` in `pending`/`publishing`.
- Check `v2DispatchError` field on job.

### Queue appears stuck

- Inspect `factory_step_queue` for expired leases.
- V2 worker runs stale-lease recovery periodically; restart companion if needed.

### Permission errors in admin timeline

- Ensure Firestore rules include admin read on:
  - `factory_step_runs`
  - `factory_job_runs`
  - `factory_jobs`
  - `factory_step_queue`
  - `factory_events`
