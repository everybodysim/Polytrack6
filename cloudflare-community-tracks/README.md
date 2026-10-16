# Polytrack6 Community Tracks — setup without commands

This adds a Community Tracks page from the former Multiplayer main-menu button. It keeps the existing track-selection tabs, editor, gameplay, and saved-track format.

You can set it up entirely in the Cloudflare and GitHub websites. **You do not need a terminal, command prompt, or command-line tools.**

## Part 1 — Create the D1 database

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/) and select your account.
2. Open **Storage & databases → D1 SQL Database** (the wording may appear as **D1**).
3. Choose **Create database** and name it `polytrack-community-tracks`.
4. Open the new database and choose its **Console** / **SQL** tab.
5. Open [schema.sql in this repository](https://github.com/everybodysim/Polytrack6/blob/main/cloudflare-community-tracks/schema.sql).
6. Copy all the SQL in that file, paste it into the D1 SQL console, and click **Run**. You should see a successful result. This creates the table that stores shared tracks.

## Part 2 — Create the Worker API

1. In Cloudflare, open **Workers & Pages** and choose **Create** → **Worker**.
2. Name it `polytrack-community-tracks`, then deploy the starter Worker.
3. Open the new Worker and choose **Edit code**.
4. In another tab, open [worker.js in this repository](https://github.com/everybodysim/Polytrack6/blob/main/cloudflare-community-tracks/worker.js). Copy the entire file.
5. Return to the Cloudflare editor, replace all starter code with the copied code, and choose **Deploy**.
6. Open the Worker’s **Settings** → **Bindings** → **Add binding**. Choose **D1 database**.
7. Set the variable name to exactly `DB`, select the `polytrack-community-tracks` database you created, and save the binding.
8. Deploy the Worker again if Cloudflare asks you to.

## Part 3 — Connect the game to the Worker

1. Open the Worker’s overview page and copy its public URL. It will look similar to `https://polytrack-community-tracks.your-subdomain.workers.dev`.
2. Open [community-tracks.js in GitHub](https://github.com/everybodysim/Polytrack6/blob/main/community-tracks.js).
3. Click the pencil **Edit** button.
4. Near the top, find the default URL containing `YOUR_SUBDOMAIN`. Replace only that URL with your actual Worker URL, keeping the quotation marks.
5. Click **Commit changes** to save the edit to the main branch.
6. Open your Worker URL with `/api/health` added to the end. For example: `https://polytrack-community-tracks.your-subdomain.workers.dev/api/health`. A working setup displays a small JSON response containing `"ok":true`.

Wait a minute or two for GitHub Pages to publish the update, then reload [Polytrack6](https://everybodysim.github.io/Polytrack6/).

## Using Community Tracks

- **Tracks:** browse tracks shared by everyone. Choose **Import** to save a track into your local Custom Tracks. Reload the game after importing so its built-in list refreshes.
- **Publish:** choose a locally saved custom track, fill in its public name, optional description, and author name, then press **Publish track**.
- The track itself stays in Polytrack’s native `PolyTrack2` format. No separate account or login is currently required.

## Important notes

- This setup uses **D1 only** for the database; it does not use Workers KV.
- Publishing currently has no accounts, moderation queue, or spam protection. Before widely sharing the feature, add rate limiting/moderation in Cloudflare.
- If you get stuck, send a screenshot of the Cloudflare page you are looking at. You should not need to use commands for these steps.
