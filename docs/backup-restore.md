# Backups and restore test

MongoDB Atlas's free M0 cluster has **no automatic backups**, so PANS keeps its own: weekly, before
big changes (a new session's leadership, bulk edits), and before running any seed command against
production. A backup only counts once a restore of it has been checked, so do the test below at
launch and then once a term.

Backups hold personal data (alumni names, emails and phone numbers; feedback with contact emails).
Keep them on an encrypted drive or in the PANS Google Drive with access limited to the two account
admins, **never in the repository**, and delete copies older than a year.

## What you need

- [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) (`mongodump`,
  `mongorestore`). On Windows, install the MSI and open a new PowerShell window.
- The production connection string (`MONGODB_URI`, from the password manager). The `pans-api`
  database user from [docs/deployment.md](deployment.md) can read and write every database on the
  cluster, which the scratch restore needs.
- The repository, with `npm ci` run, for the verify step.

## 1. Back up

```powershell
# The live database. Set it in the terminal so it doesn't end up in a file.
$env:SOURCE_MONGODB_URI = "mongodb+srv://pans-api:…@cluster0.….mongodb.net/pans-unilag?retryWrites=true&w=majority"
$day = Get-Date -Format yyyy-MM-dd

mongodump --uri "$env:SOURCE_MONGODB_URI" --gzip --archive="pans-unilag-$day.archive"
```

The `.archive` file is the backup. `*.archive` and `dump/` are in `.gitignore`, so git won't pick
them up by accident, but move the file to the backup location straight away.

## 2. Restore into a scratch database

Restore into a **separate database** on the same cluster (`pans-unilag-restore-test`), never over
the live one:

```powershell
mongorestore --uri "$env:SOURCE_MONGODB_URI" --gzip --archive="pans-unilag-$day.archive" `
  --nsFrom "pans-unilag.*" --nsTo "pans-unilag-restore-test.*" --drop
```

`--drop` only clears `pans-unilag-restore-test` from an earlier test. The `--nsFrom`/`--nsTo` pair
is what keeps the restore away from `pans-unilag`: check it before pressing Enter.

## 3. Verify

```powershell
$env:RESTORED_MONGODB_URI = $env:SOURCE_MONGODB_URI -replace "/pans-unilag\?", "/pans-unilag-restore-test?"
npm run backup:verify -w server
```

The script reads both databases (it never writes) and compares every collection: the number of
documents and a SHA-256 fingerprint of their exact contents, so a missing document, a changed value
or a date that came back as text all show up. It prints only counts, never the documents:

```
Comparing "pans-unilag" (source) with "pans-unilag-restore-test" (restored)

collection     source  restored  result
admins              2         2  identical
alumni             14        14  identical
…
Restore verified: 16 collections, 412 documents, all identical.
```

Rate-limit counters (`ratelimits`) are skipped: they expire within the hour. If anyone edits the
site between steps 1 and 3, the edited collection shows `DIFFERENT`; run steps 1 to 3 again at a
quiet time.

## 4. Clean up and record

1. Drop the scratch database: Atlas → **Browse Collections** → `pans-unilag-restore-test` → delete;
   or `mongosh "$env:RESTORED_MONGODB_URI" --eval "db.dropDatabase()"`.
2. Forget the connection strings: `Remove-Item Env:SOURCE_MONGODB_URI, Env:RESTORED_MONGODB_URI`.
3. Note the date, the archive name and the "Restore verified" line (counts only, no data) in the
   PR or issue you're working on, or in the handover notes.

## Restoring for real

If the live data is lost or damaged:

1. Put the site into a quiet state: tell admins not to edit.
2. Restore the most recent verified archive over `pans-unilag`:
   `mongorestore --uri "$env:SOURCE_MONGODB_URI" --gzip --archive="…" --drop`
   (`--drop` replaces each collection with the backup's copy).
3. Check `/api/health`, a few pages, and the dashboard. Edits made after the backup are lost and
   need redoing.
