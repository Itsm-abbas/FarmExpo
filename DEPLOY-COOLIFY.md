# Deploying FarmExpo on a Contabo VPS with Coolify

Coolify is a free dashboard you install on your own server. It works like
Vercel: connect the GitHub repo, set the environment variables, add a domain,
and every push to `main` redeploys the app with HTTPS.

Time needed: about an hour the first time.

---

## 0. Before you start

### Stop tracking the `.env` file

The `.env` file (database password, `JWT_SECRET`) is committed in git, so it
is on GitHub. Remove it from git (the file stays on your computer):

```bash
git rm --cached .env
git commit -m "Stop tracking .env"
git push
```

It stays in the old commits, though. So:

- If the GitHub repo is **public**, make it private (GitHub > repo >
  Settings > General > Danger Zone > Change visibility).
- Either way, change the secrets: reset the database password in Supabase
  (Project Settings > Database > Reset password) and choose a new
  `JWT_SECRET`. Use the new values in step 6. Everyone has to log in again
  after `JWT_SECRET` changes.

### Things to have ready

- The VPS IP address, username (`root`) and password from Contabo.
- A domain or subdomain for the app, e.g. `farmexpo.yourcompany.com`.
- Your environment values (see step 6).

### Where the database lives

The plan is to move the database from Supabase onto this server (part B). Then
the app and the database sit side by side and queries are as fast as they can
be, wherever the server is. Until the move, the app keeps using Supabase in
Seoul.

---

## 1. Point your domains at the server

One server can host many websites. Every domain and subdomain simply points
at the same IP; Coolify's built-in proxy (Traefik) looks at which address the
visitor typed and sends them to the right site, each with its own HTTPS
certificate.

At each domain's registrar (where you bought it), add **A records** to the
VPS IP. For example:

| Domain | Type | Name | Value | Goes to |
|--------|------|------|-------|---------|
| yourcompany.com | A | `@` | VPS IP | company website |
| yourcompany.com | A | `www` | VPS IP | company website |
| yourcompany.com | A | `farmexpo` | VPS IP | this management system (`farmexpo.yourcompany.com`) |
| yourcompany.com | A | `coolify` | VPS IP | the Coolify dashboard |
| othersite.com | A | `@` and `www` | VPS IP | another website |

Domains bought from different registrars work the same way. Changes can take
from a few minutes to a few hours to start working.

The rest of this guide uses `farmexpo.yourcompany.com` for the management
system; use your real subdomain.

---

## 2. Connect to the server

### With PuTTY

1. Open **PuTTY**.
2. **Host Name (or IP address)**: your server IP. **Port**: `22`.
   **Connection type**: SSH.
3. To reuse it later: type `Contabo` under **Saved Sessions** and click
   **Save**. Next time, double-click `Contabo`.
4. Click **Open**. The first time, a security alert asks whether to trust the
   server: click **Accept**.
5. `login as:` type `root`, Enter. Then the password, Enter (nothing shows
   while you type; that is normal).

You are now typing commands on the server.

Handy in PuTTY:
- **Paste** = right-click inside the window (Ctrl+V does not work).
- **Copy** = just select text with the mouse; it is copied automatically.

### Or with PowerShell

```bash
ssh root@YOUR_SERVER_IP
```

Type `yes` the first time, then the password.

Update it first:

```bash
apt update && apt upgrade -y
```

---

## 3. Install Coolify

Still on the server:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This takes a few minutes. When it finishes, open in your browser:

```
http://YOUR_SERVER_IP:8000
```

Create the admin account straight away (the first person to open this page
becomes the admin).

---

## 4. Add the app

1. In Coolify: **Projects > + Add > New project**, name it `FarmExpo`.
2. Open the project's **production** environment > **+ New resource**.
3. Choose **Private Repository (with GitHub App)** and follow the steps to
   connect your GitHub account, then pick the `FarmExpo` repo and branch
   `main`.
   (If the repo is public you can use **Public Repository** and paste its URL.)
