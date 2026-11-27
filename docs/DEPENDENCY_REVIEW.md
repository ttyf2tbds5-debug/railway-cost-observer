# Dependency review

The machine-readable inventory is dependency-licenses.json. It includes installed and platform-optional packages from the lockfile. This is a manifest inventory, not a completed legal opinion.

Most packages declare MIT/Apache/BSD/ISC-style terms. Pay particular attention before distributing a binary image to Sharp/libvips (LGPL-3.0-or-later alongside Apache/MIT terms), lightningcss and axe-core (MPL-2.0), and caniuse-lite (CC-BY-4.0). Preserve each dependency's license and notice files; do not relicense third-party code as the application's license. Source/provision obligations for redistributed native binaries still need review before a public image release. The current deliverable contains source and a lockfile, not vendored dependency binaries.

The initially installed Prisma 6.19.3 dependency tree had four high findings involving @prisma/config, effect and deepmerge-ts. It was replaced with 6.12.0; the resulting audit reported zero known vulnerabilities. This is a temporary compatibility decision and should be reviewed before release and during maintenance. Audit absence is not proof of absence of vulnerabilities.

Railway usage rates/query structure were checked against the official railwayapp/cli repository at commit b1f025bb92e02e11e779a7b8a8cf5544462349b4, src/commands/usage.rs. The application is an independent implementation, not a repackaging of a competitor.
