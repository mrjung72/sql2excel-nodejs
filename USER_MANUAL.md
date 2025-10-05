# SQL2Excel Tool User Manual

## 📖 Table of Contents
- [Overview](#overview)
- [Installation and Setup](#installation-and-setup)
- [Basic Usage](#basic-usage)
- [Query Definition File Structure](#query-definition-file-structure)
- [Advanced Features](#advanced-features)
- [Template Style System](#template-style-system)
- [Building and Deployment](#building-and-deployment)
- [CLI Command Reference](#cli-command-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

SQL2Excel is a powerful Node.js-based tool for generating Excel files from SQL query results with advanced styling, template support, and standalone executable distribution.

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
- 🔍 **File Validation**: Automatic filename validation and Korean character warnings
- 🎯 **Sheet-specific Styling**: Apply different styles to individual sheets
- 📦 **Standalone Executable**: Generate standalone .exe files for distribution without Node.js dependency
- 🌐 **Multi-language Support**: Korean and English release packages
- 🔧 **Release Automation**: Automated release package generation with proper documentation

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
3. Run `sql2excel.bat` for interactive menu
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

### Method 1: Interactive Batch File (Recommended for Windows Users)

Run the interactive batch file for a user-friendly menu:
```bash
sql2excel.bat
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

## 📋 Query Definition File Structure

### XML Format

#### Basic Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries maxRows="10000">
  <excel db="sampleDB" output="output/SalesReport.xlsx" style="modern">
  </excel>
  
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
    <var name="year">2024</var>
  </vars>
  
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="Active customer list">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region FROM Customers WHERE IsActive = 1
      ]]>
    </dynamicVar>
    <dynamicVar name="productPrices" type="key_value_pairs" description="Product prices">
      <![CDATA[
        SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <queryDefs>
    <queryDef id="customer_base" description="Base customer query">
      <![CDATA[
        SELECT CustomerID, CustomerName, Email, Phone
        FROM Customers WHERE IsActive = 1
      ]]>
    </queryDef>
  </queryDefs>
  
  <sheets>
    <sheet name="MonthlySales" use="true" aggregateColumn="Month" limit="1000" style="business">
      <![CDATA[
        SELECT MONTH(OrderDate) as Month, 
               SUM(TotalAmount) as Sales,
               COUNT(*) as OrderCount
        FROM Orders 
        WHERE YEAR(OrderDate) = ${year}
          AND CustomerID IN (${activeCustomers.CustomerID})
        GROUP BY MONTH(OrderDate)
        ORDER BY Month
      ]]>
    </sheet>
    
    <sheet name="CustomerList" use="true" db="erpDB">
      <queryRef ref="customer_base"/>
    </sheet>
  </sheets>
</queries>
```

### JSON Format

#### Basic Structure
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/SalesReport.xlsx",
    "style": "modern",
    "maxRows": 10000
  },
  "vars": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "year": "2024"
  },
  "dynamicVars": [
    {
      "name": "activeCustomers",
      "description": "Active customer list",
      "query": "SELECT CustomerID, CustomerName FROM Customers WHERE IsActive = 1"
    },
    {
      "name": "productPrices",
      "type": "key_value_pairs",
      "description": "Product prices",
      "query": "SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0"
    }
  ],
  "sheets": [
    {
      "name": "MonthlySales",
      "use": true,
      "aggregateColumn": "Month",
      "limit": 1000,
      "style": "business",
      "query": "SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales FROM Orders WHERE YEAR(OrderDate) = ${year} GROUP BY MONTH(OrderDate)"
    }
  ]
}
```

## 🎨 Template Style System

SQL2Excel includes a comprehensive template style system with pre-defined Excel styling templates.

### Available Template Styles

| Style ID | Name | Description |
|----------|------|-------------|
| `default` | 기본 스타일 | 기본 엑셀 스타일 |
| `modern` | 모던 스타일 | 현대적인 디자인 |
| `dark` | 다크 스타일 | 어두운 테마 |
| `colorful` | 컬러풀 스타일 | 다채로운 색상 |
| `minimal` | 미니멀 스타일 | 간결한 디자인 |
| `business` | 비즈니스 스타일 | 업무용 스타일 |
| `premium` | 프리미엄 스타일 | 고급스러운 디자인 |

### Using Template Styles

#### 1. Global Style (XML)
```xml
<excel db="sampleDB" output="output/Report.xlsx" style="modern">
```

#### 2. Global Style (JSON)
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/Report.xlsx",
    "style": "modern"
  }
}
```

#### 3. CLI Style Option
```bash
node src/excel-cli.js export --xml queries.xml --style modern
```

#### 4. Sheet-specific Style
```xml
<sheet name="SalesData" use="true" style="business">
  <![CDATA[
    SELECT * FROM Sales
  ]]>
</sheet>
```

### Customizing Template Styles

You can override template styles with custom styling:

```xml
<excel db="sampleDB" output="output/Report.xlsx" style="modern">
  <header>
    <font name="Calibri" size="14" color="FFFFFF" bold="true"/>
    <fill color="2E75B6"/>
  </header>
  <body>
    <font name="Calibri" size="11" color="000000"/>
    <fill color="F8F9FA"/>
  </body>
</excel>
```

## 🔄 Enhanced Dynamic Variables System

The tool supports advanced dynamic variables that can extract data at runtime and use it in queries.

### Variable Types

| Type | Description | Access Pattern | Default |
|------|-------------|----------------|---------|
| `column_identified` | Extract all columns as arrays keyed by column name | `${varName.columnName}` | ✅ Yes |
| `key_value_pairs` | Extract first two columns as key-value pairs | `${varName.key}` | No |

### Usage Examples

#### XML Configuration
```xml
<dynamicVars>
  <!-- Using column_identified (default) -->
  <dynamicVar name="customerData" description="Customer information">
    <![CDATA[
      SELECT CustomerID, CustomerName, Region FROM Customers
    ]]>
  </dynamicVar>
  
  <!-- Using key_value_pairs -->
  <dynamicVar name="productPrices" type="key_value_pairs" description="Product prices">
    <![CDATA[
      SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0
    ]]>
  </dynamicVar>
</dynamicVars>
```

#### Usage in Queries
```sql
-- In your sheet queries
SELECT * FROM Orders 
WHERE CustomerID IN (${customerData.CustomerID})
  AND ProductID IN (${productPrices.ProductID})
  AND Region IN (${customerData.Region})
```

### Variable Processing
1. **Execution Order**: Dynamic variables are processed before sheet queries
2. **Database Connection**: Uses the specified database connection
3. **Error Handling**: If a variable query fails, it's replaced with an empty result
4. **Performance**: Variables are executed once and cached for the entire export
5. **Debug Mode**: Enable with `DEBUG_VARIABLES=true` for detailed variable substitution

## 🎨 Advanced Features

### 1. Excel Styling

#### Font Styling
```xml
<font name="Arial" size="12" color="FFFFFF" bold="true" italic="false"/>
```

#### Fill Styling
```xml
<fill color="4F81BD" patternType="solid"/>
```

#### Border Styling
```xml
<border>
  <top style="thin" color="000000"/>
  <bottom style="thin" color="000000"/>
  <left style="thin" color="000000"/>
  <right style="thin" color="000000"/>
</border>
```

#### Alignment
```xml
<alignment horizontal="center" vertical="center" wrapText="true"/>
```

### 2. Query Reuse

#### Basic Query Reuse
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
</sheets>
```

#### Parameter Override Feature

You can use the same query definition across multiple sheets while applying different parameter values for each.

##### Parameter Override in XML
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
  
  <!-- All regions customers -->
  <sheet name="AllCustomers" use="true" queryRef="customer_base">
    <params>
      <param name="regionList">["Seoul", "Busan", "Daegu", "Incheon"]</param>
      <param name="startDate">2024-01-01</param>
    </params>
  </sheet>
</sheets>
```

##### Parameter Override in JSON
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
    },
    {
      "name": "BusanCustomers",
      "use": true,
      "queryRef": "customer_base",
      "params": {
        "regionList": ["Busan"],
        "startDate": "2024-03-01"
      }
    }
  ]
}
```

##### Parameter Priority
1. **Sheet-specific parameters** (highest priority)
2. **Global variables** (vars section)
3. **Default values** (hardcoded in query definition)

##### Supported Parameter Types
- **String**: `"Seoul"`
- **Number**: `1000`
- **Array**: `["Seoul", "Busan"]`
- **Boolean**: `true`, `false`
- **Date**: `"2024-01-01"`


### 3. Separate Table of Contents

Generate a standalone TOC file:

#### XML Configuration
```xml
<queries>
  <excel db="sampleDB" output="output/Report.xlsx">
```

#### CLI Option
```bash
node src/excel-cli.js export --xml queries.xml
```

### 4. File Validation

The tool automatically validates filenames and warns about Korean characters:

```
⚠️  경고: 파일명에 한글이 포함되어 있습니다: 샘플쿼리.xml
   💡 권장사항: 파일명을 영문으로 변경하세요.
   💡 예시: "샘플쿼리.xml" → "sample-query.xml"
```

### 5. Database Source Information

Each sheet includes database source information:

```
📊 출처: sampleDB DB
```

## 📦 Building and Deployment

### Building Standalone Executable

#### 1. Build Single Executable
```bash
# Build versioned executable (e.g., sql2excel.exe)
npm run build
```

This creates a standalone executable in the `dist/` directory that includes:
- All Node.js dependencies
- Source code
- Configuration templates
- Style templates

#### 2. Create Release Package
```bash
# Generate complete release package
npm run release
```

This creates a comprehensive release package including:
- Standalone executable (`sql2excel-v{version}.exe`)
- Interactive batch file (`sql2excel.bat`)
- Configuration files (`config/dbinfo.json`)
- Sample query files (`queries/`)
- Style templates (`templates/`)
- Documentation (`user_manual/`)
- License and changelog

#### 3. Clean Build Artifacts
```bash
# Remove all build artifacts and release packages
npm run clean
```

### Release Package Structure

```
sql2excel-v{version}/
├── sql2excel.exe          # Standalone executable
├── sql2excel.bat                  # Interactive batch interface
├── config/
│   └── dbinfo.json               # Database configuration
├── queries/                      # Sample query files
│   ├── queries-sample.xml
│   ├── queries-sample.json
│   └── ...
├── templates/
│   └── excel-styles.xml          # Style templates
├── user_manual/
│   ├── USER_MANUAL.md            # This manual
│   └── CHANGELOG.md              # Version history
├── README.md                     # Quick start guide
├── RELEASE_INFO.txt              # Release information
└── LICENSE                       # License file
```

### Distribution Options

#### Option 1: Standalone Package
- **Target**: End users without Node.js
- **Contents**: Complete executable package
- **Usage**: Run `sql2excel.bat` or use `sql2excel-v{version}.exe` directly

#### Option 2: Source Code Package
- **Target**: Developers and advanced users
- **Contents**: Full source code with Node.js dependencies
- **Usage**: `npm install` then use npm scripts or Node.js commands

### Multi-language Support

The release system supports multiple language packages:

#### Korean Package (`sql2excel-v{version}-ko/`)
- Korean batch interface
- Korean documentation (`배포정보.txt`)
- Korean error messages and prompts

#### English Package (`sql2excel-v{version}-en/`)
- English batch interface
- English documentation (`RELEASE_INFO.txt`)
- English error messages and prompts

## 🔧 CLI Command Reference

### Main Commands

| Command | Description | Options |
|---------|-------------|---------|
| `export` | Generate Excel file | `--xml`, `--query`, `--style`, `--var` |
| `validate` | Validate configuration file | `--xml`, `--query` |
| `list-dbs` | List available databases | None |
| `list-styles` | List available template styles | None |

### Export Options

| Option | Description | Example |
|--------|-------------|---------|
| `--xml <file>` | XML query definition file | `--xml queries.xml` |
| `--query <file>` | JSON query definition file | `--query queries.json` |
| `--style <style>` | Template style to use | `--style modern` |
| `--var <key=value>` | Set variable value | `--var "year=2024"` |
| `--config <file>` | Database config file | `--config config/dbinfo.json` |
| `--db <dbname>` | Default database | `--db sampleDB` |

### Examples

#### Development Environment
```bash
# Basic export with XML
node src/excel-cli.js export --xml queries/sales.xml

# Export with template style
node src/excel-cli.js export --xml queries/sales.xml --style business

# Export with variables
node src/excel-cli.js export --xml queries/sales.xml --var "year=2024" --var "region=North"

# Validate configuration
node src/excel-cli.js validate --xml queries/sales.xml

# List available styles
node src/excel-cli.js list-styles
```

#### Standalone Executable
```bash
# Basic export with XML
sql2excel.exe export --xml queries/sales.xml

# Export with template style
sql2excel.exe export --xml queries/sales.xml --style business

# Export with variables
sql2excel.exe export --xml queries/sales.xml --var "year=2024" --var "region=North"

# Validate configuration
sql2excel.exe validate --xml queries/sales.xml

# List available styles
sql2excel.exe list-styles
```

#### Interactive Batch File
```bash
# Run interactive menu
sql2excel.bat

# Follow the prompts:
# 1. Select option (1-5)
# 2. Enter file paths when prompted
# 3. Review results
```

## 📊 Examples

### Complete XML Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries maxRows="5000">
  <excel db="sampleDB" output="output/SalesReport.xlsx" style="business">
  </excel>
  
  <vars>
    <var name="year">2024</var>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
  </vars>
  
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="Active customer list">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region 
        FROM Customers 
        WHERE IsActive = 1 AND Region IN ('North', 'South')
      ]]>
    </dynamicVar>
    <dynamicVar name="productCategories" type="key_value_pairs" description="Product categories">
      <![CDATA[
        SELECT CategoryID, CategoryName 
        FROM Categories 
        WHERE IsActive = 1
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <sheets>
    <sheet name="MonthlySales" use="true" aggregateColumn="Month" limit="1000">
      <![CDATA[
        SELECT 
          MONTH(OrderDate) as Month,
          SUM(TotalAmount) as Sales,
          COUNT(*) as OrderCount,
          AVG(TotalAmount) as AvgOrderValue
        FROM Orders 
        WHERE YEAR(OrderDate) = ${year}
          AND CustomerID IN (${activeCustomers.CustomerID})
        GROUP BY MONTH(OrderDate)
        ORDER BY Month
      ]]>
    </sheet>
    
    <sheet name="CustomerAnalysis" use="true" style="modern">
      <![CDATA[
        SELECT 
          c.CustomerID,
          c.CustomerName,
          c.Region,
          COUNT(o.OrderID) as TotalOrders,
          SUM(o.TotalAmount) as TotalSpent,
          AVG(o.TotalAmount) as AvgOrderValue
        FROM Customers c
        LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
        WHERE c.CustomerID IN (${activeCustomers.CustomerID})
          AND (o.OrderDate IS NULL OR YEAR(o.OrderDate) = ${year})
        GROUP BY c.CustomerID, c.CustomerName, c.Region
        ORDER BY TotalSpent DESC
      ]]>
    </sheet>
    
    <sheet name="ProductSummary" use="true" limit="500">
      <![CDATA[
        SELECT 
          p.ProductID,
          p.ProductName,
          pc.CategoryName,
          SUM(od.Quantity) as TotalSold,
          SUM(od.Quantity * od.UnitPrice) as TotalRevenue
        FROM Products p
        JOIN Categories pc ON p.CategoryID = pc.CategoryID
        LEFT JOIN OrderDetails od ON p.ProductID = od.ProductID
        LEFT JOIN Orders o ON od.OrderID = o.OrderID
        WHERE pc.CategoryID IN (${productCategories.CategoryID})
          AND (o.OrderDate IS NULL OR YEAR(o.OrderDate) = ${year})
        GROUP BY p.ProductID, p.ProductName, pc.CategoryName
        ORDER BY TotalRevenue DESC
      ]]>
    </sheet>
  </sheets>
</queries>
```

### Complete JSON Example
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/SalesReport.xlsx",
    "style": "business",
    "maxRows": 5000
  },
  "vars": {
    "year": "2024",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "dynamicVars": [
    {
      "name": "activeCustomers",
      "description": "Active customer list",
      "query": "SELECT CustomerID, CustomerName FROM Customers WHERE IsActive = 1"
    },
    {
      "name": "productCategories",
      "type": "key_value_pairs",
      "description": "Product categories",
      "query": "SELECT CategoryID, CategoryName FROM Categories WHERE IsActive = 1"
    }
  ],
  "sheets": [
    {
      "name": "MonthlySales",
      "use": true,
      "aggregateColumn": "Month",
      "limit": 1000,
      "query": "SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales FROM Orders WHERE YEAR(OrderDate) = ${year} GROUP BY MONTH(OrderDate)"
    },
    {
      "name": "CustomerAnalysis",
      "use": true,
      "style": "modern",
      "query": "SELECT CustomerID, CustomerName, COUNT(OrderID) as TotalOrders FROM Customers c LEFT JOIN Orders o ON c.CustomerID = o.CustomerID WHERE YEAR(o.OrderDate) = ${year} GROUP BY CustomerID, CustomerName"
    }
  ]
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Errors
**Problem**: Cannot connect to database
**Solution**: 
- Check `config/dbinfo.json` configuration
- Verify network connectivity
- Ensure proper database permissions

#### 2. Variable Resolution Errors
**Problem**: Variables not resolving correctly
**Solution**:
- Check variable syntax (${varName})
- Verify variable names match exactly
- Check for typos in variable references
- Enable debug mode: `DEBUG_VARIABLES=true`

#### 3. Dynamic Variable Errors
**Problem**: Dynamic variable not resolving
**Solution**:
- Check variable query syntax
- Verify variable name in usage
- Check database permissions for variable queries
- Review variable type configuration

#### 4. File Permission Errors
**Problem**: Cannot write output file
**Solution**:
- Check output directory permissions
- Ensure output directory exists
- Close any open Excel files

#### 5. Memory Issues
**Problem**: Out of memory errors with large datasets
**Solution**:
- Use `limit` attribute to restrict row count
- Process data in smaller chunks
- Increase Node.js memory limit

#### 6. Korean Filename Warnings
**Problem**: Filename contains Korean characters
**Solution**:
- Rename files to use English characters only
- Use descriptive English names
- Avoid special characters in filenames

#### 7. Template Style Not Found
**Problem**: Template style not loading
**Solution**:
- Check `templates/excel-styles.xml` file exists
- Verify style ID spelling
- Use `list-styles` command to see available styles

#### 8. Executable Not Found (Standalone)
**Problem**: `sql2excel-v*.exe file not found` error
**Solution**:
- Ensure the executable file is in the same directory as `sql2excel.bat`
- Check that the executable name matches the version (e.g., `sql2excel.exe`)
- Re-extract the release package if files are missing

#### 9. PowerShell Execution Policy (Windows)
**Problem**: PowerShell execution policy prevents batch file execution
**Solution**:
- Run Command Prompt as Administrator
- Use `cmd` instead of PowerShell
- Or set PowerShell execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### 10. Missing Dependencies (Development)
**Problem**: Module not found errors during development
**Solution**:
- Run `npm install` to install dependencies
- Check Node.js version (requires 16.0+)
- Clear npm cache: `npm cache clean --force`

### Debug Mode
Enable debug mode to see detailed variable substitution:

#### Development Environment
```bash
DEBUG_VARIABLES=true node src/excel-cli.js export --xml ./queries/sample.xml
```

#### Standalone Executable
```bash
# Set environment variable then run
set DEBUG_VARIABLES=true
sql2excel.exe export --xml ./queries/sample.xml
```

### Error Recovery
1. **Check logs**: Review console output for error details
2. **Validate configuration**: Use `validate` command
3. **Test connections**: Use `list-dbs` command
4. **Simplify queries**: Test with simple queries first
5. **Check file permissions**: Ensure proper file access rights

## 📞 Support

- **Documentation**: Refer to project documentation
- **Issues**: Report issues via GitHub
- **Email**: sql2excel.nodejs@gmail.com
- **Website**: www.sql2excel.com
