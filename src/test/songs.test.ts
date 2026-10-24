import { describe, expect, it } from 'vitest';
import { songs } from '../data/songs';

describe('song data', () => {
  it('has no placeholder tones left', () => {
    songs.forEach((s) => { expect(s.previewUrl).not.toMatch(/placeholder/); expect(s.subtitle ?? '').not.toMatch(/Placeholder/i); });
  });
  it('real previews come from Apple and carry a credit link', () => {
    const withPreview = songs.filter((s) => s.previewUrl);
    expect(withPreview.map((s) => s.id).sort()).toEqual(['feel-a', 'nsimbi-yamahumusha']);
    withPreview.forEach((s) => {
      expect(s.previewUrl).toMatch(/^https:\/\/audio-ssl\.itunes\.apple\.com\//);
      expect(s.previewCredit?.url).toMatch(/^https:\/\/music\.apple\.com\//);
    });
  });
  it('songs without a preview have a verified YouTube embed matching their youtubeUrl', () => {
    songs.filter((s) => !s.previewUrl).forEach((s) => {
      expect(s.embed?.kind).toBe('youtube');
      expect(s.youtubeUrl).toBe(`https://www.youtube.com/watch?v=${s.embed!.id}`);
    });
  });
});
