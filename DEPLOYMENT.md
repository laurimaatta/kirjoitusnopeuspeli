# Vercel Deployment Guide - Global Leaderboard

Tämä ohje kertoo, miten peli otetaan käyttöön Vercelissä globaalilla top-listalla.

## Vaiheet

### 0. Asenna Vercel CLI (jos ei ole vielä asennettuna)

**Vaihtoehto 1: npm (suositeltu)**

```bash
npm install -g vercel
```

**Vaihtoehto 2: yarn**

```bash
yarn global add vercel
```

**Vaihtoehto 3: Homebrew (macOS)**

```bash
brew install vercel-cli
```

**Vaihtoehto 4: Windows (Scoop)**

```bash
scoop install vercel
```

Tarkista asennus:

```bash
vercel --version
```

### 1. Valmistele projekti

```bash
npm install
```

### 2. Luo Redis -tietokanta

1. Mene [Vercel Dashboard](https://vercel.com/dashboard)
2. Valitse projekti (tai luo uusi)
3. Mene **Storage**-välilehteen
4. Klikkaa **Create Database**
5. Valitse **Redis**
6. Valitse haluamasi alue (region)
7. Luo tietokanta

### 3. Yhdistä Redis projektiin

1. Klikkaa luomasi Redis -tietokantaa
2. Klikkaa **Connect to Project**
3. Valitse projekti, johon haluat yhdistää

**Tärkeää:** Vercel lisää automaattisesti seuraavat ympäristömuuttujat:

- `REDIS_URL` (tai `KV_URL`)

### 4. Yhdistä projekti paikalliseen kehitykseen

```bash
vercel link
```

Valitse projekti, johon Redis on yhdistetty.

### 5. Hae ympäristömuuttujat paikalliseen käyttöön

```bash
vercel env pull .env.development.local
```

Tämä luo `.env.development.local` -tiedoston ympäristömuuttujilla.

### 6. Paikallinen testaus (valinnainen)

Jos haluat testata paikallisesti:

```bash
vercel dev
```

Tämä käynnistää paikallisen kehityspalvelimen, joka simuloi Vercelin ympäristöä.

**Huom:** Redis-yhteys vaatii ympäristömuuttujat. Varmista että `.env.development.local` on luotu (`vercel env pull`).

### 7. Julkaise projekti

```bash
vercel --prod
```

Tai pushaa GitHubiin ja Vercel julkaisee automaattisesti.

## Tarkista että toimi

1. Avaa julkaistu sivusto
2. Pelaa peli ja yritä tallentaa tulos
3. Tarkista top-lista
4. Avaa peli eri selaimesta/laitteesta - pitäisi näkyä samat tulokset

## Ongelmatilanteet

### "Redis client not initialized" / "REDIS_URL environment variable is not set"

- Tarkista että Redis on yhdistetty projektiin
- Tarkista että `REDIS_URL` (tai `KV_URL`) on olemassa Vercel Dashboard → Project → Settings → Environment Variables
- Varmista että `redis` on asennettuna (`npm install`)
- Jos testaat paikallisesti, varmista että `.env.development.local` on luotu (`vercel env pull .env.development.local`)

### API endpoint ei toimi

- Tarkista että `/api/leaderboard.js` on olemassa
- Tarkista Vercel Function logs: Dashboard → Project → Functions

### CORS-virheet

- API-reitti sisältää CORS-otsakkeet
- Jos ongelmia, tarkista että `Access-Control-Allow-Origin` on asetettu oikein

## Top-listan nollaus

Jos haluat nollata top-listan:

1. Aseta ympäristömuuttuja Vercel Dashboardissa:
   - Mene Project → Settings → Environment Variables
   - Lisää uusi muuttuja: `LEADERBOARD_RESET_SECRET`
   - Anna sille arvo (esim. satunnainen merkkijono)
   - Julkaise projekti uudelleen

2. Avaa `/reset-leaderboard.html` julkaistussa sovelluksessa
3. Syötä salainen avain ja klikkaa "Nollaa Top-lista"

Vaihtoehtoisesti voit käyttää API:ta suoraan:
```bash
curl -X DELETE https://your-app.vercel.app/api/leaderboard \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-secret-key"}'
```

## Ympäristömuuttujat

Vercel lisää automaattisesti Redis-yhteyden yhdistämisen jälkeen:

```
REDIS_URL=redis://... (tai KV_URL=redis://...)
```

**Valinnainen:** Aseta `LEADERBOARD_RESET_SECRET` jos haluat käyttää reset-toimintoa.

**Älä lisää REDIS_URL manuaalisesti** - se lisätään automaattisesti, kun yhdistät Redis-projektin.

Jos testaat paikallisesti, hae ympäristömuuttujat komennolla:

```bash
vercel env pull .env.development.local
```
