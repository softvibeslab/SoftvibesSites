---
name: video-evidence-analysis
description: "Analyze public videos end to end: acquire and transcribe, inspect audiovisual construction, fact-check claims, and deliver a calibrated verdict with timestamps and primary sources. Use for Facebook, YouTube, TikTok, uploaded videos, documentaries, explainers, and scientific or political clips."
---

# Video Evidence Analysis

Analyze the actual artifact, not just its caption or transcript. Separate what the video says, how it persuades, and what the evidence supports.

## Deliverable

Default output:

1. One-sentence verdict.
2. Neutral thesis/argument map.
3. Claim-by-claim fact-check with timestamp, verdict, evidence, and missing inference.
4. Audiovisual analysis: structure, pacing, graphics, accessibility, voice/music/mix.
5. Persuasion analysis: authority cues, modality shifts, false dichotomies, emotional framing.
6. Calibrated conclusion and primary-source links.

Use verdict labels consistently:

- **Established** — supported by replicated or consensus evidence.
- **Supported but limited** — real evidence with scope constraints.
- **Preliminary** — suggestive result needing replication.
- **Hypothesis** — testable proposal, not confirmed.
- **Interpretation** — philosophical or theoretical inference beyond the direct result.
- **Misleading** — real source, but the video overstates or changes what it shows.
- **False** — contradicted by the cited source or established evidence.

## Workflow

### 1. Acquire and preserve

- Capture metadata, description, duration, upload context, and canonical URL.
- Prefer platform captions when complete; otherwise download the public media with `yt-dlp` and transcribe locally.
- Keep source media unchanged. Put derivatives in a task directory.
- Record exact duration, resolution, frame rate, codecs, and audio presence with `ffprobe`.

### 2. Validate the transcript

- Produce both plain text and timestamped SRT/VTT.
- Read the beginning, every major topic transition, and the ending.
- Check suspicious repeated phrases, impossible timestamps, zero-duration cues, and speech after the audio has ended. These are transcription artifacts until verified against the media.
- Anchor important claims to timestamps. Do not quote auto-transcription as verbatim when the audio was not manually confirmed.

### 3. Inspect the visual construction

Use the smallest sample that represents the whole video:

- Generate an interval contact sheet for global style and continuity.
- Add scene-change detection when pacing matters.
- Inspect extra frames around major claims, charts, citations, or visual discontinuities.
- Distinguish observation from inference: say “AI-assisted appearance” rather than declaring synthetic origin without provenance evidence.
- Check subtitle size, contrast, reading time, safe-area placement, and whether graphics show evidence or merely mood.

### 4. Measure audio instead of guessing

Use `ffmpeg`/`ffprobe` to inspect:

- integrated loudness (LUFS),
- true peak (dBTP),
- loudness range (LRA),
- silence/dead-air windows,
- clipping or unusually compressed delivery.

Describe perceived voice synthesis only as an indication unless provenance is available.

### 5. Build the argument map

Reduce the video to explicit links:

`source result → interpretation → mechanism → broad conclusion`

Mark where the video silently changes level. Common failure:

`study found correlation → mechanism is true → worldview is proven`

Also track modal language over time: “might/suggests/proposes” becoming “shows/confirms/proves” is evidence inflation even when every named source exists.

### 6. Fact-check in source order

For each central claim:

1. Find the exact source the video appears to invoke.
2. Prefer original paper, official dataset, court text, statute, or institutional record.
3. Use high-quality reviews or reference works for consensus and interpretation.
4. Read methods, population, endpoint, limitations, and author list—not only the abstract or press release.
5. Separate correlation, compatibility, mechanism, causation, replication, and generalization.
6. Verify attribution: a nearby researcher, lab, or related paper is not automatically the author of the cited experiment.
7. State what was *not measured*. Absence of the decisive measurement often resolves the fact-check quickly.

For scientific/philosophical videos, explicitly distinguish:

- theorem or formal result,
- interpretation of that result,
- proposed physical mechanism,
- experimental observation,
- claim that the observation confirms the mechanism.

See `references/scientific-claim-calibration.md` for a worked pattern.

### 7. Synthesize without laundering uncertainty

The final verdict should answer:

- Are the named facts real?
- Are they correctly attributed?
- Does each conclusion follow from the experiment?
- Is the uncertainty preserved or removed?
- Would a reasonable viewer leave believing something stronger than the evidence supports?

A video can be narratively excellent and scientifically misleading. Score form and evidence separately when useful.

## Minimal checks

Before delivery:

- Source media and transcript duration agree.
- Every major factual verdict has a source.
- At least one primary source was read for each decisive empirical claim.
- Animal, cell, simulation, and human results are not conflated.
- “Compatible with” is not rewritten as “confirms.”
- Hypotheses are not described as consensus.
- Subjective audiovisual judgments are labeled as judgments.
- Final answer leads with the verdict, not the production diary.

## Pitfalls

- **Transcript-only analysis:** misses graphics, pacing, disclaimers, and emotional manipulation.
- **Press-release laundering:** institutional enthusiasm is not the paper’s evidentiary strength.
- **Citation existence = claim true:** a real paper may not test the video’s conclusion.
- **Attribution blending:** related researchers and adjacent studies get merged into one authority chain.
- **Quantum/AI/neuroscience halo:** evidence for a broad field is not evidence for the specific mechanism claimed.
- **Decorative precision:** exact frequencies or percentages may be model parameters rather than measurements.
- **Synthetic-media certainty:** appearance alone is not provenance.
- **Overlong setup:** perform the analysis first; report only methods that help the user assess confidence.

## Output template

```text
VERDICT
[One sentence]

WHAT THE VIDEO ARGUES
[Short argument map]

FACT-CHECK
[Timestamp] Claim — Verdict
What the source actually found:
What the video adds or omits:
Source:

AUDIOVISUAL EXECUTION
[Structure, pacing, graphics, accessibility, audio]

BOTTOM LINE
[Accurate / partly reliable / speculative / misleading, and why]
```
