# SQL2Excel Version History

## v2.1.5 - DynamicVar DB Routing & XML Validation Update (2025-11-15)

### ✨ New/Changed
- Dynamic variable DB routing
  - XML `dynamicVar` supports `db` (alias of `database`) attribute
  - Each dynamic variable is executed using the adapter for its specified DB key
  - Fallback to default DB when not specified
- XML validation update
  - `queryDef` now allows `db` attribute during structure validation (for documentation/future use). Execution DB remains sheet-level `db` or global default

### 🔧 Code Changes
- `src/query-parser.js`
  - Allow `db` attribute on `dynamicVar`; parse `database || db`
  - Allow `db` attribute on `queryDef` in validation
- `src/variable-processor.js`
  - Execute dynamic variables on their own DB adapters (`dbAdapters[targetDbKey]`)
- `src/index.js`
  - Pass `dbAdapters` and `defaultDbKey` to dynamic variable processor

### 📝 Documentation
- README/README_KR: Added v2.1.5 highlights, dynamicVar `db`/`database` usage notes and examples
- USER_MANUAL/USER_MANUAL_KR: Documented dynamicVar attributes and per-variable DB routing
- CHANGELOG/CHANGELOG_KR: Added v2.1.5 entries

## v2.1.4 - DB Adapter Test Query & Schema Alignment (2025-11-08)

### ✨ New/Changed
- Adapter-level connection test SQL
  - Added `getTestQuery()` to all DB adapters
    - MSSQL: `SELECT 1 as test`
    - MySQL/MariaDB: `SELECT 1 as test`
    - PostgreSQL: `SELECT 1`
    - SQLite: `SELECT 1`
    - Oracle: `SELECT 1 FROM dual`
  - `excel-cli.js` uses `adapter.getTestQuery()` for connection validation

- Sample schema alignment for cross-DB consistency (Orders)
  - PostgreSQL: added `SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID`
  - MySQL: added `SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID`
  - Purpose: match sample data columns and improve parity with MSSQL schema

### 🐛 Fixes
- Oracle connection validation fixed during `list-dbs`/validation flows
  - Replaced hardcoded `SELECT 1 as test` with adapter-provided query
- `excel-cli.js`: fixed broken `catch` in `loadDatabaseConfig()` and improved error message (`configFileLoadFailed`)

### 🔧 Code Changes
- `src/database/OracleAdapter.js`: add `getTestQuery()`
- `src/database/MSSQLAdapter.js`: add `getTestQuery()`
- `src/database/MySQLAdapter.js`: add `getTestQuery()`
- `src/database/PostgreSQLAdapter.js`: add `getTestQuery()`
- `src/database/SQLiteAdapter.js`: add `getTestQuery()`
- `src/excel-cli.js`: use `adapter.getTestQuery()`; fix `loadDatabaseConfig()` catch block
- `resources/create_sample_tables_postgresql.sql`: add Orders columns (`SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID`)
- `resources/create_sample_tables_mysql.sql`: add Orders columns (`SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID`)

### 📝 Notes
- These changes ensure sample data (PostgreSQL) loads cleanly across DBs when schemas are applied accordingly.

## v2.1.4(v1.3.3) - Docs Sync & Version Bump (2025-10-31)

### ✨ New/Changed
- Added `exceptColumns` attribute to exclude specific columns from sheet output
  - XML: `<sheet name="..." exceptColumns="ColA, ColB">` (comma-separated)
  - JSON: supports `"exceptColumns": ["ColA", "ColB"]` or legacy `"except_columns": ["ColA", "ColB"]`
  - Case-insensitive key detection; backward compatible with `except_columns`
- Behavior: specified columns are removed from the recordset before writing files (Excel/CSV/TXT), so they are not included in outputs
- Synchronized KR/EN documents (README, USER_MANUAL, CHANGELOG)
- Updated package version to 1.3.3

### 🔧 Code Changes
- `src/query-parser.js`: Parse `exceptColumns` (and `except_columns`) from XML/JSON and normalize to array
- `src/index.js`: When a sheet defines `exceptColumns`, remove those columns from result rows prior to export

### 📝 Documentation
- README/README_KR, USER_MANUAL/USER_MANUAL_KR, CHANGELOG/CHANGELOG_KR updated accordingly

## v2.1.2(v1.3.2) - CSV/TXT Formatting & Directory Naming (2025-10-31)

### ✨ New/Changed
- Per-sheet export directory naming simplified
  - Directory is now `<output_basename>` (extension suffix removed)
  - Example: `output="d:/temp/report.csv"` → directory `d:/temp/report/`
- CSV/TXT field formatting changes
  - Apply CSV quoting/escaping rules only when output extension is `.csv`
  - For non-CSV (e.g., `.txt`, `.sql`, etc.), write plain values without quoting
  - Internal newlines inside field values are normalized (\r/\n → space) for both CSV and TXT
  - Record separators remain CRLF; headers still included
  - Date values are serialized as `yyyy-MM-dd HH:mm:ss` (24-hour) in CSV/TXT and SQL literals

### 🔧 Code Changes
- `src/excel-generator.js`
  - Add `isCsv` flag; branch value formatter per format
  - `escapeCsv()` now normalizes internal newlines before quoting
  - Introduce `toPlain()` with newline normalization for non-CSV
  - Change per-sheet target directory from `<base>_<ext>` to `<base>`

### 📝 Documentation
- README/README_KR: Updated highlights and per-sheet export directory rules; noted CSV/TXT newline normalization and quoting scope
- USER_MANUAL/USER_MANUAL_KR: Updated per-sheet export section to reflect new directory naming and formatting rules
- CHANGELOG/CHANGELOG_KR: Added v1.3.2 entry

## v2.1.1-beta (v1.3.1) - Filename Variables and DATE Fixes (2025-10-30)

### ✨ New/Changed
- Output filename variable enhancements
  - Support `${DB_NAME}` in `excel.output` (also normalizes custom syntax `$(DB_NAME}` → `${DB_NAME}`)
  - Support `${DATE:...}` in `excel.output` using server local time when timezone omitted
  - Continue to support `${DATE.TZ:...}` for explicit timezones
