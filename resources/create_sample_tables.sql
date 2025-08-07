-- ========================================
-- 샘플 테이블 생성 스크립트
-- Microsoft SQL Server용
-- ========================================
-- 
-- 시간 설정 참고:
-- SQL Server에서 GETDATE()는 서버의 현지 시각을 반환합니다.
-- 한국 표준시(KST)로 설정하려면 서버 타임존을 확인하세요.
-- 
-- ========================================

USE [master]
GO

-- 샘플 데이터베이스 생성 (존재하지 않는 경우)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SampleDB')
BEGIN
    CREATE DATABASE [SampleDB]
END
GO

USE [SampleDB]
GO

-- ========================================
-- 1. Customers 테이블 생성
-- ========================================

-- 기존 테이블이 있으면 삭제
IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL
    DROP TABLE dbo.Customers
GO

CREATE TABLE dbo.Customers (
    CustomerID int IDENTITY(1,1) NOT NULL,
    CustomerCode nvarchar(20) NOT NULL,
    CustomerName nvarchar(100) NOT NULL,
    ContactName nvarchar(50) NULL,
    Email nvarchar(100) NULL,
    Phone nvarchar(20) NULL,
    Address nvarchar(200) NULL,
    City nvarchar(50) NULL,
    Region nvarchar(50) NULL,
    PostalCode nvarchar(10) NULL,
    Country nvarchar(50) NULL,
    CustomerType nvarchar(20) DEFAULT 'Regular',
    CreditLimit decimal(15,2) DEFAULT 0,
    IsActive bit DEFAULT 1,
    CreatedDate datetime2(7) DEFAULT GETDATE(),
    LastUpdated datetime2(7) DEFAULT GETDATE(),
    
    CONSTRAINT PK_Customers PRIMARY KEY CLUSTERED (CustomerID ASC),
    CONSTRAINT UK_Customers_Code UNIQUE (CustomerCode)
)
GO

-- 인덱스 생성
CREATE NONCLUSTERED INDEX IX_Customers_Name ON dbo.Customers (CustomerName)
CREATE NONCLUSTERED INDEX IX_Customers_City ON dbo.Customers (City)
CREATE NONCLUSTERED INDEX IX_Customers_Region ON dbo.Customers (Region)
CREATE NONCLUSTERED INDEX IX_Customers_Type ON dbo.Customers (CustomerType)
GO

-- ========================================
-- 2. Orders 테이블 생성
-- ========================================

-- 기존 테이블이 있으면 삭제
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL
    DROP TABLE dbo.Orders
GO

CREATE TABLE dbo.Orders (
    OrderID int IDENTITY(1,1) NOT NULL,
    OrderNumber nvarchar(30) NOT NULL,
    CustomerID int NOT NULL,
    OrderDate datetime2(7) NOT NULL,
    RequiredDate datetime2(7) NULL,
    ShippedDate datetime2(7) NULL,
    OrderStatus nvarchar(20) DEFAULT 'Pending',
    ShipVia nvarchar(50) NULL,
    Freight decimal(10,2) DEFAULT 0,
    ShipName nvarchar(100) NULL,
    ShipAddress nvarchar(200) NULL,
    ShipCity nvarchar(50) NULL,
    ShipRegion nvarchar(50) NULL,
    ShipPostalCode nvarchar(10) NULL,
    ShipCountry nvarchar(50) NULL,
    SubTotal decimal(15,2) DEFAULT 0,
    TaxAmount decimal(10,2) DEFAULT 0,
    TotalAmount decimal(15,2) DEFAULT 0,
    PaymentMethod nvarchar(30) NULL,
    PaymentStatus nvarchar(20) DEFAULT 'Unpaid',
    EmployeeID int NULL,
    Notes nvarchar(500) NULL,
    CreatedDate datetime2(7) DEFAULT GETDATE(),
    LastUpdated datetime2(7) DEFAULT GETDATE(),
    
    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderID ASC),
    CONSTRAINT UK_Orders_Number UNIQUE (OrderNumber),
    CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerID) 
        REFERENCES dbo.Customers (CustomerID)
)
GO

-- 인덱스 생성
CREATE NONCLUSTERED INDEX IX_Orders_CustomerID ON dbo.Orders (CustomerID)
CREATE NONCLUSTERED INDEX IX_Orders_OrderDate ON dbo.Orders (OrderDate)
CREATE NONCLUSTERED INDEX IX_Orders_Status ON dbo.Orders (OrderStatus)
CREATE NONCLUSTERED INDEX IX_Orders_PaymentStatus ON dbo.Orders (PaymentStatus)
CREATE NONCLUSTERED INDEX IX_Orders_ShippedDate ON dbo.Orders (ShippedDate)
GO

-- ========================================
-- 3. OrderDetails 테이블 생성 (추가)
-- ========================================

-- 기존 테이블이 있으면 삭제
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NOT NULL
    DROP TABLE dbo.OrderDetails
GO

CREATE TABLE dbo.OrderDetails (
    OrderDetailID int IDENTITY(1,1) NOT NULL,
    OrderID int NOT NULL,
    ProductCode nvarchar(30) NOT NULL,
    ProductName nvarchar(100) NOT NULL,
    UnitPrice decimal(10,2) NOT NULL,
    Quantity int NOT NULL,
    Discount decimal(5,2) DEFAULT 0,
    LineTotal AS (UnitPrice * Quantity * (1 - Discount/100)) PERSISTED,
    
    CONSTRAINT PK_OrderDetails PRIMARY KEY CLUSTERED (OrderDetailID ASC),
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderID) 
        REFERENCES dbo.Orders (OrderID) ON DELETE CASCADE
)
GO

-- 인덱스 생성
CREATE NONCLUSTERED INDEX IX_OrderDetails_OrderID ON dbo.OrderDetails (OrderID)
CREATE NONCLUSTERED INDEX IX_OrderDetails_ProductCode ON dbo.OrderDetails (ProductCode)
GO

-- ========================================
-- 4. 뷰 생성 (주문 요약)
-- ========================================

IF OBJECT_ID('dbo.vw_OrderSummary', 'V') IS NOT NULL
    DROP VIEW dbo.vw_OrderSummary
GO

CREATE VIEW dbo.vw_OrderSummary
AS
SELECT 
    o.OrderID,
    o.OrderNumber,
    o.OrderDate,
    c.CustomerCode,
    c.CustomerName,
    c.City as CustomerCity,
    c.Region as CustomerRegion,
    o.OrderStatus,
    o.PaymentStatus,
    o.TotalAmount,
    COUNT(od.OrderDetailID) as ItemCount,
    SUM(od.Quantity) as TotalQuantity,
    o.CreatedDate
FROM dbo.Orders o
    INNER JOIN dbo.Customers c ON o.CustomerID = c.CustomerID
    LEFT JOIN dbo.OrderDetails od ON o.OrderID = od.OrderID
GROUP BY 
    o.OrderID, o.OrderNumber, o.OrderDate, 
    c.CustomerCode, c.CustomerName, c.City, c.Region,
    o.OrderStatus, o.PaymentStatus, o.TotalAmount, o.CreatedDate
GO

PRINT '테이블 생성이 완료되었습니다.'
PRINT '- Customers 테이블'
PRINT '- Orders 테이블' 
PRINT '- OrderDetails 테이블'
PRINT '- vw_OrderSummary 뷰'
GO 