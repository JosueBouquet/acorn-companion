import { MsEdgeTTS, OUTPUT_FORMAT, type Voice } from "msedge-tts"
import type { Readable } from "stream"
import type { EdgeVoice } from "../shared/types"

let cache: EdgeVoice[] | null = null

function toEdgeVoice(voice: Voice): EdgeVoice {
  return {
    shortName: voice.ShortName,
    name: voice.FriendlyName || voice.Name,
    gender: voice.Gender,
    locale: voice.Locale
  }
}

export async function listEdgeVoices(): Promise<EdgeVoice[]> {
  if (cache) return cache

  const tts = new MsEdgeTTS({ connectionTimeoutMs: 8000, synthesisTimeoutMs: 20000 })
  try {
    const voices = await tts.getVoices()
    cache = voices
      .filter((voice) => /^(es|en)-/i.test(voice.ShortName))
      .map(toEdgeVoice)
      .sort((a, b) => a.locale.localeCompare(b.locale) || a.name.localeCompare(b.name))
    return cache
  } finally {
    tts.close()
  }
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}

export async function synthesizeEdge(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS({ connectionTimeoutMs: 8000, synthesisTimeoutMs: 30000 })
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)
    return await streamToBuffer(audioStream)
  } finally {
    tts.close()
  }
}