- Lowercase token support for DATE formats
  - Newly supports `yyyy, yy, dd, d, hh, h, sss` in addition to existing uppercase tokens
  - Safe replacement order from longer to shorter tokens
- Removed automatic timestamp suffix
  - No longer appends `_yyyymmddhhmmss` to filenames automatically; use DATE variables in `excel.output` instead

### 🔧 Code Changes
- `src/index.js`: Apply variable substitution to `excel.output`; inject `DB_NAME`; normalize `$(VAR}` → `${VAR}`; removed auto timestamp append
- `src/mssql-helper.js`: Extend date formatter to support lowercase tokens; added `formatDateLocal`
- `src/variable-processor.js`: Use `formatDateLocal` for `${DATE:...}` (local time)

### 📝 Documentation
- README/README_KR: Added v1.3.1 highlights and filename variable usage examples
- USER_MANUAL/USER_MANUAL_KR: Documented filename variables (`DB_NAME`, DATE), lowercase tokens, and local-time behavior
- CHANGELOG/CHANGELOG_KR: Added v1.3.1 entry

## v2.1.0-beta (v1.3.0) - Per-sheet Export for CSV/TXT and Routing Rules (2025-10-29)

### ✨ New/Changed
- Export routing based on output extension
  - `.xlsx` / `.xls` → Generate a single Excel workbook (existing behavior)
  - `.csv` → Generate per-sheet CSV files
  - All other extensions (e.g., `.txt`, `.log`, `.data`, `.sql`, etc.) → Generate per-sheet TXT files (tab-delimited)
- Output directory naming
  - If per-sheet export is used, files are written under `<output_basename>_<ext>` (no dot)
  - Example: `output="d:/temp/report.csv"` → directory `d:/temp/report_csv/`
- Per-file naming
  - Each sheet becomes a separate file named after the sheet's original name (`originalName`) with filesystem sanitization
  - No 31-character truncation applies to CSV/TXT outputs (Excel-only limit)
  - Max filename length capped at 100 characters; invalid characters replaced with `_`
- Data formats
  - CSV: comma-delimited, UTF-8 with BOM, headers included, CRLF line endings
  - TXT: tab-delimited, UTF-8 with BOM, headers included, CRLF line endings

### 🔧 Code Changes
- index.js: Route by extension; only `.xlsx`/`.xls` use workbook generation; `.csv` uses per-sheet CSV; others per-sheet TXT
- excel-generator.js: Implement per-sheet writer, directory naming `<basename>_<ext>`, filename from `originalName`, formatting defaults

### 📝 Documentation
- README/README_KR: Updated highlights to v1.3.0 with per-sheet export rules and examples
- USER_MANUAL/USER_MANUAL_KR: Added section describing routing, directory/filename rules, and defaults
- CHANGELOG/CHANGELOG_KR: Added v1.3.0 entry

## v2.0.2-beta (v1.2.11) - TOC Original Name & Sheet Name Length Warning (2025-10-29)

### ✨ New/Changed
- Sheet name length > 31 characters is now treated as a warning during validation (no failure)
  - Warning also indicates that Excel may truncate the sheet name
- Table of Contents (TOC) updated to include a new column: "Original Name"
  - Shows the originally defined sheet name even if the actual tab was truncated
  - Removed tooltip note; information is displayed as a dedicated column instead

### 🔧 Code Changes
- excel-cli.js: Validation now logs warnings for long names, not errors
- excel-style-helper.js: TOC structure updated (add Original Name column, remove Note column)
- index.js / excel-generator.js: Pass original sheet name through to TOC

### 📝 Documentation
- README/README_KR: Updated highlights to v1.2.11, described changes
- CHANGELOG: Added v1.2.11 entry

## v2.0.1-beta (v1.2.10) - Non-interactive CLI & Docs (2025-10-29)

### ✨ New Features

#### Non-interactive CLI (app.js)
- Added direct execution without interactive menu using `--mode`
  - Modes: `validate`, `test`, `export`, `help`
  - Works in Node and packaged EXE

### 📝 Documentation
- README.md / README_KR.md: Added "Non-interactive CLI" usage and examples
- Updated highlights to v1.2.10

## v2.0.0-beta - Multi-Database Support (2025-10-22)

### ✨ New Features
- **Multi-Database Support**: Support for multiple database types beyond MSSQL
  - **Supported Databases**: MSSQL, MySQL, MariaDB
  - **Unified Interface**: Consistent API across all database types
  - **Database Factory Pattern**: Automatic adapter selection based on database type
  - **Backward Compatibility**: Existing MSSQL configurations work without changes

### 🔧 Configuration
```json
{
  "sampleDB": {
    "type": "mssql",      // Optional, defaults to "mssql" if not specified
    "server": "localhost",
    "port": 1433,
    "database": "SampleDB",
    "user": "sa",
    "password": "password"
  },
  "mysqlDB": {
    "type": "mysql",      // New: MySQL support
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  },
  "mariaDB": {
    "type": "mariadb",    // New: MariaDB support
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  }
}
```

### 📦 Technical Changes
- **New Architecture**:
  - `src/database/DatabaseFactory.js`: Factory for creating database adapters
  - `src/database/MSSQLAdapter.js`: MSSQL implementation (refactored from mssql-helper.js)
  - `src/database/MySQLAdapter.js`: MySQL/MariaDB implementation
  
- **Updated Files**:
  - `src/index.js`: Uses DatabaseFactory instead of direct MSSQLHelper
  - `src/variable-processor.js`: Database-agnostic implementation
  - `package.json`: Added `mysql2` dependency

### 🔄 Database-Specific Features
- **MSSQL**: 
  - Uses `TOP N` for row limiting
  - Supports `GETDATE()` function
  
- **MySQL/MariaDB**: 
  - Uses `LIMIT N` for row limiting
  - Converts `GETDATE()` to `NOW()` automatically
  - Connection pooling with automatic reconnection

