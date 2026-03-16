const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const responseSchema = {
  type: "json_schema",
  json_schema: {
    name: "concept_card_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subject: { type: "string" },
              chapter: { type: "string" },
              concept_title: { type: "string" },
              definition: { type: "string" },
              key_points: { type: "array", items: { type: "string" } },
              short_explanation: { type: "string" },
              diagram: { type: "string" },
              memory_trick: { type: "string" }
            },
            required: [
              "subject",
              "chapter",
              "concept_title",
              "definition",
              "key_points",
              "short_explanation",
              "diagram",
              "memory_trick"
            ],
            additionalProperties: false
          }
        }
      },
      required: ["cards"],
      additionalProperties: false
    }
  }
};

export const generateConceptCardsWithAI = async ({
  text,
  subject = "General",
  chapter = "Core Concepts",
  model = process.env.OPENAI_MODEL || "gpt-5-mini"
}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const prompt = [
    "Generate educational concept cards from the text.",
    "Return JSON only.",
    "Each card must include subject, chapter, concept_title, definition, key_points(3-5), short_explanation(2-3 sentences), diagram, memory_trick.",
    "If no diagram exists in text, generate a simple ASCII flow using downward arrows.",
    `Subject: ${subject}`,
    `Chapter: ${chapter}`,
    "Text:",
    text
  ].join("\n");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: responseSchema,
      messages: [
        {
          role: "system",
          content: "You are an educational content generator that returns strict JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`AI concept card generation failed: ${details}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return Array.isArray(parsed.cards) ? parsed.cards : [];
};
