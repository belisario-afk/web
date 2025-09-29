declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: typeof Spotify;
  }
}

declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  type WebPlaybackError = { message: string };

  interface AlbumImage {
    url: string;
    height?: number | null;
    width?: number | null;
  }

  interface Artist {
    name: string;
    uri?: string;
  }

  interface Track {
    name: string;
    uri?: string;
    artists: Artist[];
    album: { images: AlbumImage[] };
  }

  interface PlaybackTrackWindow {
    current_track: Track;
    previous_tracks?: Track[];
    next_tracks?: Track[];
  }

  interface PlaybackState {
    context?: { uri?: string } | null;
    disallows?: Record<string, boolean>;
    paused: boolean;
    position?: number;
    duration?: number;
    repeat_mode?: number;
    shuffle?: boolean;
    track_window: PlaybackTrackWindow;
  }

  class Player {
    constructor(options: PlayerInit);
    // Required for mobile autoplay policies
    activateElement?: () => Promise<void> | void;

    // connection
    connect(): Promise<boolean>;
    disconnect(): void;

    // control
    togglePlay(): Promise<void>;
    resume(): Promise<void>;
    pause(): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    setVolume(volume: number): Promise<void>;
    getVolume(): Promise<number>;

    // events
    addListener(
      event:
        | 'ready'
        | 'not_ready'
        | 'player_state_changed'
        | 'initialization_error'
        | 'authentication_error'
        | 'account_error',
      cb:
        | ((e: { device_id: string }) => void)
        | ((state: PlaybackState | null) => void)
        | ((err: WebPlaybackError) => void)
    ): boolean;

    removeListener(
      event:
        | 'ready'
        | 'not_ready'
        | 'player_state_changed'
        | 'initialization_error'
        | 'authentication_error'
        | 'account_error',
      cb?: Function
    ): boolean;
  }
}

export {};