### 💡 Usage Examples
```xml
<!-- Mix different database types in one Excel file -->
<excel output="multi_db_report_${DATE.UTC:YYYYMMDD}.xlsx" db="mysqlDB">
  <sheet name="MySQL Users" db="mysqlDB">
    <query>SELECT * FROM users</query>
  </sheet>
  
  <sheet name="MSSQL Orders" db="sampleDB">
    <query>SELECT * FROM orders</query>
  </sheet>
  
  <sheet name="MariaDB Products" db="mariaDB">
    <query>SELECT * FROM products</query>
  </sheet>
</excel>
```

### ⚠️ Notes
- **Type Field**: The `type` field in database configuration is optional. If omitted, defaults to `mssql` for backward compatibility.
- **Port Numbers**: Default ports are used if not specified (MSSQL: 1433, MySQL/MariaDB: 3306)
- **Connection Pooling**: All database types use connection pooling for optimal performance

### 📚 Dependencies
- Added: `mysql2@^3.6.0` - MySQL/MariaDB driver with promise support
- Maintained: `mssql@^10.0.0` - Microsoft SQL Server driver

---

## v1.2.9 - Global Timezone System & Local Time Support (2025-10-21)

### ✨ New Features
- **Global Timezone System**: Support for 22 timezones worldwide
  - New syntax: `${DATE.<TIMEZONE>:format}` (explicit timezone) or `${DATE:format}` (local time)
  - Asia-Pacific: UTC, GMT, KST, JST, CST, SGT, PHT, ICT, IST, AEST
  - Europe/Middle East: CET(Germany, France, Italy, Poland), EET, GST
  - Americas: EST, AST, CST_US(US, Canada, Mexico), MST, PST, AKST, HST, BRT, ART
  - Supported tokens: `YYYY`, `YY`, `MM`, `M`, `DD`, `D`, `HH`, `H`, `mm`, `m`, `ss`, `s`, `SSS`

- **Local Time Support**: Automatically uses server's local time when timezone is omitted
  - `${DATE:YYYY-MM-DD}` - Uses server's local timezone
  - Recommendation: Explicitly specify timezone for global consistency

### 🌍 Timezone Usage Examples
```
${DATE.UTC:YYYY-MM-DD}                 → 2024-10-21 (UTC time)
${DATE.KST:YYYY년 MM월 DD일}           → 2024년 10월 22일 (Korea time)
${DATE.JST:YYYY年MM月DD日}             → 2024年10月22日 (Japan time)
${DATE.EST:YYYY-MM-DD HH:mm:ss}        → 2024-10-21 10:30:45 (US East)
${DATE.CET:DD.MM.YYYY HH:mm}           → 21.10.2024 16:30 (Central Europe)
${DATE.PHT:YYYY/MM/DD HH:mm}           → 2024/10/21 23:30 (Philippines)
${DATE.ICT:YYYY-MM-DD HH:mm}           → 2024-10-21 22:30 (Thailand/Vietnam)
${DATE:YYYYMMDD_HHmmss}                → 20241021_183045 (local time)
```

### 🔧 Improvements
- **Enhanced Extensibility**: Flexible timezone and format specification beyond fixed formats
- **Explicit Timezone**: Clarified timezone specification in variable names (`DATE.UTC`, `DATE.KST`, etc.)
- **Flexible Time Handling**: Simultaneous multi-timezone display for global reports
- `src/variable-processor.js`: 
  - Added 22 timezone offset configurations
  - Added local time processing logic
  - Added timezone-specific date variable parsing logic
- `src/mssql-helper.js`: Unified date formatting logic with `formatDate()` function

### 💥 Breaking Changes
- **Date Variable Format Changed**: Changed to explicitly specify timezone
  - Old: `${DATE:format}`, `${DATETIME:format}`, `${KST:format}`
  - New: `${DATE.<TIMEZONE>:format}` or `${DATE:format}` (local time)

### 🔄 Migration Guide
Update existing variables to new global timezone format:
```
Old: ${DATE:YYYY-MM-DD}                   → New: ${DATE.UTC:YYYY-MM-DD} or ${DATE:YYYY-MM-DD} (local)
Old: ${DATETIME:YYYY-MM-DD HH:mm:ss}      → New: ${DATE.UTC:YYYY-MM-DD HH:mm:ss}
Old: ${KST:YYYY-MM-DD}                    → New: ${DATE.KST:YYYY-MM-DD}
Old: ${KST:YYYY년 MM월 DD일}              → New: ${DATE.KST:YYYY년 MM월 DD일}
```

### 📝 Example Files Updated
- `queries/datetime-variables-example.xml`: Completely rewritten with global timezone system
- `queries/datetime-variables-example.json`: Completely rewritten with global timezone system

### 📚 Usage Examples
```sql
-- Use UTC time in filename
<excel output="report_${DATE.UTC:YYYYMMDD}_${DATE.UTC:HHmmss}.xlsx">

-- Use local time in filename
<excel output="report_${DATE:YYYYMMDD}_${DATE:HHmmss}.xlsx">

-- Global report (simultaneous multi-timezone display)
SELECT 
  'Seoul: ${DATE.KST:YYYY-MM-DD HH:mm:ss}' as Seoul_Time,
  'New York: ${DATE.EST:YYYY-MM-DD HH:mm:ss}' as NewYork_Time,
  'Tokyo: ${DATE.JST:YYYY-MM-DD HH:mm:ss}' as Tokyo_Time,
  'Paris: ${DATE.CET:YYYY-MM-DD HH:mm:ss}' as Paris_Time

-- Display Korean-style dates
SELECT 'Report Date: ${DATE.KST:YYYY년 MM월 DD일}' as Title

-- Use timezone in WHERE conditions
WHERE created_date >= '${DATE.KST:YYYY-MM-DD}'
  AND updated_time < '${DATE.KST:YYYY-MM-DD HH:mm:ss}'
```

