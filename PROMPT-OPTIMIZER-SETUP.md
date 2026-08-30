# Claude Code Prompt Optimizer Setup

This project is configured to use the Claude Code Prompt Optimizer, a hook that automatically enhances prompts with detailed, structured instructions.

## Installation

The prompt optimizer has been installed globally via:

```bash
git clone https://github.com/johnpsasser/claude-code-prompt-optimizer.git
cd claude-code-prompt-optimizer
npm run install-hook
```

## Usage

To use the prompt optimizer in Claude Code, simply add `<optimize>` to the beginning of any prompt:

```
<optimize> implement a user authentication system with JWT tokens
```

The hook will:
1. Intercept your prompt before sending it to Claude
2. Process it through Claude's extended thinking mode
3. Return an enhanced version with:
   - Specific implementation steps
   - Error handling considerations
   - Testing requirements
   - Edge cases and best practices

## How It Works

The optimizer transforms simple, high-level requests into detailed technical specifications. For example:

**Original prompt:**
```
Create a REST API with authentication
```

**Optimized prompt:**
```
Create a REST API with authentication

## Requirements & Constraints
- Use TypeScript and Express.js
- Implement JWT-based authentication
- Include rate limiting to prevent brute force attacks
- Support both access and refresh tokens

## Implementation Steps
1. Set up Express server with TypeScript compilation
2. Create middleware for JWT verification
3. Implement login/logout endpoints
4. Add rate limiting middleware
5. Create protected route examples
6. Implement token refresh logic

## Error Handling
- Handle invalid JWT tokens gracefully
- Return appropriate HTTP status codes
- Log authentication failures securely
- Implement request validation

## Testing
- Write unit tests for authentication middleware
- Test token expiration scenarios
- Test invalid token rejection
- Load test rate limiting behavior

## Edge Cases
- Expired tokens mid-request
- Token revocation
- Concurrent requests with same token
- Clock skew between servers
```

## Authentication

The optimizer requires one of:
- **Stored OAuth**: From `claude login` (recommended)
- **OAuth Token**: `CLAUDE_CODE_OAUTH_TOKEN` environment variable (Claude Pro/MAX)
- **API Key**: `ANTHROPIC_API_KEY` environment variable (API credits)

The installation automatically uses stored OAuth if available.

## Configuration

The hook is configured in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "user-prompt-submit": ["claude-code-prompt-optimizer"]
  }
}
```

## Troubleshooting

If optimization fails:
1. Check that Claude Code CLI is up to date: `claude --version`
2. Verify authentication is set up: `claude login`
3. Check hook installation: `cat ~/.claude/settings.json`
4. Review logs for authentication errors

## Disabling the Optimizer

To temporarily disable the optimizer:
1. Open `~/.claude/settings.json`
2. Remove or comment out the prompt-optimizer hook
3. Reload Claude Code

To uninstall completely:
```bash
npm uninstall -g claude-code-prompt-optimizer
# Then manually remove from ~/.claude/settings.json
```

## Credits

- **Project**: [claude-code-prompt-optimizer](https://github.com/johnpsasser/claude-code-prompt-optimizer)
- **Author**: John Sasser
- **License**: MIT
