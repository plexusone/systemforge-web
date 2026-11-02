/**
 * A speech failure. `code` is `unsupported` when the browser lacks the API,
 * otherwise the browser's own error code, such as `not-allowed` (no
 * permission, or speech started without a user gesture), `audio-capture`
 * (no microphone) or `synthesis-failed`. `start-timeout` means the browser
 * accepted speech but never started it, even after a retry.
 */
export class SpeechError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? `speech error: ${code}`);
    this.name = 'SpeechError';
    this.code = code;
  }
}
