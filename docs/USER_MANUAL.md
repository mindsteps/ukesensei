# Uke Sensei — User Manual

A browser-based practice companion that listens through your microphone and gives you real-time feedback while you play. This guide covers everything a player-facing user can do in the app. For setup/build instructions see the main [README](../README.md); for how the app is built see the [Developer Guide](./DEVELOPER_GUIDE.md).

## Getting started

1. Open the app and allow microphone access when prompted — everything here depends on it.
2. **Set up your profile.** The first time you open the app you'll be asked for a name and a "key" (your password). The same name + key brings your profile back on any device — there's no email/password account system, just this name+key pair. An email address is optional, only used for reminders/updates.
3. **Take the tour.** Right after setup you'll get a short, skippable walkthrough of the main areas. Skip it anytime, and bring it back later from the user menu (top right, next to your name) or the "Take the tour" link on the About page.

## Choosing an instrument

The instrument selector is in the top-left of the header. Supported instruments:

| Instrument | Fretboard | Chord diagrams | Lessons |
|---|---|---|---|
| Ukulele | ✅ | ✅ | ✅ (blues curriculum) |
| Bass | ✅ | ✅ | ✅ (technique curriculum) |
| Guitar | ✅ | ✅ | — (no curriculum yet) |
| Clarinet | — | — | — (no curriculum yet) |
| Voice | — | — | ✅ |
| Handpan | — (own diagram) | — | ✅ |
| Cajón | — (own panel) | — | ✅ (rhythm-based) |

Switching instruments keeps each instrument's progress separate — your lesson progress on ukulele doesn't affect bass, for example.

For string instruments (ukulele/bass/guitar) you can also pick a **tuning**. Standard/Low G for ukulele is auto-detected: just start playing your open G string and the app figures out which one you're using. For handpan, pick a **scale layout** from its own dropdown instead of a tuning.

## Free Play

Hit **Start Listening**, then just play. The detected note lights up on the fretboard (or the appropriate panel for non-fretted instruments) in real time, with a tuning meter showing how sharp or flat you are. Turn on the scale overlay to see a key/scale highlighted on the fretboard so you can see how what you're playing relates to it. There's also a flip toggle right next to the fretboard if you prefer seeing it from the player's own perspective looking down at the instrument.

If you strum a chord, it's identified automatically and shown as a fretting diagram alongside the fretboard.

## Exercises

Exercises are free-form, ungated practice — no account progress is required to use them. Pick a key and scale (for pitched instruments) or a rhythm pattern (for cajón), then start. The app guides you note-by-note (or hit-by-hit) and shows a summary at the end: accuracy, average tuning deviation, total time, and a suggestion for what to practice next.

## Lessons

Lessons are structured, in order, and gate progress: each lesson has instructional content, some free-play practice drills to warm up on, and a checkpoint exercise you must pass (at a set accuracy) to unlock the next lesson. Not every instrument has a curriculum yet — see the table above.

## Library and sharing

Your practice sessions and recordings are saved to your **Library**, where you can play them back later. From a saved session you can generate a shareable link so someone else can listen without needing an account. Share links can be revoked at any time from the same place you created them.

## Sheet music

If a session includes a melody, the app can transcribe it into live staff notation, quantized to a tempo grid, so you can see what you played as sheet music rather than just a note-by-note log.

## Your profile

From the user menu you can:
- **View profile** — update your display name, key (password), contact email, or avatar
- **Take the tour** — replay the first-run walkthrough
- **Log out**

## Troubleshooting

- **No sound is detected.** Check that your browser has microphone permission for the site, and that the correct input device is selected at the OS level. Try moving closer to the mic or increasing your instrument's volume.
- **Wrong notes are detected / detection feels laggy.** Background noise or a very quiet room mic can confuse pitch detection. Try a quieter environment or an external mic if possible.
- **Chord detection doesn't trigger.** A single sustained string won't register as a chord — the detector needs at least a few different notes ringing together within a short window.
- **My progress didn't carry over to another device.** Make sure you signed in with the exact same name and key (both are case-sensitive) on the new device.
