import "server-only";

import { promises as fs } from "fs";
import { createRequire } from "module";
import path from "path";

import Database from "better-sqlite3";

import { getEmbeddingDimension } from "@/knowhub/features/knowledge/embedding-service";
import type {
  KnowledgeVectorStats,
  VectorRecordInput,
  VectorSearchResult,
  VectorStoreAdapter,
} from "@/knowhub/features/vector-store/types";

const storageRoot = path.join(process.cwd(), "storage", "knowhub", "vector");
const databasePath = path.join(storageRoot, "knowhub.sqlite");

type SqliteVecModule = {
  load: (db: Database.Database) => void;
};

let dbInstance: Database.Database | null = null;
let sqliteVecModule: SqliteVecModule | null = null;

function getSqliteVecModule() {
  if (sqliteVecModule) {
    return sqliteVecModule;
  }

  const require = createRequire(path.join(process.cwd(), "package.json"));
  sqliteVecModule = require("sqlite-vec") as SqliteVecModule;
  return sqliteVecModule;
}

function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  getSqliteVecModule().load(db);

  db.exec(`
    create virtual table if not exists knowhub_vectors using vec0(
      embedding float[${getEmbeddingDimension()}],
      knowledge_id text,
      source_key text,
      docspace_id text,
      file_path text,
      file_name text,
      strategy_id text,
      slice_id text,
      token_count integer,
      start_line integer,
      end_line integer,
      +content text,
      +kind text,
      +heading_title text,
      +parent_headings_json text
    );
  `);

  dbInstance = db;
  return db;
}

async function ensureStorageDir() {
  await fs.mkdir(storageRoot, { recursive: true });
}

function formatEmbedding(embedding: number[]) {
  return JSON.stringify(embedding);
}

function toIntegerMetadata(value: number, fieldName: string) {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${fieldName} 必须是整数`);
  }

  return BigInt(value);
}

export async function ensureVectorStore() {
  await ensureStorageDir();
  getDatabase();
}

export class SqliteVecStore implements VectorStoreAdapter {
  private readonly db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  replaceKnowledgeVectors(knowledgeId: string, records: VectorRecordInput[]) {
    const deleteStatement = this.db.prepare("delete from knowhub_vectors where rowid = ?");
    const insertStatement = this.db.prepare(`
      insert into knowhub_vectors(
        embedding,
        knowledge_id,
        source_key,
        docspace_id,
        file_path,
        file_name,
        strategy_id,
        slice_id,
        token_count,
        start_line,
        end_line,
        content,
        kind,
        heading_title,
        parent_headings_json
      ) values (
        @embedding,
        @knowledgeId,
        @sourceKey,
        @docspaceId,
        @filePath,
        @fileName,
        @strategyId,
        @sliceId,
        @tokenCount,
        @startLine,
        @endLine,
        @content,
        @kind,
        @headingTitle,
        @parentHeadingsJson
      )
    `);
    const currentRows = this.db
      .prepare("select rowid from knowhub_vectors where knowledge_id = ?")
      .all(knowledgeId) as Array<{ rowid: number }>;
    const replaceTransaction = this.db.transaction((items: VectorRecordInput[]) => {
      currentRows.forEach((row) => {
        deleteStatement.run(row.rowid);
      });

      items.forEach((item) => {
        insertStatement.run({
          ...item,
          embedding: formatEmbedding(item.embedding),
          tokenCount: toIntegerMetadata(item.tokenCount, "tokenCount"),
          startLine: toIntegerMetadata(item.startLine, "startLine"),
          endLine: toIntegerMetadata(item.endLine, "endLine"),
        });
      });
    });

    replaceTransaction(records);
    return {
      vectorCount: records.length,
    } satisfies KnowledgeVectorStats;
  }

  deleteByKnowledgeId(knowledgeId: string) {
    const rows = this.db
      .prepare("select rowid from knowhub_vectors where knowledge_id = ?")
      .all(knowledgeId) as Array<{ rowid: number }>;
    const deleteStatement = this.db.prepare("delete from knowhub_vectors where rowid = ?");
    const deleteTransaction = this.db.transaction(() => {
      rows.forEach((row) => {
        deleteStatement.run(row.rowid);
      });
    });

    deleteTransaction();
  }

  getKnowledgeStats(knowledgeId: string) {
    const row = this.db
      .prepare(
        "select count(*) as vectorCount from knowhub_vectors where knowledge_id = ?",
      )
      .get(knowledgeId) as { vectorCount: number };

    return {
      vectorCount: row.vectorCount,
    } satisfies KnowledgeVectorStats;
  }

  searchByEmbedding(knowledgeId: string, embedding: number[], limit: number) {
    const statement = this.db.prepare(`
      select
        rowid as rowId,
        distance,
        knowledge_id as knowledgeId,
        source_key as sourceKey,
        docspace_id as docspaceId,
        file_path as filePath,
        file_name as fileName,
        strategy_id as strategyId,
        slice_id as sliceId,
        token_count as tokenCount,
        start_line as startLine,
        end_line as endLine,
        content,
        kind,
        heading_title as headingTitle,
        parent_headings_json as parentHeadingsJson
      from knowhub_vectors
      where embedding match @embedding
        and k = @limit
        and knowledge_id = @knowledgeId
      order by distance
    `);

    return statement.all({
      embedding: formatEmbedding(embedding),
      limit,
      knowledgeId,
    }) as VectorSearchResult[];
  }
}
