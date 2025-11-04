-- ========================================
-- 샘플 데이터 입력 스크립트 (Oracle)
-- ========================================

-- Customers
INSERT INTO Customers (CustomerCode, CustomerName, ContactName, Email, Phone, City, Region, Country, CustomerType, CreditLimit, IsActive)
VALUES ('CUST001','Acme Corp','John Doe','john@acme.com','+1-555-1001','New York','NY','USA','Regular',10000,1);
INSERT INTO Customers (CustomerCode, CustomerName, ContactName, Email, Phone, City, Region, Country, CustomerType, CreditLimit, IsActive)
VALUES ('CUST002','Globex','Jane Smith','jane@globex.com','+1-555-1002','Los Angeles','CA','USA','VIP',20000,1);
INSERT INTO Customers (CustomerCode, CustomerName, ContactName, Email, Phone, City, Region, Country, CustomerType, CreditLimit, IsActive)
VALUES ('CUST003','Initech','Bob Martin','bob@initech.com','+1-555-1003','Seattle','WA','USA','Regular',15000,1);

-- Products
INSERT INTO Products (ProductCode, ProductName, Category, UnitPrice, UnitsInStock)
VALUES ('P-100','Laptop 14"','Electronics',1200,50);
INSERT INTO Products (ProductCode, ProductName, Category, UnitPrice, UnitsInStock)
VALUES ('P-101','Wireless Mouse','Electronics',25,500);
INSERT INTO Products (ProductCode, ProductName, Category, UnitPrice, UnitsInStock)
VALUES ('P-102','Office Chair','Furniture',180,120);

-- Employees
INSERT INTO Employees (EmployeeCode, FirstName, LastName, Title, Department, Salary, IsActive)
VALUES ('E-001','Alice','Kim','Manager','Sales',6500,1);
INSERT INTO Employees (EmployeeCode, FirstName, LastName, Title, Department, Salary, IsActive)
VALUES ('E-002','Brian','Lee','Engineer','IT',7200,1);
INSERT INTO Employees (EmployeeCode, FirstName, LastName, Title, Department, Salary, IsActive)
VALUES ('E-003','Cathy','Park','Analyst','Finance',5800,1);

-- Orders
INSERT INTO Orders (OrderNumber, CustomerID, OrderDate, OrderStatus, SubTotal, TaxAmount, TotalAmount, PaymentStatus)
VALUES ('SO-20240101-001', 1, TO_TIMESTAMP('2024-01-01 10:00:00','YYYY-MM-DD HH24:MI:SS'), 'Pending', 1225, 122.5, 1347.5, 'Unpaid');
INSERT INTO Orders (OrderNumber, CustomerID, OrderDate, OrderStatus, SubTotal, TaxAmount, TotalAmount, PaymentStatus)
VALUES ('SO-20240105-002', 2, TO_TIMESTAMP('2024-01-05 15:30:00','YYYY-MM-DD HH24:MI:SS'), 'Shipped', 180, 18, 198, 'Paid');

-- OrderDetails
INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount)
VALUES (1, 1, 1200, 1, 0);
INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount)
VALUES (1, 2, 25, 1, 0);
INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount)
VALUES (2, 3, 180, 1, 0);

COMMIT;

PROMPT 'Oracle용 샘플 데이터 입력 완료'
