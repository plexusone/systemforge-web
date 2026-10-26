# Adding invite pages

An application that launches invite-only, with SystemForge's invite-gated
sign-up, needs two pages: one for operators to issue invites and work through
the waitlist, and one for members to invite people from their allowance.
`@plexusone/invites` provides both. This guide wires them into an
application; SystemForge's
[invite-gated sign-up guide](https://plexusone.github.io/systemforge/guides/invite-gated-signup/)
covers turning it on in SystemAuth and what an invited person sees.

## 1. Choose where the invite API runs

The pages call SystemForge's invite API with the browser's cookies, so the
API must accept the session of the person using the page. There are two
places to serve it:

| Where                                    | Base URL                                          | Use when                                                                                                    |
| ---------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Behind the application's own session** | A path on the application, such as `/invites/api` | The application embeds SystemAuth and has its own sign-in. The pages stay same-origin, so cookies just work |
| **On the SystemAuth host**               | `https://auth.example.com/signup-invites/api`     | The person is signed in to SystemAuth itself (`Options.SignupAPI`)                                          |

Serving the API behind the application's session is the usual choice. In
the host binary, `Service.SignupAPI` takes a function that names the person
signed in to the application:

```go
api, err := svc.SignupAPI(func(r *http.Request) (uuid.UUID, error) {
    return mySession.PrincipalID(r)
})
mux.Handle("/invites/api/", http.StripPrefix("/invites/api", api))
```

On the SystemAuth host, the page and the API are on different origins: the
API must allow credentialed requests from the application's origin, and the
SystemAuth session cookie must reach it.

## 2. Install and add the styles

```bash
pnpm add @plexusone/invites @plexusone/ui
```

The pages use Tailwind classes with `@plexusone/ui`'s theme names. Set up
Tailwind as in [@plexusone/ui](../packages/ui.md), then add the package's
built files to Tailwind's sources so their classes are generated:

```css
@source "../node_modules/@plexusone/invites/dist";
```

## 3. Route the pages

Create one client and route both pages where they belong in the
application. They are plain components, not an `AppModule`, because invites
are platform-wide rather than organization-scoped.

```tsx
import { createInvitesApi, InviteAdminPage, InvitePeoplePage } from '@plexusone/invites';

const invites = createInvitesApi('/invites/api');

<Route path="/invite" element={<InvitePeoplePage api={invites} />} />
<Route path="/admin/invites" element={<InviteAdminPage api={invites} />} />
```

`InviteAdminPage` is for platform administrators. Anyone else who reaches it
sees the API's refusal, so the route needs no guard of its own, but the menu
should not offer it to them.

## 4. Show the menu links to the right people

`settings()` says whether the person is an administrator, and `myInvites()`
gives their allowance. Offer **Invites** to administrators, and **Invite
people** to members who have an allowance:

```tsx
const [links, setLinks] = useState<{ admin: boolean; invite: boolean }>();

useEffect(() => {
  void Promise.all([invites.settings(), invites.myInvites()]).then(([s, mine]) =>
    setLinks({ admin: s.is_admin, invite: mine.allowance > 0 })
  );
}, []);
```

A member with no allowance can still open `/invite`; the page tells them they
have no invites to give yet.

## 5. Point the sign-in page at the waitlist

A refused sign-up is not told why. Link the application's sign-in page to
SystemAuth's waitlist, `https://auth.example.com/signup/waitlist`, so a
person without an invite has somewhere to go, and link it from any public
page that announces the launch.

## What the pages do

- **Invite people** shows how many people the member can still invite,
  creates an invite link and shows it once with a copy button, and revokes a
  link nobody has used, which gives the slot back.
- **Invites** has a section each for invite codes, email invites, the
  waitlist, member allowances, and the accounts that joined. New codes and
  links are shown once, because only a hash is stored; destructive actions
  are confirmed inline.

See [@plexusone/invites](../packages/invites.md) for each page's sections
and props, and the API client's methods.

## Testing

The pages fetch with the global `fetch`, so a test can stub it and answer
each route with JSON, as the package's own tests do. Answer `GET /settings`
and `GET /me/invites` for the member page, and the `/admin/...` routes for
the operator page. Use `vi.stubGlobal('fetch', ...)` in Vitest, and restore
it after each test.
