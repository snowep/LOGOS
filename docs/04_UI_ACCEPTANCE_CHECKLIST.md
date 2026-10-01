# LOGOS — UI Acceptance Checklist

## Global
- [ ] MUI v9 used consistently.
- [ ] No fake production data.
- [ ] No hard-coded Windows paths.
- [ ] No browser hard-coded localhost API URLs.
- [ ] No ORION visible in product UI.
- [ ] No voice controls.
- [ ] No fake telemetry.
- [ ] No fake integrations.
- [ ] No fake agent counts.
- [ ] No fake progress.

## Typography
- [ ] Home title 32 px.
- [ ] Inner page titles <=28 px.
- [ ] Section headings 18 px.
- [ ] Card titles 16 px.
- [ ] Body 14–16 px.
- [ ] Metadata 12–13 px.
- [ ] No clipped headings.
- [ ] No unreadable secondary text.

## Icons
- [ ] Official MUI icons only.
- [ ] Navigation 22–24 px.
- [ ] Normal 20–24 px.
- [ ] Metadata 18 px.
- [ ] Icon-only controls have aria-label.
- [ ] No decorative icon overload.
- [ ] No microphone button.

## Dark
- [ ] Warm dark background.
- [ ] Readable primary text.
- [ ] Readable secondary text.
- [ ] Visible but subtle borders.
- [ ] Accent used sparingly.
- [ ] No purple/indigo gradient.

## Light
- [ ] Warm off-white background.
- [ ] Near-white surfaces.
- [ ] Dark readable text.
- [ ] Visible borders.
- [ ] Accent remains readable.

## Home
- [ ] Greeting.
- [ ] Dominant command input.
- [ ] Command max width 760 px.
- [ ] Content max width 1120 px.
- [ ] Maximum three primary project cards above fold.
- [ ] Project cards approximately 352–360 px wide desktop.
- [ ] Needs Attention only when populated.
- [ ] Recent activity is real.
- [ ] No telemetry cards.

## Chat
- [ ] Conversation dominates.
- [ ] Context hidden until relevant.
- [ ] Sources inspectable.
- [ ] Consequential actions have approval UI.

## Vault
- [ ] Only meaningful Markdown documents shown.
- [ ] Relationships visible.
- [ ] Preview readable.
- [ ] Raw filesystem path hidden by default.

## Memory
- [ ] Search.
- [ ] Provenance.
- [ ] Confidence where applicable.
- [ ] Status.
- [ ] Related documents/projects.

## System
- [ ] Real health data.
- [ ] Real DB data.
- [ ] Real retrieval backend.
- [ ] Real runtime data.
- [ ] Real logs.
- [ ] Accurate configuration.
- [ ] Developer information isolated here.

## Accessibility
- [ ] Keyboard navigation.
- [ ] Visible focus.
- [ ] Icon labels.
- [ ] Form labels.
- [ ] Correct heading hierarchy.
- [ ] Adequate contrast.
- [ ] No information conveyed only by color.

## Screen test sizes

```text
1440 x 900
1280 x 800
1024 x 768
768 x 1024
390 x 844
```

At all sizes:
- [ ] no horizontal page overflow,
- [ ] no clipped headings,
- [ ] no unreadable text,
- [ ] no overlapping controls,
- [ ] primary action remains visible.