### 🌏 Newly Added Timezones (3)
- **PHT** (Philippine Time, UTC+8): Philippines
- **ICT** (Indochina Time, UTC+7): Thailand, Vietnam
- **AST** (Atlantic Standard Time, UTC-4): Eastern Canada

## v1.2.8 - Language Configuration & Type Safety Improvements (2025-10-19)

### 🔧 Improvements
- **Unified Language Configuration**: Standardized language settings using environment variable (`LANGUAGE`)
  - `app.js`: Use environment variable instead of command-line argument
  - `src/index.js`: Environment variable-based language configuration
  - `src/excel-cli.js`: Use environment variable, changed default from 'kr' to 'en'
  - `src/excel-style-helper.js`: Use environment variable
  - `src/file-utils.js`: Use environment variable
  - `src/style-manager.js`: Use environment variable
  - `src/variable-processor.js`: Use environment variable
  - `src/query-parser.js`: Use environment variable
  - `src/excel-generator.js`: Use environment variable

- **Batch File Improvements**: Added environment variable settings, removed `--lang` parameter
  - `run.bat`: Added `set LANGUAGE=en`
  - `실행하기.bat`: Added `set LANGUAGE=kr`
  - `create-release.js`: Added environment variable settings to release batch file templates
  - `package.json`: Changed `start:kr` script to message directing users to use batch files

### 🐛 Bug Fixes
- **Type Conversion Error Fix**: Improved type safety when handling empty arrays in IN clauses
  - `src/mssql-helper.js`: `createInClause()` function now returns `NULL` instead of `'^-_'`
  - `src/variable-processor.js`: Unresolved dynamic variables replaced with `NULL` instead of `'^-_'`
  - **Issue**: Type conversion error when executing `WHERE OrderID IN ('^-_')` on INT columns
  - **Solution**: Using `WHERE OrderID IN (NULL)` works safely with all data types
  - **Impact**: Executes without errors on all column types (numeric, string, date, etc.) and always returns 0 rows

### 📝 Documentation
- Enhanced multilingual messages
  - `variable-processor.js`: Shows `(no match)` / `(매칭 없음)` message when replacing with NULL
  - Clarified messages when replacing with empty strings

### 🔄 Migration Guide
- If you were running with `node app.js --lang=kr`:
  - Windows: `set LANGUAGE=kr && node app.js`
  - Or use `실행하기.bat` (automatically sets environment variable)
- In development environment, you can set `LANGUAGE=kr` in `.env` file

## v1.2.7 - Encoding & Validation Improvements (2025-10-16)

### 🔧 Improvements
- **Removed Korean Filename Validation**: Removed filename Korean character validation logic
  - `file-utils.js`: Removed `hasKoreanInFilename()` and `validateFilename()` functions
  - `query-parser.js`: Removed `validateQueryFile()` function
  - `index.js`: Removed `validateQueryFile()` calls
  - Documentation: Removed all Korean filename validation related content

- **Query File Validation Enhancement**: Show only databases used in the query file
  - `excel-cli.js`: Enhanced `validateQueryFile()` function
  - Collects DB IDs from `<excel>`, `<sheet>`, and `<dynamicVar>` elements
  - Displays only databases actually used in the query file
  - Shows error if referenced DB is not found in config file

- **Release Package Encoding Fix**: Fixed character corruption in release batch files
  - `create-release.js`: Removed Korean text from batch files
  - `app.js`: Added UTF-8 encoding settings for Windows
  - Batch files now display English messages only
  - Korean interface displays properly after Node.js application starts

- **Query Sample Files Localization**: Converted all query sample files to English
  - `queries/queries-sample-orders.json`: Converted to English
  - `queries/queries-sample-orders.xml`: Converted to English
  - `queries/datetime-variables-example.json`: Converted to English
  - `queries/datetime-variables-example.xml`: Converted to English
  - `queries/queries-with-dynamic-variables.json`: Converted to English
  - `queries/queries-with-dynamic-variables.xml`: Converted to English
  - `queries/queries-with-template.xml`: Converted to English
  - `queries/test-sheet-name-validation.xml`: Converted to English

### 📝 Documentation
- Updated README files to reflect removal of filename validation feature
- Updated USER_MANUAL files with latest changes

## v1.2.6 - Validation & Structure Improvements (2025-10-15)

