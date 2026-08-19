# ARGUS — Project Overview

## What ARGUS Is

ARGUS is a local-first, privacy-focused AI operating environment. It runs as a native desktop application on macOS, Linux, and Windows, providing a unified interface for interacting with AI models — both local and remote.

ARGUS is not a cloud service. It is software that runs on the user's machine, keeps data under user control, and makes the distinction between local and remote AI processing explicit and transparent.

## Core Objective

Provide a single, well-designed desktop environment where users can:

1. Chat with AI models (local or remote)
2. Choose and switch between AI providers
3. Understand exactly where their data is going
4. Run AI inference entirely locally when desired

## Problem It Solves

Existing AI interfaces are either:
- **Cloud-only** (ChatGPT, Claude) — users have no control over where their data goes
- **CLI-only** (ollama, llama.cpp) — powerful but not accessible to non-developers
- **Fragmented** — users must juggle multiple tools for different providers

ARGUS provides a unified desktop application that makes local AI accessible while allowing remote providers when the user chooses.

## Target Users

- **Primary:** Developers and technical users who want local AI capabilities with a clean UI
- **Secondary:** Privacy-conscious users who want to run AI without sending data to third parties
- **Tertiary:** Researchers and students who need to experiment with multiple AI providers

## Main Use Cases

1. **Local AI Chat** — Run Ollama models locally, chat through a polished interface
2. **Remote AI Chat** — Connect to Groq, OpenAI, or other APIs when local inference isn't sufficient
3. **Provider Switching** — Switch between local and remote providers within the same session
4. **Privacy-Aware AI** — See clearly whether a request will stay local or go to the cloud

## Non-Goals (v1.0)

- ARGUS is not an AI agent framework
- ARGUS is not a model training tool
- ARGUS is not a vector database or RAG system
- ARGUS does not aim to replace IDEs or code editors
- ARGUS does not automatically download models without user consent
- ARGUS does not provide voice input/output in v1.0 (planned for later)
- ARGUS does not include document analysis in v1.0 (planned for later)
- ARGUS does not include a plugin/extension system in v1.0 (planned for later)

## Long-Term Vision

ARGUS will eventually become a comprehensive AI operating environment with:
- Voice input/output (local ASR/TTS)
- Document and file analysis
- Persistent, user-controlled memory
- Multi-provider model management
- Plugin/extension ecosystem
- Cross-platform packaging with zero-configuration setup

These capabilities will be added incrementally in future milestones, not in the initial release.
