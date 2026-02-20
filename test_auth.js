// Test Supabase Authentication
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://amnxuwxwmifiqhiskise.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbnh1d3h3bWlmaXFoaXNraXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTc3NTQsImV4cCI6MjA4NzA5Mzc1NH0.i1x5W_nK4SNTZuWvJ1nHLtZB7cbHYgSClBu6XsQS93s'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('Testing Supabase Authentication...')
  
  try {
    // Test 1: Check if we can get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', { sessionData, sessionError })
    
    // Test 2: Try to sign up a test user
    console.log('\n--- Testing Sign Up ---')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          name: 'Test User'
        }
      }
    })
    
    console.log('Sign up result:', { signUpData, signUpError })
    
    // Test 3: Try to sign in
    console.log('\n--- Testing Sign In ---')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    
    console.log('Sign in result:', { signInData, signInError })
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testAuth()