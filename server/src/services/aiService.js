const fallback = (destination, days, types, weather) => ({
  packingList: [
    {
      category: "Clothing",
      items: [
        { name: "Comfortable outfits", isWeatherSpecific: false },
        { name: "Walking shoes", isWeatherSpecific: false },
      ],
    },
    {
      category: "Toiletries",
      items: [
        { name: "Toiletry bag", isWeatherSpecific: false },
        { name: "Sunscreen", isWeatherSpecific: true },
      ],
    },
    {
      category: "Electronics",
      items: [
        { name: "Phone charger", isWeatherSpecific: false },
        { name: "Power bank", isWeatherSpecific: false },
      ],
    },
    {
      category: "Documents",
      items: [
        { name: "Passport or ID", isWeatherSpecific: false },
        { name: "Travel insurance details", isWeatherSpecific: false },
      ],
    },
    {
      category: "Weather-specific",
      items: [
        {
          name: weather?.includes("rain") ? "Rain jacket" : "Light layers",
          isWeatherSpecific: true,
        },
      ],
    },
  ],
  itinerary: Array.from({ length: days }, (_, index) => ({
    dayNumber: index + 1,
    activities: [
      {
        time: "Morning",
        title: `Explore ${destination}`,
        description: `Start with a relaxed neighborhood walk and a local breakfast.`,
      },
      {
        time: "Afternoon",
        title:
          types?.includes("Beach") ?
            "Unwind by the water"
          : "Discover a local highlight",
        description:
          "Leave room for spontaneous discoveries and a memorable meal.",
      },
      {
        time: "Evening",
        title: "Dinner and reflection",
        description: "Choose a well-reviewed local spot and plan tomorrow.",
      },
    ],
  })),
});

async function callOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON with packingList and itinerary arrays.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error("OpenAI request failed");
  return JSON.parse((await response.json()).choices[0].message.content);
}
async function callAnthropic(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 3000,
      system: "Return only valid JSON with packingList and itinerary arrays.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error("Anthropic request failed");
  const text = (await response.json()).content[0].text;
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Return only JSON with packingList and itinerary arrays. ${prompt}`,
              },
            ],
          },
        ],
      }),
    },
  );
  if (!response.ok) throw new Error("Gemini request failed");
  const text = (await response.json()).candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
export async function generateTripPlan(
  destination,
  tripLength,
  tripTypes,
  weatherSummary,
  provider = "openai",
) {
  const prompt = JSON.stringify({
    destination,
    tripLength,
    tripTypes,
    weatherSummary,
  });
  try {
    return (
      (await (
        { openai: callOpenAI, anthropic: callAnthropic, gemini: callGemini }[
          provider
        ] || callOpenAI
      )(prompt)) || fallback(destination, tripLength, tripTypes, weatherSummary)
    );
  } catch {
    return fallback(destination, tripLength, tripTypes, weatherSummary);
  }
}
export async function regenerateItineraryDay(
  destination,
  dayNumber,
  tripTypes,
  weatherForDay,
  provider = "openai",
) {
  const plan = await generateTripPlan(
    destination,
    1,
    tripTypes,
    weatherForDay,
    provider,
  );
  return { dayNumber, activities: plan.itinerary[0].activities };
}
