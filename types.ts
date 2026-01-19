
export interface VideoHighlight {
  startTime: string;
  endTime: string;
  label: string;
  description: string;
}

export interface AppState {
  url: string;
  videoId: string | null;
  startTime: string;
  endTime: string;
  isProcessing: boolean;
  statusMessage: string;
  highlights: VideoHighlight[];
  isAnalyzing: boolean;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  CLIPPING = 'CLIPPING',
  DOWNLOADING = 'DOWNLOADING',
  ERROR = 'ERROR'
}
