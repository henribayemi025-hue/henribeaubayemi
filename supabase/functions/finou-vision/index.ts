// finou-vision — STUB. Miroir IA (virtual try-on) is Parking Lot (out of scope
// this cycle). Kept as a stub so the deployment surface is stable for later work.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Même règle que finou-chat/miroir-ia: on autorise finjaro.net, ses
// sous-domaines (dont un futur "staging.finjaro.net"), les previews Cloudflare
// Pages (*.pages.dev — couvre le déploiement de test tant que le nom exact du
// projet staging n'est pas connu), l'ancien Netlify et le dev local.
const PROD_HOST = 'finjaro.net';
const NETLIFY_HOST = 'finjaro.netlify.app';

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host === NETLIFY_HOST || host.endsWith(`--${NETLIFY_HOST}`)) return true;
  if (host.endsWith('.pages.dev')) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve((req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(
    JSON.stringify({ status: 'not_implemented', feature: 'miroir-ia', phase: 2 }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
