# Magic Link Authentication

The Magic Link Authentication system provides a passwordless login experience for users and candidates. It uses a time-sensitive, signed JWT token sent via email to authenticate sessions.

## Architecture

### Backend
- **Service**: `AuthService` handles the core logic.
  - `sendMagicLink(email)`: Checks if the email exists in `UsersService` or `CandidatesService`. Generates a JWT with `type: 'magic-link'` and expiration (15m).
  - `verifyMagicLink(token)`: Validates the token signature and expiration. Exchanges if for a long-lived session JWT.
- **Controller**: `AuthController`
  - `POST /auth/magic-link`: Endpoint to trigger the email.
  - `POST /auth/magic-login`: Endpoint to verify the token and return session credentials.
- **Email**: `EmailService` sends the email using `nodemailer` (currently configured for Ethereal).

### Frontend
- **Portal**: The candidate portal is the primary consumer.
  - login page: `/portal/login` - Form to request the link.
  - verify page: `/portal/login/verify?token=...` - Captures the token from URL and calls verification endpoint.

## Security Considerations
- **Token Expiration**: Magic links expire after 15 minutes to reduce risk of intercepted links.
- **Single Use**: Ideally, tokens should be single-use (though currently stateless JWTs are used, ensuring short expiration mitigates replay attacks).
- **Scope**: The token generated for the link has a specific `magic-link` type claim, preventing it from being used as a session token directly.
