# ARGUS Daemon Demonstrations & Media

This directory contains master video demonstrations, caption tracks, terminal recordings, demo manifests, and guides for the ARGUS Autonomous Voice-Native Linux Agent Daemon (`argusd`).

## 🎬 Master Video Demonstration

| Asset | Format | Resolution | Duration | Subtitles |
|---|---|---|---|---|
| [**`argus-ted-master.mp4`**](argus-ted-master.mp4) | MP4 (H.264 / AAC) | 1080p 60fps | 01:29 (89s) | [SRT](argus-ted-master.srt) · [VTT](argus-ted-master.vtt) |

### Video Scene Breakdown:
- `00:00 - 00:20`: Daemon Bootstrap & Capability Audit (`argusd doctor`)
- `00:21 - 00:45`: Autonomous Port 8080 Collision Diagnosis & Safe Process Liberation
- `00:46 - 01:05`: Adversarial Attack Interception (Path Traversal & Cloud Metadata SSRF blocked)
- `01:06 - 01:29`: Landlock LSM Kernel Restriction & 4-Tier Voice Fallback Cascade

### Playback Instructions
To play the video locally with subtitles:
```bash
# Using VLC
vlc --sub-file docs/demo/argus-ted-master.srt docs/demo/argus-ted-master.mp4

# Using MPV
mpv --sub-file=docs/demo/argus-ted-master.srt docs/demo/argus-ted-master.mp4

# On macOS Native Player
open docs/demo/argus-ted-master.mp4
```

## Running the Interactive Terminal Demo
To run the automated terminal interactive walkthrough:
```bash
./scripts/demo.sh
```

## Running the Linux Verification Harness
To verify ARGUS under real Linux kernel Landlock LSM, cgroups v2, and unprivileged user namespaces:
```bash
./scripts/test-linux.sh
```

## Interactive Voice & CLI Operation
```bash
# Start background daemon
argusd start

# Run comprehensive capability & subsystem probe
argusd doctor

# Test natural voice input & 4-tier neural TTS cascade
argusd voice "ARGUS, inspect system health and verify port 8080"
```
