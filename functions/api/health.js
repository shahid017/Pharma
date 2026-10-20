export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      openai_configured: Boolean(context.env.OPENAI_API_KEY),
      google_vision_configured: Boolean(context.env.GOOGLE_VISION_API_KEY),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
