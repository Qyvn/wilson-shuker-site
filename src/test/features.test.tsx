import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentsConfig, Song, TourEvent, VaultConfig, MixtapeConfig } from '../types';
import { decodeMixtape, encodeMixtape, moveItem } from '../lib/mixtape';
import { vaultStatus } from '../lib/vault';
import { clampQty, orderTotal, ticketMode } from '../lib/tickets';
import { EventCard, TourSection } from '../components/TourSection';
import { VaultPanel } from '../components/VaultPanel';
import { MixtapeMaker } from '../components/MixtapeMaker';
import { SharedMixtape } from '../components/SharedMixtape';
import { FakeAudio } from './fakeAudio';

const base = { spotifyUrl: '', appleMusicUrl: '', youtubeMusicUrl: '', youtubeUrl: '' };
const songs: Song[] = [
  { id: 'a', title: 'Alpha', artwork: '/a.svg', previewUrl: '/a.mp3', ...base },
  { id: 'b', title: 'Bravo', artwork: '/b.svg', previewUrl: '', ...base, youtubeUrl: 'https://www.youtube.com/watch?v=b' },
  { id: 'c', title: 'Charlie', artwork: '/c.svg', previewUrl: '/c.mp3', ...base },
];
const mixCfg: MixtapeConfig = { enabled: true, maxSongs: 2, tapeColors: [{ id: 'amber', label: 'Amber', value: '#e3a25c' }, { id: 'blue', label: 'Blue', value: '#2f6fd6' }] };
const opts = { maxSongs: 2, colorIds: ['amber', 'blue'] };

describe('mixtape URL encode/decode', () => {
  it('round-trips name, colour and order', () => {
    const q = encodeMixtape({ name: 'Late drive & chill', color: 'blue', songIds: ['c', 'a'] });
    expect(decodeMixtape(q, songs, opts)).toEqual({ name: 'Late drive & chill', color: 'blue', songIds: ['c', 'a'] });
  });
  it('drops unknown/duplicate ids, caps length, falls back on bad colour, trims name', () => {
    const m = decodeMixtape('?mixtape=1&t=' + 'x'.repeat(80) + '&c=evil&s=zzz,a,a,c,b', songs, opts)!;
    expect(m.songIds).toEqual(['a', 'c']);
    expect(m.color).toBe('amber');
    expect(m.name).toHaveLength(40);
  });
  it('returns null without the flag or with no valid songs', () => {
    expect(decodeMixtape('?t=x&s=a', songs, opts)).toBeNull();
    expect(decodeMixtape('?mixtape=1&s=nope', songs, opts)).toBeNull();
  });
  it('defaults an empty name', () => {
    expect(decodeMixtape('?mixtape=1&s=a', songs, opts)!.name).toBe('Untitled mixtape');
  });
  it('moveItem reorders and ignores out-of-range moves', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  });
});

describe('mixtape maker UI', () => {
  it('adds up to max, reorders, and builds a share link', async () => {
    render(<MixtapeMaker songs={songs} config={mixCfg} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add Alpha to mixtape' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add Charlie to mixtape' }));
    expect(screen.getByRole('button', { name: 'Add Bravo to mixtape' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Move Charlie up' }));
    await userEvent.type(screen.getByLabelText('Name your tape'), 'For you');
    await userEvent.click(screen.getByLabelText('Blue'));
    const href = screen.getByTestId('mixtape-link').getAttribute('href')!;
    expect(decodeMixtape(new URL(href).search, songs, opts)).toEqual({ name: 'For you', color: 'blue', songIds: ['c', 'a'] });
  });
});

describe('shared mixtape playback', () => {
  beforeEach(() => { FakeAudio.instances = []; vi.stubGlobal('Audio', FakeAudio); });
  it('does not autoplay, plays in sequence, skips songs without previews, respects 30s cap', async () => {
    render(<SharedMixtape mix={{ name: 'T', color: 'amber', songIds: ['a', 'b', 'c'] }} songs={songs} config={mixCfg} capSeconds={30} onClose={() => {}} />);
    const audio = FakeAudio.instances.at(-1)!;
    expect(audio.playCalls).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: /Play mixtape/ }));
    expect(audio.src).toBe('/a.mp3');
    expect(audio.playCalls).toBe(1);
    await act(async () => audio.tick(30.2));
    expect(audio.src).toBe('/c.mp3');
    expect(audio.playCalls).toBe(2);
    expect(screen.getByTestId('mix-status')).toHaveTextContent('3. Charlie: playing');
  });
});

