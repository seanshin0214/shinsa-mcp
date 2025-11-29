import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

let supabase: SupabaseClient | null = null;
let openai: OpenAI | null = null;

export function initRAG() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_KEY are required for RAG');
    return false;
  }

  if (!openaiKey) {
    console.error('OPENAI_API_KEY is required for RAG');
    return false;
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  openai = new OpenAI({ apiKey: openaiKey });
  return true;
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000)
  });

  return response.data[0].embedding;
}

export interface SearchResult {
  content: string;
  citation_type: string;
  paper_title: string;
  similarity: number;
}

export async function searchCitations(
  query: string,
  topK: number = 5,
  filterType?: string
): Promise<SearchResult[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const queryEmbedding = await getEmbedding(query);

  const params: Record<string, unknown> = {
    query_embedding: queryEmbedding,
    match_count: topK
  };

  if (filterType) {
    params.filter_type = filterType;
  }

  const { data, error } = await supabase.rpc('match_citations', params);

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
}

export async function getPaperCitations(paperTitle: string): Promise<SearchResult[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('citations')
    .select('content, citation_type, paper_title')
    .ilike('paper_title', `%${paperTitle}%`);

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  return (data || []).map((row: { content: string; citation_type: string; paper_title: string }) => ({
    content: row.content,
    citation_type: row.citation_type,
    paper_title: row.paper_title,
    similarity: 1.0
  }));
}

export async function getStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byPaper: Record<string, number>;
}> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('citations')
    .select('citation_type, paper_title');

  if (error) {
    throw new Error(`Stats query failed: ${error.message}`);
  }

  const byType: Record<string, number> = {};
  const byPaper: Record<string, number> = {};

  (data || []).forEach((row: { citation_type: string; paper_title: string }) => {
    const ct = row.citation_type || 'unknown';
    const pt = row.paper_title || 'unknown';
    byType[ct] = (byType[ct] || 0) + 1;
    byPaper[pt] = (byPaper[pt] || 0) + 1;
  });

  return {
    total: data?.length || 0,
    byType,
    byPaper
  };
}

export function isRAGInitialized(): boolean {
  return supabase !== null && openai !== null;
}
