# Releasing

For maintainers. Packages are versioned by hand and published to npm by
hand with pnpm, one package at a time. The release workflow in GitHub
Actions does not publish; it runs only when started by hand.

## Versions

- **The repository is tagged** `vX.Y.Z` for each release. Release notes and
  the changelog are per repository.
- **Packages are versioned independently.** Bump only the packages that
  changed; a release can move `@plexusone/shell` to 0.2.3 while the others
  stay at 0.2.1. Internal ranges are `workspace:^`, which pnpm publishes as
  a caret range on the version in the workspace.
- **While the major version is 0,** a change a consumer must react to is a
  new minor version; fixes are patch versions.
- **A published version cannot be replaced.** Fix forward with a new
  version, and deprecate the broken one.

## 1. Prepare the release

1. Set `version` in each changed package's `package.json`.
2. Add the release to `CHANGELOG.json` with each change's commit, then
   generate the changelog:

   ```bash
   schangelog validate CHANGELOG.json
   schangelog generate CHANGELOG.json -o CHANGELOG.md
   cp CHANGELOG.md docs/changelog.md
   ```

3. Add `docs/releases/vX.Y.Z.md` and list it in `mkdocs.yml`.
4. Check locally what CI checks:

   ```bash
   pnpm install --frozen-lockfile
   pnpm build          # ends by loading every package entry point
   pnpm test
   pnpm lint
   pnpm format:check
   ```

   `pnpm build` runs `scripts/check-exports.mjs`, which imports and requires
   every entry point each package exports. It fails when an export names a
   file the build does not write, which once shipped a `@plexusone/ui` that
   could not load.

## 2. Push, then tag

1. Push `main` and wait for CI to pass.
2. Tag the commit CI passed on, and push the tag:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

## 3. Publish

Publish from `main` at the tagged commit. `pnpm publish` refuses a detached
HEAD (`ERR_PNPM_GIT_UNKNOWN_BRANCH`), so check out `main`, not the tag:

```bash
git checkout main
git pull --ff-only
git rev-parse --short HEAD    # must be the tagged commit
pnpm install --frozen-lockfile
pnpm build
```

Sign in right before publishing: tokens from `npm login` are short-lived, and
an expired one makes `publish` fail with `E404` on `PUT`. If `npm whoami`
fails, run `npm login` again.

Then publish **each changed package with its own command**, in
dependency order: `ui` and `auth` before `tenant`, and all three before
`shell`; `auth` before `pages`.

```bash
npm login
npm whoami                    # grokify
pnpm --filter @plexusone/ui publish --access public
pnpm --filter @plexusone/auth publish --access public
pnpm --filter @plexusone/tenant publish --access public
pnpm --filter @plexusone/shell publish --access public
```

Do not use `pnpm -r publish`. It decides what to publish by asking the
registry, which can lag behind a version just published or staged; it then
publishes that version again, npm answers `E409 Cannot publish over
previously staged version`, and the run stops before the remaining
packages.

### A new package goes through staging

Until it is approved, the version cannot be installed, and the registry may
take a few minutes to show it after approval. Check **Staged Packages**
before concluding a publish failed.

The first version of a package that is not yet on npm is staged: npm
publishes a public `0.0.0-stage` placeholder and holds the real version
until a maintainer approves it. Approve it in **Staged Packages** on
npmjs.com, with two-factor authentication, before publishing a package
that depends on it. With npm 11.15 or later, `npm stage list` and
`npm stage approve <id>` do the same from the terminal.

### When publishing fails

| Error                                                | Cause                                                                | What to do                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ERR_PNPM_GIT_UNKNOWN_BRANCH`                        | HEAD is detached, as after checking out a tag                        | Check out `main` at the tagged commit                                     |
| `E404` on `PUT`                                      | Not signed in, or the token expired (sign-in tokens are short-lived) | `npm login`, then `npm whoami`                                            |
| `E409 Cannot publish over previously staged version` | That version is already published or staged                          | Skip it; publish the next package                                         |
| `E402`                                               | Publishing a scoped package as restricted                            | Every package sets `publishConfig.access: public`; pass `--access public` |

## 4. Verify

The registry can take a minute to show a new version. Then install the
published packages into an empty project and load them, which is what a
consumer does:

```bash
mkdir /tmp/check && cd /tmp/check && npm init -y >/dev/null
npm install react@19 react-dom@19 @plexusone/shell @plexusone/auth @plexusone/tenant @plexusone/ui
node --input-type=module -e "await import('@plexusone/shell'); console.log('import ok')"
node -e "require('@plexusone/shell'); console.log('require ok')"
```

If a published version is broken, publish a fixed version and deprecate the
broken one:

```bash
npm deprecate @plexusone/ui@0.2.1 "broken exports; use 0.2.2"
```
