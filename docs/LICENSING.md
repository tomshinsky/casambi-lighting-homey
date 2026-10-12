# Licence review

The local reference `lkempf/casambi-bt`, pinned at
`ec23769ab3459abf8ba5f332267900964319d03e`, is Apache-2.0. Its Python protocol and
crypto work informed the JavaScript adaptations. The project retains Apache-2.0,
a copy of the licence, attribution and change notices. An MIT-only label would
not replace the upstream obligations; one consistent Apache licence avoids that
ambiguity while allowing community redistribution and contributions.

`casambi-bt-hass` and `aiocasambi` were examined for context; none of their source
is copied or shipped. No Python dependency is bundled. Runtime imports use Node
built-ins and the Homey-provided SDK. ESLint and its lockfile dependencies are
build/test tools only, not runtime dependencies.

Original assets are code-generated illustrations, not proprietary logos or copied
product photographs. Branding does not imply endorsement. App Store artwork and
trademark suitability still require human review before submission.

References: [Apache licence](https://www.apache.org/licenses/LICENSE-2.0),
[upstream repository](https://github.com/lkempf/casambi-bt).
