import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import type { ChatCompletionMessageParam, InitProgressCallback } from "@mlc-ai/web-llm";

export class LLMService {
  private engine: MLCEngine | null = null;
  private selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
  private isInitializing = false;

  async init(progressCallback?: InitProgressCallback) {
    if (this.engine || this.isInitializing) return;
    this.isInitializing = true;
    try {
      this.engine = await CreateMLCEngine(this.selectedModel, { initProgressCallback: progressCallback });
    } catch (e) {
      console.error("Failed to init LLM engine", e);
    } finally {
      this.isInitializing = false;
    }
  }

  async generateResponse(
    messages: ChatCompletionMessageParam[],
    tools: any[]
  ) {
    if (!this.engine) throw new Error("LLM Engine not initialized");

    const response = await this.engine.chat.completions.create({
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    return response.choices[0].message;
  }
}

export const llmService = new LLMService();