4. **Build Pack: Railpack** (the successor of Nixpacks, which is deprecated). It detects Next.js by itself.
5. **Port: 3000**.
6. Don't deploy yet: set up the database first.

---

## 5. Create the database and bring your data over from Supabase

### 5.1 Create PostgreSQL in Coolify

1. In the `FarmExpo` project: **+ New resource > Databases > PostgreSQL**
   (choose version **17**).
2. Leave **Make it publicly available** switched **off**. The app reaches it
   over Coolify's private network; nobody on the internet can.
3. Click **Start**.
4. Copy the **Postgres URL (internal)** shown on the database page. It looks
   like `postgres://postgres:LONGPASSWORD@abc123xyz:5432/postgres`. This is
   the new `DATABASE_URL`.
5. Note the database **container name** (the `abc123xyz` part, also shown
   at the top of the page); it is used below.

### 5.2 Copy the data

Pick a quiet time and tell your team not to enter anything for about 15
minutes, so nothing is added to Supabase during the copy.

On the server (logged in with `ssh` as in step 2):

```bash
mkdir -p ~/backups && cd ~/backups
```

Dump the Supabase database. Use the **direct** connection (port 5432, the
`DIRECT_URL` value) in quotes:

```bash
docker run --rm -v ~/backups:/backup postgres:17 pg_dump "SUPABASE_DIRECT_URL" --schema=public --no-owner --no-acl -Fc -f /backup/farmexpo.dump
```

`--schema=public` takes only your app's tables (including Prisma's migration
history), not Supabase's own internal schemas.

Load it into the new database (replace `CONTAINER` with the container name
from 5.1):

```bash
docker cp ~/backups/farmexpo.dump CONTAINER:/tmp/farmexpo.dump
docker exec CONTAINER pg_restore -U postgres -d postgres --no-owner --no-acl /tmp/farmexpo.dump
```

A few lines saying a schema "public" already exists are normal.

Check the data arrived (should list your tables and a count of users):

```bash
docker exec CONTAINER psql -U postgres -d postgres -c "\dt" -c "select count(*) from \"User\";"
```

Keep the Supabase project for a couple of weeks as a fallback, then you can
delete it.

### 5.3 Daily backups (don't skip this)

On Supabase, backups were done for you. On your own server they are your job:
if the disk fails, the data is gone.

On the database page in Coolify: **Backups > + Add**, schedule `0 2 * * *`
(every night at 2:00). Also add an **S3 storage** under Coolify
**Storages** (Cloudflare R2, Backblaze B2 or Contabo Object Storage are cheap)
and tick it on the backup, so copies are kept **off** the server too.

---

## 6. Environment variables

In the app's **Environment Variables** tab, add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | the internal Postgres URL from step 5.1 |
| `DIRECT_URL` | the same URL again |
| `JWT_SECRET` | a long random string |
| `APP_URL` | `https://farmexpo.yourcompany.com` (your real domain) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | your email settings, if you send password-reset emails |

Notes:

- With the database on the server there is no `?pgbouncer=true`; the app
  connects directly.
- `NEXT_PUBLIC_API_URL` is no longer needed; the app uses `/api` on its own
  domain.
- To make a random `JWT_SECRET`, run on the server:
  `openssl rand -base64 48`

---

## 7. Run database migrations on each deploy

In the app's **Configuration > General** (or **Advanced**), find
**Pre-deployment command** and enter:

```
npm run migrate
```

This runs `prisma migrate deploy` before each new version starts, so
migrations (such as `invoice_signature` and `speed_indexes`) are applied
automatically. They are written to be safe to run more than once.

---

## 8. Domain and HTTPS

In **Configuration > General > Domains**, enter:

```
https://farmexpo.yourcompany.com
```