### ✨ New Features
- **Sheet Name Validation**: Added Excel sheet name validation logic
  - Invalid character validation: `\`, `/`, `*`, `?`, `[`, `]`, `:`
  - Maximum length validation: 31 character limit
  - Leading/trailing whitespace validation
  - Actual sheet name validation after variable substitution

- **XML Structure Validation**: Added element and attribute name validation logic
  - Allowed elements validation
  - Allowed attributes validation
  - Automatic exclusion of xml2js internal keys (`$`, `_`, etc.)
  - Detailed error message output

- **Interactive Menu System**: User-friendly menu system in sql2db style
  - `app.js`: Multi-language menu system
  - `run.bat`: English version launcher script (`--lang=en`)
  - `실행하기.bat`: Korean version launcher script (`--lang=kr`)

- **Multi-language Support**: Language selection via command line arguments
  - `--lang=en`: English interface
  - `--lang=kr`: Korean interface
  - Multi-language support for menus, messages, and errors

### 🔧 Technical Improvements
- **Improved dbinfo.json Structure**: Removed dbs wrapper
  - Before: `{"dbs": {"sampleDB": {...}}}`
  - After: `{"sampleDB": {...}}`
  - More concise structure for better readability

- **pkg Environment Path Handling**: Using APP_ROOT constant
  - `mssql-connection-manager.js`: Added pkg environment path handling
  - Unified all file paths based on APP_ROOT

- **pkg Build Optimization** (2025-10-15)
  - Removed `--no-native-build` option: Improved native module compatibility
  - Explicit native module inclusion: Added `mssql`, `tedious` to assets
  - Explicit entry point: Specified as `pkg app.js` format
  - Explicit target: Specified `--target node18-win-x64`
  - Added compression: Optimized file size with `--compress GZip`

- **pkg Environment Support** (2025-10-15)
  - Detect pkg environment and call modules directly in `app.js`
  - Directly require `excel-cli.js` module for functionality
  - Automatic branching between Node.js and pkg environments
  - Dynamic reconstruction of `process.argv` for module calls
  - `excel-cli.js`: Dynamically read args and command within main() function
  - `file-utils.js`: APP_ROOT-based path handling (pkg environment support)
  - `index.js`: Create new yargs instance each time with explicit process.argv

- **Improved Option Parsing** (2025-10-15)
  - Added `--lang` option handling in `excel-cli.js`
  - Added unknown option ignore functionality (`default` case)
  - Enhanced option parser stability
  - Improved `yargs` usage: Changed to `require('yargs/yargs')`
  - Explicit `process.argv.slice(2)` passing for pkg environment compatibility

### 🐛 Bug Fixes
- **queryDef validation error**: Improved id attribute recognition in queryDef
- **Variable substitution sheet name validation**: Changed to validate after variable substitution
- **validate command option parsing**: Improved --xml option recognition
- **Fixed "i is not defined" error** (2025-10-15)
  - `index.js`: Added `sheetIndex` variable in for-of loop
  - Improved index tracking logic in sheet processing loop
  - Fixed passing correct index to sheet name validation function

- **Fixed sheet name validation not applied during file validation** (2025-10-15)
  - `excel-cli.js`: Moved sheet name validation logic outside queryDefs block
  - Improved structure to ensure validation always runs
  - Returns `false` with clear error messages on validation failure
  - Auto-correction during query execution, validation failure during file validation

### 🎨 UI/UX Improvements (2025-10-15)
- **Detailed Validation Output**
  - Sheet list: Display full list instead of just count
  - Per-sheet validation results: Show ✅ success / ❌ failure for each
  - Detailed failure reasons: Specify which rules were violated
  - Database list: Display detailed info including server, DB name, user, permissions

- **Fixed Character Corruption on Batch File Execution**
  - Execute `cls` immediately after `@echo off` to clear initial screen
  - Redirect stderr with `chcp 65001 >nul 2>&1`
  - Execute `cls` again after code page change to remove corrupted characters
  - Provide clean screen on batch file startup

### 📦 Distribution Improvements (2025-10-15)
- **Auto-generate Batch Files**: Generate language-specific batch files in `create-release.js`
  - `run.bat`: Automatically includes `--lang=en`
  - `실행하기.bat`: Automatically includes `--lang=kr`
- **Optimized Executable Size**: Reduced size by ~40% through compression
- **Native Module Inclusion**: Guaranteed proper operation of DB connection libraries

## v1.2.5 - Batch Interface Improvements (2025-10-10)

### 🔧 Improvements
- **📋 Numbered File Selection**: Changed file selection from manual path entry to numbered menu system
- **✅ Enhanced Input Validation**: Added validation for file selection numbers
- **🎯 Improved User Experience**: More intuitive file selection with automatic listing of XML/JSON files
- **🔍 File Type Detection**: Automatic detection and separation of XML and JSON files in selection menus
- **📁 Empty Directory Handling**: Better handling when no query definition files are found

### 🪟 Batch Interface Changes
- **VALIDATE Menu**: Display numbered list of all query files (XML/JSON) for validation
- **EXPORT_XML Menu**: Display numbered list of XML files with simplified selection
- **EXPORT_JSON Menu**: Display numbered list of JSON files with simplified selection
- **Input Validation**: Check if number is in valid range and provide clear error messages
- **User Feedback**: Show selected file path before processing

---

## v1.2.4 - Standalone Executable & Enhanced User Experience (2025-10-05)

### ✨ New Features
- **📦 Standalone Executable Generation**: Generate versioned standalone .exe files without Node.js dependency
- **🌐 Multi-language Release Packages**: Automated Korean and English release package generation
- **🕒 Creation Timestamp Display**: Show creation timestamp on each Excel sheet
- **⏰ Enhanced DateTime Variables**: 20+ automatic datetime variables for real-time timestamp generation
- **📋 SQL Query Formatting**: Preserve original SQL formatting with line breaks in Table of Contents
- **🔧 Input Validation**: Automatic whitespace trimming for file path inputs in batch interface
- **🚀 Release Automation**: Complete automated release process with proper documentation

### 📦 Standalone Executable Features
- **Versioned Executable Names**: `sql2excel-v1.2.4.exe` format for clear version identification
- **Asset Bundling**: Excel templates and style files bundled within executable
- **Path Resolution**: Smart path resolution for packaged vs development environments
- **No Node.js Dependency**: Fully self-contained executable for end users

### 🌐 Multi-language Support
- **Korean Release Package**: `sql2excel-v1.2.4-ko` with Korean documentation and interface
- **English Release Package**: `sql2excel-v1.2.4-en` with English documentation and interface
- **Localized Batch Files**: Language-specific batch interfaces (`sql2excel.bat`, `sql2excel-en.bat`)
- **Automated Documentation**: Dynamic version replacement in user manuals and README files

### 🕒 Enhanced DateTime System
- **20+ DateTime Variables**: Comprehensive set of datetime functions for various formats
- **Real-time Generation**: Each function generates current timestamp at execution time
- **Multiple Formats**: UTC, KST, Korean localized, ISO, compact formats
- **Variable Processing Order**: Fixed processing order to ensure datetime variables work correctly

#### Available DateTime Variables
```javascript
CURRENT_TIMESTAMP    // 2025-10-05 14:30:25
KST_NOW             // 2025-10-05 23:30:25 (Korea Standard Time)
CURRENT_DATE        // 2025-10-05
CURRENT_TIME        // 14:30:25
KOREAN_DATE         // 2025년 10월 05일
KOREAN_DATETIME     // 2025년 10월 05일 14시 30분 25초
DATE_YYYYMMDD       // 20251005
DATETIME_YYYYMMDD_HHMMSS // 20251005_143025
ISO_TIMESTAMP       // 2025-10-05T14:30:25.123Z
UNIX_TIMESTAMP      // 1728134225
// ... and 10 more formats
```

### 📋 Table of Contents Enhancements
- **SQL Formatting Preservation**: Original SQL query formatting with line breaks maintained
- **Creation Timestamp**: Display file creation timestamp in each sheet
- **Improved Readability**: Better visual presentation of complex SQL queries

### 🔧 User Interface Improvements
- **Input Validation**: Automatic whitespace trimming for file paths in batch interface
- **Error Prevention**: Prevents "file not found" errors from accidental whitespace
- **Copy-Paste Friendly**: Handles paths copied from other sources with leading/trailing spaces

### 🚀 Build & Release System
- **Automated Release Script**: `npm run release` creates complete release packages
- **Version-aware Building**: `npm run build` generates versioned executable names
- **Documentation Sync**: Automatic version replacement in all documentation files
- **Clean Build Process**: `npm run clean` removes old builds and release files

### 🔧 Technical Improvements
- **Module Resolution Fix**: Resolved "Cannot find module" errors in packaged executables
- **Asset Path Management**: Dynamic asset path resolution for templates and styles
- **Variable Processing Logic**: Fixed datetime variable substitution order
- **Batch Script Robustness**: Improved file type detection and error handling

### 📚 Documentation Updates
- **User Manual Enhancement**: Updated with all new features and standalone executable usage
- **Release Documentation**: Comprehensive deployment and usage instructions
- **Example Updates**: Added datetime variable examples and multi-line SQL formatting

### 🐛 Bug Fixes
- **DateTime Variable Output**: Fixed issue where datetime values were not displaying in Excel sheets
- **Variable Processing Order**: Corrected variable substitution sequence to prioritize datetime functions
- **XML Structure Validation**: Fixed missing `<sheets>` tags in example files
- **Batch File Type Detection**: Improved XML/JSON file type identification in Windows batch interface
- **Path Resolution**: Fixed template file paths in packaged executable environment

---

## v1.2.3 - Parameter Override Feature Addition (2025-08-29)

### ✨ New Features
- **⚙️ Parameter Override Feature**: Override query definition parameters for each sheet
- **🔄 Enhanced Query Reuse**: Use the same query definition across multiple sheets with different parameters
- **📊 Priority System**: Process in order: sheet-specific parameters > global variables > default values
- **🎯 Multiple Data Type Support**: Support for string, number, array, boolean, and date parameter types
- **📝 Detailed Logging**: Comprehensive logging output for parameter override process

### 📊 Parameter Override System

#### Parameter Override in XML
```xml
<queryDefs>
  <queryDef id="customer_base" description="Base customer query">
    <![CDATA[
      SELECT CustomerID, CustomerName, Email, Phone, Region
      FROM Customers 
      WHERE IsActive = 1 
        AND Region IN (${regionList})
        AND CreatedDate >= '${startDate}'
    ]]>
  </queryDef>
