# 🚀 Perplexica - An AI-powered search engine 🔎 <!-- omit in toc -->

---

## 🟢 Quick Start (For Beginners)

Follow these simple steps to run Perplexica on your computer. No coding experience needed!

### 1. Install Docker
- Download and install Docker Desktop from [here](https://www.docker.com/products/docker-desktop/).
- Follow the instructions for your operating system (Windows, Mac, or Linux).

### 2. Download Perplexica
- Open a terminal (Command Prompt, PowerShell, or Terminal app).
- Run this command to download Perplexica:
  ```bash
  git clone https://github.com/Kamran1819G/Perplexica.git
  ```
- Go into the project folder:
  ```bash
  cd Perplexica
  ```

### 3. Copy the Example Config
- Find the file named `sample.config.toml` in the project folder.
- Make a copy and rename it to `config.toml`.
- (Optional) You can edit `config.toml` later to change settings, but the default works for most users.

### 4. Start Perplexica
- In the terminal, run:
  ```bash
  docker-compose up --build
  ```
- The first time, this may take a few minutes.

### 5. Open the App
- Once you see messages that Perplexica is running, open your web browser.
- Go to [http://localhost:3000](http://localhost:3000)

That's it! 🎉

### 6. Stop Perplexica
- To stop the app, go back to your terminal and press `Ctrl+C`.
- To remove the running containers, run:
  ```bash
  docker-compose down
  ```

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

There are mainly 2 ways of installing Perplexica - With Docker, Without Docker. Using Docker is highly recommended.

### Getting Started with Docker (Recommended)

1. Ensure Docker is installed and running on your system.
2. Clone the Perplexica repository:

   ```bash
   git clone https://github.com/Kamran1819G/Perplexica.git
   ```

3. After cloning, navigate to the directory containing the project files.

4. Rename the `sample.config.toml` file to `config.toml` and fill in the required fields as described below.

5. **Local Build (Recommended for Development):**
   - The `docker-compose.yaml` is now set up to always build the app from your local code and Dockerfile.
   - Your source code, config, and assets are mounted as volumes into the container, so changes are reflected live (with a container restart or hot reload, depending on your setup).
   - To start the stack:
     ```bash
     docker-compose up --build
     ```
   - To rebuild after changing dependencies:
     ```bash
     docker-compose up --build
     ```
   - To stop:
     ```bash
     docker-compose down
     ```
   - You do **not** need to pull or push any Docker images for development.

6. Wait a few minutes for the setup to complete. You can access Perplexica at http://localhost:3000 in your web browser.

**Note:** After the containers are built, you can start Perplexica directly from Docker without having to open a terminal.

#### For Contributors
- All development should use the local build workflow above.
- Your changes will be reflected live in the running container.
- If you add dependencies, rebuild with `docker-compose up --build`.
- The GitHub Actions workflow for Docker images is now only for official releases and is not required for local development.

### Non-Docker Installation

1. Install SearXNG and allow `JSON` format in the SearXNG settings.
2. Clone the repository and rename the `sample.config.toml` file to `config.toml` in the root directory. Ensure you complete all required fields in this file.
3. After populating the configuration run `npm i`.
4. Install the dependencies and then execute `npm run build`.
5. Finally, start the app by running `npm run start`

**Note**: Using Docker is recommended as it simplifies the setup process, especially for managing environment variables and dependencies.

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

[![Deploy to Sealos](https://raw.githubusercontent.com/labring-actions/templates/main/Deploy-on-Sealos.svg)](https://usw.sealos.io/?openapp=system-template%3FtemplateName%3Dperplexica)
[![Deploy to RepoCloud](https://d16t0pc4846x52.cloudfront.net/deploylobe.svg)](https://repocloud.io/details/?app_id=267)
[![Run on ClawCloud](https://raw.githubusercontent.com/ClawCloud/Run-Template/refs/heads/main/Run-on-ClawCloud.svg)](https://template.run.claw.cloud/?referralCode=U11MRQ8U9RM4&openapp=system-fastdeploy%3FtemplateName%3Dperplexica)

## Upcoming Features

- [x] Add settings page
- [x] Adding support for local LLMs
- [x] History Saving features
- [x] Introducing various Focus Modes
- [x] Adding API support
- [x] Adding Discover
- [ ] Finalizing Copilot Mode

## Support Us

If you find Perplexica useful, consider giving us a star on GitHub. This helps more people discover Perplexica and supports the development of new features. Your support is greatly appreciated.

### Donations

We also accept donations to help sustain our project. If you would like to contribute, you can use the following options to donate. Thank you for your support!

| Ethereum                                              |
| ----------------------------------------------------- |
| Address: `0xB025a84b2F269570Eb8D4b05DEdaA41D8525B6DD` |

## Contribution

Perplexica is built on the idea that AI and large language models should be easy for everyone to use. If you find bugs or have ideas, please share them in via GitHub Issues. For more information on contributing to Perplexica you can read the [CONTRIBUTING.md](CONTRIBUTING.md) file to learn more about Perplexica and how you can contribute to it.

## Help and Support

If you have any questions or feedback, please feel free to reach out to us. You can create an issue on GitHub or join our Discord server. There, you can connect with other users, share your experiences and reviews, and receive more personalized help. [Click here](https://discord.gg/EFwsmQDgAu) to join the Discord server. To discuss matters outside of regular support, feel free to contact me on Discord at `Kamran1819G`.

Thank you for exploring Perplexica, the AI-powered search engine designed to enhance your search experience. We are constantly working to improve Perplexica and expand its capabilities. We value your feedback and contributions which help us make Perplexica even better. Don't forget to check back for updates and new features!

## Development vs Production Compose Files

- `docker-compose.dev.yaml`: For development. Mounts your code and runs the dev server for hot reload. Use this for active development.
- `docker-compose.prod.yaml`: For production. No code mounting, runs the optimized production build. Use this for deployment.
- `docker-compose.yaml`: The base file, extended by the above for each environment.

### Development Usage
```bash
docker-compose -f docker-compose.dev.yaml up --build
```
- Edit your code locally and see changes live (hot reload).
- Stop with:
```bash
docker-compose -f docker-compose.dev.yaml down
```

### Production Usage
```bash
docker-compose -f docker-compose.prod.yaml up --build
```
- Runs the optimized production build, no code mounting.
- Stop with:
```bash
docker-compose -f docker-compose.prod.yaml down
```
