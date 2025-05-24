// advisor/index.js

require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /choose with JSON body { strategies: [{ name, apy }, ...] }
app.post("/choose", async (req, res) => {
  const { strategies } = req.body;

  const prompt = `
You are a seasoned DeFi strategist and AI assistant. Your goal is to recommend the single best USDC.e yield strategy on the XDC Network, given current APYs and additional considerations.

Context:
• Token: USDC.e (wrapped USDC on XDC mainnet).
• User goal: Maximize safe yield while maintaining sufficient liquidity and minimizing risk.
• Risk profile: Moderate (prioritize strategies with reliable track records over experimental high-APY pools).
• Constraints: Funds should be easily withdrawable; avoid locked or vesting-only protocols.

Here are the available strategies and their on-chain APYs:
${strategies.map(s => `- ${s.name}: ${s.apy}% APY`).join("\n")}

Tasks:
1. Select the best strategy name.
2. Explain your reasoning with:
   a. How the APY compares to others.
   b. Liquidity and counterparty risk considerations.
   c. Ease of withdrawal and any lockup terms.
3. Output ONLY valid JSON with exactly these keys:
   {
     "strategy": "<name>",
     "reason": "<detailed explanation>"
   }

Example response format:
{
  "strategy": "XSwap",
  "reason": "XSwap offers the highest APY at 5.2%, on-chain liquidity depth of $2M, no lockups, and audited smart contracts. All others either have lower APY or vesting periods."
}

Begin now.
`;

  try {
    // In v4, use the completions API
    const response = await openai.completions.create({
      model: "gpt-4o-mini",
      prompt,
      max_tokens: 200,
      temperature: 0.2,
    });

    const text = response.choices[0].text.trim();
    const jsonStart = text.indexOf("{");
    const jsonText = text.slice(jsonStart);
    const recommendation = JSON.parse(jsonText);

    res.json(recommendation);
  } catch (err) {
    console.error("AI advisor error:", err);
    res.status(500).json({ error: "AI service error" });
  }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Advisor running on port ${PORT}`));
