# Vercel Deployment Guide - Global Leaderboard

Tämä ohje kertoo, miten peli otetaan käyttöön Vercelissä globaalilla top-listalla.

## Vaiheet

### 1. Valmistele projekti

```bash
npm install
```

### 2. Luo Vercel KV -tietokanta

1. Mene [Vercel Dashboard](https://vercel.com/dashboard)
2. Valitse projekti (tai luo uusi)
3. Mene **Storage**-välilehteen
4. Klikkaa **Create Database**
5. Valitse **KV** (Redis)
6. Valitse haluamasi alue (region)
7. Luo tietokanta

### 3. Yhdistä KV projektiin

1. Klikkaa luomasi KV -tietokantaa
2. Klikkaa **Connect to Project**
3. Valitse projekti, johon haluat yhdistää

**Tärkeää:** Vercel lisää automaattisesti seuraavat ympäristömuuttujat:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 4. Paikallinen testaus (valinnainen)

Jos haluat testata paikallisesti:

```bash
vercel dev
```

Tämä käynnistää paikallisen kehityspalvelimen, joka simuloi Vercelin ympäristöä.

**Huom:** KV-ympäristömuuttujat tarvitsevat Vercelin palvelun. Jos testaat paikallisesti, voit:
- Käyttää `vercel env pull` noutamaan ympäristömuuttujat
- TAI käyttää `vercel dev`, joka hoitaa tämän automaattisesti

### 5. Julkaise projekti

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

### "KV client not initialized"

- Tarkista että KV on yhdistetty projektiin
- Tarkista että ympäristömuuttujat ovat olemassa Vercel Dashboard → Project → Settings → Environment Variables
- Varmista että `@vercel/kv` on asennettuna (`npm install`)

### API endpoint ei toimi

- Tarkista että `/api/leaderboard.js` on olemassa
- Tarkista Vercel Function logs: Dashboard → Project → Functions

### CORS-virheet

- API-reitti sisältää CORS-otsakkeet
- Jos ongelmia, tarkista että `Access-Control-Allow-Origin` on asetettu oikein

## Ympäristömuuttujat

Vercel lisää nämä automaattisesti KV:n yhdistämisen jälkeen:

```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

**Älä lisää näitä manuaalisesti** - ne lisätään automaattisesti.
