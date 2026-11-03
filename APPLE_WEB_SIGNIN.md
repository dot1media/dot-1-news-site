# Sign in with Apple, on the web

The code for Apple sign-in on news.dot1.media is already in place. It stays
hidden until the two environment variables below are set, so nothing looks
broken before the Apple Developer setup is done. The web uses the same backend
procedure as the app (`auth.signInWithApple`); the only difference is the token
audience, which is why the backend needs the web Services ID too.

## 1. Create a Services ID (Apple Developer)

Apple Developer, Certificates, Identifiers & Profiles, Identifiers, add a new
**Services ID** (not an App ID).

- Description: Dot 1 News Web
- Identifier: a reverse-domain string, for example `media.dot1.news.web`.
  This string is the web "client id" used in the env vars below.

Then select the Services ID, enable **Sign in with Apple**, and Configure:

- Primary App ID: the existing Dot 1 News app id (`app.dot1.dot1news`).
- Domains and Subdomains: `news.dot1.media`
- Return URLs: `https://news.dot1.media/account`

## 2. Verify the domain

Apple gives you a file named `apple-developer-domain-association.txt` on that
configure screen. It must be served at:

`https://news.dot1.media/.well-known/apple-developer-domain-association.txt`

Add it to the news site (a `public/.well-known/` file), deploy, then click
Verify in Apple Developer.

## 3. Set the environment variables

News site (the `dot-1-news-site` Vercel project):

- `NEXT_PUBLIC_APPLE_CLIENT_ID` = the Services ID, e.g. `media.dot1.news.web`
- `NEXT_PUBLIC_APPLE_REDIRECT_URI` = `https://news.dot1.media/account`
  (must exactly match a Return URL registered in step 1)

Backend (the `dot-1-news-final` Vercel project):

- `APPLE_WEB_CLIENT_ID` = the same Services ID, e.g. `media.dot1.news.web`
  (so the backend accepts identity tokens issued to the web client)

## 4. Redeploy

Redeploy both projects. The "Continue with Apple" button then appears in the
sign-in panel (the article comments box and the /account page). An account made
this way has no password, so the password section is hidden for it, exactly
like an Apple account created in the app. A reader who signed up with email on
the app and later uses Apple with the same email is linked to the one account.

## Notes

- The native app already uses Sign in with Apple against the App ID; this does
  not change that. The two can coexist; a user is keyed on Apple's stable `sub`.
- If you ever rename the Services ID, update both env vars and redeploy.
