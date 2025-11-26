import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      throw new Error('User not found')
    }

    // 2. Get file data from request body
    const { file, fileType } = await req.json()
    if (!file || !fileType) {
      throw new Error('Missing file or fileType')
    }

    // 3. Decode base64 and upload
    const fileContent = decode(file.replace(/^data:image\/\w+;base64,/, ''))
    const fileExt = fileType.split('/')[1]
    const filePath = `${user.id}.${fileExt}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, fileContent, {
        contentType: fileType,
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    // 4. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath)

    return new Response(JSON.stringify({ publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})