import { createClient } from '../../../../lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('customer_messages')
    .select('*')
    .order('created_at', { ascending: false })

  return Response.json({ messages: messages || [] })
}