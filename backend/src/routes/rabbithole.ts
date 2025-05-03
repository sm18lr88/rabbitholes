import express from "express";
import { tavily } from "@tavily/core";
import { openAIService } from "../services/openaiService";
import OpenAI from "openai";

interface RabbitHoleSearchRequest {
    query: string;
    previousConversation?: Array<{
        user?: string;
        assistant?: string;
    }>;
    concept?: string;
    followUpMode?: "expansive" | "focused";
}

interface SearchResponse {
    response: string;
    followUpQuestions: string[];
    contextualQuery: string;
    sources: Array<{
        title: string;
        url: string;
        uri: string;
        author: string;
        image: string;
    }>;
    images: Array<{
        url: string;
        thumbnail: string;
        description: string;
    }>;
}

export function setupRabbitHoleRoutes(_runtime: any) {
    const router = express.Router();
    const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

    router.post("/rabbitholes/search", async (req: express.Request, res: express.Response) => {
        try {
            const {
                query,
                previousConversation,
                concept,
                followUpMode = "expansive",
            } = req.body as RabbitHoleSearchRequest;

            const searchResults = await tavilyClient.search(query, {
                searchDepth: "basic",
                includeImages: true,
                maxResults: 3,
            });

            const conversationContext = previousConversation
                ? previousConversation
                      .map(
                          (msg) =>
                              (msg.user ? `User: ${msg.user}\n` : "") +
                              (msg.assistant ? `Assistant: ${msg.assistant}\n` : "")
                      )
                      .join("\n")
                : "";

            const messages = [
                {
                    role: "system",
                    content: `You are an AI assistant that helps users explore topics in depth. Format your responses using markdown with headers (####).

Your goal is to provide comprehensive, accurate information while maintaining engagement.
Base your response on the search results provided, and structure it clearly with relevant sections.

After your main response, include a "Follow-up Questions:" section with 3 concise questions that would help users explore the topic further.
One of the questions should be a question that is related to the search results, and the other two should be either thought provoking questions or devil's advocate/conspiracy questions.
ALWAYS enclose the follow-up questions section between '###START_FOLLOWUP###' and '###END_FOLLOWUP###'
`,
                },
                {
                    role: "user",
                    content: `Previous conversation:\n${conversationContext}\n\nSearch results about "${query}":\n${JSON.stringify(
                        searchResults
                    )}\n\nPlease provide a comprehensive response about ${
                        concept || query
                    }. Include relevant facts, context, and relationships to other topics. Format the response in markdown with #### headers. The response should be ${
                        followUpMode === "expansive" ? "broad and exploratory" : "focused and specific"
                    }.`,
                },
            ];

            const completion = (await openAIService.createChatCompletion(messages, "gemini")) as OpenAI.Chat.ChatCompletion;
            const response = completion.choices?.[0]?.message?.content ?? "";

            // Extract follow-up questions using enclosure markers
            const match = response.match(/###START_FOLLOWUP###([\s\S]*?)###END_FOLLOWUP###/);
            let followUpQuestions: string[] = [];
            if (match) {
                followUpQuestions = match[1]
                    .split('\n')
                    .map(line => line.replace(/^[\s*-]*\d*\.?\s*/, '').trim())
                    .filter(Boolean);
            }

            // Remove the Follow-up Questions section from the main response
            const mainResponse = response.split("Follow-up Questions:")[0].trim();

            const sources = searchResults.results.map((result: any) => ({
                title: result.title || "",
                url: result.url || "",
                uri: result.url || "",
                author: result.author || "",
                image: result.image || "",
            }));

            const images = searchResults.images
                .map((result: any) => ({
                    url: result.url,
                    thumbnail: result.url,
                    description: result.description || "",
                }));

            const searchResponse: SearchResponse = {
                response: mainResponse,
                followUpQuestions,
                contextualQuery: query,
                sources,
                images,
            };

            res.json(searchResponse);
        } catch (error) {
            console.error("Error in rabbithole search endpoint:", error);
            res.status(500).json({
                error: "Failed to process search request",
                details: (error as Error).message,
            });
        }
    });

    return router;
}
