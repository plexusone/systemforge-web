export { SpeechError } from './errors';
export { DEFAULT_MAX_CHUNK_CHARS, splitText } from './text';
export {
  getVoices,
  isSynthesisSupported,
  langMatches,
  pickVoice,
  speak,
  stopSpeaking,
} from './synthesis';
export type {
  GetVoicesOptions,
  SpeakInput,
  SpeakOptions,
  SpeakResult,
  SpeakSegment,
  Speaking,
  SpeechState,
  SynthesisEnv,
  SynthesisLike,
  UtteranceConstructor,
} from './synthesis';
export { isRecognitionSupported, listen } from './recognition';
export type {
  ListenOptions,
  ListenResult,
  Listening,
  RecognitionErrorEventLike,
  RecognitionFactory,
  RecognitionLike,
  RecognitionResultEventLike,
} from './recognition';
