// ORRA Profile Song Library
// Original songs by ORRA (Nick Joseph) — created on Suno AI
// Users can also paste any custom direct audio URL

export interface ProfileSong {
  id: string;
  title: string;
  artist: string;
  url: string;
  genre: string;
  mood: string;
  duration: string; // display only
  coverArt?: string; // optional cover art URL
}

// ===== ORRA ORIGINAL SONGS =====
export const ORRA_SONGS: ProfileSong[] = [
  {
    id: 'orra-anthem',
    title: 'ORRA',
    artist: 'Nick Joseph',
    url: '/music/orra/orra.mp3',
    genre: 'Hip-Hop',
    mood: 'Anthem',
    duration: '3:33',
    coverArt: '/images/songs/orra-cover.jpeg',
  },
  {
    id: 'orra-back-of-the-tracks',
    title: 'Back Of The Tracks',
    artist: 'Nick',
    url: '/music/orra/back-of-the-tracks.mp3',
    genre: 'Hip-Hop',
    mood: 'Gritty',
    duration: '3:33',
    coverArt: '/images/songs/back-of-the-tracks-cover.jpeg',
  },
  {
    id: 'orra-welcome-to-my-page',
    title: 'Welcome To My Page',
    artist: 'ORRA',
    url: '/music/orra/welcome-to-my-page.mp3',
    genre: 'Hip-Hop',
    mood: 'Welcome',
    duration: '2:31',
    coverArt: '/images/songs/welcome-to-my-page-cover.jpeg',
  },
  {
    id: 'orra-gives-me-everything',
    title: 'ORRA Gives Me Everything',
    artist: 'ORRA',
    url: '/music/orra/orra-gives-me-everything.mp3',
    genre: 'Hip-Hop',
    mood: 'Hype',
    duration: '2:52',
    coverArt: '/images/songs/orra-gives-me-everything-cover.jpeg',
  },
  {
    id: 'orra-like-and-follow',
    title: 'Like And Follow',
    artist: 'ORRA',
    url: '/music/orra/like-and-follow.mp3',
    genre: 'Hip-Hop',
    mood: 'Viral',
    duration: '2:09',
    coverArt: '/images/songs/like-and-follow-cover.jpeg',
  },
];

// The full song library — ORRA originals only
export const SONG_LIBRARY: ProfileSong[] = ORRA_SONGS;

// Combined library (same as ORRA_SONGS since we only have ORRA songs)
export const ALL_SONGS: ProfileSong[] = ORRA_SONGS;

// Genre options for the song picker
export const GENRE_OPTIONS = ['All', 'Hip-Hop'];

export function getSongById(id: string): ProfileSong | undefined {
  return ALL_SONGS.find(s => s.id === id);
}

export function getSongByUrl(url: string): ProfileSong | undefined {
  return ALL_SONGS.find(s => s.url === url);
}

export function filterSongsByGenre(genre: string): ProfileSong[] {
  if (genre === 'All') return ALL_SONGS;
  return ALL_SONGS.filter(s => s.genre === genre);
}

export function getVocalSongs(): ProfileSong[] {
  return [];
}

export function getInstrumentalSongs(): ProfileSong[] {
  return ORRA_SONGS;
}
