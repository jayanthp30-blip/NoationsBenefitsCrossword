# Nations Benefits Crossword Challenge

Internal office game for the Nations Benefits newsletter: an interactive crossword
built from healthcare/fintech terms, with a shared live leaderboard and Excel export.

- **Live site:** https://jayanthp30-blip.github.io/NoationsBenefitsCrossword/
- **Leaderboard:** https://jayanthp30-blip.github.io/NoationsBenefitsCrossword/scoreboard.html
- **Repo:** https://github.com/jayanthp30-blip/NoationsBenefitsCrossword

---

## Accounts involved

| Service | Account | Notes |
|---|---|---|
| GitHub | `jayanthp30-blip` | Owns the repo and GitHub Pages hosting. All commits are authored as this account. |
| Firebase / Google Cloud | Project **`nb-crossword`** | Holds the Cloud Firestore database that stores scores. Log in at [console.firebase.google.com](https://console.firebase.google.com) with the Google account used to create this project. |

Nothing in this project is tied to any other personal account — only the two above.

---

## How it's built

Plain static site (HTML/CSS/JS, no build step, no framework) hosted on **GitHub
Pages**. Score data is stored centrally in **Cloud Firestore** so the leaderboard
is shared across every device/browser in the office, not just local to one player.

```
index.html          Landing (name/email entry) + the crossword game itself
scoreboard.html      Live office leaderboard + "Download as Excel" button
firestore.rules      Security rules for the crossword_scores collection (published copy)
.nojekyll             Tells GitHub Pages not to run Jekyll processing on the /assets folder

assets/
  style.css           All styling (design tokens at the top of the file)
  app.js              Crossword engine: grid build, clue selection, typing/scoring, submit flow
  scoreboard.js        Leaderboard page logic: fetch scores, render table, Excel export (SheetJS)
  crossword-data.js    Generated grid layout + all clue/answer data (see "Changing the clues" below)
  firebase.js           Thin wrapper around the Firebase Firestore SDK (submitScore / fetchScores)
  firebase-config.js    Firebase project config (NOT secret — see note below) + collection name
  logo.jpg              Nations Benefits logo
```

### Why Firestore, specifically

GitHub Pages only serves static files — there's no server to store submissions.
Firestore is a free cloud database that the site's JS talks to directly from the
browser, so every player's score lands in one shared place instead of being
stuck in their own browser's local storage.

**Firebase config is not a secret.** The values in `assets/firebase-config.js`
(`apiKey`, `projectId`, etc.) are meant to be public in client-side code — they
just identify which Firebase project to talk to. Actual access control is
enforced by the security rules below, not by hiding these values.

---

## Firestore setup (already done, documented for reference)

1. Firebase project **`nb-crossword`** created, Spark (free) plan.
2. **Cloud Firestore** database created in **production mode**, region
   `asia-southeast1` (Singapore). (Note: a Realtime Database also exists on this
   project from an earlier step — it's unused by the site; only Firestore matters.)
3. Security rules published (also saved in this repo as `firestore.rules`):
   - Anyone can **read** the `crossword_scores` collection (needed for the public
     leaderboard).
   - Anyone can **create** a new score document, but only if it has the right
     shape (name/email as non-empty strings, numeric score fields).
   - **No one can update or delete** a score once submitted — including through
     the app itself. This stops anyone from tampering with others' scores.
4. A **composite index** was created on `crossword_scores` (fields: `correctCount`
   descending, `timeSeconds` ascending) — required because the leaderboard query
   sorts by two fields at once. If you ever change the sort logic in
   `scoreboard.js`/`firebase.js` to order by different/additional fields,
   Firestore will throw an error in the browser console with a direct link to
   create the new index — just open that link while logged into the `nb-crossword`
   project and click **Create Index**.

To view/manage data directly: [console.firebase.google.com](https://console.firebase.google.com)
→ project **nb-crossword** → left sidebar **Firestore** (under "Project
shortcuts") → **Data** tab → `crossword_scores` collection.

---

## Changing the clues / crossword layout

The grid in `assets/crossword-data.js` was generated (not hand-placed) from the
original clue/answer list using a small script that:

1. Builds an intersecting crossword grid from a list of Across/Down
   `{answer, clue}` pairs (greedy best-intersection placement).
2. Numbers cells using standard crossword numbering rules.
3. Outputs the result as `window.CROSSWORD_DATA = {...}` — rows, cols, and a
   `words` array (`{number, dir, row, col, answer, clue, length}`).

That generator script isn't kept in the repo (it was a one-off build step run
locally). To change the clue list:
- Regenerate a similar script (a greedy word-placement algorithm sorting by
  word length, placing the longest word first, then placing each remaining
  word at its best-scoring letter intersection with already-placed words), or
- Manually edit the `words` array in `assets/crossword-data.js` directly if
  you're just tweaking clue text (not adding/removing words — changing the
  actual word list requires recomputing row/col positions so everything still
  intersects correctly).

---

## Local development

No build step needed — it's plain static files.

```bash
cd NoationsBenefitsCrossword
python3 -m http.server 8934
# open http://localhost:8934/index.html
```

Firebase works the same locally as in production since it's just a client-side
SDK talking to the real `nb-crossword` project — there's no separate local/dev
Firebase environment set up.

---

## Deployment

Push to `main` — GitHub Pages (configured in the repo's Settings → Pages,
legacy branch-based build from `main` / root) rebuilds automatically, usually
within ~20 seconds.

```bash
git add -A
git commit -m "..."
git push
```

---

## Known follow-ups / things to keep in mind

- A one-time **"QA Test"** score was submitted during setup testing to verify
  the whole pipeline (submission → Firestore → leaderboard → Excel export)
  works end-to-end. It should be deleted manually from the Firestore **Data**
  tab before sharing the game in the newsletter, since the app itself is not
  allowed to delete entries (see security rules above).
- There's no admin/moderation UI — if a bad submission ever needs removing,
  it has to be deleted the same way (Firestore console → Data tab → delete
  the document).
- `gh` (GitHub CLI) is authenticated on this laptop as `jayanthp30-blip` for
  pushing/managing the repo and GitHub Pages settings via `gh api`.
