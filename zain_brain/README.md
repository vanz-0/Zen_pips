# Zen Brain (ZAIN) - Deterministic Knowledge Graph

This wiki operates on the architecture inspired by Andrej Karpathy's "llm-wiki.md" and advanced deterministic graph methods (Nebula system). 
The core philosophy is that the LLM is the *maintainer* and *librarian*, but the **human defines the core structural entities (nodes)**.

## Architecture

1. **Raw Sources (L1)**: Ingested documents or raw markdown notes.
2. **Deterministic Index (`index.md`)**: The root catalog. All core concepts MUST be linked here.
3. **Semantic Graph**: Entities are linked using bidirectional markdown links (`[[Link]]`). We strictly use predefined nodes (Concepts, Entities, Protocols).

## Rules for LLM Maintainers (Zain Agents)
1. **Never Hallucinate Links**: Only link to existing concepts found in `index.md` or `schema.md`. If a new concept is required, you must append it to `index.md` first.
2. **Log Operations**: Any new ingestion or sweeping change must be recorded chronologically in `log.md`. Format: `## [YYYY-MM-DD] ingest | Topic`.
3. **Contradiction Management**: Do not blindly overwrite older knowledge if conflicted. Flag the contradiction with an alert block `> [!WARNING] Contradiction` and let the human (admin) resolve it.
4. **Source of Truth**: The Markdown files are the source of truth, but they represent a database graph. Each file should have YAML frontmatter.

## Agent Instructions for Ingesting News or Data
When told to ingest a new trading article or system update:
1. Parse the information.
2. Search `index.md` for the closest relative topic (e.g. `[[High Impact Economics]]`).
3. Add a section or update the respective markdown file.
4. Add cross-references to affected pairs or strategies.
5. Append entry to `log.md`.

This structure prevents "knowledge drift" and allows our AI bots (like the Discord/Telegram Support Bots) to accurately retrieve verified context without spending tokens trying to logically deduce file locations.
