import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicSection } from '../components/MusicSection';
import { StreamingLinks } from '../components/StreamingLinks';
import { streamingLinks } from '../lib/links';
import type { Song } from '../types';
import { FakeAudio } from './fakeAudio';

const base = { spotifyUrl: '', appleMusicUrl: '', youtubeMusicUrl: '', youtubeUrl: '' };
const songs: Song[] = [
  { id: 'a', title: 'Alpha', artwork: '/a.svg', previewUrl: '/audio/a.mp3', ...base, spotifyUrl: 'https://open.spotify.com/track/x' },
  { id: 'b', title: 'Bravo', artwork: '/b.svg', previewUrl: '/audio/b.mp3', ...base },
  { id: 'c', title: 'Charlie', artwork: '/c.svg', previewUrl: '', ...base, youtubeUrl: 'https://www.youtube.com/watch?v=x' },
];

const audio = () => FakeAudio.instances[FakeAudio.instances.length - 1];
const disc = (name: RegExp) => screen.getByRole('button', { name, pressed: false });

beforeEach(() => {
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
});

describe('preview player', () => {
  it('does not autoplay on load or on selection', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    expect(audio().playCalls).toBe(0);
    await userEvent.click(disc(/^Alpha/));
    expect(audio().src).toBe('/audio/a.mp3');
    expect(audio().playCalls).toBe(0);
    expect(screen.getByTestId('status')).toHaveTextContent('Paused');
  });

  it('hard-caps playback at 30 seconds', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    expect(screen.getByTestId('status')).toHaveTextContent('Playing');
    act(() => audio().tick(12));
    expect(screen.getByTestId('status')).toHaveTextContent('Playing');
    act(() => audio().tick(30.1));
    expect(audio().paused).toBe(true);
    expect(screen.getByTestId('status')).toHaveTextContent('Preview ended');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
  });

  it('never allows a cap above 30s even if configured higher', async () => {
    render(<MusicSection songs={songs} capSeconds={90} />);
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    act(() => audio().tick(30));
    expect(audio().paused).toBe(true);
  });

  it('replay restarts from 0 after the cap', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    act(() => audio().tick(30));
    await userEvent.click(screen.getByRole('button', { name: /Replay/ }));
    expect(audio().currentTime).toBe(0);
    expect(audio().playCalls).toBe(2);
    expect(screen.getByTestId('status')).toHaveTextContent('Playing');
  });

  it('switching songs stops the previous preview and does not autoplay the next', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Alpha/));
    await userEvent.click(screen.getByRole('button', { name: 'Play preview' }));
    act(() => audio().tick(5));
    await userEvent.click(disc(/^Bravo/));
    expect(audio().paused).toBe(true);
    expect(audio().src).toBe('/audio/b.mp3');
    expect(audio().playCalls).toBe(1);
    expect(screen.getByTestId('status')).toHaveTextContent('Paused');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows unavailable message, disables playback and still offers configured links', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Charlie/));
    expect(screen.getByTestId('status')).toHaveTextContent('Preview unavailable');
    expect(screen.getByText(/No preview is available/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Replay/ })).toBeDisabled();
    expect(screen.getByRole('link', { name: /YouTube/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=x');
    expect(audio().playCalls).toBe(0);
  });

  it('shows an error state when the audio fails to load', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(disc(/^Bravo/));
    act(() => { audio().dispatchEvent(new Event('error')); });
    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/);
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeDisabled();
  });

  it('wheel supports keyboard and button rotation', async () => {
    render(<MusicSection songs={songs} capSeconds={30} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rotate to next CD' }));
    expect(screen.getByText('Facing:').parentElement).toHaveTextContent('Bravo');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('Facing:').parentElement).toHaveTextContent('Charlie');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /Charlie \(selected\)/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('streaming links', () => {
  const s: Song = { id: 'x', title: 'X', artwork: '', previewUrl: '', spotifyUrl: 'https://open.spotify.com/t', appleMusicUrl: '',
    youtubeMusicUrl: '   ', youtubeUrl: 'not a url' };
  it('only renders buttons for non-empty valid URLs', () => {
    render(<StreamingLinks song={s} />);
    const list = screen.getByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Spotify');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('renders no buttons when nothing is configured', () => {
    render(<StreamingLinks song={{ ...s, spotifyUrl: '', youtubeUrl: '' }} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(streamingLinks({ ...s, spotifyUrl: '' })).toEqual([]);
  });
});
