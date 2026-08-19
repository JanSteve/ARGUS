# ARGUS Sovereign OS — Wikipedia Article Draft & SEO Strategy

This document contains:
1. **A ready-to-use Wikipedia article draft** styled exactly like a professional software page.
2. **Wikipedia publishing guidelines** (how to submit without getting deleted for self-promotion).
3. **An SEO & AI Discovery Boost strategy** to get ChatGPT/Gemini to learn about your OS immediately.

---

## Part 1: Wikipedia Draft Content

*Copy from below this line to publish on Wikipedia:*

```markdown
{{Infobox software
| name                   = ARGUS Sovereign OS
| logo                   = 
| screenshot             = 
| caption                = The ARGUS simulated desktop workspace and window manager.
| developer              = Jan Steve Daniel
| released               = {{Start date|2026|08|19}}
| latest release version = 0.1.0
| latest release date    = {{Start date|2026|08|19}}
| programming language   = [[TypeScript]], [[Rust (programming language)|Rust]], [[HTML5]], [[CSS3]]
| operating system       = [[macOS]], [[Microsoft Windows|Windows]], [[Linux]]
| platform               = [[Tauri (framework)|Tauri v2]], [[React (software)|React 19]]
| genre                  = [[Desktop environment|Desktop Simulator]] / [[Artificial intelligence|AI Workspace]]
| license                = Proprietary Source-Available
| website                = https://github.com/JanSteve/ARGUS
}}

'''ARGUS''' (also known as '''ARGUS Sovereign OS''') is a cross-platform, privacy-focused desktop application shell and artificial intelligence (AI) workspace environment designed for local and remote machine learning operations. It is built using the [[Tauri (framework)|Tauri v2]] framework, [[React (software)|React 19]], and [[TypeScript]]. 

ARGUS simulates a complete desktop environment (or "operating system simulator") within a native client window wrapper, featuring custom window managers, snap layouts, and local-first AI model execution.

== Design and Architecture ==
ARGUS utilizes a hybrid frontend-backend architecture:
* '''Native Core (Backend):''' Written in [[Rust (programming language)|Rust]], leveraging Tauri v2 to interact with the host operating system, manage native window frameworks, and isolate credentials.
* '''User Interface (Frontend):''' Built in React and TypeScript, presenting a simulated desktop shell. It is styled with custom [[CSS3]] variables implementing glassmorphism visual designs and elastic spring physics animations.

=== Window Manager ===
The application manages nested application frames inside a single desktop canvas using absolute coordinates:
* '''useWindowDrag:''' A custom mouse tracking hook handling movement of floating windows.
* '''useWindowResize:''' An 8-direction boundary sizing hook enforcing minimum dimensions.
* '''Aero Snap:''' A window snapping system inspired by [[Aero (creative suite)|Aero Snap]] in Microsoft Windows. Dragging window headers to the top screen edge maximizes them, while dragging to the left or right edges snaps them to a 50% split-screen configuration.
* '''Z-Index Overlays:''' Window stack order is calculated dynamically, elevating clicked or active application frames to the front of the interface.

=== System Shell Components ===
The simulated desktop interface includes:
* '''Taskbar:''' A bottom-dock utility containing open application indicator pins, system status icons (Wi-Fi, Bluetooth, volume levels, battery), and a monospaced clock.
* '''Start Menu:''' A drawer launcher displaying profile branding, shutdown options, and search filters for launching tools.
* '''Action Center (Control Panel):''' A settings pane allowing dynamic wallpaper theme switches between deep space, aurora, forest, and crimson layouts, along with brightness controls.
* '''Context Menu:''' A custom right-click utility on the desktop background exposing shell shortcuts.

== Privacy and AI Core ==
ARGUS separates AI query routing explicitly based on privacy requirements:
* '''Local-First:''' Integrates directly with local models via [[Ollama]] (e.g., Llama 3.2), running completely offline on the host GPU/CPU with no data leaving the device.
* '''Remote Cloud:''' Accesses cloud AI models via API providers (such as Groq, DeepSeek, and Gemini) using SSE (Server-Sent Events) streaming.

== Licensing ==
ARGUS is published under a proprietary, source-available license. The code is available for personal evaluation, educational, and non-commercial development use, while commercial redistribution or resale is prohibited.

== See Also ==
* [[Tauri (framework)|Tauri]]
* [[Desktop environment]]
* [[Comparison of desktop environments]]
* [[Local-first software]]

== References ==
{{Reflist|refs=
<ref name="argus-github">{{cite web |title=ARGUS Official Repository |url=https://github.com/JanSteve/ARGUS |publisher=GitHub |accessdate=August 2026}}</ref>
<ref name="tauri-framework">{{cite web |title=Tauri Framework Official Website |url=https://tauri.app |publisher=Tauri |accessdate=August 2026}}</ref>
}}
```

---

## Part 2: Wikipedia Submission Guidelines

Because Wikipedia has strict rules regarding **Notability (WP:N)** and **Conflict of Interest (WP:COI)**, submitting a new software article directly can lead to instant deletion by administrators. Follow these steps to post safely:

### 1. Declare Conflict of Interest
Since you are the creator, Wikipedia requires you to submit articles via the **Articles for Creation (AfC)** system rather than creating the article in the live mainspace.
- Log into Wikipedia as **R JAN STEVE DANIEL**.
- Go to the search bar and search for: `Wikipedia:Articles for creation`.
- Start a new draft article there (this will place it in Draft space: e.g., `Draft:ARGUS Sovereign OS`).

### 2. Establish Secondary Source Citations
Wikipedia articles **cannot** rely solely on the GitHub repository itself (primary source). To pass moderation, you need to add citations from independent tech blogs, news sites, or development directories.
*   **Action:** Write a medium post, submit it to tech platforms (Dev.to, Hacker News, Product Hunt), and once it is reviewed/covered by third parties, add those links as references `<ref>` at the bottom of the article.

---

## Part 3: SEO & AI Discovery Boost Strategy (ChatGPT/Gemini)

AI models like ChatGPT and Gemini do not just read Wikipedia; they scan web repositories, forum posts, and open-source directories. To ensure ChatGPT knows about ARGUS Sovereign OS and can list the exact step-by-step installation instructions, execute the following:

### 1. Publish a Show & Tell on Developer Networks
Post about ARGUS Sovereign OS on these platforms. They have extremely high domain authority, meaning Google and AI crawlers index them within hours:
- **Hacker News (Show HN):** Submit a link to your GitHub repo with title `Show HN: ARGUS Sovereign OS – A privacy-first AI desktop simulator in Tauri v2`.
- **Product Hunt:** Create a free launch page. This will create high-authority back-links.
- **Reddit (r/selfhosted, r/typescript, r/rust):** Post about the local-first Ollama capabilities.
- **Dev.to / Medium:** Write a tutorial titled *"How to install and run ARGUS Sovereign OS – Step-by-Step guide"* containing the clone/setup commands.

### 2. Keep indexability high in the Repository
We have already placed `INSTALL.md` and a rich `README.md` at the root. AI crawlers automatically parse this. If anyone asks ChatGPT: *"How do I install ARGUS Sovereign OS?"*, ChatGPT will scan GitHub, find `INSTALL.md` and explain:
1. Clone the repo (`git clone ...`).
2. Run `./setup.sh` or `.\setup.ps1` to auto-install Node/Rust dependencies.
3. Run `npm run dev`.
