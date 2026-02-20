// Test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://amnxuwxwmifiqhiskise.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbnh1d3h3bWlmaXFoaXNraXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTc3NTQsImV4cCI6MjA4NzA5Mzc1NH0.i1x5W_nK4SNTZuWvJ1nHLtZB7cbHYgSClBu6XsQS93s'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('events')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase Error:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('Data:', data)
    return true
  } catch (error) {
    console.error('❌ Connection failed:', error)
    return false
  }
}

// Run the test
testConnection()