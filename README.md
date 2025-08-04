# MCP Server PubMed

MCP server for searching PubMed scientific articles using NCBI E-utilities API.

## Features

- Search PubMed articles with flexible query parameters
- Fetch detailed article information including abstracts, authors, and DOI
- Built-in rate limiting (3 req/s without API key, 10 req/s with API key)
- Caching support for improved performance
- TypeScript implementation with full type safety

## Installation

### Via npx (Recommended)

No installation required! Use directly:

```bash
npx @ncukondo/mcp-server-pubmed --email your@email.com
```

### Global Installation

```bash
npm install -g @ncukondo/mcp-server-pubmed
```

### Local Installation

```bash
npm install @ncukondo/mcp-server-pubmed
```

## Usage with Claude Code

### 1. Start the MCP Server

```bash
# Basic usage (email required)
npx @ncukondo/mcp-server-pubmed --email your@email.com

# With caching
npx @ncukondo/mcp-server-pubmed --email your@email.com --cache-dir ./cache --cache-ttl 3600

# With environment variables
PUBMED_EMAIL=your-email@example.com npx @ncukondo/mcp-server-pubmed
```

### 2. Connect with Claude Code

Start Claude Code and connect to the MCP server:

```bash
claude code --mcp @ncukondo/mcp-server-pubmed
```

Or set via environment variable:

```bash
export MCP_SERVERS="@ncukondo/mcp-server-pubmed"
claude code
```

## Usage with Claude Desktop

### 1. Edit Configuration File

Edit Claude Desktop's configuration file (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pubmed": {
      "command": "npx",
      "args": ["@ncukondo/mcp-server-pubmed"],
      "env": {
        "PUBMED_EMAIL": "your-email@example.com"
      }
    }
  }
}
```

### 2. Configuration with Caching

```json
{
  "mcpServers": {
    "pubmed": {
      "command": "npx",
      "args": [
        "@ncukondo/mcp-server-pubmed",
        "--cache-dir",
        "./cache",
        "--cache-ttl",
        "3600"
      ],
      "env": {
        "PUBMED_EMAIL": "your-email@example.com",
        "PUBMED_API_KEY": "your-api-key"
      }
    }
  }
}
```

### 3. Configuration for Globally Installed Version

If you've installed globally:

```bash
npm install -g @ncukondo/mcp-server-pubmed
```

```json
{
  "mcpServers": {
    "pubmed": {
      "command": "mcp-server-pubmed",
      "args": ["--cache-dir", "./pubmed-cache"],
      "env": {
        "PUBMED_EMAIL": "your-email@example.com"
      }
    }
  }
}
```

## Direct JSON Configuration

### Minimal Configuration

```json
{
  "mcpServers": {
    "pubmed": {
      "command": "node",
      "args": ["/path/to/mcp-server-pubmed/dist/index.js"]
    }
  }
}
```

### Full Configuration

```json
{
  "mcpServers": {
    "pubmed": {
      "command": "node",
      "args": [
        "/path/to/mcp-server-pubmed/dist/index.js",
        "--cache-dir",
        "/path/to/cache",
        "--cache-ttl",
        "7200"
      ],
      "env": {
        "PUBMED_EMAIL": "researcher@university.edu",
        "PUBMED_API_KEY": "your-ncbi-api-key"
      },
      "cwd": "/path/to/working/directory"
    }
  }
}
```

## Requirements

### System Requirements
- **Node.js**: >= 18
- **npm**: Latest version recommended
- **Memory**: Minimum 512MB, recommended 1GB+
- **Network**: Access to NCBI E-utilities API

### Environment Variables (Recommended)

- `PUBMED_EMAIL`: Email address recommended by NCBI
- `PUBMED_API_KEY`: API key for higher rate limits (optional)

## How to Use

### Available Tools

#### search

Search PubMed articles with query parameters.

**Parameters:**
- `query` (required): Search query string
- `max_results`: Maximum number of results (default: 20)
- `sort`: Sort order for results

**Example usage:**
```
Search for "COVID-19 vaccine efficacy"
```

#### fetch_summary
Fetch detailed summary for specific PubMed articles.

**Parameters:**
- `pmids` (required): Array of PubMed IDs to fetch

**Example usage:**
```
Get detailed information for PMID 12345678
```

#### get_full_text
Get full text information for PubMed articles (when available).

**Parameters:**
- `pmids` (required): Array of PubMed IDs

## MCP Server Development

### Development Environment Setup

```bash
git clone <repository-url>
cd mcp-server-pubmed
npm install
```

### Development Commands

```bash
# Build
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test

# Test UI
npm run test:ui

# Test (CI)
npm run test:run
```

### Directory Structure

```
src/
├── index.ts          # Main server file
├── pubmed-api.ts     # PubMed API implementation
├── handlers/         # Request handlers
└── __tests__/        # Test files
```

### Testing During Development

```bash
# Start server locally
npm run build
node dist/index.js

# Test with MCP client in another terminal
# Or use Claude Desktop config with "command": "node", "args": ["/absolute/path/to/dist/index.js"]
```

### Debugging

```bash
# Start with debug mode
DEBUG=* node dist/index.js

# Debug with caching
DEBUG=* node dist/index.js --cache-dir ./debug-cache --cache-ttl 300
```

### Packaging

```bash
# Build for distribution
npm run prepublishOnly

# Verify package
npm pack
```

## Rate Limits

- Without API key: 3 requests per second
- With API key: 10 requests per second

NCBI recommends including an email address in requests for better support.

## Technical Specifications

- **Runtime**: Node.js (>=18)
- **Language**: TypeScript with ES2022 target
- **Module System**: ESM
- **Build Tool**: Vite
- **Testing**: Vitest
- **MCP SDK**: @modelcontextprotocol/sdk v1.17.1

## License

ISC