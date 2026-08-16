// Server-side proxy for Yahoo Finance chart data.
// Runs on Netlify's servers, so there's no browser CORS restriction —
// this is the durable replacement for the public allorigins.win proxy.

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const symbol = params.symbol;
  const interval = params.interval || "1d";
  const range = params.range || "1y";

  if (!symbol) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing symbol parameter" }),
    };
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;

  try {
    const res = await fetch(url, {
      headers: {
        // Yahoo occasionally blocks requests with no browser-like User-Agent
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Yahoo returned ${res.status}` }),
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || "Fetch failed" }),
    };
  }
};
