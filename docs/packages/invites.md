# @plexusone/invites

Pages for SystemForge's invite-gated sign-up: an operator page to manage
invite codes, email invites, the waitlist and member allowances, and a member
page to invite people. Both call SystemForge's invite API (`signupapi`); see
SystemForge's [invite-gated sign-up guide](https://plexusone.github.io/systemforge/guides/invite-gated-signup/).
[Adding invite pages](../guides/invite-gated-signup.md) walks through wiring
them into an application.

```bash
pnpm add @plexusone/invites @plexusone/ui
```

## Use the pages

The pages are plain components: route them in your application wherever they
belong. They are not an `AppModule`, because invites are platform-wide, not
organization-scoped.

```tsx
import { createInvitesApi, InviteAdminPage, InvitePeoplePage } from '@plexusone/invites';

// Where the host serves the invite API: behind its own session...
const invites = createInvitesApi('/invites/api');
// ...or on SystemAuth with Options.SignupAPI:
// createInvitesApi('https://auth.example.com/signup-invites/api');

<Route path="/admin/invites" element={<InviteAdminPage api={invites} />} />
<Route path="/invite" element={<InvitePeoplePage api={invites} />} />
```

Requests carry the browser's cookies, so the API must be same-origin with the
page or allow credentialed requests from it. The pages use Tailwind classes
from `@plexusone/ui`'s preset; add the package's `dist` to your Tailwind
sources.

## InvitePeoplePage

For any signed-in person:

- how many people they can still invite, from their allowance;
- **Create invite link**, disabled when none are left, which shows the new
  link once with a copy button;
- their links with status and expiry, and **Revoke** (asked inline) for a link
  nobody has used, which gives the slot back.

| Prop    | Type         | Description                        |
| ------- | ------------ | ---------------------------------- |
| `api`   | `InvitesApi` | The client from `createInvitesApi` |
| `title` | `string`     | Heading; default "Invite people"   |

## InviteAdminPage

For platform administrators; anyone else sees the API's refusal. Sections:

| Section               | Does                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invite codes**      | Create a code with a label, how many people it admits, expiry and note; the code and link are shown once. List codes with uses and status; revoke |
| **Email invites**     | Invite pasted addresses, with a note and expiry; list with status; revoke                                                                         |
| **Waitlist**          | Select entries (or everyone not yet invited) and invite them; remove an entry                                                                     |
| **Member allowances** | Set how many people a member may invite, by email, or return them to the default                                                                  |
| **Joined**            | Accounts admitted by codes and email invites, with the code or member that brought them                                                           |

| Prop    | Type         | Description                        |
| ------- | ------------ | ---------------------------------- |
| `api`   | `InvitesApi` | The client from `createInvitesApi` |
| `title` | `string`     | Heading; default "Invites"         |

## API client

`createInvitesApi(baseUrl)` returns an `InvitesApi` with one method per
route: `settings`, `myInvites`, `createMyCode`, `revokeMyCode`, and for
administrators `invites`, `addInvites`, `revokeInvite`, `codes`,
`createCode`, `revokeCode`, `waitlist`, `inviteFromWaitlist`,
`removeFromWaitlist`, `allowances`, `setAllowance` and `joined`. A failed
call throws `ApiError` with the HTTP status and the API's message. Wire types
(`InviteCode`, `CreatedCode`, `EmailInvite`, `WaitlistEntry`, `Allowance`,
`JoinedAccount`, `MyInvites`, `InviteSettings`) are snake_case, as the API
sends them.
