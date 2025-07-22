-- ========================================
-- 샘플 데이터 입력 스크립트
-- Microsoft SQL Server용
-- ========================================

USE [SampleDB]
GO

-- ========================================
-- 1. Customers 샘플 데이터 입력
-- ========================================

PRINT '고객 데이터 입력 중...'

-- 기존 데이터 삭제 (참조무결성 때문에 역순으로)
DELETE FROM dbo.OrderDetails
DELETE FROM dbo.Orders  
DELETE FROM dbo.Customers
GO

-- IDENTITY 시드 리셋
DBCC CHECKIDENT ('dbo.Customers', RESEED, 0)
DBCC CHECKIDENT ('dbo.Orders', RESEED, 0)
DBCC CHECKIDENT ('dbo.OrderDetails', RESEED, 0)
GO

-- 고객 데이터 입력
INSERT INTO dbo.Customers (
    CustomerCode, CustomerName, ContactName, Email, Phone, 
    Address, City, Region, PostalCode, Country, 
    CustomerType, CreditLimit, IsActive, CreatedDate
) VALUES 
-- 서울 지역 고객
('CUST001', '삼성전자(주)', '김철수', 'kim@samsung.com', '02-1234-5678', 
 '서울특별시 서초구 서초대로 1321', '서울', '서울', '06765', '대한민국', 'VIP', 50000000, 1, '2024-01-15'),

('CUST002', 'LG전자(주)', '박영희', 'park@lg.com', '02-2345-6789', 
 '서울특별시 영등포구 여의대로 128', '서울', '서울', '07336', '대한민국', 'VIP', 30000000, 1, '2024-01-20'),

('CUST003', '현대자동차(주)', '이민수', 'lee@hyundai.com', '02-3456-7890', 
 '서울특별시 종로구 율곡로 75', '서울', '서울', '03045', '대한민국', 'Premium', 40000000, 1, '2024-02-01'),

('CUST004', '신세계백화점', '정수진', 'jung@shinsegae.com', '02-4567-8901', 
 '서울특별시 중구 소공로 63', '서울', '서울', '04530', '대한민국', 'Regular', 10000000, 1, '2024-02-10'),

-- 부산 지역 고객  
('CUST005', '부산항만공사', '김부산', 'kim@busanport.com', '051-999-1234', 
 '부산광역시 중구 해관로 1', '부산', '부산', '48943', '대한민국', 'Premium', 20000000, 1, '2024-02-15'),

('CUST006', '롯데백화점 센텀시티점', '최롯데', 'choi@lotte.com', '051-888-2345', 
 '부산광역시 해운대구 센텀남대로 35', '부산', '부산', '48058', '대한민국', 'Regular', 8000000, 1, '2024-03-01'),

-- 대구 지역 고객
('CUST007', '대구은행', '서대구', 'seo@dgb.co.kr', '053-777-3456', 
 '대구광역시 중구 달구벌대로 2077', '대구', '경북', '41911', '대한민국', 'Premium', 15000000, 1, '2024-03-05'),

-- 인천 지역 고객
('CUST008', '인천국제공항공사', '안인천', 'ahn@airport.kr', '032-666-4567', 
 '인천광역시 중구 공항로 272', '인천', '인천', '22382', '대한민국', 'VIP', 25000000, 1, '2024-03-10'),

-- 광주 지역 고객
('CUST009', '기아자동차 광주공장', '조광주', 'cho@kia.com', '062-555-5678', 
 '광주광역시 광산구 소촌로 60', '광주', '전남', '62034', '대한민국', 'Premium', 18000000, 1, '2024-03-15'),

-- 대전 지역 고객
('CUST010', 'KAIST', '문대전', 'moon@kaist.ac.kr', '042-444-6789', 
 '대전광역시 유성구 대학로 291', '대전', '대전', '34141', '대한민국', 'Regular', 5000000, 1, '2024-03-20'),

-- 해외 고객
('CUST011', 'Sony Corporation', 'Tanaka Hiroshi', 'tanaka@sony.co.jp', '+81-3-1234-5678', 
 '1-7-1 Konan, Minato-ku', 'Tokyo', 'Tokyo', '108-0075', 'Japan', 'VIP', 60000000, 1, '2024-04-01'),

('CUST012', 'Apple Inc.', 'John Smith', 'john.smith@apple.com', '+1-408-996-1010', 
 'One Apple Park Way', 'Cupertino', 'California', '95014', 'USA', 'VIP', 80000000, 1, '2024-04-05'),

-- 비활성 고객
('CUST013', '구)대우전자', '김대우', 'kim@daewoo.com', '02-9999-0000', 
 '서울특별시 중구 청계천로 100', '서울', '서울', '04517', '대한민국', 'Regular', 0, 0, '2023-12-01')

PRINT '고객 데이터 입력 완료 (13개)'
GO

-- ========================================
-- 2. Orders 샘플 데이터 입력  
-- ========================================

PRINT '주문 데이터 입력 중...'

