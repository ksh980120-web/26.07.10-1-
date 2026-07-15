const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tyarioamtiofdigycrpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YXJpb2FtdGlvZmRpZ3ljcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODAyMjEsImV4cCI6MjA5OTM1NjIyMX0.ZjdGz8a9Zm1NefPsO8q_S0oOX91CxH0sjsBbt1zSk70';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log('Testing INSERT without status...');
  const { data, error } = await supabase.from('submissions').insert({
    user_id: '00000000-0000-0000-0000-000000000000', // Let's see if this fails on foreign key or column
    reference: 'Test reference',
    user_text: 'Test user text',
    correct_text: 'Test correct text',
    score: 100,
    mode: 'blank_fill',
    is_approved: false
  }).select('*');
  
  if (error) {
    console.log('INSERT error message:', error.message);
    console.log('INSERT error code:', error.code);
    console.log('INSERT error details:', error.details);
  } else {
    console.log('Insert succeeded! Data:', data);
  }
}

inspect();
