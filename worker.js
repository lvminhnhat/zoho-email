const VALID_API_KEYS = [
  'zoho-oauth-2024-secret-key',
]

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    try {
      const body = await request.json()
      const { client_id, client_secret, code, redirect_uri, datacenter, grant_type, refresh_token, api_key } = body

      const validKeys = env.API_KEYS ? env.API_KEYS.split(',') : VALID_API_KEYS
      if (!api_key || !validKeys.includes(api_key)) {
        return new Response(JSON.stringify({ error: 'Invalid or missing API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!client_id || !client_secret || !datacenter) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const tokenUrl = `https://accounts.zoho.${datacenter}/oauth/v2/token`

      const params = new URLSearchParams()
      params.append('client_id', client_id)
      params.append('client_secret', client_secret)

      if (grant_type === 'refresh_token' && refresh_token) {
        params.append('grant_type', 'refresh_token')
        params.append('refresh_token', refresh_token)
      } else if (code && redirect_uri) {
        params.append('grant_type', 'authorization_code')
        params.append('code', code)
        params.append('redirect_uri', redirect_uri)
      } else {
        return new Response(JSON.stringify({ error: 'Missing code/redirect_uri or refresh_token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      const data = await response.json()

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}
