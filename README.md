# SQL2Excel - Generate Excel Files from SQL Query Results

A Node.js-based tool for generating Excel files from SQL query results.

## 🎯 Key Features

- 📊 **Multi-Sheet Support**: Save multiple SQL query results in separate sheets within one Excel file
- 🎨 **Excel Styling**: Detailed styling for header/data areas including fonts, colors, borders, alignment
- 🔗 **Multiple DB Connections**: Use different database connections for each sheet
- 📝 **Variable System**: Use variables in queries for dynamic query generation
- 🔄 **Dynamic Variables**: Extract values from database in real-time for dynamic query generation
- 🔄 **Query Reuse**: Define common queries and reuse them across multiple sheets
- ⚙️ **Parameter Override**: Override query definition parameters for each sheet
- 📋 **Auto Table of Contents**: Automatically generate table of contents sheet with hyperlinks
- 📊 **Aggregation Features**: Automatic aggregation and display of counts by specified column values
- 🚦 **Query Limits**: Row count limiting for large data processing
- 🖥️ **CLI Interface**: Simple command-line tool execution
- 🪟 **Windows Batch Files**: Batch files for Windows users
- 📄 **XML/JSON Support**: Flexible configuration file format support

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Database Configuration
Configure database connection information in `config/dbinfo.json`:
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
    }
  }
}
```

### 3. Generate Excel File
```bash
# Execute via CLI command
node src/excel-cli.js export --xml ./queries/queries-sample.xml

# Or execute via NPM script
npm run export -- --xml ./queries/queries-sample.xml

# Or execute via Windows batch file
실행하기.bat
```

### 4. Main CLI Commands
```bash
# Generate Excel file
node src/excel-cli.js export --xml ./queries/sample.xml

# Validate query file
node src/excel-cli.js validate --xml ./queries/sample.xml

# Test database connection
node src/excel-cli.js list-dbs

# Help
node src/excel-cli.js help
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