</queryDefs>

<sheets>
  <!-- Seoul customers -->
  <sheet name="SeoulCustomers" use="true" queryRef="customer_base">
    <params>
      <param name="regionList">["Seoul"]</param>
      <param name="startDate">2024-01-01</param>
    </params>
  </sheet>
  
  <!-- Busan customers -->
  <sheet name="BusanCustomers" use="true" queryRef="customer_base">
    <params>
      <param name="regionList">["Busan"]</param>
      <param name="startDate">2024-03-01</param>
    </params>
  </sheet>
</sheets>
```

#### Parameter Override in JSON
```json
{
  "queryDefs": {
    "customer_base": {
      "name": "customer_base",
      "description": "Base customer query",
      "query": "SELECT CustomerID, CustomerName, Email, Phone, Region FROM Customers WHERE IsActive = 1 AND Region IN (${regionList}) AND CreatedDate >= '${startDate}'"
    }
  },
  "sheets": [
    {
      "name": "SeoulCustomers",
      "use": true,
      "queryRef": "customer_base",
      "params": {
        "regionList": ["Seoul"],
        "startDate": "2024-01-01"
      }
    }
  ]
}
```

### 🔧 Improvements
- **Enhanced Variable Processing Logic**: Added sheet-specific parameter support to `substituteVars` method
- **Parser Improvements**: Parameter override functionality supported in both XML and JSON parsers
- **Type Safety**: Safe parsing and processing for various data types
- **Logging System**: Detailed logging output for parameter override process to support debugging

### 📚 Documentation
- **User Manual Update**: Added detailed parameter override feature description
- **Example File Updates**: Added parameter override examples
- **README Update**: Added parameter override to main feature list

---

## v1.2.2 - Dynamic Variables System Enhancement (2025-08-20)

### ✨ New Features
- **🔄 Dynamic Variables System**: Extract values from database in real-time for dynamic query generation
- **📊 2 Dynamic Variable Types**: Default type (`column_identified` behavior), `key_value_pairs` type support
- **🎯 Default Type Improvement**: Automatically processes as `column_identified` type when `type` attribute is omitted
- **🔗 Time Function Integration**: Use time functions like `CURRENT_TIMESTAMP`, `CURRENT_DATE` in dynamic variables
- **🌐 Environment Variable Support**: Use environment variables in dynamic variables
- **🐛 Debug Mode**: Detailed variable substitution logging with `DEBUG_VARIABLES=true` environment variable

### 🔄 Dynamic Variable Type Features

#### 1. Default Type (column_identified behavior)
- Default when `type` attribute is omitted
- Creates arrays for each column
- Access specific column values using `${variableName.columnName}` format
- Example: `${customerData.CustomerID}`, `${customerData.Region}`

#### 2. key_value_pairs Type
- Requires explicit `type="key_value_pairs"` specification
- Creates key-value pairs from first two columns
- Access key values using `${variableName.keyName}` format
- Example: `${productPrices.ProductID}`

### 📝 Usage Examples
```xml
<!-- Dynamic variable definitions -->
<dynamicVars>
  <!-- Default type: type attribute omitted -->
  <dynamicVar name="customerData" description="Customer data by column">
    <![CDATA[
      SELECT CustomerID, CustomerName, City, Region
      FROM Customers WHERE IsActive = 1
    ]]>
  </dynamicVar>
  
  <!-- key_value_pairs type: explicit specification -->
  <dynamicVar name="productPrices" type="key_value_pairs" description="Product price information">
    <![CDATA[
      SELECT ProductID, UnitPrice
      FROM Products WHERE Discontinued = 0
    ]]>
  </dynamicVar>
