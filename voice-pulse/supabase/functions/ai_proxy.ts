export default async function handler() {
  return new Response(
    JSON.stringify({
      message: 'AI proxy placeholder - configure OpenRouter later.',
      cached: true,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    },
  );
}
