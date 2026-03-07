-- ==========================================
-- ZEN PIPS ECOSYSTEM: PGVECTOR SCHEMA (RAG)
-- Run this in the Supabase SQL Editor to enable the chatbot
-- ==========================================

-- 1. Enable the pgvector extension to work with OpenAI embeddings
create extension if not exists vector;

-- 2. Create the documents table to store our knowledge base
create table if not exists public.documents (
  id bigserial primary key,
  content text not null, -- The actual text chunk
  metadata jsonb, -- Store category ('sop' vs 'trading_knowledge'), source file, page number
  embedding vector(1536) -- OpenAI text-embedding-3-small generates 1536 dimensions
);

-- 3. Create a function to search for documents via cosine similarity
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter_category text DEFAULT null
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where filter_category is null or documents.metadata->>'category' = filter_category
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
