export async function getWeather(destination, startDate, endDate) {
  if (!process.env.OPENWEATHER_API_KEY)
    return { summary: "Weather unavailable. Pack flexible layers.", daily: [] };
  const params = new URLSearchParams({
    q: destination,
    appid: process.env.OPENWEATHER_API_KEY,
    units: "metric",
  });
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?${params}`,
  );
  if (!response.ok) throw new Error("Weather service unavailable");
  const data = await response.json();
  const daily = data.list
    .filter((item) => item.dt_txt.includes("12:00:00"))
    .map((item) => ({
      date: item.dt_txt.slice(0, 10),
      text: item.weather[0].description,
      temp: Math.round(item.main.temp),
    }));
  return {
    summary:
      daily
        .map((day) => `${day.date}: ${day.text}, ${day.temp}°C`)
        .join("; ") || "Forecast unavailable",
    daily,
  };
}
