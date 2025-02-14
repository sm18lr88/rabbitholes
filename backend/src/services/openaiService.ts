import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

export interface OpenAIConfig {
    baseURL: string;
    apiKey: string;
    defaultModel: string;
}

export interface ModelConfig {
    [key: string]: {
        baseURL: string;
        apiKey: string;
        model: string;
    };
}

export class OpenAIService {
    private static instance: OpenAIService;
    private clients: Map<string, OpenAI | GoogleGenerativeAI>;
    private modelConfigs: ModelConfig;

    private constructor() {
        const googleApiKey = process.env.GOOGLE_AI_API_KEY;
        if (!googleApiKey) {
            throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
        }

        this.clients = new Map();
        this.modelConfigs = {
            gemini: {
                baseURL: "https://generativelanguage.googleapis.com/v1beta",
                apiKey: googleApiKey,
                model: "gemini-2.0-flash",
            }
        };
    }

    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    private getClient(provider: string): OpenAI | GoogleGenerativeAI {
        if (!this.clients.has(provider)) {
            const config = this.modelConfigs[provider];
            if (!config) {
                throw new Error(`Provider ${provider} not configured`);
            }
            
            if (provider === "gemini") {
                this.clients.set(
                    provider,
                    new GoogleGenerativeAI(config.apiKey)
                );
            } else {
                this.clients.set(
                    provider,
                    new OpenAI({
                        baseURL: config.baseURL,
                        apiKey: config.apiKey,
                    })
                );
            }
        }
        return this.clients.get(provider)!;
    }

    public async createChatCompletion(
        messages: Array<{
            role: string;
            content: string | Array<{ type: string; text?: string; imageUrl?: string }>;
        }>,
        provider: string = "gemini",
        options: Partial<OpenAI.Chat.ChatCompletionCreateParams> = {}
    ) {
        const client = this.getClient(provider);
        const config = this.modelConfigs[provider];

        if (provider === "gemini") {
            const geminiClient = client as GoogleGenerativeAI;
            const model = geminiClient.getGenerativeModel({ model: config.model });

            // Format messages for Gemini
            const formattedContent = messages.map(msg => {
                const content = typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.map(part => part.text || '').join(' ');
                return content;
            }).join('\n');

            const result = await model.generateContent(formattedContent);
            const response = await result.response;
            
            return {
                choices: [{
                    message: {
                        role: 'assistant',
                        content: response.text()
                    },
                    index: 0,
                    finish_reason: 'stop'
                }]
            } as OpenAI.Chat.ChatCompletion;
        } else {
            const openaiClient = client as OpenAI;
            return await openaiClient.chat.completions.create({
                messages: messages as any,
                model: config.model,
                stream: false,
                ...options,
            });
        }
    }

    public async createStreamCompletion(
        messages: Array<{
            role: string;
            content: string | Array<{ type: string; text?: string; imageUrl?: string }>;
        }>,
        provider: string = "gemini",
        options: Partial<OpenAI.Chat.ChatCompletionCreateParams> = {},
        signal?: AbortSignal
    ) {
        const client = this.getClient(provider);
        const config = this.modelConfigs[provider];

        if (provider === "gemini") {
            const geminiClient = client as GoogleGenerativeAI;
            const model = geminiClient.getGenerativeModel({ model: config.model });

            // Format messages for Gemini
            const formattedContent = messages.map(msg => {
                const content = typeof msg.content === 'string' 
                    ? msg.content 
                    : msg.content.map(part => part.text || '').join(' ');
                return content;
            }).join('\n');

            const result = await model.generateContentStream(formattedContent);
            return result;
        } else {
            const openaiClient = client as OpenAI;
            return await openaiClient.chat.completions.create(
                {
                    messages: messages as any,
                    model: config.model,
                    stream: true,
                    ...options,
                },
                { signal }
            );
        }
    }

    public getModelConfig(provider: string) {
        return this.modelConfigs[provider];
    }
}

export const openAIService = OpenAIService.getInstance(); 