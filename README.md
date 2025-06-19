# [Free AI Summarizer](https://github.com/gumob/AISummarizer)

A Chrome Extension that uses AI to summarize web articles. Extract and summarize content from any webpage with just a few clicks. <br/>
This extension does not require an API key or login access.

<div class="grid" markdown>

![Screenshot](https://raw.githubusercontent.com/gumob/AISummarizer/refs/heads/main/screenshot.png)

</div>

## Features

### Core Features

- Extract and save article automaticlly
- Multiple AI service support
- Article summarization
- Floating panel for quick access
- Dark/Light mode support
- Modern and polished design

### Article Management

- Extract articles from any webpage
- Re-extract articles as needed
- Copy article content to clipboard
- Save article content automatically
- URL-based extraction denylist

## Installation

### From Chrome Web Store

1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/free-ai-summarizer/...)
2. Click "Add to Chrome"
3. Click "Add Extension" in the confirmation dialog

### Development Version

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the downloaded folder

## For Developers

### Development Setup

1. Install required tools

   - [Node.js](https://nodejs.org/) (v20 or higher)
   - [pnpm](https://pnpm.io/) (v10 or higher)
   - [mise](https://mise.jdx.dev/) (Development environment manager)

2. Clone the repository

   ```bash
   git clone https://github.com/gumob/AISummarizer.git
   cd AISummarizer
   ```

3. Install dependencies

   ```bash
   pnpm install
   ```

4. Start development server

   ```bash
   pnpm dev
   ```

5. Open `chrome://extensions` in Chrome
6. Enable "Developer mode" in the top right
7. Click "Load unpacked"
8. Select the `dist/dev` folder in the downloaded directory

### Using Fastlane

```bash
bundle exec fastlane
```

### Project Structure

For detailed project structure, please refer to [DIRECTORYSTRUCTURE.md](./DIRECTORYSTRUCTURE.md).

### Technology Stack

For detailed technology stack information, please refer to [TECHNOLOGSTACK.md](./TECHNOLOGSTACK.md).

### Development Guidelines

1. Code Style

   - Use ESLint and Prettier
   - Run `pnpm lint` before committing
   - Run `pnpm format` before committing

2. Branch Strategy

   - `main`: Production branch
   - `develop`: Development branch
   - Feature development: `feature/feature-name`
   - Bug fixes: `fix/bug-description`

3. Pull Requests
   - Clear title and description
   - Reference related issue numbers
   - Self-review before submission

### Building

```bash
# Production build
pnpm build

# Development build
pnpm dev
```

## 🔒 Privacy

We respect your privacy. All data is stored locally on your device. See our [Privacy Policy](./PRIVACY.md) for details.

## 📝 License

This project is licensed under the [MIT License](./LICENSE).
