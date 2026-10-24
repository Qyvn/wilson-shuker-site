import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicSection } from '../components/MusicSection';
import { SharedMixtape } from '../components/SharedMixtape';
import type { Song, MixtapeConfig } from '../types';
import { FakeAudio } from './fakeAudio';

const base = { spotifyUrl: '', appleMusicUrl: '', youtubeMusicUrl: '', youtubeUrl: '' };
const songs: Song[] = [
  { id: 'a', title: 'Alpha', artwork: '/a.svg', previewUrl: '/a.m4a', ...base },
  { id: 'b', title: 'Bravo', artwork: '/b.svg', previewUrl: '/b.m4a', ...base },
  { id: 'c', title: 'Charlie', artwork: '/c.svg', previewUrl: '', ...base },
];
const audio = () => FakeAudio.instances[FakeAudio.instances.length - 1];
const disc = (name: RegExp) => screen.getByRole('button', { name, pressed: false });
const status = () => screen.getByTestId('status').textContent;
const reelsSpinning = () => document.querySelectorAll('.cassette-window .reel.spin').length;

beforeEach(() => { FakeAudio.instances = []; vi.stubGlobal('Audio', FakeAudio); });

describe('media-event driven sync', () => {
  it('preloads the selected track on selection without playing', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    expect(audio().preload).toBe('auto');
    expect(audio().loadCalls).toBeGreaterThan(0);
    expect(audio().playCalls).toBe(0);
  });

  it('does not claim Playing until the real playing event; reels idle while loading', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    audio().playMode = 'pending';
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    expect(status()).toBe('Loading…');
    expect(reelsSpinning()).toBe(0);
    await act(async () => { audio().resolvePlay(); });
    expect(status()).toBe('Playing');
    expect(reelsSpinning()).toBe(2);
  });

  it('shows Buffering… and stops reels on waiting/stalled, resumes on playing', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    act(() => audio().tick(4.2));
    act(() => { audio().dispatchEvent(new Event('waiting')); });
    expect(status()).toBe('Buffering…');
    expect(reelsSpinning()).toBe(0);
    act(() => { audio().dispatchEvent(new Event('playing')); });
    act(() => { audio().dispatchEvent(new Event('stalled')); });
    expect(status()).toBe('Buffering…');
    act(() => { audio().dispatchEvent(new Event('playing')); });
    expect(status()).toBe('Playing');
  });

  it('progress and timer come from audio.currentTime', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    act(() => audio().tick(7.6));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '8');
    expect(document.querySelector('.cassette-deck')!.getAttribute('data-time')).toBe('7.600');
    expect(screen.getByText(/0:07 \/ 0:30/)).toBeInTheDocument();
  });

  it('handles play() rejection (autoplay policy) without claiming playback', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    audio().playMode = 'NotAllowedError';
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    expect(status()).toBe('Paused');
    audio().playMode = 'NotSupportedError';
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('rapid track switching: one audio element, stale play promise ignored, no listener leak', async () => {
    const { unmount } = render(<MusicSection songs={songs} capSeconds={30} />);
    const listeners = audio().listenerCount;
    await userEvent.click(disc(/^Alpha/));
    audio().playMode = 'AbortError';
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    await userEvent.click(disc(/^Bravo/));
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(disc(/^Bravo/));
    expect(FakeAudio.instances).toHaveLength(1);
    expect(audio().src).toBe('/b.m4a');
    expect(audio().paused).toBe(true);
    expect(status()).toBe('Paused');
    expect(audio().listenerCount).toBe(listeners);
    unmount();
    expect(audio().listenerCount).toBe(0);
  });
});

describe('shared mixtape transitions', () => {
  const cfg: MixtapeConfig = { enabled: true, maxSongs: 6, tapeColors: [{ id: 'x', label: 'X', value: '#000' }] };
  it('advances on cap, skips songs without previews, single element, no overlap', async () => {
    render(<SharedMixtape mix={{ name: 'T', color: 'x', songIds: ['a', 'c', 'b'] }} songs={songs} config={cfg} capSeconds={30} onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Play mixtape/ }));
    expect(audio().src).toBe('/a.m4a');
    expect(screen.getByTestId('mix-status')).toHaveTextContent(/1\. Alpha: playing/);
    act(() => audio().tick(30));
    expect(audio().src).toBe('/b.m4a');
    expect(audio().playCalls).toBe(2);
    expect(screen.getByTestId('mix-status')).toHaveTextContent(/3\. Bravo: playing/);
    act(() => { audio().dispatchEvent(new Event('waiting')); });
    expect(screen.getByTestId('mix-status')).toHaveTextContent(/buffering/);
    act(() => audio().tick(30));
    expect(audio().paused).toBe(true);
    expect(FakeAudio.instances).toHaveLength(1);
    fireEvent.click(document.body);
  });
});
