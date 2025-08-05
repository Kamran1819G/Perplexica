# 🚀 Perplexica - An AI-powered search engine 🔎 <!-- omit in toc -->

> **Note:** This is a fork of the original [Perplexica project](https://github.com/ItzCrazyKns/Perplexica) by [@ItzCrazyKns](https://github.com/ItzCrazyKns). This fork is maintained separately with additional features, improvements, and independent installation using local build for complete independence from external registries.

---

## 🚀 How to Run Perplexica

There are **3 different ways** to run Perplexica depending on your needs:

### 🟢 **Option 1: Production Docker (Recommended for End Users)**

**Best for**: Regular users who want to run Perplexica as a service

**Setup**:
1. Install Docker Desktop from [here](https://www.docker.com/products/docker-desktop/)
2. Clone the repository:
   ```bash
   git clone https://github.com/Kamran1819G/Perplexica.git
   cd Perplexica
   ```
3. Copy the config file:
   ```bash
   cp sample.config.toml config.toml
   ```
4. Start Perplexica:
   ```bash
   docker compose up --build
   ```
5. Open [http://localhost:3000](http://localhost:3000)

**✅ Pros**: Easy setup, production-ready, isolated environment  
**❌ Cons**: Slower startup, no hot reloading

---

### 🛠️ **Option 2: Development Setup (Recommended for Contributors)**

**Best for**: Developers who want to contribute or modify the code

**Setup**:
1. Install Docker Desktop and Node.js/yarn
2. Clone the repository:
   ```bash
   git clone https://github.com/Kamran1819G/Perplexica.git
   cd Perplexica
   ```
3. Copy the config file:
   ```bash
   cp sample.config.toml config.toml
   ```
4. Start development environment:

   **Linux/macOS**:
   ```bash
   ./dev.sh
   ```

   **Windows**:
   ```cmd
   dev.bat
   ```

5. Open [http://localhost:3000](http://localhost:3000)

**✅ Pros**: Fast hot reloading, easy debugging, instant code changes  
**❌ Cons**: Requires Node.js/yarn installation

---

### 🔧 **Option 3: Manual Installation (Advanced Users)**

**Best for**: Advanced users who want full control over the setup

**Setup**:
1. Install Node.js, SearXNG, and configure it
2. Clone the repository:
   ```bash
   git clone https://github.com/Kamran1819G/Perplexica.git
   cd Perplexica
   ```
3. Copy and configure the config file:
   ```bash
   cp sample.config.toml config.toml
   # Edit config.toml with your settings
   ```
4. Install dependencies and start:
   ```bash
   yarn install
   yarn build
   yarn start
   ```

**✅ Pros**: Full control, no Docker dependency  
**❌ Cons**: Complex setup, manual dependency management

---

## 🎯 **Which Option Should You Choose?**

| Use Case | Recommended Option | Why? |
|----------|-------------------|------|
| **Just want to use Perplexica** | Option 1: Production Docker | Easiest setup, works out of the box |
| **Want to contribute code** | Option 2: Development Setup | Fast development with hot reloading |
| **Advanced user, no Docker** | Option 3: Manual Installation | Full control over the environment |
| **Testing/Evaluation** | Option 1: Production Docker | Quick to get started |
| **Custom modifications** | Option 2: Development Setup | Easy to modify and test changes |

---

[![Discord](https://dcbadge.vercel.app/api/server/26aArMy8tT?style=flat&compact=true)](https://discord.gg/26aArMy8tT)

![preview](.assets/perplexica-screenshot.png?)

## Table of Contents <!-- omit in toc -->

- [Overview](#overview)
- [Preview](#preview)
- [Features](#features)
- [Installation](#installation)
  - [Getting Started with Docker (Recommended)](#getting-started-with-docker-recommended)
  - [Non-Docker Installation](#non-docker-installation)
  - [Ollama Connection Errors](#ollama-connection-errors)
- [Using as a Search Engine](#using-as-a-search-engine)
- [Using Perplexica's API](#using-perplexicas-api)
- [Expose Perplexica to a network](#expose-perplexica-to-network)
- [One-Click Deployment](#one-click-deployment)

- [Upcoming Features](#upcoming-features)
- [Support Us](#support-us)
  - [Donations](#donations)
- [Contribution](#contribution)
- [Help and Support](#help-and-support)
- [Development vs Production Compose Files](#development-vs-production-compose-files)

## Overview

Perplexica is an open-source AI-powered searching tool or an AI-powered search engine that goes deep into the internet to find answers. Inspired by Perplexity AI, it's an open-source option that not just searches the web but understands your questions. It uses advanced machine learning algorithms like similarity searching and embeddings to refine results and provides clear answers with sources cited.

Using SearxNG to stay current and fully open source, Perplexica ensures you always get the most up-to-date information without compromising your privacy.

**This Fork:** This repository is a fork of the original [Perplexica project](https://github.com/ItzCrazyKns/Perplexica) with additional features, improvements, and an independent installation system using local build for complete independence from external registries. We maintain this fork separately to provide enhanced functionality while staying true to the original project's goals.

Want to know more about its architecture and how it works? You can read it [here](https://github.com/Kamran1819G/Perplexica/tree/master/docs/architecture/README.md).

## Preview

![video-preview](.assets/perplexica-preview.gif)

## Features

- **Local LLMs**: You can make use local LLMs such as Llama3 and Mixtral using Ollama.
- **Two Main Modes:**
  - **Copilot Mode:** (In development) Boosts search by generating different queries to find more relevant internet sources. Like normal search instead of just using the context by SearxNG, it visits the top matches and tries to find relevant sources to the user's query directly from the page.
  - **Normal Mode:** Processes your query and performs a web search.
- **Focus Modes:** Special modes to better answer specific types of questions. Perplexica currently has 6 focus modes:
  - **All Mode:** Searches the entire web to find the best results.
  - **Writing Assistant Mode:** Helpful for writing tasks that do not require searching the web.
  - **Academic Search Mode:** Finds articles and papers, ideal for academic research.
  - **YouTube Search Mode:** Finds YouTube videos based on the search query.
  - **Wolfram Alpha Search Mode:** Answers queries that need calculations or data analysis using Wolfram Alpha.
  - **Reddit Search Mode:** Searches Reddit for discussions and opinions related to the query.
- **Current Information:** Some search tools might give you outdated info because they use data from crawling bots and convert them into embeddings and store them in a index. Unlike them, Perplexica uses SearxNG, a metasearch engine to get the results and rerank and get the most relevant source out of it, ensuring you always get the latest information without the overhead of daily data updates.
- **API**: Integrate Perplexica into your existing applications and make use of its capibilities.

It has many more features like image and video search. Some of the planned features are mentioned in [upcoming features](#upcoming-features).

## Installation

There are **3 different installation methods** for Perplexica. Choose the one that best fits your needs:

### 🟢 **Option 1: Production Docker (Recommended for End Users)**

The easiest way to get started. Everything runs in Docker containers.

**Quick Start**:
```bash
git clone https://github.com/Kamran1819G/Perplexica.git
cd Perplexica
cp sample.config.toml config.toml
docker compose up --build
```

**✅ Best for**: Regular users, quick setup, production use  
**📖 Details**: See the **[Docker Setup Guide](docs/DOCKER.md)**

### 🛠️ **Option 2: Development Setup (Recommended for Contributors)**

Hybrid approach: SearXNG in Docker + Next.js on host for fast development.

**Quick Start**:
```bash
git clone https://github.com/Kamran1819G/Perplexica.git
cd Perplexica
cp sample.config.toml config.toml
./dev.sh  # Linux/macOS
# or
dev.bat   # Windows
```

**✅ Best for**: Developers, contributors, custom modifications  
**📖 Details**: See the **[Development Guide](DEVELOPMENT.md)**

### 🔧 **Option 3: Manual Installation (Advanced Users)**

Full manual setup without Docker dependencies.

**Setup**:
1. Install Node.js, SearXNG, and configure it
2. Clone the repository and copy config file
3. Run `yarn install && yarn build && yarn start`

**✅ Best for**: Advanced users, full control, no Docker dependency  
**📖 Details**: See the **[Installation Documentation](docs/installation)**

### 🎯 **Recommendation**

- **New users**: Start with Option 1 (Production Docker)
- **Contributors**: Use Option 2 (Development Setup)
- **Advanced users**: Choose Option 3 (Manual Installation)

See the [installation documentation](https://github.com/Kamran1819G/Perplexica/tree/master/docs/installation) for more information like updating, etc.

### Ollama Connection Errors

If you're encountering an Ollama connection error, it is likely due to the backend being unable to connect to Ollama's API. To fix this issue you can:

1. **Check your Ollama API URL:** Ensure that the API URL is correctly set in the settings menu.
2. **Update API URL Based on OS:**

   - **Windows:** Use `http://host.docker.internal:11434`
   - **Mac:** Use `http://host.docker.internal:11434`
   - **Linux:** Use `http://<private_ip_of_host>:11434`

   Adjust the port number if you're using a different one.

3. **Linux Users - Expose Ollama to Network:**

   - Inside `/etc/systemd/system/ollama.service`, you need to add `Environment="OLLAMA_HOST=0.0.0.0"`. Then restart Ollama by `systemctl restart ollama`. For more information see [Ollama docs](https://github.com/ollama/ollama/blob/main/docs/faq.md#setting-environment-variables-on-linux)

   - Ensure that the port (default is 11434) is not blocked by your firewall.

## Using as a Search Engine

If you wish to use Perplexica as an alternative to traditional search engines like Google or Bing, or if you want to add a shortcut for quick access from your browser's search bar, follow these steps:

1. Open your browser's settings.
2. Navigate to the 'Search Engines' section.
3. Add a new site search with the following URL: `http://localhost:3000/?q=%s`. Replace `localhost` with your IP address or domain name, and `3000` with the port number if Perplexica is not hosted locally.
4. Click the add button. Now, you can use Perplexica directly from your browser's search bar.

## Using Perplexica's API

Perplexica also provides an API for developers looking to integrate its powerful search engine into their own applications. You can run searches, use multiple models and get answers to your queries.

For more details, check out the full documentation [here](https://github.com/Kamran1819G/Perplexica/tree/master/docs/API/SEARCH.md).

## Expose Perplexica to network

Perplexica runs on Next.js and handles all API requests. It works right away on the same network and stays accessible even with port forwarding.

## One-Click Deployment

> **⚠️ Note:** One-click deployment services may not work with the current local build setup. These services typically expect pre-built Docker images from registries, but this project uses local builds for complete independence.

### Alternative Deployment Options

#### Option 1: Manual Deployment (Recommended)
Use the provided Docker Compose file for reliable deployment:

```bash
# Production deployment
NODE_ENV=production docker-compose up --build -d
```

#### Option 2: Cloud Platform Deployment
For cloud platforms that support local builds:

- **Railway**: Connect your GitHub repo and use `docker-compose.deploy.yaml`
- **Render**: Use the deployment compose file with build context
- **DigitalOcean App Platform**: Supports Docker Compose with local builds

#### Option 3: Kubernetes Deployment
Use the provided Kubernetes template:

```bash
# Apply the deployment template
kubectl apply -f deploy-template.yaml
```

📖 **For comprehensive deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT.md)**

## Upcoming Features

- [x] Add settings page
- [x] Adding support for local LLMs
- [x] History Saving features
- [x] Introducing various Focus Modes
- [x] Adding API support
- [x] Adding Discover
- [ ] Finalizing Copilot Mode



## Contribution

Perplexica is built on the idea that AI and large language models should be easy for everyone to use. If you find bugs or have ideas, please share them in via GitHub Issues. For more information on contributing to Perplexica you can read the [CONTRIBUTING.md](CONTRIBUTING.md) file to learn more about Perplexica and how you can contribute to it.

### 🌍 Language Contributions

We welcome contributions to add new languages or improve existing translations! Perplexica currently supports **12 languages** including RTL support for Arabic.

- **Want to add a new language?** Check out our [Language Contribution Guide](docs/LANGUAGE_CONTRIBUTION.md)
- **Current languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi
- **Need help?** Join our [Discord community](https://discord.gg/EFwsmQDgAu) for translation support

Your contributions help make Perplexica accessible to users worldwide! 🌍

## Help and Support

If you have any questions or feedback, please feel free to reach out to us. You can create an issue on GitHub or join our Discord server. There, you can connect with other users, share your experiences and reviews, and receive more personalized help. [Click here](https://discord.gg/EFwsmQDgAu) to join the Discord server. To discuss matters outside of regular support, feel free to contact me on Discord at `Kamran1819G`.

Thank you for exploring Perplexica, the AI-powered search engine designed to enhance your search experience. We are constantly working to improve Perplexica and expand its capabilities. We value your feedback and contributions which help us make Perplexica even better. Don't forget to check back for updates and new features!



## 📚 Docker Documentation

For comprehensive Docker setup instructions, including:
- **Development environment** with live updates
- **Production deployment** 
- **Troubleshooting** common issues
- **Performance optimization** tips
- **External services** integration (Ollama, LM Studio)

📖 **Read the complete [Docker Setup Guide](docs/DOCKER.md)**
