# Build requests

Open **Admin dashboard → Build requests**. Enter a title, instructions and optional acceptance criteria. The request starts queued. The same page shows the request queue above the form on phones and beside it on wider screens. Select a status count to filter it. Each row shows its current status, owner and last update. **Pick up next request** claims the oldest queued item when one is available, and **Pick up this request** claims the selected one. The page records the administrator and timestamp on the request and its history.

Select **Copy prompt for Codex** and paste the result into the chat for this repository. It includes the request reference, revision, acceptance criteria and follow-ups. From a phone, paste it into the Workforce Intelligence workspace on a connected computer using [Codex Remote](https://developers.openai.com/blog/mastering-codex-remote-for-engineering). From the trusted Docker host, Codex can also read the next queued request or a specific request after you ask it to work on one.

```sh
docker compose exec -T api node backend/cli/readBuildRequest.js next
docker compose exec -T api node backend/cli/readBuildRequest.js 42
```

This command reads the queue without claiming a request. Pick up the selected request in the admin portal to record the assigned administrator. Codex should check the request revision and clarify any unexpected expansion of scope before acting. The request describes the desired work. Existing release permissions still govern pushing, deploying and changing live data.

When the work is ready, the administrator who picked it up can **Submit result for review** with a description, test results and an optional GitHub commit or pull request URL. An administrator can then mark the review complete or add a follow-up that returns it to the queue. A follow-up on work in progress updates its revision while leaving it assigned. Refresh a request before submitting a result if a colleague has added further instructions.

Only signed-in administrators can read or write requests through the website. The Docker command is for operators with access to the application container. Requests and history are stored in the live MySQL volume and included in private backups. Distributed demo snapshots omit their rows. The app keeps instructions as text and does not launch Codex, run commands or publish changes when an administrator submits a request.
