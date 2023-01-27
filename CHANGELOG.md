# Change Log

This file documents all notable changes to quence.

## v2.0.0

Released: 2023-01-26

### Major Changes

- (BREAKING) Now requires node 14+
- (BREAKING) Major API refactor
- (BREAKING) New CLI.  Only some thought given to backward-compatibility.

### Minor Changes

- (FEATURE) Add support for lost packets
- (FEATURE) Add support for notes next to actors in the timeline
- (FEATURE) Built-in API descriptions for Typescript
- (REFACTOR) Removed useless logging
- (UPDATE) Updated all dependencies to latest
- (FEATURE) Adds unicode support, including \u0000, \u{0}, and \x00 escapes.
  Participant names are canonicalized using NFC.

### Bug Fixes

- (BUG) Respect arrow_height and arrow_width
- (BUG) Begin arrows were flipped for R2L lines
- (BUG) Fix many issues with big line_width's
