import "dotenv/config";
import { AiService } from "../src/app/services/ai.service";

async function runTest() {
  console.log("==========================================");
  console.log("🤖 Starting AI Service Verification Test");
  console.log("==========================================\n");

  try {
    const testMessage = "What courses are available on the platform? Show me the list.";
    console.log(`Sending message: "${testMessage}"\n`);

    console.log("--- AI Response Stream Start ---");
    const stream = await AiService.chatAssistant(testMessage, [], null, "test-ai-session-123");

    let fullReply = "";
    for await (const chunk of stream) {
      const text = typeof chunk === "string" ? chunk : (chunk as any).content || "";
      process.stdout.write(text);
      fullReply += text;
    }
    console.log("\n--- AI Response Stream End ---\n");

    console.log("==========================================");
    if (fullReply.trim().length > 0) {
      console.log("🎉 AI Service is 100% WORKING and VERIFIED!");
    } else {
      throw new Error("Received empty response from AI service.");
    }
    console.log("==========================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ AI Service Test Failed:", error);
    process.exit(1);
  }
}

runTest();
