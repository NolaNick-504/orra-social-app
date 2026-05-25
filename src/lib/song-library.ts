// ORRA Profile Song Library
// Original songs by ORRA — created on Suno AI
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
  sunoUrl?: string; // link to Suno page
}

// ===== ORRA ORIGINAL SONGS (Local MP3s) =====
const ORRA_LOCAL_SONGS: ProfileSong[] = [
  {
    id: 'orra-anthem',
    title: 'ORRA',
    artist: 'ORRA',
    url: '/music/orra/orra.mp3',
    genre: 'Hip-Hop',
    mood: 'Anthem',
    duration: '3:33',
    coverArt: '/images/songs/orra-cover.jpeg',
  },
  {
    id: 'orra-back-of-the-tracks',
    title: 'Back Of The Tracks',
    artist: 'ORRA',
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

// ===== ORRA SUNO SONGS (from the ORRA APP playlist) =====
const ORRA_SUNO_SONGS: ProfileSong[] = [
  {
    id: 'orra-cloud-nine-id',
    title: 'Cloud Nine ID',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-cloud-nine.mp3',
    genre: 'Hyperpop',
    mood: 'Playful',
    duration: '2:30',
    coverArt: '/images/songs/cloud-nine-id-cover.jpeg',
    sunoUrl: 'https://suno.com/song/d9aa0633-287d-4416-9633-940048e24307',
  },
  {
    id: 'orra-thumbs-in-orbit',
    title: 'Thumbs In Orbit',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-thumbs-orbit.mp3',
    genre: 'Pop',
    mood: 'Upbeat',
    duration: '2:45',
    coverArt: '/images/songs/thumbs-in-orbit-cover.jpeg',
    sunoUrl: 'https://suno.com/song/0b9c8a40-6f34-4ebb-941d-f2c80269dee1',
  },
  {
    id: 'orra-glow-up-season-v1',
    title: 'Glow Up Season V1',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-glow-up-v1.mp3',
    genre: 'Tropical House',
    mood: 'Summer',
    duration: '2:50',
    coverArt: '/images/songs/glow-up-season-v1-cover.jpeg',
    sunoUrl: 'https://suno.com/song/3e8386d4-52f3-440e-be59-708ffc3694f5',
  },
  {
    id: 'orra-glow-up-season-v2',
    title: 'Glow Up Season V2',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-glow-up-v2.mp3',
    genre: 'Tropical House',
    mood: 'Summer',
    duration: '2:50',
    coverArt: '/images/songs/glow-up-season-v2-cover.jpeg',
    sunoUrl: 'https://suno.com/song/d2152008-542f-4c67-9c51-d6f7f900f0a8',
  },
  {
    id: 'orra-squad-love',
    title: 'Squad Love',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-squad-love.mp3',
    genre: 'Pop-Rap',
    mood: 'Hype',
    duration: '2:40',
    coverArt: '/images/songs/squad-love-cover.jpeg',
    sunoUrl: 'https://suno.com/song/d9886ce7-84a3-4787-b27f-90857459ff98',
  },
  {
    id: 'orra-flirt-era',
    title: 'Flirt Era',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-flirt-era.mp3',
    genre: 'R&B',
    mood: 'Smooth',
    duration: '2:55',
    coverArt: '/images/songs/flirt-era-cover.jpeg',
    sunoUrl: 'https://suno.com/song/dcbe1466-92fc-4fcf-a82d-673614d2157b',
  },
  {
    id: 'orra-no-cap-motivation',
    title: 'No Cap Motivation',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-no-cap.mp3',
    genre: 'Hip-Hop',
    mood: 'Motivational',
    duration: '2:35',
    coverArt: '/images/songs/no-cap-motivation-cover.jpeg',
    sunoUrl: 'https://suno.com/song/4f84ea82-0e44-41fc-ab42-3414fb095ac9',
  },
  {
    id: 'orra-hot-girl-walk-energy',
    title: 'Hot Girl Walk Energy',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-hot-girl.mp3',
    genre: 'Funky Pop',
    mood: 'Fun',
    duration: '2:45',
    coverArt: '/images/songs/hot-girl-walk-energy-cover.jpeg',
    sunoUrl: 'https://suno.com/song/f8a79d19-a153-4e92-846d-8f080b2ce02b',
  },
  {
    id: 'orra-gremlin-mode-on',
    title: 'Gremlin Mode On',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-gremlin.mp3',
    genre: 'Hyperpop',
    mood: 'Chaos',
    duration: '2:20',
    coverArt: '/images/songs/gremlin-mode-on-cover.jpeg',
    sunoUrl: 'https://suno.com/song/20e3ac07-1fae-4dc0-9005-753744f6fe31',
  },
  {
    id: 'orra-top-eight-crown',
    title: 'Top Eight Crown',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-top-eight.mp3',
    genre: 'Pop',
    mood: 'Nostalgic',
    duration: '2:50',
    coverArt: '/images/songs/top-eight-crown-cover.jpeg',
    sunoUrl: 'https://suno.com/song/a0b5e14b-9c78-491a-b789-384c39f47ac3',
  },
  {
    id: 'orra-unbothered-queen',
    title: 'Unbothered Queen',
    artist: 'ORRA',
    url: '/api/serve-file?path=music/orra/placeholder-unbothered.mp3',
    genre: 'Pop',
    mood: 'Confident',
    duration: '3:00',
    coverArt: '/images/songs/unbothered-queen-cover.jpeg',
    sunoUrl: 'https://suno.com/song/64d41473-8b96-4c36-8a0a-0ee545900b6e',
  },
];

// ===== SUNO/EXTERNAL SONGS (AI-generated, diverse genres) =====
const SUNO_EXTERNAL_SONGS: ProfileSong[] = [
  {
    id: 'suno-aurora-bounce',
    title: 'Aurora Bounce',
    artist: 'Suno AI',
    url: '/api/serve-file?path=music/suno/aurora-bounce.mp3',
    genre: 'Electronic',
    mood: 'Energetic',
    duration: '3:00',
    coverArt: '/images/songs/aurora-bounce-cover.jpeg',
  },
  {
    id: 'suno-midnight-confession',
    title: 'Midnight Confession',
    artist: 'Suno AI',
    url: '/api/serve-file?path=music/suno/midnight-confession.mp3',
    genre: 'R&B',
    mood: 'Smooth',
    duration: '3:30',
    coverArt: '/images/songs/midnight-confession-cover.jpeg',
  },
  {
    id: 'suno-neon-prayer',
    title: 'Neon Prayer',
    artist: 'Suno AI',
    url: '/api/serve-file?path=music/suno/neon-prayer.mp3',
    genre: 'Hyperpop',
    mood: 'Wild',
    duration: '2:45',
    coverArt: '/images/songs/neon-prayer-cover.jpeg',
  },
  {
    id: 'suno-crawfish-boil',
    title: 'Crawfish Boil',
    artist: 'Suno AI',
    url: '/api/serve-file?path=music/suno/crawfish-boil.mp3',
    genre: 'Hip-Hop',
    mood: 'Gritty',
    duration: '3:15',
    coverArt: '/images/songs/crawfish-boil-cover.jpeg',
  },
  {
    id: 'suno-golden-hour-vibes',
    title: 'Golden Hour Vibes',
    artist: 'Suno AI',
    url: '/api/serve-file?path=music/suno/golden-hour-vibes.mp3',
    genre: 'Tropical House',
    mood: 'Chill',
    duration: '3:20',
    coverArt: '/images/songs/golden-hour-vibes-cover.jpeg',
  },
];

// The full song library — all ORRA originals
export const ORRA_SONGS: ProfileSong[] = [...ORRA_LOCAL_SONGS, ...ORRA_SUNO_SONGS];

// The full song library — ORRA originals only
export const SONG_LIBRARY: ProfileSong[] = ORRA_SONGS;

// Combined library (ORRA songs + Suno/external songs)
export const ALL_SONGS: ProfileSong[] = [...ORRA_LOCAL_SONGS, ...ORRA_SUNO_SONGS, ...SUNO_EXTERNAL_SONGS];

// Genre options for the song picker
export const GENRE_OPTIONS = ['All', 'Hip-Hop', 'Pop', 'Hyperpop', 'R&B', 'Tropical House', 'Pop-Rap', 'Funky Pop', 'Electronic'];

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
  return ORRA_SUNO_SONGS;
}

export function getInstrumentalSongs(): ProfileSong[] {
  return ORRA_LOCAL_SONGS;
}
