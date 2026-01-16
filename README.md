# Kirjoitusnopeuspeli (Typewriter Speed Game)

Verkkoperustainen kirjoitusnopeuspeli suomenkielisille pelaajille. Pelissä sanat liikkuvat ikkunassa vasemmalta oikealle, ja pelaajan tulee kirjoittaa sanat oikein ennen kuin ne osuvat oikeaan seinään.

## Ominaisuudet

- 🎮 Selainpohjainen peli - ei tarvetta asennukselle
- 📊 Globaali top-lista - tallentaa parhaat tulokset Vercel KV -tietokantaan
- ⚡ Nopeutuu ajan myötä - peli kiihtyy jatkuvasti
- 🚨 Virhehävitys - väärät näppäilyt eivät pysäytä peliä, mutta aiheuttavat visuaalisen ja äänellisen hälytyksen
- 🎨 Moderni ja ammattimainen ulkoasu
- 🇫🇮 Suomeksi - käyttöliittymä ja sanat
- 🌐 Yhteinen top-lista kaikille pelaajille

## Asennus ja käyttö

### Paikallinen käyttö

1. Avaa `index.html` selaimessa
2. Aloita peli kirjoittamalla ensimmäinen sana

### Verkkokäyttöön

Peli on staattinen verkkosovellus, joten sen voi helposti julkaista mihin tahansa staattista sisältöä tukevaan palveluun:

#### GitHub Pages

1. Lataa koodi GitHub-repositorioon
2. Mene repositorion asetuksiin
3. Ota käyttöön GitHub Pages Source-haarasta

#### Netlify

1. Rakenna ja julkaise GitHub-repositorioon
2. Kytke Netlify GitHub-repositorioon
3. Aseta Build command: (tyhjä) ja Publish directory: /

#### Vercel (Suositeltu - globaali top-lista)

1. Asenna Vercel CLI:
   ```bash
   npm install -g vercel
   ```
   Tarkista asennus: `vercel --version`
2. Projekti-kansiossa: `npm install` (asentaa riippuvuudet)
3. Luo Redis -tietokanta:
   - Mene Vercel Dashboardiin
   - Valitse projekti → Storage → Create Database → Redis
4. Yhdistä Redis -tietokanta projektiin:
   - Dashboard: Storage → Redis → Connect to Project
5. Yhdistä projekti paikalliseen kehitykseen:
   - CLI: `vercel link` ja valitse projekti
6. Hae ympäristömuuttujat (paikalliseen testaukseen):
   - CLI: `vercel env pull .env.development.local`
7. Julkaise projekti: `vercel --prod`
   
**Huom:** Vercel lisää `REDIS_URL` ympäristömuuttujan automaattisesti Redis:n yhdistämisen jälkeen.

#### Muut palvelut

Peli toimii millä tahansa palvelulla, joka palvelee staattisia HTML-tiedostoja (AWS S3, Azure Static Web Apps, jne.)

## Pelin säännöt

1. Sanat ilmestyvät vasemmasta laidasta ja liikkuvat oikealle
2. Kirjoita sana oikein, jotta se katoaa
3. Sana saa 10 pistettä
4. Peli päättyy, kun sana osuu oikeaan seinään
5. Peli nopeutuu ajan myötä ja oikein kirjoitetuilla sanoilla

## Teknologiat

- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Redis (Vercel Storage) - globaali top-lista
- Vercel Serverless Functions - API-päätepisteet

## Tiedostorakenne

```
typewriter/
├── api/
│   └── leaderboard.js  # API-päätepiste top-listalle (GET, POST)
├── index.html          # Pää-HTML-tiedosto
├── styles.css          # Tyylitiedosto
├── game.js            # Pelilogiikka
├── words.js           # Suomenkieliset sanat
├── package.json       # NPM-riippuvuudet
├── vercel.json        # Vercel-konfiguraatio
├── README.md          # Tämä tiedosto
└── .gitignore         # Git-ignore-tiedosto
```

## Lisenssi

Vapaa käyttöön.

## Kehitys

Jos haluat muokata peliä:

1. Kloonaa repositorio
2. Avaa `index.html` selaimessa
3. Muokkaa tiedostoja haluamallasi editorilla
4. Päivitä selain nähdäksesi muutokset

### Lisäämässä uusia sanoja

Muokkaa `words.js`-tiedostoa ja lisää uusia sanoja `FINNISH_WORDS`-taulukkoon.
