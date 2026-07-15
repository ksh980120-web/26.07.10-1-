console.log('Env keys containing SUPABASE:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
console.log('Env keys containing SERVICE:', Object.keys(process.env).filter(k => k.includes('SERVICE')));
console.log('Env keys containing ROLE:', Object.keys(process.env).filter(k => k.includes('ROLE')));
console.log('Env keys containing DB or POSTGRES:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('POSTGRES')));
