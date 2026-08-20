# Frontend deployment runbook

The production frontend is a static Angular application hosted on Cloudflare Pages. This runbook covers preview
verification, production promotion, cross-repository smoke testing, and rollback. It does not authorize DNS or account
changes; an operator must perform those actions in the Cloudflare account.

## Cloudflare Pages configuration

Configure the Pages project with:

- build command: `npm run build`;
- build output directory: `dist/bitcoin-math-lab/browser`;
- the Node and npm versions declared in `package.json`; and
- the production branch selected by the release operator.

Set production and preview variables separately:

| Variable           |                 Required | Purpose                                                  |
| ------------------ | -----------------------: | -------------------------------------------------------- |
| `BML_API_BASE_URL` | When API is cross-origin | Public HTTPS backend URL, with no path or trailing slash |
| `BML_SENTRY_DSN`   | For monitored production | Public browser Sentry DSN                                |
| `BML_ENVIRONMENT`  |              Recommended | Stable label such as `production` or `preview`           |
| `BML_RELEASE`      |              Recommended | Release commit; Cloudflare's commit SHA is the fallback  |

Never put a private token or server credential in a Pages variable. Every frontend variable and generated asset is
public to visitors.

The post-build script validates the API URL, writes `runtime-config.js`, and adds the API origin to the generated
Content Security Policy. An invalid production URL fails the build instead of creating a deployment that the browser
cannot use.

## Pre-production checklist

1. Confirm CI is green for every PR in the frontend, backend, and Bitclone merge sequence.
2. Confirm the backend is healthy and its `BML_CORS_ORIGINS` contains the exact preview frontend origin.
3. Record the candidate frontend commit, backend image digest, current production deployment, and UTC start time.
4. Deploy the candidate as a Pages preview with the preview API and monitoring variables.
5. Open the preview in a clean browser session and confirm it has no mixed-content, CSP, or CORS errors.
6. Run the automated release check:

   ```bash
   BML_E2E_BASE_URL=https://<preview-host> \
     BML_PRODUCTION_SMOKE=1 BML_LIVE_API=1 npm run test:smoke:production
   ```

   Alternatively, open **Actions → Production smoke → Run workflow**, enter the preview URL, and run the `production`
   environment job. Configure required reviewers for that GitHub environment when an approval gate is desired. Failed
   runs retain Playwright evidence for seven days.

7. Confirm the smoke check generated matching privacy-safe request records in backend logs.
8. Trigger one non-sensitive test error through the monitoring provider's approved verification method, confirm its
   environment and release, and remove the test event if policy permits.

## Production release

1. Confirm `BML_API_BASE_URL` names the production backend and that its certificate is valid.
2. Confirm the backend permits `https://bitcoinmathlab.com` and, if served, `https://www.bitcoinmathlab.com` exactly.
3. Promote or deploy the already verified frontend commit. Do not rebuild from a different commit.
4. Confirm `https://bitcoinmathlab.com` is served over HTTPS and the intended `www` redirect is effective.
5. Run:

   ```bash
   BML_E2E_BASE_URL=https://bitcoinmathlab.com \
     BML_PRODUCTION_SMOKE=1 BML_LIVE_API=1 npm run test:smoke:production
   ```

6. Verify the Cloudflare deployment, analytics, and Sentry event stream show the expected release and no new failure.
7. Record the deployed commit, backend image digest, smoke result, and UTC completion time.

## Rollback

Rollback is required when navigation or metadata checks fail, required security headers are missing, the browser cannot
reach the API, either guided lesson fails, or monitoring shows a release regression.

1. Restore the last known-good Pages deployment using Cloudflare's deployment rollback control.
2. If the failure is in the API, restore the backend image first, then restore or retain the compatible frontend.
3. Rerun the production smoke command against `https://bitcoinmathlab.com`.
4. Confirm monitoring and backend request records have returned to their previous baseline.
5. Record the failed and restored commits, backend digests, relevant request IDs, and UTC times.

Fix the release through the normal pull-request and CI path. Do not edit generated deployment assets by hand or expose
browser payloads, cookies, headers, environment dumps, or internal exception details in an issue.
