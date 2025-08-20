# SQL2Excel Tool User Manual

## 📖 Table of Contents
- [Overview](#overview)
- [Installation and Setup](#installation-and-setup)
- [Basic Usage](#basic-usage)
- [Query Definition File Structure](#query-definition-file-structure)
- [Advanced Features](#advanced-features)
- [CLI Command Reference](#cli-command-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

SQL2Excel is a Node.js-based tool for generating Excel files from SQL query results.

### Key Features
- 📊 **Multi-Sheet Support**: Save multiple SQL query results in separate sheets within one Excel file
- 🎨 **Excel Styling**: Detailed styling for header/data areas including fonts, colors, borders, alignment
- 🔗 **Multiple DB Connections**: Use different database connections for each sheet
- 📝 **Variable System**: Use variables in queries for dynamic query generation
- 🔄 **Dynamic Variables**: Extract values from database in real-time for dynamic query generation
- 🔄 **Query Reuse**: Define common queries and reuse them across multiple sheets
- 📋 **Auto Table of Contents**: Automatically generate table of contents sheet with hyperlinks
- 📊 **Aggregation Features**: Automatic aggregation and display of counts by specified column values
- 🚦 **Query Limits**: Row count limiting for large data processing
- 🖥️ **CLI Interface**: Simple command-line tool execution
- 🪟 **Windows Batch Files**: Batch files for Windows users
- 📄 **XML/JSON Support**: Flexible configuration file format support

## 🛠️ Installation and Setup

### 1. System Requirements
- Node.js 16.0 or higher
- SQL Server 2012 or higher
- Appropriate database permissions

### 2. Installation
```bash
npm install
```

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

### CLI Command Execution

#### 1. Generate Excel File
```bash
# Using XML query file
node src/excel-cli.js export --xml ./queries/sample-queries.xml

# Using JSON query file
node src/excel-cli.js export --query ./queries/sample-queries.json

# Execute with variables
node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"
```

#### 2. Validate Query File
```bash
node src/excel-cli.js validate --xml ./queries/sample-queries.xml
```

#### 3. Test Database Connection
```bash
node src/excel-cli.js list-dbs
```

### NPM Script Usage
```bash
# Generate Excel file
npm run export -- --xml ./queries/sample-queries.xml

# Validate query file
npm run validate -- --xml ./queries/sample-queries.xml
```

### Windows Batch File Usage
```bash
# Interactive execution
실행하기.bat

# Direct execution
export-xml.bat
export-json.bat
```

## 📋 Query Definition File Structure

### XML Format (Recommended)

#### Basic Structure
```xml
<queries>
  <excel db="database_name" output="output/file.xlsx">
    <header>
      <!-- Header styling -->
    </header>
    <data>
      <!-- Data styling -->
    </data>
  </excel>
  
  <vars>
    <!-- Static variables -->
  </vars>
  
  <dynamicVars>
    <!-- Dynamic variables -->
  </dynamicVars>
  
  <sheets>
    <!-- Sheet definitions -->
  </sheets>
</queries>
```

#### Excel Configuration
```xml
<excel db="sampleDB" output="output/SalesReport.xlsx">
  <header>
    <font name="Arial" size="12" color="FFFFFF" bold="true"/>
    <fill color="4F81BD"/>
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

#### Variable Definition
```xml
<vars>
  <var name="startDate">2024-01-01</var>
  <var name="endDate">2024-12-31</var>
  <var name="department">IT</var>
</vars>
```

#### Dynamic Variables
```xml
<dynamicVars>
  <!-- Using column_identified (default) -->
  <dynamicVar name="activeCustomers" description="Active customer list">
    <![CDATA[
      SELECT CustomerID, CustomerName, Region
      FROM Customers WHERE IsActive = 1
    ]]>
  </dynamicVar>
  
  <!-- Using key_value_pairs -->
  <dynamicVar name="statusMapping" type="key_value_pairs" description="Status mapping">
    <![CDATA[
      SELECT StatusCode, StatusName
      FROM StatusCodes WHERE IsActive = 1
    ]]>
  </dynamicVar>
</dynamicVars>
```

#### Sheet Definition
```xml
<sheet name="MonthlySales" use="true" aggregateColumn="Month" limit="1000">
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
```

### JSON Format

#### Basic Structure
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/SalesReport.xlsx",
    "header": {
      "font": {
        "name": "Arial",
        "size": 12,
        "color": "FFFFFF",
        "bold": true
      },
      "fill": {
        "color": "4F81BD"
      }
    }
  },
  "vars": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "dynamicVars": [
    {
      "name": "activeCustomers",
      "description": "Active customer list",
      "query": "SELECT CustomerID, CustomerName FROM Customers WHERE IsActive = 1"
    }
  ],
  "sheets": [
    {
      "name": "MonthlySales",
      "use": true,
      "aggregateColumn": "Month",
      "query": "SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales FROM Orders WHERE YEAR(OrderDate) = ${year} GROUP BY MONTH(OrderDate)"
    }
  ]
}
```

## 🔄 Dynamic Variables System

The tool supports dynamic variables that can extract data at runtime and use it in queries.

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

### 3. Aggregation Features
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

### 4. Auto Table of Contents
The tool automatically generates a table of contents sheet with:
- Sheet names as hyperlinks
- Row counts for each sheet
- Creation timestamp
- File information

## 🖥️ CLI Command Reference

### Main Commands

#### Export Excel File
```bash
node src/excel-cli.js export --xml <file>
node src/excel-cli.js export --query <file>
```

**Options:**
- `--xml <file>`: XML query definition file
- `--query <file>`: JSON query definition file
- `--var <name=value>`: Set variable value (multiple allowed)
- `--output <file>`: Override output file path
- `--verbose`: Enable verbose logging

#### Validate Query File
```bash
node src/excel-cli.js validate --xml <file>
node src/excel-cli.js validate --query <file>
```

#### List Databases
```bash
node src/excel-cli.js list-dbs
```

#### Help
```bash
node src/excel-cli.js help
node src/excel-cli.js help <command>
```

### Examples
```bash
# Basic export
node src/excel-cli.js export --xml ./queries/sales-report.xml

# Export with variables
node src/excel-cli.js export --xml ./queries/sales-report.xml \
  --var "year=2024" \
  --var "department=IT"

# Validate configuration
node src/excel-cli.js validate --xml ./queries/sales-report.xml

# List available databases
node src/excel-cli.js list-dbs
```

## 📝 Examples

### Complete XML Example
```xml
<queries>
  <excel db="sampleDB" output="output/SalesReport.xlsx">
    <header>
      <font name="Arial" size="12" color="FFFFFF" bold="true"/>
      <fill color="4F81BD"/>
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
  
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
  </vars>
  
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="Active customer list">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region
        FROM Customers WHERE IsActive = 1
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <sheets>
    <sheet name="MonthlySales" use="true" aggregateColumn="Month">
      <![CDATA[
        SELECT MONTH(OrderDate) as Month, 
               SUM(TotalAmount) as Sales,
               COUNT(*) as OrderCount
        FROM Orders 
        WHERE YEAR(OrderDate) = 2024
          AND CustomerID IN (${activeCustomers.CustomerID})
        GROUP BY MONTH(OrderDate)
        ORDER BY Month
      ]]>
    </sheet>
    
    <sheet name="CustomerOrders" use="true" limit="1000">
      <![CDATA[
        SELECT c.CustomerName, o.OrderDate, o.TotalAmount
        FROM Orders o
        INNER JOIN Customers c ON o.CustomerID = c.CustomerID
        WHERE o.OrderDate BETWEEN '${startDate}' AND '${endDate}'
          AND c.CustomerID IN (${activeCustomers.CustomerID})
        ORDER BY o.OrderDate DESC
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
    "header": {
      "font": {
        "name": "Arial",
        "size": 12,
        "color": "FFFFFF",
        "bold": true
      },
      "fill": {
        "color": "4F81BD"
      }
    }
  },
  "vars": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "dynamicVars": [
    {
      "name": "activeCustomers",
      "description": "Active customer list",
      "query": "SELECT CustomerID, CustomerName FROM Customers WHERE IsActive = 1"
    }
  ],
  "sheets": [
    {
      "name": "MonthlySales",
      "use": true,
      "aggregateColumn": "Month",
      "query": "SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales FROM Orders WHERE YEAR(OrderDate) = 2024 GROUP BY MONTH(OrderDate)"
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

#### 3. Dynamic Variable Errors
**Problem**: Dynamic variable not resolving
**Solution**:
- Check variable query syntax
- Verify variable name in usage
- Check database permissions for variable queries

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

### Debug Mode
Enable debug mode to see detailed variable substitution:
```bash
DEBUG_VARIABLES=true node src/excel-cli.js export --xml ./queries/sample.xml
```

### Error Recovery
1. **Check logs**: Review console output for error details
2. **Validate configuration**: Use `validate` command
3. **Test connections**: Use `list-dbs` command
4. **Simplify queries**: Test with simple queries first

## 📞 Support

- **Documentation**: Refer to project documentation
- **Issues**: Report issues via GitHub
- **Email**: sql2excel.nodejs@gmail.com
- **Website**: sql2excel.com