</dynamicVars>

<!-- Using dynamic variables -->
<sheet name="CustomerOrderAnalysis">
  <![CDATA[
    SELECT * FROM Orders 
    WHERE CustomerID IN (${customerData.CustomerID})
      AND Region IN (${customerData.Region})
      AND ProductID IN (${productPrices.ProductID})
  ]]>
</sheet>
```

### 🔧 Improvements
- **Default Type Simplification**: Automatically processes as `column_identified` type when `type` attribute is omitted, improving usability
- **Variable Substitution Priority**: Processes in order: dynamic variables > regular variables > time functions > environment variables
- **SQL Injection Prevention**: Proper escaping for all variable values
- **Enhanced Error Handling**: Replaces dynamic variables with empty arrays for safety when processing errors occur
- **Performance Optimization**: Dynamic variables executed once and cached for entire export

### 📚 Documentation
- **README.md Update**: Added dynamic variables feature introduction and examples
- **USER_MANUAL.md Expansion**: Added detailed dynamic variables usage and type descriptions
- **Example Files Added**: Created `queries-with-dynamic-variables.xml`, `queries-with-dynamic-variables.json`

---

## v1.2.1 - Documentation Improvements (2025-08-11)

### 📚 Documentation
- **📖 User Manual**: Added comprehensive `USER_MANUAL.md`
- **📋 Version History**: Added systematic `CHANGELOG.md`
- **🔧 Configuration Guide**: Detailed database connection and setup instructions
- **💡 Example Expansion**: Added various usage scenarios and example code

### 🔧 Improvements
- **Documentation Structure**: Systematic document organization with table of contents
- **Example Enhancement**: Detailed examples for actual usage scenarios
- **Troubleshooting Guide**: Common issues and solutions
- **Version History**: Systematic organization of all version changes

---

## v1.2.0 - Query Reuse and CLI Improvements (2024-08-07)

### ✨ New Features
- **🔄 Query Definition Reuse**: Define common queries with `queryDefs` and reuse across multiple sheets
- **🖥️ New CLI Interface**: Command-line tool via `excel-cli.js`
- **🪟 Windows Batch Files**: Convenient execution batch files for Windows users
- **✅ File Validation**: Query file format and structure validation tool
- **🔗 DB Connection Test**: Check connection status for all configured databases

### 📊 Query Reuse System
- **XML/JSON Support**: `queryDefs` functionality supported in both formats
- **Code Reuse**: Reference same query across multiple sheets using `queryRef`
```xml
<queryDefs>
  <queryDef id="customer_base" description="Base customer query">
    <![CDATA[
      SELECT CustomerID, CustomerName, Email, Phone
      FROM Customers WHERE IsActive = 1
    ]]>
  </queryDef>
</queryDefs>

<sheets>
  <sheet name="CustomerList" use="true">
    <queryRef ref="customer_base"/>
  </sheet>
  
  <sheet name="CustomerOrders" use="true">
    <![CDATA[
      SELECT o.*, c.CustomerName
      FROM Orders o
      INNER JOIN (${customer_base}) c ON o.CustomerID = c.CustomerID
    ]]>
  </sheet>
</sheets>
```

### 🖥️ CLI Commands
```bash
# Generate Excel file
node src/excel-cli.js export --xml ./queries/sample.xml

# Validate query file
node src/excel-cli.js validate --xml ./queries/sample.xml

# List databases
node src/excel-cli.js list-dbs

# Help
node src/excel-cli.js help
```

### 🪟 Windows Batch Files
- `실행하기.bat`: Interactive execution
- `export-xml.bat`: Direct XML export
- `export-json.bat`: Direct JSON export
- `validate.bat`: File validation
- `db-test.bat`: Database connection test

---

## v1.1.5 - Excel Styling Enhancements (2024-08-06)

### ✨ New Features
- **🎨 Advanced Excel Styling**: Comprehensive styling for headers and data areas
- **📊 Font Control**: Font name, size, color, bold, italic settings
- **🎨 Fill Control**: Background color and pattern settings
- **📏 Border Control**: Border style, color, and position settings
- **📐 Alignment Control**: Horizontal/vertical alignment and text wrapping

### 📝 Styling Examples
```xml
<excel db="sampleDB" output="output/StyledReport.xlsx">
  <header>
    <font name="Arial" size="12" color="FFFFFF" bold="true"/>
    <fill color="4F81BD" patternType="solid"/>
    <border>
      <top style="thin" color="000000"/>
      <bottom style="thin" color="000000"/>
    </border>
    <alignment horizontal="center" vertical="center"/>
  </header>
  
  <data>
    <font name="Arial" size="10"/>
    <border>
      <top style="thin" color="CCCCCC"/>
      <bottom style="thin" color="CCCCCC"/>
    </border>
  </data>
</excel>
```

---

## v1.1.4 - Aggregation and Table of Contents (2024-08-05)

### ✨ New Features
- **📊 Aggregation Features**: Automatic aggregation and display of counts by specified column values
- **📋 Auto Table of Contents**: Automatically generate table of contents sheet with hyperlinks
- **🔗 Hyperlink Support**: Clickable links between sheets
- **📈 Statistics Display**: Row counts and creation information

### 📝 Aggregation Example
```xml
<sheet name="SalesByRegion" use="true" aggregateColumn="Region">
  <![CDATA[
    SELECT Region, SUM(TotalAmount) as TotalSales, COUNT(*) as OrderCount
    FROM Orders o
    INNER JOIN Customers c ON o.CustomerID = c.CustomerID
    GROUP BY Region
  ]]>