Coolify gets a free SSL certificate (Let's Encrypt) by itself once the DNS
from step 1 points at the server.

---

## 9. Deploy

Click **Deploy**. Watch the **Logs** tab; the first build takes a few minutes.
When it says the deployment is finished, open your domain.

From now on, every `git push` to `main` deploys automatically (Coolify sets
this up through the GitHub App; check **Configuration > Webhooks** if not).

---

## 10. Secure the server

### Firewall

On the server:

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 8000
ufw enable
```

After you can reach the Coolify dashboard on its own domain (Coolify
**Settings > Instance's Domain**, e.g. `https://coolify.yourcompany.com`),
close port 8000:

```bash
ufw delete allow 8000
```

### Log in with a key instead of the password

#### With PuTTY

1. On your computer, open **PuTTYgen** (installed with PuTTY; search the
   Start menu).
2. Key type **EdDSA** (Ed25519), click **Generate** and move the mouse over
   the blank area until it finishes.
3. Optionally set a **Key passphrase** (a password for the key itself).
4. Click **Save private key**, save it somewhere safe, e.g.
   `Documents\contabo.ppk`. Never share this file.
5. Select **all** the text in the box **"Public key for pasting into OpenSSH
   authorized_keys file"** and copy it (Ctrl+C). It starts with `ssh-ed25519`.
6. In your PuTTY session on the server, run these two commands, pasting
   the copied key (right-click) where it says `PASTE_KEY_HERE`:

   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   echo "PASTE_KEY_HERE" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
   ```

7. In PuTTY, load your saved `Contabo` session, go to **Connection > SSH >
   Auth > Credentials**, and under **Private key file for authentication**
   browse to `contabo.ppk`. Go back to **Session**, click **Save**.
8. Under **Connection > Data**, set **Auto-login username** to `root`,
   then **Session > Save** again.
9. Open a **new** PuTTY window with the `Contabo` session. It should log in
   without asking for the server password. Keep your old window open until
   this works.

Then turn password login off (last block of this section).

#### Or with PowerShell

On **your computer** (PowerShell):

```bash
ssh-keygen -t ed25519
```

Press Enter for every question. Then copy the key to the server:

```bash
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Check that `ssh root@YOUR_SERVER_IP` now logs in **without** asking for the
password.

#### Turn password login off

Only once logging in with the key works (PuTTY or PowerShell), run on the
server:

```bash
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

---

## Your other websites on the same server

Each website is its own resource in Coolify, with its own domain:

1. Add the DNS records for its domain (step 1).
2. In Coolify, create a project for it (or use the same one) > **+ New
   resource**:
   - a site in a GitHub repo (Next.js, React, Node, PHP…): pick the repo, as
     in step 4;
   - plain HTML files: the same, Railpack serves them as a static site;
   - WordPress: **+ New resource > Services > WordPress** (Coolify sets up its
     own MySQL database).
3. Enter its domain under **Domains** (step 8), e.g.
   `https://othersite.com,https://www.othersite.com`.
4. Deploy. HTTPS is issued per domain automatically.

Every site that needs a database gets its **own** database resource, so one
site can never read or damage another's data. Add the nightly backups (step
5.3) to each one.

Keep an eye on memory: **Coolify > Servers > your server > Metrics**, or
`free -h` on the server. PostgreSQL, Coolify and a few Next.js sites fit
comfortably in 8 GB; a 4 GB plan gets tight with several Node apps.

---

## Everyday use

| You want to… | Do this |
|---|---|
| Release a change | `git push` to `main` |
| See errors | Coolify > app > **Logs** |
| Restart the app | Coolify > app > **Restart** |
| Go back to the last version | Coolify > app > **Deployments** > pick one > **Redeploy** |
| Change a secret | **Environment Variables**, then **Redeploy** |

## If something goes wrong

- **Build fails with Prisma errors**: check `DATABASE_URL` and `DIRECT_URL`
  are set and correct.
- **Site not reachable / no HTTPS**: the DNS record may not be active yet.
  Check with `ping farmexpo.yourcompany.com`; it should show your server IP.
- **"Bad gateway" (502)**: the app is not running on port 3000. Check the
  port setting (step 4) and the Logs.
- **Logged out everywhere**: expected after changing `JWT_SECRET`.
