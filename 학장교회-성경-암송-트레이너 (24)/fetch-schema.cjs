async function fetchSchema() {
  const url = 'https://tyarioamtiofdigycrpf.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YXJpb2FtdGlvZmRpZ3ljcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODAyMjEsImV4cCI6MjA5OTM1NjIyMX0.ZjdGz8a9Zm1NefPsO8q_S0oOX91CxH0sjsBbt1zSk70';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Response content:', data);
  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err);
  }
}

fetchSchema();
