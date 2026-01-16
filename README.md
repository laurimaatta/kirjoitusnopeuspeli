# Kirjoitusnopeuspeli (Typewriter Speed Game)

Verkkoperustainen kirjoitusnopeuspeli suomenkielisille pelaajille. Pelissä sanat liikkuvat ikkunassa vasemmalta oikealle, ja pelaajan tulee kirjoittaa sanat oikein ennen kuin ne osuvat oikeaan seinään.

## Ominaisuudet

- 🎮 Selainpohjainen peli - ei tarvetta asennukselle
- 📊 Top-lista - tallentaa parhaat tulokset selaimen paikalliseen tallennustilaan
- ⚡ Nopeutuu ajan myötä - peli kiihtyy jatkuvasti
- 🚨 Virhehävitys - väärät näppäilyt eivät pysäytä peliä, mutta aiheuttavat visuaalisen ja äänellisen hälytyksen
- 🎨 Moderni ja ammattimainen ulkoasu
- 🇫🇮 Suomeksi - käyttöliittymä ja sanat

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

#### Vercel

1. Asenna Vercel CLI: `npm i -g vercel`
2. Projekti-kansiossa: `vercel`
3. Seuraa ohjeita

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
- LocalStorage (top-listan tallennukseen)

## Tiedostorakenne

```
typewriter/
├── index.html          # Pää-HTML-tiedosto
├── styles.css          # Tyylitiedosto
├── game.js            # Pelilogiikka
├── words.js           # Suomenkieliset sanat
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