INSERT INTO dbo.Orders (
    OrderNumber, CustomerID, OrderDate, RequiredDate, ShippedDate,
    OrderStatus, ShipVia, Freight, ShipName, ShipAddress, ShipCity, ShipRegion, ShipCountry,
    SubTotal, TaxAmount, TotalAmount, PaymentMethod, PaymentStatus, EmployeeID, Notes
) VALUES 
-- 2024년 1월 주문
('ORD-2024-0001', 1, '2024-01-16', '2024-01-26', '2024-01-18', 
 'Shipped', '한진택배', 5000, '삼성전자(주)', '서울특별시 서초구 서초대로 1321', '서울', '서울', '대한민국',
 950000, 95000, 1050000, '신용카드', 'Paid', 101, '긴급배송 요청'),

('ORD-2024-0002', 2, '2024-01-22', '2024-02-01', '2024-01-25', 
 'Shipped', 'CJ대한통운', 3000, 'LG전자(주)', '서울특별시 영등포구 여의대로 128', '서울', '서울', '대한민국',
 1200000, 120000, 1323000, '계좌이체', 'Paid', 102, NULL),

-- 2024년 2월 주문
('ORD-2024-0003', 3, '2024-02-05', '2024-02-15', '2024-02-07', 
 'Shipped', '로젠택배', 7000, '현대자동차(주)', '서울특별시 종로구 율곡로 75', '서울', '서울', '대한민국',
 2500000, 250000, 2757000, '신용카드', 'Paid', 103, '대량주문'),

('ORD-2024-0004', 4, '2024-02-12', '2024-02-22', '2024-02-14', 
 'Shipped', '한진택배', 2000, '신세계백화점', '서울특별시 중구 소공로 63', '서울', '서울', '대한민국',
 800000, 80000, 882000, '신용카드', 'Paid', 101, NULL),

('ORD-2024-0005', 5, '2024-02-18', '2024-02-28', '2024-02-20', 
 'Shipped', '부산택배', 4000, '부산항만공사', '부산광역시 중구 해관로 1', '부산', '부산', '대한민국',
 1500000, 150000, 1654000, '계좌이체', 'Paid', 104, '부산지역 배송'),

-- 2024년 3월 주문
('ORD-2024-0006', 6, '2024-03-03', '2024-03-13', '2024-03-05', 
 'Shipped', 'CJ대한통운', 3500, '롯데백화점 센텀시티점', '부산광역시 해운대구 센텀남대로 35', '부산', '부산', '대한민국',
 600000, 60000, 663500, '신용카드', 'Paid', 105, NULL),

('ORD-2024-0007', 7, '2024-03-08', '2024-03-18', '2024-03-10', 
 'Shipped', '대구택배', 2500, '대구은행', '대구광역시 중구 달구벌대로 2077', '대구', '경북', '대한민국',
 1100000, 110000, 1212500, '계좌이체', 'Paid', 106, NULL),

('ORD-2024-0008', 8, '2024-03-12', '2024-03-22', '2024-03-14', 
 'Shipped', '인천택배', 6000, '인천국제공항공사', '인천광역시 중구 공항로 272', '인천', '인천', '대한민국',
 3200000, 320000, 3526000, '신용카드', 'Paid', 107, '공항 직배송'),

-- 2024년 4월 주문 (일부 미처리)
('ORD-2024-0009', 9, '2024-04-02', '2024-04-12', '2024-04-04', 
 'Shipped', '광주택배', 4500, '기아자동차 광주공장', '광주광역시 광산구 소촌로 60', '광주', '전남', '대한민국',
 1800000, 180000, 1984500, '계좌이체', 'Paid', 108, NULL),

('ORD-2024-0010', 10, '2024-04-08', '2024-04-18', NULL, 
 'Processing', NULL, 0, 'KAIST', '대전광역시 유성구 대학로 291', '대전', '대전', '대한민국',
 500000, 50000, 550000, '계좌이체', 'Pending', 109, '연구용 장비'),

('ORD-2024-0011', 11, '2024-04-15', '2024-04-25', NULL, 
 'Processing', NULL, 0, 'Sony Corporation', '1-7-1 Konan, Minato-ku', 'Tokyo', 'Tokyo', 'Japan',
 5000000, 0, 5000000, '신용카드', 'Pending', 110, '해외배송'),

('ORD-2024-0012', 12, '2024-04-20', '2024-04-30', NULL, 
 'Pending', NULL, 0, 'Apple Inc.', 'One Apple Park Way', 'Cupertino', 'California', 'USA',
 8000000, 0, 8000000, '계좌이체', 'Pending', 111, '대량 해외주문'),

-- 취소된 주문
('ORD-2024-0013', 1, '2024-04-25', '2024-05-05', NULL, 
 'Cancelled', NULL, 0, '삼성전자(주)', '서울특별시 서초구 서초대로 1321', '서울', '서울', '대한민국',
 300000, 30000, 330000, NULL, 'Cancelled', 101, '고객 요청으로 취소')

PRINT '주문 데이터 입력 완료 (13개)'
GO

