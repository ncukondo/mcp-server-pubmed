#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createSearchHandler } from './handlers/search.js';
import { createFetchSummaryHandler } from './handlers/fetch-summary.js';
import { createGetFullTextHandler } from './handlers/get-fulltext.js';

const server = new Server(
  {
    name: 'mcp-server-pubmed',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        parsed[key] = value;
        i++; // Skip the value in the next iteration
      }
    }
  }
  
  return parsed;
}

const cmdArgs = parseArgs();

// Read configuration from environment variables and command line arguments
const email = cmdArgs.email || process.env.PUBMED_EMAIL;
const apiKey = cmdArgs['api-key'] || process.env.PUBMED_API_KEY;
const cacheDir = cmdArgs['cache-dir'] || process.env.PUBMED_CACHE_DIR;
const cacheTTL = cmdArgs['cache-ttl'] || process.env.PUBMED_CACHE_TTL;

if (!email) {
  console.error(`ERROR: PUBMED_EMAIL environment variable or --email argument is required
  
  Configuration options:
    Environment variables:
      PUBMED_EMAIL (required): Your email address for PubMed API requests
      PUBMED_API_KEY (optional): Your PubMed API key for higher rate limits
      PUBMED_CACHE_DIR (optional): Directory path for caching API responses
      PUBMED_CACHE_TTL (optional): Cache TTL in seconds (default: 86400)
    
    Command line arguments:
      --email <email>: Your email address for PubMed API requests
      --api-key <key>: Your PubMed API key for higher rate limits
      --cache-dir <path>: Directory path for caching API responses
      --cache-ttl <seconds>: Cache TTL in seconds (default: 86400)`);
  process.exit(1);
}

const pubmedOptions = {
  email,
  ...(apiKey && { apiKey }),
  ...(cacheDir && { cacheDir }),
  ...(cacheTTL && { cacheTTL: parseInt(cacheTTL) })
};

const searchHandler = createSearchHandler(pubmedOptions);
const fetchSummaryHandler = createFetchSummaryHandler(pubmedOptions);
const getFullTextHandler = createGetFullTextHandler(pubmedOptions);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_pubmed',
        description: 'Search PubMed for scientific articles. ',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for PubMed',
            },
            searchOptions: {
              type: 'object',
              description: 'Optional search parameters',
              properties: {
                retMax: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                },
                retStart: {
                  type: 'number',
                  description: 'Starting index for results',
                },
                sort: {
                  type: 'string',
                  enum: ['relevance', 'pub_date', 'author', 'journal'],
                  description: 'Sort order for results',
                },
                dateFrom: {
                  type: 'string',
                  description: 'Start date filter (YYYY/MM/DD format)',
                },
                dateTo: {
                  type: 'string',
                  description: 'End date filter (YYYY/MM/DD format)',
                },
              },
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch_summary',
        description: 'Fetch detailed article information from PubMed using PMIDs. ',
        inputSchema: {
          type: 'object',
          properties: {
            pmids: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of PubMed IDs (PMIDs) to fetch',
            },
          },
          required: ['pmids'],
        },
      },
      {
        name: 'get_fulltext',
        description: 'Get full text content of PubMed articles using PMIDs.',
        inputSchema: {
          type: 'object',
          properties: {
            pmids: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of PubMed IDs (PMIDs) to get full text for',
            },
          },
          required: ['pmids'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'search_pubmed') {
    const { query, searchOptions } = request.params.arguments as {
      query: string;
      searchOptions?: {
        retMax?: number;
        retStart?: number;
        sort?: 'relevance' | 'pub_date' | 'author' | 'journal';
        dateFrom?: string;
        dateTo?: string;
      };
    };

    try {
      const results = await searchHandler.search(query, searchOptions);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching PubMed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  if (request.params.name === 'fetch_summary') {
    const { pmids } = request.params.arguments as {
      pmids: string[];
    };

    try {
      const results = await fetchSummaryHandler.fetchSummary(pmids);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching article summaries: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  if (request.params.name === 'get_fulltext') {
    const { pmids } = request.params.arguments as {
      pmids: string[];
    };

    try {
      const results = await getFullTextHandler.getFullText(pmids);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching full text: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const configMessage = `
  MCP PubMed Server 
    Configuration:
      Email: ${email}
      API Key: ${apiKey ? 'Configured' : 'Not configured (using default rate limits)'}
      Cache Directory: ${cacheDir || 'Not configured (caching disabled)'}
      Cache TTL: ${cacheTTL ? `${cacheTTL} seconds` : '86400 seconds (default)'}
  `;
  console.log(configMessage);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('MCP PubMed server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

await main();