# SQL2Excel - Generate Excel Files from SQL Query Results

A Node.js-based tool for generating Excel files from SQL query results.

### Key Features
- 📊 **Multi-Sheet Support**: Save multiple SQL query results in separate sheets within one Excel file
- 🎨 **Template Style System**: Pre-defined Excel styling templates for consistent design with 7 built-in styles
- 🔗 **Multiple DB Connections**: Use different database connections for each sheet
- 📝 **Variable System**: Use variables in queries for dynamic query generation
- 🔄 **Enhanced Dynamic Variables**: Extract values from database in real-time with advanced processing
- 🔄 **Query Reuse**: Define common queries and reuse them across multiple sheets
- ⚙️ **Parameter Override**: Override query definition parameters for each sheet with different values
- 📋 **Auto Table of Contents**: Automatically generate table of contents sheet with hyperlinks
- 📊 **Aggregation Features**: Automatic aggregation and display of counts by specified column values
- 🚦 **Query Limits**: Row count limiting for large data processing
- 🖥️ **CLI Interface**: Simple command-line tool execution
- 🪟 **Windows Batch Files**: Interactive batch files for Windows users
- 📄 **XML/JSON Support**: Flexible configuration file format support
- 🎯 **Sheet-specific Styling**: Apply different styles to individual sheets
- 📦 **Standalone Executable**: Generate standalone .exe files for distribution without Node.js dependency
- 🌐 **Multi-language Support**: Korean and English release packages
- 🔧 **Release Automation**: Automated release package generation with proper documentation
- 🕒 **Creation Timestamp**: Display creation timestamp on each Excel sheet
- ⏰ **Custom DateTime Variables**: Support for 19 timezones worldwide with custom format (`${DATE.UTC:YYYY-MM-DD}`, `${DATE.KST:YYYY년 MM월 DD일}`, `${DATE.EST:YYYY-MM-DD HH:mm}`, etc.)
- 📋 **SQL Query Formatting**: Preserve original SQL formatting with line breaks in Table of Contents
- 🔧 **Input Validation**: Automatic whitespace trimming for file path inputs

## 🚀 Quick Start

## 🛠️ Installation and Setup

### 1. System Requirements

#### For Development/Source Code Usage
- Node.js 16.0 or higher
- SQL Server 2012 or higher
- Appropriate database permissions

#### For Standalone Executable Usage
- Windows 10 or higher (64-bit)
- SQL Server 2012 or higher
- Appropriate database permissions
- **No Node.js installation required**

### 2. Installation Options

#### Option A: Development Installation
```bash
# Clone or download the source code
npm install

# Build standalone executable (optional)
npm run build
```

#### Option B: Standalone Executable
1. Download the release package from the releases section
2. Extract to your desired directory
3. Run interactive menu:
   - English: Run `run.bat`
   - Korean: Run `실행하기.bat`
4. Or use `sql2excel-v{version}.exe` directly

### 3. Database Connection Setup
Create `config/dbinfo.json` file:
```json
{
  "dbs": {
    "sampleDB": {
      "server": "localhost",
      "port": 1433,
      "database": "SampleDB",
      "user": "sa",
      "password": "yourpassword",
      "options": {
        "encrypt": false,
        "trustServerCertificate": true
      }
    },
    "erpDB": {
      "server": "erp-server.com",
      "port": 1433,
      "database": "ERP_Database",
      "user": "erp_user",
      "password": "erp_password",
      "options": {
        "encrypt": true,
        "trustServerCertificate": false
      }
    }
  }
}
```

## 🚀 Basic Usage

### Language Settings

The tool supports Korean and English through environment variables:

#### Development Environment
- **English**: Run `run.bat` (automatically sets `LANGUAGE=en`)
- **Korean**: Run `실행하기.bat` (automatically sets `LANGUAGE=kr`)

#### Release Package
- **English**: Run `run.bat`
- **Korean**: Run `실행하기.bat`

> 💡 **Note**: Language is controlled via the `LANGUAGE` environment variable. Default is English (en).

### Method 1: Interactive Batch File (Recommended for Windows Users)

#### Development Environment
```bash
# English version
run.bat

# Korean version
실행하기.bat
```

#### Release Package
```bash
# English version
run.bat

# Korean version
실행하기.bat
```

The interactive menu provides:
1. **Validate Query Definition File** - Check your XML/JSON files for errors
2. **Test Database Connection** - Verify database connectivity
3. **Generate Excel File (XML File)** - Export using XML query definitions
4. **Generate Excel File (JSON File)** - Export using JSON query definitions
5. **Show Help** - Display detailed help information

