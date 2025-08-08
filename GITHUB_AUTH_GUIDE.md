# GitHub Personal Access Token Authentication Guide

## Overview

The website now uses **GitHub Personal Access Token (PAT)** authentication for secure admin access and direct content management. This replaces the previous client-side password authentication with a more secure, GitHub-integrated approach.

## Features

### ✅ **Implemented Features:**

1. **Secure GitHub PAT Authentication**
   - Login with GitHub Personal Access Token
   - Token validation against GitHub API
   - Repository access verification
   - Secure client-side token storage

2. **Direct GitHub Repository Operations**
   - Create blog posts directly to GitHub repository
   - Create talks directly to GitHub repository
   - List existing content from GitHub
   - Delete content from GitHub repository
   - Automatic deployment triggering

3. **Enhanced Admin Interface**
   - GitHub user information display
   - Content management dashboard
   - Real-time content listing
   - Integrated content operations

## How to Get Your GitHub Personal Access Token

### Step 1: Navigate to GitHub Settings
1. Go to [GitHub.com](https://github.com) and sign in
2. Click your profile picture in the top right
3. Select **Settings** from the dropdown

### Step 2: Access Developer Settings
1. Scroll down in the left sidebar
2. Click **Developer settings** (at the bottom)
3. Click **Personal access tokens**
4. Choose **Tokens (classic)** for compatibility

### Step 3: Generate New Token
1. Click **Generate new token** → **Generate new token (classic)**
2. Add a descriptive note (e.g., "Website Admin Access")
3. Set expiration (recommended: 90 days for security)
4. Select the following scopes:
   - ✅ **repo** (Full control of private repositories)
     - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events

### Step 4: Generate and Copy Token
1. Click **Generate token**
2. **IMPORTANT**: Copy the token immediately (it won't be shown again)
3. Store it securely (password manager recommended)

## Using the Admin Interface

### Step 1: Access Admin Panel
1. Navigate to `/admin` on your website
2. You'll see the GitHub authentication form

### Step 2: Login with GitHub PAT
1. Paste your GitHub Personal Access Token in the input field
2. Click **Authenticate with GitHub**
3. The system will:
   - Validate your token with GitHub API
   - Check repository access permissions
   - Store your session securely

### Step 3: Use Admin Features
Once authenticated, you can:

#### Create Content
- **Create Blog Post**: Direct creation to GitHub repository
- **Create Talk**: Direct creation to GitHub repository
- Content is automatically deployed via GitHub Actions

#### Manage Content
- **View Content**: List all blog posts and talks
- **Delete Content**: Remove content directly from repository
- **Edit Content**: (Coming in future updates)

## Security Features

### Token Security
- Tokens are stored in browser localStorage (client-side only)
- No server-side token storage
- Tokens are validated against GitHub API on each use
- Repository access is verified before operations

### Repository Protection
- Only users with repository access can authenticate
- All operations require valid GitHub token
- Direct GitHub API integration ensures authenticity

### Session Management
- Sessions persist until logout or token expiration
- Easy logout clears all stored credentials
- Re-authentication required after token expiry

## Technical Implementation

### Architecture
```
Browser → GitHub API → Repository → GitHub Actions → Deployment
```

### Key Components
1. **GitHub API Integration** (`src/utils/github.ts`)
2. **Authentication System** (`src/utils/github-auth.ts`)
3. **Admin Interface** (`src/pages/admin/`)
4. **Content Creation** (Direct GitHub API calls)

### File Paths
- **Chinese Blog Posts**: `src/content/blog/`
- **English Blog Posts**: `src/content/blog-en/`
- **Chinese Talks**: `src/content/talks/`
- **English Talks**: `src/content/talks-en/`

## Troubleshooting

### Common Issues

#### "Invalid GitHub token"
- **Cause**: Token format is incorrect or expired
- **Solution**: Generate a new token with proper scopes

#### "Token does not have access to the repository"
- **Cause**: Token lacks repository permissions
- **Solution**: Ensure token has `repo` scope selected

#### "Network error validating token"
- **Cause**: GitHub API is unreachable or rate limited
- **Solution**: Check internet connection, wait and retry

#### "Failed to create content"
- **Cause**: File already exists or insufficient permissions
- **Solution**: Check if content with same slug exists, verify token permissions

### Token Best Practices

1. **Use Descriptive Names**: Name tokens clearly (e.g., "Website Admin - Dec 2024")
2. **Set Reasonable Expiration**: 30-90 days for security
3. **Rotate Regularly**: Generate new tokens periodically
4. **Store Securely**: Use password managers, never commit to code
5. **Revoke When Done**: Remove tokens when no longer needed

## Migration from Old System

### What Changed
- ❌ **Removed**: Client-side password authentication
- ❌ **Removed**: File download workflow
- ✅ **Added**: GitHub PAT authentication
- ✅ **Added**: Direct repository operations
- ✅ **Added**: Automatic deployment

### Migration Steps
1. Generate GitHub Personal Access Token (see guide above)
2. Access `/admin` and authenticate with new token
3. All existing functionality now works through GitHub integration
4. Content is created directly in repository (no manual file placement needed)

## Future Enhancements

### Planned Features
- Content editing interface
- Bulk content operations
- Content preview before publishing
- Translation workflow integration
- Content analytics and statistics

### Security Improvements
- Token refresh mechanism
- Enhanced permission validation
- Audit logging
- Multi-user support

## Support

If you encounter issues:
1. Check this guide for troubleshooting steps
2. Verify your GitHub token has correct permissions
3. Ensure repository access is properly configured
4. Check browser console for detailed error messages

---

**Note**: This system is designed for GitHub Pages deployment and works entirely with static hosting. All operations are performed client-side with direct GitHub API integration.
