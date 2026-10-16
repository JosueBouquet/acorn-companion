import type { LLMResponse } from "@shared/types"

export async function askLLM(question: string): Promise<LLMResponse> {
  return window.api.llm.ask(question)
}
