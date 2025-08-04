import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createSearchHandler } from '../handlers/search.js';
import { createFetchSummaryHandler } from '../handlers/fetch-summary.js';
import { createGetFullTextHandler } from '../handlers/get-fulltext.js';

// Mock the handlers
vi.mock('../handlers/search.js', () => ({
  createSearchHandler: vi.fn((pubmedOptions) => ({
    search: vi.fn(),
  })),
}));

vi.mock('../handlers/fetch-summary.js', () => ({
  createFetchSummaryHandler: vi.fn((pubmedOptions) => ({
    fetchSummary: vi.fn(),
  })),
}));

vi.mock('../handlers/get-fulltext.js', () => ({
  createGetFullTextHandler: vi.fn((pubmedOptions) => ({
    getFullText: vi.fn(),
  })),
}));

describe('MCP PubMed Server', () => {
  let server: Server;
  let mockSearchHandler: { search: ReturnType<typeof vi.fn> };
  let mockFetchSummaryHandler: { fetchSummary: ReturnType<typeof vi.fn> };
  let mockGetFullTextHandler: { getFullText: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock handlers
    mockSearchHandler = {
      search: vi.fn(),
    };
    
    mockFetchSummaryHandler = {
      fetchSummary: vi.fn(),
    };
    
    mockGetFullTextHandler = {
      getFullText: vi.fn(),
    };
    
    (createSearchHandler as any).mockReturnValue(mockSearchHandler);
    (createFetchSummaryHandler as any).mockReturnValue(mockFetchSummaryHandler);
    (createGetFullTextHandler as any).mockReturnValue(mockGetFullTextHandler);

    server = new Server(
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

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_pubmed',
            description: 'Search PubMed for scientific articles',
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
          const results = await mockSearchHandler.search(query, searchOptions);
          
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

      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  });

  describe('ListTools', () => {
    it('should return available tools', async () => {
      const request = { method: 'tools/list', params: {} };
      const handler = server['_requestHandlers'].get('tools/list');
      
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(response).toEqual({
        tools: [
          {
            name: 'search_pubmed',
            description: 'Search PubMed for scientific articles',
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
            description: 'Fetch detailed article information from PubMed using PMIDs',
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
            description: 'Get full text content of PubMed articles using PMIDs',
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
      });
    });
  });

  describe('CallTool', () => {
    it('should handle search_pubmed tool call with query only', async () => {
      const mockResults = [
        { pmid: '12345', title: 'COVID-19 Research Article', pubDate: '2023/01/15' },
        { pmid: '67890', title: 'Another COVID-19 Study', pubDate: '2023/02/20' },
      ];
      
      mockSearchHandler.search.mockResolvedValue(mockResults);

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_pubmed',
          arguments: {
            query: 'covid-19',
          },
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(mockSearchHandler.search).toHaveBeenCalledWith('covid-19', undefined);
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResults, null, 2),
          },
        ],
      });
    });

    it('should handle search_pubmed tool call with searchOptions', async () => {
      const mockResults = [
        { pmid: '11111', title: 'Machine Learning in Medicine', pubDate: '2023/03/10' },
      ];
      
      mockSearchHandler.search.mockResolvedValue(mockResults);

      const searchOptions = {
        retMax: 5,
        sort: 'pub_date' as const,
        dateFrom: '2023/01/01',
        dateTo: '2023/12/31',
      };

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_pubmed',
          arguments: {
            query: 'machine learning',
            searchOptions,
          },
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(mockSearchHandler.search).toHaveBeenCalledWith('machine learning', searchOptions);
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResults, null, 2),
          },
        ],
      });
    });

    it('should handle search errors gracefully', async () => {
      const errorMessage = 'PubMed API error';
      mockSearchHandler.search.mockRejectedValue(new Error(errorMessage));

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_pubmed',
          arguments: {
            query: 'invalid query',
          },
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: `Error searching PubMed: ${errorMessage}`,
          },
        ],
      });
    });

    it('should handle unknown errors gracefully', async () => {
      mockSearchHandler.search.mockRejectedValue('Unknown error');

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_pubmed',
          arguments: {
            query: 'test query',
          },
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error searching PubMed: Unknown error',
          },
        ],
      });
    });

    it('should handle get_fulltext tool call', async () => {
      const mockResults = [
        { pmid: '12345', fullText: '# Test Article\n\n## Abstract\n\nTest abstract content.' },
        { pmid: '67890', fullText: null },
      ];
      
      mockGetFullTextHandler.getFullText.mockResolvedValue(mockResults);

      const request = {
        method: 'tools/call',
        params: {
          name: 'get_fulltext',
          arguments: {
            pmids: ['12345', '67890'],
          },
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(mockGetFullTextHandler.getFullText).toHaveBeenCalledWith(['12345', '67890']);
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResults, null, 2),
          },
        ],
      });
    });

    it('should handle get_fulltext errors gracefully', async () => {
      const errorMessage = 'Full text fetch error';
      mockGetFullTextHandler.getFullText.mockRejectedValue(new Error(errorMessage));

      const request = {
        method: 'tools/call',
        params: {
          name: 'get_fulltext',
          arguments: {
            pmids: ['invalid-pmid'],
          },
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      const response = await handler!(request as any);
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: `Error fetching full text: ${errorMessage}`,
          },
        ],
      });
    });

    it('should throw error for unknown tool', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {},
        },
      };
      
      const handler = server['_requestHandlers'].get('tools/call');
      expect(handler).toBeDefined();
      
      await expect(handler!(request as any)).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });
});