# Setting Up Personal Access Token for PR Comments

To have PR comments appear from your personal GitHub account instead of `github-actions[bot]`, you need to create a Personal Access Token (PAT) and add it to your repository secrets.

## Steps

### 1. Create a Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., `D2Go PR Comments`)
4. Set an expiration (recommend 90 days or 1 year)
5. Select the following scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `write:discussion` (Read and write team discussions)

   Or if this is a public repo, you can use fine-grained permissions:
   - ✅ `pull_requests: write`
   - ✅ `contents: read`

6. Click **"Generate token"**
7. **Copy the token** (you won't be able to see it again!)

### 2. Add Token to Repository Secrets

1. Go to your repository settings: `https://github.com/o-az/d2go/settings/secrets/actions`
2. Click **"New repository secret"**
3. Name: `GH_PAT`
4. Value: Paste the token you copied
5. Click **"Add secret"**

### 3. That's it!

The workflow is already configured to use `secrets.GH_PAT` when available. If the secret is not set, it will fall back to the default `github.token` (which posts as `github-actions[bot]`).

## Security Notes

- Never commit your PAT to the repository
- Set an expiration date and renew periodically
- Only grant the minimum required permissions
- If the token is compromised, revoke it immediately in GitHub settings
