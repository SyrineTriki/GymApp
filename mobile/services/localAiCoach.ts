import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { initLlama } from 'llama.rn';

type LlamaContext = Awaited<ReturnType<typeof initLlama>>;

// SmolLM2-1.7B-Instruct, Q4_K_M quantization (~1.1GB). Small, ungated (no HF
// license click-through needed), and fast enough for on-device chat on modern
// phones. Swap this for a different GGUF if you want a different model/size.
const MODEL_URL =
  'https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF/resolve/main/SmolLM2-1.7B-Instruct-Q4_K_M.gguf?download=true';
const MODEL_FILENAME = 'smollm2-1.7b-instruct-q4_k_m.gguf';

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_PATH = `${MODEL_DIR}${MODEL_FILENAME}`;

const SYSTEM_PROMPT =
  "You are the AI Coach inside GymApp, a friendly and knowledgeable fitness and nutrition " +
  "assistant. Give concise, practical, encouraging advice on training, recovery, and diet. " +
  "Keep answers short (2-5 sentences) unless asked for detail. If someone describes an " +
  "injury or sharp pain, tell them to stop the movement and consult a medical professional " +
  "instead of giving medical advice.";

const STOP_WORDS = [
  '</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>',
  '<|EOT|>', '<|END_OF_TURN_TOKEN|>', '<|end_of_turn|>', '<|endoftext|>',
];

export interface ChatTurn { role: 'user' | 'assistant'; content: string; }

let contextPromise: Promise<LlamaContext> | null = null;

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists;
}

export async function downloadModel(onProgress: (fraction: number) => void): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true }).catch(() => {});

  const resumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    (data) => {
      if (data.totalBytesExpectedToWrite > 0) {
        onProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
      }
    },
  );

  const result = await resumable.downloadAsync();
  if (!result || result.status !== 200) {
    // Clean up a partial/broken file so the next attempt starts fresh.
    await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
    throw new Error('Model download failed. Check your connection and try again.');
  }
}

export async function deleteModel(): Promise<void> {
  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  contextPromise = null;
}

async function getContext(): Promise<LlamaContext> {
  if (!contextPromise) {
    contextPromise = initLlama({
      model: MODEL_PATH,
      use_mlock: true,
      n_ctx: 4096,
      // Metal acceleration on iOS; Android GPU support isn't production-stable
      // in llama.rn yet, so stay on CPU there.
      n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
    }).catch((err) => {
      contextPromise = null; // allow retry on next call
      throw err;
    });
  }
  return contextPromise;
}

/**
 * Warm up the model (load weights into memory) ahead of the first message,
 * so the chat screen isn't waiting on cold-start latency mid-conversation.
 */
export async function preloadModel(): Promise<void> {
  await getContext();
}

/**
 * Send a message with recent chat history and stream the reply.
 * `onToken` is called with each incremental token as it's generated.
 * Resolves with the full response text once generation completes.
 */
export async function sendMessage(
  history: ChatTurn[],
  userMessage: string,
  onToken: (partialTextSoFar: string) => void,
): Promise<string> {
  const context = await getContext();

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.slice(-12), // keep the prompt bounded — last ~12 turns of context
    { role: 'user' as const, content: userMessage },
  ];

  let accumulated = '';
  const result = await context.completion(
    { messages, n_predict: 400, stop: STOP_WORDS, temperature: 0.7 },
    (data) => {
      accumulated += data.token;
      onToken(accumulated);
    },
  );

  return result.text.trim();
}

export async function releaseModel(): Promise<void> {
  if (contextPromise) {
    const ctx = await contextPromise.catch(() => null);
    await ctx?.release();
    contextPromise = null;
  }
}
