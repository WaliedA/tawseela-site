# Pointing tawseela.co at the Render site

Runbook for taking `tawseela.co` off its parking page and onto the Render static
site. Everything below was verified against public DNS on **7 September 2026**;
re-check the "Current state" section before acting if significant time has passed.

The site is already live and serving at
<https://tawseela-site.onrender.com>. This document only covers the domain.

---

## Summary

| | |
| --- | --- |
| Domain | `tawseela.co` |
| Registrar | Netfirms (per Walied) |
| DNS today | Above.com / Trellian parking nameservers |
| Render service | `tawseela-site` (`srv-daf0kdon74is73fqbqag`), static site |
| Render dashboard | <https://dashboard.render.com/static/srv-daf0kdon74is73fqbqag> |
| Render workspace | My Workspace (`tea-cv155hl6l47c73f34ahg`) |

Two records are needed at the end of this. The work is in getting the zone onto
a nameserver you actually control first.

---

## Current state (verified 2026-09-07)

Nameservers:

```
ns118554.ztomy.com
ns218554.ztomy.com
```

These belong to Above.com / Trellian, a domain parking service. The SOA
responsible-party address is `abuse.confluence-networks.com`, and the serial is
the placeholder `2011101001`.

Apex `A` records point at parking infrastructure:

```
66.81.203.9
66.81.203.134
66.81.203.199
```

**The zone is empty apart from parking defaults.** Confirmed by three checks:

1. The nameservers wildcard-resolve every label. `zzq7x4nonexistent.tawseela.co`
   and `kjh23sdfk9.tawseela.co` both answer with the parking IPs, so apparent
   records for `mail`, `www`, `autodiscover`, `_dmarc` and
   `default._domainkey` are wildcard noise, not real entries.
2. The only `MX` record is `300 ~` — a literal tilde, a parking placeholder, not
   a routable mail host.
3. The only apex `TXT` is `v=spf1 a -all`, a parking default. `_dmarc` returns an
   empty TXT.

### What this means

**There is no live email on this domain and nothing in the zone worth
preserving.** Moving the nameservers cannot break mail, because there is no mail.
This is the low-risk case — no MX, SPF, DKIM or DMARC to carry across.

