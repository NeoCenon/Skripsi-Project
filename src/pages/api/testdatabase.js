// import { supabase } from '../lib/supabase'

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
    
//     if (error) return res.status(400).json({ error: error.message })
//     return res.status(200).json(data)
//   }
  
//   if (req.method === 'POST') {
//     const { data, error } = await supabase
//       .from('users')
//       .insert([req.body])
//       .select()
    
//     if (error) return res.status(400).json({ error: error.message })
//     return res.status(201).json(data)
//   }
// }