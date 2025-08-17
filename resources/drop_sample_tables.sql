

-----------------------------------------------------------
-- 외래키 삭제
-----------------------------------------------------------
ALTER TABLE OrderDetails DROP CONSTRAINT FK_OrderDetails_Orders;
ALTER TABLE Orders DROP CONSTRAINT FK_Orders_Customers;



-----------------------------------------------------------
-- 테이블 삭제
-----------------------------------------------------------
DROP TABLE OrderDetails;
DROP TABLE Orders;
DROP TABLE Customers;