If that changes before you execute this — if someone sets up email on
`tawseela.co` in the meantime — stop and re-run the checks in
[Verification](#verification), because the migration then has to carry those
records across and the ordering below is no longer sufficient.

---

## Target state

| Host | Type | Value | TTL |
| --- | --- | --- | --- |
| `@` (apex) | `A` | `216.24.57.1` | 3600 |
| `www` | `CNAME` | `tawseela-site.onrender.com` | 3600 |

`216.24.57.1` is Render's anycast address for apex domains. It is not guessed —
it is the address already serving the other Render-hosted apex domains on this
account (`walied.net`, `waliedalbasheer.com`, `intuitio.vc`), and
`www.intuitio.vc` is a `CNAME` to `co-build.onrender.com` in exactly the shape
above.

Render's own dashboard shows the records it expects once the domain is added.
**If Render's panel disagrees with this table, follow Render.** It is the
authority; this table is a cross-check.

The three `66.81.203.x` parking `A` records must be **deleted**, not left
alongside the new one. Left in place, DNS round-robins and roughly three
visitors in four land on the parking page.

---

## Why the order matters

Editing DNS records in the Netfirms control panel while the nameservers still
say `ztomy.com` changes nothing in public DNS. Netfirms' panel edits Netfirms'
zone; the internet is asking Above.com. This is the single most common way this
task appears to fail.

So the nameservers move first, and only then do the records mean anything.

Equally, adding the DNS records without adding the domain inside Render means
Render receives the traffic and rejects it — it only serves hostnames that have
been registered against a service. Both sides have to be done.

Adding the domain in Render *before* the DNS exists is harmless; it simply sits
in an unverified state until the records resolve.

---

## Procedure

### 1. Decide where the zone will live

Pick one, and it becomes the panel where you edit records:

- **Netfirms' own DNS** — fewest moving parts if you are already paying for it.
- **Cloudflare** (free) — faster propagation, better tooling, and it can hold the
  zone independently of the registrar.
- **Hostinger** — worth noting: this is the DNS provider wired into Walied's
  Claude Code tooling, so if the zone lives here, record changes can be made
  directly from a session instead of by hand. The Hostinger account currently
  holds no domains.

The rest of this runbook is written provider-neutrally. Substitute your choice.

### 2. Repoint the nameservers

In the Netfirms account, find the domain's nameserver settings — usually under
Domains → `tawseela.co` → Manage → Nameservers or DNS. Replace
`ns118554.ztomy.com` and `ns218554.ztomy.com` with the nameservers of the
provider chosen in step 1.

If Netfirms has a "parking" or "domain forwarding" toggle enabled on this domain,
turn it off. Parking is what put the `ztomy.com` nameservers there, and some
registrars reassert them on save while the toggle is on.

Nameserver delegation changes propagate at the `.co` registry. Allow up to
24 hours, though it is commonly under an hour.

Confirm before continuing:

```bash
nslookup -type=NS tawseela.co 8.8.8.8
```

Do not proceed until this returns the new nameservers.

### 3. Add the domain in Render

Open <https://dashboard.render.com/static/srv-daf0kdon74is73fqbqag> →
**Settings** → **Custom Domains** → **Add Custom Domain**.

Add both, as separate entries:

- `tawseela.co`
- `www.tawseela.co`

Render will display the exact DNS records it expects for each. Compare them
against the [Target state](#target-state) table and use Render's values if they
differ.

### 4. Create the DNS records

In the panel of the provider from step 1:

1. **Delete** the apex `A` records `66.81.203.9`, `66.81.203.134` and
   `66.81.203.199` if the new provider imported them.
2. **Delete** the placeholder `MX` record (`300 ~`) and the parking
   `v=spf1 a -all` TXT. Neither does anything useful, and the SPF record in
   particular is a lie once real mail is set up later.
3. **Add** `@` → `A` → `216.24.57.1`.
4. **Add** `www` → `CNAME` → `tawseela-site.onrender.com`.

Leave TTL at the provider default, or 3600 if asked.

If the provider refuses a `CNAME` on `www` because a conflicting `A` record
exists, delete the `A` record first — a hostname cannot hold both.

### 5. Verify in Render

Back in the Render Custom Domains panel, click **Verify** on each entry. Once
verification passes, Render issues a TLS certificate automatically. That takes a
few minutes; the domain will serve a certificate warning until it completes.

---

## Verification

Run these once propagation has had time to settle.

Nameservers have moved off parking:

```bash
nslookup -type=NS tawseela.co 8.8.8.8
```

Apex resolves to Render and **only** Render — a single address, no `66.81.203.x`:

```bash
nslookup -type=A tawseela.co 8.8.8.8
```

`www` is a CNAME to the service:

```bash
nslookup -type=CNAME www.tawseela.co 8.8.8.8
```

The parking wildcard is gone — this must now return NXDOMAIN, where today it
answers with a parking IP:

```bash
nslookup zzq7x4nonexistent.tawseela.co 8.8.8.8
```

The site is served over HTTPS with a valid certificate:

```bash
curl -sI https://tawseela.co/ | head -1
curl -s https://tawseela.co/ | grep -o '<title>[^<]*</title>'
```

Expected: `HTTP/2 200` and `<title>Tawseela — People Mobility AI</title>`.

Deep links work, since all views are hash-routed off a single document:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://tawseela.co/assets/app.js
```

---

## Rollback

Nothing here is destructive to anything of value — the current zone holds only
parking defaults, and the site remains reachable at
<https://tawseela-site.onrender.com> throughout, independent of the domain.

To back out, set the nameservers at Netfirms back to:

```
ns118554.ztomy.com
ns218554.ztomy.com
```

The parking page returns once the registry propagates the change. Remove the
custom domains from the Render panel at the same time so Render is not holding
hostnames it no longer serves.

---

## Afterwards

Once the domain resolves, two things in the repo become worth revisiting:

- `index.html` already declares `https://tawseela.co/` as its canonical URL and
  in its Open Graph tags, so those become correct automatically. No edit needed.
- The remaining pre-launch items — contact form endpoint, owned photography, the
  hash-routing SEO decision — are listed in the repository
  [README](../README.md).
