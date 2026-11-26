// This command runs on the Docker host's trusted application container.
// The HTTP routes have separate session and administrator checks.
const pool = require('../config/db');
const { query } = require('../services/database');
const { detail } = require('../services/buildRequests');

async function read() {
  const selection = process.argv[2] || 'next';
  let id = selection;
  if (selection === 'next') {
    const [next] = await query(pool,"SELECT request_id FROM build_requests WHERE status='queued' ORDER BY request_id LIMIT 1");
    if (!next) { console.log('No queued build requests.'); return; }
    id = next.request_id;
  }
  const request = await detail(id);
  const {request_id,title,author,status,revision,instructions,acceptance_criteria,events} = request;
  console.log(JSON.stringify({request_id,title,author,status,revision,instructions,acceptance_criteria,
    follow_ups:events.filter(entry=>entry.kind === 'follow_up').map(({actor_name,body,created_at})=>({actor_name,body,created_at}))},null,2));
}

read().catch(error=>{
  console.error(error.status ? error.message : 'Could not read the build request.');
  process.exitCode = 1;
}).finally(()=>pool.end());
