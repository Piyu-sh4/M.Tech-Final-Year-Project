# Local setup in a terminal or VS Code

## Requirements

- Git to clone the repository. [Install Git](https://git-scm.com/install/)
- Docker and the Compose plugin for the application, MySQL and Redis. Start Docker Desktop or Docker Engine before running the commands. [Install Docker](https://docs.docker.com/get-docker/)
- Visual Studio Code for editing. Node.js is included in the application image. Install a local Node.js runtime if you choose to run browser automation from your shell. [Install VS Code](https://code.visualstudio.com/docs/getstarted/overview) · [Download Node.js](https://nodejs.org/en/download)

## Start in a terminal

```sh
git clone https://github.com/Bharatasya-IT-Solutions/workforce-intelligence.git
cd workforce-intelligence
docker version
docker compose version
docker compose up -d --build --wait
docker compose ps
```

Open [the local login page](http://127.0.0.1:5500/login.html) after the services report healthy. Use the demo accounts listed in the [README](../README.md#start-the-demo). The first startup imports synthetic records into a named MySQL volume.

## Work in VS Code

Open **File → Open Folder** and select the cloned repository. Use **Terminal → New Terminal** for the same Compose commands. If your system has the VS Code shell command installed, run `code .` from the repository.

The Express entry point is `backend/server.js`. Native routes and data services live under `backend/`. The shared module catalog is `backend/config/moduleCatalog.js`, and common browser behavior is under `frontend/`. Rebuild the API after changing server or browser code.

```sh
docker compose up -d --build --no-deps --wait api
docker compose logs --tail=100 api
```

Use `docker compose stop` to stop services and keep their data. For a port conflict, choose an unused `WFI_PORT` in the local ignored `.env` and update your browser URL. Use [the Compose environment example](../.env.compose.example) for other overrides. Keep keys and private backups outside version control.

## Run the checks

```sh
npm run test:docker
```

You can run the same tests via `sh scripts/test-docker.sh` without host Node.js. The test stack uses its own synthetic database. For browser automation, use the isolated setup in the [README](../README.md#browser-smoke-test). Use `docker compose logs db` to inspect a slow initial import and `docker compose logs api` for startup or migration errors.

## Certificates and appearance

Issue certificates after course assessment and independent review. The reviewer chooses a certificate template during issuance. The **Certificate register** card opens staff review, preview, download, correction and revocation actions. Revocation keeps the record and disables downloads. Learners can open **My certificates** from Profile or My learning and request a name correction on an issued certificate.

Application Settings stores the theme and accent in the account. A background image is resized and saved for the signed-in account on the current browser. Use **Remove background image** to clear it.

## Password recovery

**Forgot password?** is available from sign-in. When email delivery is unconfigured, the page directs users to a Workforce Intelligence administrator. An administrator can open the user’s **Reset User Password** dialog, verify the user’s identity, and choose **Create reset link**. Share the generated link privately. It expires after 20 minutes and can be used once.

For self-service email, configure `PASSWORD_RESET_ORIGIN` with the public HTTPS origin and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in the deployment environment. Add `SMTP_FROM` for a verified sender address that differs from the SMTP username.

## Employee spreadsheet intake

An administrator can open **Registration tracker → Import employees** and download a CSV template. Supply `full_name` and `email` for each employee. The optional `designation`, `department`, and `company` columns describe the employee, and department and company names must match configured records.

Preview the first sheet of a CSV or XLSX file with up to 50 employees. The preview checks required values, duplicate email addresses, and company and department references. Replace the spreadsheet if any rows need changes. The original file is read in the browser, and only the intake fields are sent for validation.

Choose **Send to registration review** to save the entire batch as pending employees. Approve the records in Registration tracker, then use the administrator-issued reset link to let each employee set their own password.
