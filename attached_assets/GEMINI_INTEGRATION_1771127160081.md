# Gemini API Integration Strategy

Infinity Heroes leverages the Gemini API suite through the `@google/genai` SDK.

## 🤖 Model Selection
| Task | Model | Reasoning |
| :--- | :--- | :--- |
| **Narrative Generation** | `gemini-3-pro-preview` | Superior reasoning for logic-heavy Mad Libs and long-form hypnotic sleep prose. |
| **Asset Generation** | `gemini-2.5-flash-image` | High-speed generation of character avatars and scene illustrations. |
| **Narration (TTS)** | `gemini-2.5-flash-preview-tts` | Native multimodal audio output with high emotional resonance. |

## 📝 Prompting Strategy
Prompts are structured using **Instructional Constraints** rather than just prose:
- **Sleep Hypnosis Rules**: Instructions to use sensory "anchors" (texture, scent) and zero-conflict narratives.
- **Structure**: Enforced JSON schema using the `responseSchema` config to ensure 100% parse success.
- **Pacing**: Variable length instructions based on `storyLength` (Short, Medium, Long, Eternal).

## 🔊 Text-to-Speech (TTS) Implementation
- **PCM Handling**: The API returns a Base64 string of raw 16-bit PCM data. 
- **Decoding**: We avoid `decodeAudioData` (which expects file headers like .wav) and instead manually map bytes to a Float32 array for the Web Audio API.
- **Voice Selection**: Dynamic mapping of user-friendly names (e.g., "Zephyr") to prebuilt voice IDs (e.g., `Zephyr`).
