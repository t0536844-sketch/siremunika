---
name: sqlserver-schema-execution
description: Lessons learned from executing SQL Server schema + seed scripts on localhost, covering reserved keywords, CREATE VIEW batch separation, and seed data FK ordering
source: auto-skill
extracted_at: '2026-06-07T22:52:09.316Z'
---

# SQL Server Schema & Seed Execution — Lessons Learned

These are practical corrections discovered during live execution of SQL Server schema and seed data scripts on `SVR01` (SQL Server 2019, Windows Auth). They supplement the global `sqlserver-from-react-types` skill.

## 1. Reserved keywords require `[brackets]` everywhere

SQL Server has many reserved keywords. The global skill lists `key`, `default`, `order`, `group`, `user`, `table`, `index`, `status`, `action`, `type`. During execution we discovered **`read`** is also reserved and must be bracketed.

**Rule:** Any column name that is a SQL Server reserved keyword must be wrapped in `[brackets]` in **all** SQL statements — CREATE TABLE, INSERT, SELECT, CREATE VIEW, CREATE INDEX — not just CREATE TABLE.

Example that caused `Msg 156, Level 15`:
```sql
-- WRONG
CREATE TABLE log_notification (
    ...
    read BIT DEFAULT 0,       -- 'read' is reserved → syntax error
);

INSERT INTO log_notification (id, type, title, message, time, read) VALUES ...

-- CORRECT
CREATE TABLE log_notification (
    ...
    [read] BIT DEFAULT 0,     -- bracketed
);

INSERT INTO log_notification (id, type, title, message, time, [read]) VALUES ...
```

**Expanded reserved keyword list** (additions beyond the global skill): `read`, `status` (already listed but worth double-checking), `level`, `nilai`, `periode` (these are NOT reserved — safe to use unbracketed).

**How to apply:** Before finalizing any SQL script, grep all column names against the full SQL Server reserved keyword list. Bracket anything that matches, in both schema AND seed scripts.

## 2. CREATE VIEW must be the first statement in its batch

SQL Server requires `CREATE VIEW` to be the **first statement in a query batch**. If you place multiple CREATE VIEW statements in a single batch (no `GO` separator between them), you get:

```
Msg 111, Level 15, State 1: 'CREATE VIEW' must be the first statement in a query batch.
```

**Fix:** Insert `GO` before every `CREATE VIEW` statement:

```sql
-- WRONG — all views in one batch after indexes
CREATE VIEW vw_pendapatan AS ...
CREATE VIEW vw_jasa_medis AS ...    -- Error!
CREATE VIEW vw_nakes AS ...         -- Error!

-- CORRECT — each view in its own batch
GO
CREATE VIEW vw_pendapatan AS ...
GO
CREATE VIEW vw_jasa_medis AS ...
GO
CREATE VIEW vw_nakes AS ...
```

**How to apply:** When generating schema scripts, always place `GO` on a separate line immediately before each `CREATE VIEW` (and `CREATE PROCEDURE` / `CREATE FUNCTION` — same rule applies).

## 3. Seed data column names must match bracketed schema column names

If a column is bracketed in the CREATE TABLE, the INSERT statement must also bracket it. For example:

```sql
-- Schema uses [key] and [group]
CREATE TABLE mst_permission (
    [key]   NVARCHAR(100) PRIMARY KEY,
    [group] NVARCHAR(100) NOT NULL,
    ...
);

-- Seed must also bracket them
INSERT INTO mst_permission ([key], label, [group], description) VALUES
('dashboard.view', 'Lihat Dashboard', 'Dashboard', '...');
```

**How to apply:** After bracketing column names in the schema script, audit the seed script to ensure the same column names are bracketed in INSERT column lists.

## 4. sqlcmd execution pattern for Windows

On this machine, SQL Server 2019 Developer Edition uses **Windows Authentication**. The execution pattern:

```bash
# Schema (drops existing DB first)
sqlcmd -S localhost -E -i "C:\Users\Administrator\create_simremunerasi_schema.sql" -o "C:\Users\Administrator\schema_output.txt"

# Seed data (must run AFTER schema)
sqlcmd -S localhost -E -i "C:\Users\Administrator\seed_simremunerasi_data.sql" -o "C:\Users\Administrator\seed_output.txt"

# Verification
sqlcmd -S localhost -E -d SIMRemunerasi -Q "SELECT t.name, p.rows FROM sys.tables t INNER JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1) ORDER BY t.name" -s "|" -W
sqlcmd -S localhost -E -d SIMRemunerasi -Q "SELECT name FROM sys.views ORDER BY name" -W
```

Key flags:
- `-S localhost` — local SQL Server instance
- `-E` — Windows Authentication (no password needed)
- `-i` — input SQL file
- `-o` — output log file
- `-d SIMRemunerasi` — target database for queries
- `-s "|" -W` — pipe-delimited, trimmed output for verification

## 5. Error recovery: read the output file

When `sqlcmd` exits with code 0 but there are errors, they appear in the `-o` output file, not stderr. Always read the output file after execution:

```bash
# Exit code 0 doesn't mean success — check output for Msg lines
cat C:\Users\Administrator\schema_output.txt
# Look for lines like: "Msg 156, Level 15, State 1, Server SVR01, Line 289"
```

**How to apply:** After every `sqlcmd` execution, always `read_file` the output log to check for error messages before proceeding.

## 6. Database name convention

For this project, the database is named `SIMRemunerasi` (no spaces, PascalCase). SQL scripts and API bridge configs all reference this name consistently.