-- ========================================
-- 3. OrderDetails 샘플 데이터 입력
-- ========================================

PRINT '주문상세 데이터 입력 중...'

INSERT INTO dbo.OrderDetails (
    OrderID, ProductCode, ProductName, UnitPrice, Quantity, Discount
) VALUES 
-- 주문 1번 상세 (삼성전자)
(1, 'PROD-001', '갤럭시 S24 Ultra', 1300000, 1, 0),
(1, 'PROD-002', '갤럭시 워치6', 350000, 1, 10),

-- 주문 2번 상세 (LG전자) 
(2, 'PROD-011', 'LG OLED TV 65인치', 2200000, 1, 0),
(2, 'PROD-012', 'LG 사운드바', 450000, 1, 5),

-- 주문 3번 상세 (현대자동차)
(3, 'PROD-021', '현대 제네시스 G90 부품세트', 5000000, 1, 20),

-- 주문 4번 상세 (신세계백화점)
(4, 'PROD-031', '명품 핸드백 컬렉션', 1200000, 1, 15),
(4, 'PROD-032', '브랜드 향수 세트', 800000, 1, 20),

-- 주문 5번 상세 (부산항만공사)
(5, 'PROD-041', '항만 관리 시스템', 2500000, 1, 10),
(5, 'PROD-042', '보안 카메라 세트', 800000, 1, 5),

-- 주문 6번 상세 (롯데백화점)
(6, 'PROD-051', '매장 디스플레이 시스템', 1500000, 1, 0),

-- 주문 7번 상세 (대구은행)
(7, 'PROD-061', '은행 보안 솔루션', 2000000, 1, 5),
(7, 'PROD-062', 'ATM 관리 시스템', 800000, 1, 0),

-- 주문 8번 상세 (인천공항)
(8, 'PROD-071', '공항 보안 시스템', 4000000, 1, 0),
(8, 'PROD-072', '승객 안내 시스템', 2500000, 1, 10),

-- 주문 9번 상세 (기아자동차)
(9, 'PROD-081', '자동차 생산라인 부품', 3000000, 1, 10),
(9, 'PROD-082', '품질관리 장비', 1200000, 1, 5),

-- 주문 10번 상세 (KAIST)
(10, 'PROD-091', '연구용 컴퓨터 시스템', 800000, 1, 0),
(10, 'PROD-092', '실험실 측정 장비', 400000, 1, 5),

-- 주문 11번 상세 (Sony)
(11, 'PROD-101', '고급 카메라 시스템', 8000000, 1, 15),
(11, 'PROD-102', '프로 오디오 장비', 3000000, 1, 10),

-- 주문 12번 상세 (Apple)
(12, 'PROD-111', '기업용 MacBook Pro 세트', 12000000, 1, 20),
(12, 'PROD-112', '아이패드 프로 대량 구매', 8000000, 1, 15)

-- 주문 13번은 취소되어 상세내역 없음

PRINT '주문상세 데이터 입력 완료 (18개)'
GO

-- ========================================
-- 4. Orders 테이블의 SubTotal, TotalAmount 업데이트
-- ========================================

PRINT '주문 금액 재계산 중...'

UPDATE o 
SET 
    SubTotal = ISNULL(detail_sum.SubTotal, 0),
    TotalAmount = ISNULL(detail_sum.SubTotal, 0) + o.TaxAmount + o.Freight
FROM dbo.Orders o
LEFT JOIN (
    SELECT 
        OrderID,
        SUM(LineTotal) as SubTotal
    FROM dbo.OrderDetails
    GROUP BY OrderID
) detail_sum ON o.OrderID = detail_sum.OrderID

PRINT '주문 금액 재계산 완료'
GO

-- ========================================
-- 5. 데이터 입력 결과 확인
-- ========================================

PRINT ''
PRINT '=== 데이터 입력 완료 ==='
PRINT ''

-- 테이블별 데이터 개수 확인
SELECT 'Customers' as TableName, COUNT(*) as RecordCount FROM dbo.Customers
UNION ALL
SELECT 'Orders' as TableName, COUNT(*) as RecordCount FROM dbo.Orders  
UNION ALL
SELECT 'OrderDetails' as TableName, COUNT(*) as RecordCount FROM dbo.OrderDetails

PRINT ''
PRINT '=== 주문 상태별 집계 ==='

-- 주문 상태별 집계
SELECT 
    OrderStatus,
    COUNT(*) as OrderCount,
    SUM(TotalAmount) as TotalAmount
FROM dbo.Orders
GROUP BY OrderStatus
ORDER BY OrderCount DESC

PRINT ''
PRINT '=== 지역별 고객 수 ==='

-- 지역별 고객 수
SELECT 
    Region,
    COUNT(*) as CustomerCount
FROM dbo.Customers
WHERE IsActive = 1
GROUP BY Region
ORDER BY CustomerCount DESC

PRINT ''
PRINT '샘플 데이터 입력이 모두 완료되었습니다!'
GO 