### Method 2: Direct CLI Command Execution

#### For Development (Node.js)
```bash
# Using XML query file
node src/excel-cli.js export --xml ./queries/sample-queries.xml

# Using JSON query file
node src/excel-cli.js export --query ./queries/sample-queries.json

# Execute with variables
node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

# Using template style
node src/excel-cli.js export --xml ./queries/sample-queries.xml --style modern
```

#### For Standalone Executable
```bash
# Using XML query file
sql2excel.exe export --xml ./queries/sample-queries.xml

# Using JSON query file
sql2excel.exe export --query ./queries/sample-queries.json

# Execute with variables
sql2excel.exe export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

# Using template style
sql2excel.exe export --xml ./queries/sample-queries.xml --style modern
```

### Method 3: NPM Scripts (Development Only)
```bash
# Export to Excel
npm run export -- --xml ./queries/sample-queries.xml

# Validate configuration
npm run validate -- --xml ./queries/sample-queries.xml

# Test database connection
npm run list-dbs

# Build standalone executable
npm run build

# Create release package
npm run release
```

### Common Commands

#### Validate Query File
```bash
# Development
node src/excel-cli.js validate --xml ./queries/sample-queries.xml

# Standalone
sql2excel.exe validate --xml ./queries/sample-queries.xml
```

#### Test Database Connection
```bash
# Development
node src/excel-cli.js list-dbs

# Standalone
sql2excel.exe list-dbs
```

#### List Available Template Styles
```bash
# Development
node src/excel-cli.js list-styles

# Standalone
sql2excel.exe list-styles
```


## 📚 Documentation

For detailed usage and advanced features, refer to the following documents:

- **📖 [User Manual](USER_MANUAL.md)** - Complete usage guide
- **📋 [Version History](CHANGELOG.md)** - Version-specific changes

## 💡 Usage Examples

### XML Configuration File Example (with Dynamic Variables)
```xml
<queries>
  <excel db="sampleDB" output="output/SalesReport.xlsx">
    <header>
      <font name="Arial" size="12" color="FFFFFF" bold="true"/>
      <fill color="4F81BD"/>
    </header>
  </excel>
  
  <!-- Regular variables -->
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
  </vars>
  
  <!-- Dynamic variables -->
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="Active customer list">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region
        FROM Customers WHERE IsActive = 1
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <sheet name="MonthlySales" use="true" aggregateColumn="Month">
    <![CDATA[
      SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales
      FROM Orders 
      WHERE YEAR(OrderDate) = 2024
        AND CustomerID IN (${activeCustomers.CustomerID})
      GROUP BY MONTH(OrderDate)
    ]]>
  </sheet>
</queries>
```

### Variable Usage Example
```bash
node src/excel-cli.js export --xml ./queries/sales-report.xml \
  --var "startDate=2024-01-01" \
  --var "endDate=2024-06-30"
```

## Dynamic Variables

The tool supports dynamic variables that can extract data at runtime and use it in queries:

### Variable Types

| Type | Description | Access Pattern | Default |
|------|-------------|----------------|---------|
| `column_identified` | Extract all columns as arrays keyed by column name | `${varName.columnName}` | ✅ Yes |
| `key_value_pairs` | Extract first two columns as key-value pairs | `${varName.key}` | No |

### Usage Examples

```xml
<!-- Using column_identified (default) -->
<dynamicVar name="customerData" description="Customer information">
  <![CDATA[
    SELECT CustomerID, CustomerName, Region FROM Customers
  ]]>
  <!-- type omitted - defaults to column_identified -->
</dynamicVar>

<!-- Using key_value_pairs -->
<dynamicVar name="statusMapping" description="Status mapping">
  <![CDATA[
    SELECT StatusCode, StatusName FROM StatusCodes
  ]]>
  <type>key_value_pairs</type>
</dynamicVar>
```

```sql
-- In your sheet queries
SELECT * FROM Orders 
WHERE CustomerID IN (${customerData.CustomerID})
  AND Status IN (${statusMapping.StatusCode})
```

## 🔧 Environment Requirements

- Node.js 16.0 or higher
- SQL Server 2012 or higher
- Appropriate database permissions

## 📞 Support

- **Website**: www.sql2excel.com
- **Email**: sql2excel.nodejs@gmail.com

