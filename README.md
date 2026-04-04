# 🪶 ELL: Easy Local Chat
## Private Intelligence on Your Hardware with no configurations.

[![Easy Local Chat](https://img.shields.io/badge/Status-Ready-success?style=for-the-badge&logo=ai)](https://github.com/SimpleSoftwareLTDA/easy-local-llm)
[![Electrobun](https://img.shields.io/badge/Built%20with-Electrobun-blue?style=for-the-badge)](https://electrobun.dev)

### **Run AI without cloud dependency or complex setup.**

Cloud AI monitors your data and requires recurring payments. Local AI typically requires manual dependency management and CLI expertise. 

ELL solves both. It is a cross-platform desktop application; it automates the installation of an optimized inference engine and the Gemma-4 model. 

---

## 🚀 Core Capabilities

### 🏗️ Zero-Config Setup
ELL detects your OS; it installs `llama-server` and fetches the **Gemma-4** model automatically. You do not need to manage Python environments, manual downloads or complex graphical interfaces.

### ⚡ Accelerated Performance
The app is pre-configured for high-speed inference. It uses **Flash Attention** and **Full GPU Offloading** (Vulkan/Metal/CUDA) by default. Use your local hardware to its maximum potential.

### 🛡️ Local-First Privacy
Conversations remain on your machine. There is no telemetry and no training data collection; the app works completely offline.

### 🧠 Deep Think Toggle
Switch between standard chat and reasoned response modes. ELL uses systemic prompts to force the model to reason before answering.

---

## 🛠️ Technical Specifications

### What is ELL?
A desktop application for Windows, macOS, and Linux that runs Large Language Models locally. It manages the server lifecycle, handles model storage, and provides a React-based chat interface.

### Is it free?
Yes. It is open-source; you pay $0 per token and $0 for subscriptions. 

### Hardware Requirements
8GB RAM and a dedicated GPU are recommended. The app runs on integrated graphics using llama.cpp optimizations.

### Model Architecture
ELL uses the **Gemma-4-E4B-it** model in GGUF format; it is optimized specifically for local reasoning and efficiency.

---

## 📥 Installation

### 1. Prerequisites
- **Windows**: [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/)
- **macOS**: [Homebrew](https://brew.sh/)
- **Linux**: [Nix](https://nixos.org/) or [Homebrew](https://brew.sh/)

### 2. Setup Commands
```bash
# Clone and enter the repository
git clone https://github.com/SimpleSoftwareLTDA/easy-local-llm.git
cd easy-local-llm

# Install dependencies and launch
bun install
bun dev
```

---

## 🤝 Community

We build local AI for everyone.
- **Star the repo** to support the project.
- **Open an issue** for technical feedback.
- **Join the Discord** (coming soon).

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for details.

---
<p align="center">
  <b>Owned by you. Run by you. Private to you.</b>
</p>
