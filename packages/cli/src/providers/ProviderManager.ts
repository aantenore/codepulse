import { IAiProvider, MockAiProvider } from '@codepulse/core';
import { OpenAiProvider } from '@codepulse/adapter-openai';
import { GoogleAiProvider } from '@codepulse/adapter-google';

export class ProviderManager {
    static getProvider(type?: string): IAiProvider {
        switch (type?.toLowerCase()) {
            case 'openai':
                const openAiKey = process.env.OPENAI_API_KEY;
                if (!openAiKey) {
                    console.warn("[Warning] OPENAI_API_KEY missing. Falling back to Mock Provider.");
                    return new MockAiProvider();
                }
                console.log("[AI] Using OpenAI Provider...");
                return new OpenAiProvider(openAiKey);

            case 'google':
            case 'gemini':
                const googleKey = process.env.GOOGLE_API_KEY;
                if (!googleKey) {
                    console.warn("[Warning] GOOGLE_API_KEY missing. Falling back to Mock Provider.");
                    return new MockAiProvider();
                }
                console.log("[AI] Using Google Gemini Provider...");
                return new GoogleAiProvider();

            case 'mock':
            default:
                if (type && type !== 'mock') {
                    console.warn(`[Warning] Unknown AI provider "${type}". Falling back to Mock Provider.`);
                }
                return new MockAiProvider();
        }
    }
}