</sheet>
```

### 📋 Table of Contents Features
- Sheet names as hyperlinks
- Row counts for each sheet
- Creation timestamp
- File information

---

## v1.1.3 - Multi-Database Support (2024-08-04)

### ✨ New Features
- **🔗 Multiple DB Connections**: Use different database connections for each sheet
- **📊 Database Selection**: Specify database per sheet
- **🔧 Connection Management**: Efficient connection pool management
- **📋 Connection Validation**: Validate all database connections

### 📝 Multi-DB Example
```xml
<excel db="defaultDB" output="output/MultiDBReport.xlsx">
  <!-- Default database settings -->
</excel>

<sheets>
  <sheet name="CustomerData" db="customerDB" use="true">
    <![CDATA[SELECT * FROM Customers]]>
  </sheet>
  
  <sheet name="OrderData" db="orderDB" use="true">
    <![CDATA[SELECT * FROM Orders]]>
  </sheet>
</sheets>
```

---

## v1.1.2 - Variable System Enhancement (2024-08-03)

### ✨ New Features
- **📝 Enhanced Variable System**: Improved variable substitution and validation
- **🔗 Time Functions**: Support for `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `CURRENT_TIME`
- **🌐 Environment Variables**: Use system environment variables
- **✅ Variable Validation**: Validate variable definitions and usage

### 📝 Variable Examples
```xml
<vars>
  <var name="startDate">2024-01-01</var>
  <var name="endDate">2024-12-31</var>
  <var name="currentTime">${CURRENT_TIMESTAMP}</var>
  <var name="dbName">${DATABASE_NAME}</var>
</vars>

<sheet name="TimeBasedReport" use="true">
  <![CDATA[
    SELECT * FROM Orders 
    WHERE OrderDate BETWEEN '${startDate}' AND '${endDate}'
      AND CreatedAt <= '${currentTime}'
  ]]>
</sheet>
```

---

## v1.1.1 - Performance and Stability (2024-08-02)

### ✨ New Features
- **🚦 Query Limits**: Row count limiting for large data processing
- **📊 Memory Optimization**: Improved memory usage for large datasets
- **🔧 Error Handling**: Enhanced error handling and recovery
- **📋 Progress Reporting**: Real-time progress reporting for long operations

### 🔧 Improvements
- **Performance**: Optimized data processing for large result sets
- **Stability**: Improved error handling and recovery mechanisms
- **Memory**: Better memory management for large exports
- **Logging**: Enhanced logging and progress reporting

---

## v1.1.0 - Multi-Sheet Support (2024-08-01)

### ✨ New Features
- **📊 Multi-Sheet Support**: Save multiple SQL query results in separate sheets within one Excel file
- **📋 Sheet Management**: Individual sheet configuration and control
- **🎨 Sheet Styling**: Individual styling per sheet
- **📊 Data Organization**: Organized data presentation across multiple sheets

### 📝 Multi-Sheet Example
```xml
<sheets>
  <sheet name="CustomerList" use="true">
    <![CDATA[SELECT * FROM Customers]]>
  </sheet>
  
  <sheet name="OrderSummary" use="true">
    <![CDATA[
      SELECT CustomerID, COUNT(*) as OrderCount, SUM(TotalAmount) as TotalSales
      FROM Orders GROUP BY CustomerID
    ]]>
  </sheet>
  
  <sheet name="ProductCatalog" use="true">
    <![CDATA[SELECT * FROM Products WHERE Discontinued = 0]]>
  </sheet>
</sheets>
```

---

## v1.0.5 - Configuration Enhancements (2024-07-31)

### ✨ New Features
- **📄 JSON Support**: Full JSON configuration file support
- **🔧 Configuration Validation**: Comprehensive configuration validation
- **📋 Default Values**: Sensible default values for all settings
- **🔍 Error Reporting**: Detailed error reporting and suggestions

### 📝 JSON Configuration Example
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/Report.xlsx"
  },
  "sheets": [
    {
      "name": "CustomerData",
      "use": true,
      "query": "SELECT * FROM Customers"
    }
  ]
}
```

---

## v1.0.4 - Database Connectivity (2024-07-30)

### ✨ New Features
- **🔗 SQL Server Support**: Full SQL Server database connectivity
- **🔧 Connection Configuration**: Flexible database connection configuration
- **📋 Connection Pooling**: Efficient connection pool management
- **🔍 Connection Validation**: Database connection validation and testing

### 📝 Database Configuration
```json
{
  "dbs": {
    "sampleDB": {
      "server": "localhost",
      "port": 1433,
      "database": "SampleDB",
      "user": "sa",
      "password": "password",
      "options": {
        "encrypt": false,
        "trustServerCertificate": true
      }
    }
  }
}
```

---

## v1.0.3 - Core Excel Generation (2024-07-29)

### ✨ New Features
- **📊 Excel File Generation**: Core Excel file creation functionality
- **📋 Data Export**: SQL query results to Excel format
- **🎨 Basic Styling**: Basic Excel styling and formatting
- **📄 Multiple Formats**: Support for .xlsx format

### 🔧 Core Features
- SQL query execution
- Data extraction and formatting
- Excel file creation
- Basic styling application

---

## v1.0.2 - Project Foundation (2024-07-28)

### ✨ New Features
- **🏗️ Project Structure**: Initial project structure and organization
- **📦 Dependencies**: Core Node.js dependencies and packages
- **🔧 Configuration**: Basic configuration system
- **📚 Documentation**: Initial project documentation

### 📋 Foundation
- Node.js project setup
- Package.json configuration
- Basic file structure
- Initial documentation

---

## v1.0.1 - Initial Release (2024-07-27)

### ✨ New Features
- **🎯 Core Functionality**: Basic SQL to Excel conversion functionality
- **🔗 Database Support**: SQL Server database connectivity
- **📊 Data Export**: Export SQL query results to Excel
- **🖥️ Command Line**: Basic command-line interface

### 📋 Initial Features
- Basic SQL query execution
- Excel file generation
- Simple data export
- Command-line interface

---

**Contact**: sql2excel.nodejs@gmail.com  
**Website**: sql2excel.com  
**License**: MIT License