describe('vault lock/unlock', () => {
  const v: VaultConfig = { enabled: true, example: true, title: 'Untitled — coming soon', teaserArt: '/t.svg', releaseDate: '2026-11-22T00:00:00+02:00', unlockUrl: '', signupEndpoint: '' };
  const release = Date.parse(v.releaseDate);
  it('locked before the date with correct countdown parts', () => {
    const st = vaultStatus(v.releaseDate, release - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(st).toMatchObject({ unlocked: false, days: 2, hours: 3, minutes: 4, seconds: 5 });
  });
  it('unlocks at/after the date', () => {
    expect(vaultStatus(v.releaseDate, release).unlocked).toBe(true);
    expect(vaultStatus(v.releaseDate, release + 1).unlocked).toBe(true);
  });
  it('invalid date stays locked', () => {
    expect(vaultStatus('not-a-date', 0)).toMatchObject({ unlocked: false, valid: false });
  });
  it('panel shows countdown + example label when locked; hides signup without endpoint', () => {
    render(<VaultPanel vault={v} now={release - 86400000} />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByText(/EXAMPLE placeholder/)).toBeInTheDocument();
    expect(screen.queryByTestId('vault-signup')).toBeNull();
  });
  it('panel shows signup only with a real endpoint, and unlock link after date', () => {
    const { unmount } = render(<VaultPanel vault={{ ...v, signupEndpoint: 'https://formspree.io/f/abc' }} now={release - 1000} />);
    expect(screen.getByTestId('vault-signup')).toBeInTheDocument();
    unmount();
    render(<VaultPanel vault={{ ...v, unlockUrl: 'https://music.apple.com/x' }} now={release + 1000} />);
    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.getByRole('link', { name: /Listen now/ })).toHaveAttribute('href', 'https://music.apple.com/x');
  });
});

describe('tickets', () => {
  const ev: TourEvent = { id: 'e', name: 'Show', venue: 'V', city: 'Joburg', date: '2099-01-01T19:00:00+02:00', ticketUrl: '', maxPerOrder: 6,
    tiers: [{ id: 'ga', name: 'GA', priceZar: 150 }, { id: 'vip', name: 'VIP', priceZar: 349.99 }] };
  const noKey: PaymentsConfig = { paystackPublicKey: '', currency: 'ZAR' };
  const key: PaymentsConfig = { paystackPublicKey: 'pk_test_abc123', currency: 'ZAR' };

  it('mode: soon without key or url; external with url; paystack with valid key', () => {
    expect(ticketMode(ev, noKey)).toBe('soon');
    expect(ticketMode({ ...ev, ticketUrl: 'https://www.quicket.co.za/events/1' }, noKey)).toBe('external');
    expect(ticketMode(ev, key)).toBe('paystack');
    expect(ticketMode(ev, { ...key, paystackPublicKey: 'sk_live_secret' })).toBe('soon');
    expect(ticketMode({ ...ev, tiers: ev.tiers.map((t) => ({ ...t, soldOut: true })) }, key)).toBe('soon');
  });
  it('quantity clamp and totals in cents', () => {
    expect(clampQty(0)).toBe(1);
    expect(clampQty(99, 6)).toBe(6);
    expect(clampQty(NaN)).toBe(1);
    expect(orderTotal(150, 3)).toEqual({ qty: 3, cents: 45000, zar: 450 });
    expect(orderTotal(349.99, 2)).toEqual({ qty: 2, cents: 69998, zar: 699.98 });
  });
  it('renders disabled "coming soon" and no pay button without key/url', () => {
    render(<EventCard event={ev} payments={noKey} />);
    expect(screen.getByTestId('tickets-soon')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Pay/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Get tickets/ })).toBeNull();
  });
  it('renders external ticket link when only ticketUrl is set', () => {
    render(<EventCard event={{ ...ev, ticketUrl: 'https://www.quicket.co.za/events/1' }} payments={noKey} />);
    expect(screen.getByRole('link', { name: /Get tickets/ })).toHaveAttribute('href', 'https://www.quicket.co.za/events/1');
  });
  it('paystack mode: total updates with tier/qty; pay disabled until valid email; never shows success by itself', async () => {
    render(<EventCard event={ev} payments={key} />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    await userEvent.click(screen.getByLabelText(/VIP/));
    expect(screen.getByTestId('total')).toHaveTextContent('699,98');
    const pay = screen.getByRole('button', { name: /with Paystack/ });
    expect(pay).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Email for your ticket'), 'fan@example.com');
    expect(pay).toBeEnabled();
    expect(screen.queryByTestId('payment-success')).toBeNull();
  });
  it('hides past events', () => {
    render(<TourSection events={[{ ...ev, date: '2000-01-01T00:00:00Z' }]} payments={noKey} />);
    expect(screen.getByText(/No upcoming shows/)).toBeInTheDocument();
  });
  it('lists tiers in ZAR', () => {
    render(<EventCard event={ev} payments={noKey} />);
    const tiers = screen.getByRole('group', { name: /Ticket type/ });
    expect(within(tiers).getByText(/150,00/)).toBeInTheDocument();
  });
});
