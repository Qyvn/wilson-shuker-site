import { useEffect } from 'react';
import { artist, PREVIEW_CAP_SECONDS } from './config/artist';
import { songs } from './data/songs';
import { MusicSection } from './components/MusicSection';
import { isUsableUrl } from './lib/links';

const NAV = [
  { href: '#music', label: 'Music' },
  { href: '#about', label: 'About' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#contact', label: 'Contact' },
];

export default function App() {
  // Apply theme from config.
  useEffect(() => {
    const r = document.documentElement.style;
    const c = artist.colors;
    r.setProperty('--bg', c.background); r.setProperty('--surface', c.surface); r.setProperty('--text', c.text);
    r.setProperty('--muted', c.muted); r.setProperty('--accent', c.accent); r.setProperty('--accent-2', c.accent2);
    r.setProperty('--font-display', artist.fonts.display); r.setProperty('--font-body', artist.fonts.body);
    if (artist.fonts.googleFontsHref) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = artist.fonts.googleFontsHref; document.head.appendChild(l);
    }
  }, []);

  const socials = artist.socials.filter((s) => isUsableUrl(s.url));

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a href="#top" className="brand">
          <img src={artist.logo} alt="" width={32} height={32} />
          <span>{artist.name}</span>
        </a>
        <nav aria-label="Main">
          <ul>{NAV.map((n) => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}</ul>
        </nav>
      </header>

      <main id="main">
        <section id="top" className="hero">
          <picture className="hero-media">
            {artist.heroImageMobile && <source media="(max-width: 700px)" srcSet={artist.heroImageMobile} />}
            <img src={artist.heroImage} alt={`${artist.name}`} fetchPriority="high" style={{ objectPosition: artist.heroFocus }} />
          </picture>
          <div className="hero-inner">
            <p className="eyebrow">{artist.tagline}</p>
            <h1>{artist.name}</h1>
            <p className="lead">{artist.shortIntro}</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#music">Explore the music</a>
              {socials.length > 0 && (
                <ul className="socials" aria-label="Social media">
                  {socials.map((s) => (
                    <li key={s.label}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section id="music" className="section">
          <div className="section-head">
            <h2>Music</h2>
            <p className="muted">Spin the collection, pick a CD and hear a {PREVIEW_CAP_SECONDS}-second preview.</p>
          </div>
          <MusicSection songs={songs} capSeconds={PREVIEW_CAP_SECONDS} />
        </section>

        <section id="about" className="section about">
          <img src={artist.profileImage} alt={`Portrait of ${artist.name}`} width={400} height={500} loading="lazy" />
          <div>
            <h2>About</h2>
            {artist.biography.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        <section id="gallery" className="section">
          <h2>Gallery</h2>
          <ul className="gallery">
            {artist.gallery.map((g) => (
              <li key={g.src}><img src={g.src} alt={g.alt} loading="lazy" width={400} height={400} /></li>
            ))}
          </ul>
        </section>

        <section id="contact" className="section contact">
          <h2>Contact</h2>
          <p>General: <a href={`mailto:${artist.contact.email}`}>{artist.contact.email}</a></p>
          {artist.contact.bookingEmail && (
            <p>Booking: <a href={`mailto:${artist.contact.bookingEmail}`}>{artist.contact.bookingEmail}</a></p>
          )}
          {artist.contact.management && <p className="muted">Management: {artist.contact.management}</p>}
        </section>
      </main>
      <footer className="site-footer">
        <p className="muted small">© {new Date().getFullYear()} {artist.name}. Preview clips are placeholders until authorised previews are supplied.</p>
      </footer>
    </>
  );
}
