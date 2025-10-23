#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
샘플 데이터 생성 스크립트
100건의 샘플 데이터 생성 (한글 50건 + 영어 50건)
"""

import random
from datetime import datetime, timedelta

# 한글 데이터
korean_companies = [
    '한국전자', '서울무역상사', '부산산업', '대구섬유', '인천물류센터',
    '광주식품유통', '제주특산물', '울산화학공업', '대전기술연구소', '경기통상',
    '서울가구', '부산수산', '대구한방약품', '인천해운', '광주자동차부품',
    '제주관광개발', '울산조선', '대전바이오', '경기반도체', '서울패션',
    '부산철강', '대구섬유공업', '인천유리', '광주전자부품', '제주식품',
    '울산정유', '대전전자', '경기화학', '서울건설', '부산건설자재',
    '대구기계', '인천항만', '광주광산', '제주에너지', '울산자동차',
    '대전소프트웨어', '경기물류', '서울의료기기', '부산바이오', '대구IT',
    '인천신재생에너지', '광주스마트팩토리', '제주데이터센터', '울산디스플레이', '대전우주항공',
    '경기AI산업', '서울핀테크', '부산로봇산업', '대구드론', '인천스마트시티'
]

korean_names = [
    '김철수', '이영희', '박민수', '최지영', '정현우',
    '강수진', '윤서연', '임동혁', '송미래', '한지훈',
    '김영수', '이순희', '박건호', '최미영', '정태윤',
    '강민석', '윤혜진', '임재현', '송현주', '한수연',
    '김동현', '이지은', '박상철', '최윤정', '정수현',
    '강태영', '윤미선', '임경호', '송재민', '한영미',
    '김민재', '이상훈', '박정아', '최승현', '정유진',
    '강도현', '윤서준', '임하은', '송지우', '한승우',
    '김시우', '이예은', '박하준', '최서윤', '정민재',
    '강유나', '윤도윤', '임서준', '송지안', '한예진'
]

korean_cities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '제주', '수원', '성남']
korean_regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '제주', '경기', '강원']

# 영어 데이터
english_companies = [
    'Tech Solutions Inc', 'Global Trading Co', 'Digital Innovations', 'Advanced Manufacturing', 'Pacific Logistics',
    'Euro Electronics', 'Asia Pacific Trade', 'Northern Industries', 'Smart Tech Corp', 'International Supply',
    'Future Systems', 'Green Energy Ltd', 'Advanced Materials', 'Ocean Freight Co', 'Digital Commerce',
    'Biotech Research', 'Automotive Parts Ltd', 'Cloud Services Inc', 'Pharma Solutions', 'Robotics International',
    'Financial Systems', 'Renewable Power', 'Aerospace Tech', 'Smart Agriculture', 'Quantum Computing',
    'Marine Solutions', 'AI Development', 'Logistics Solutions', 'Construction Tech', 'Food Processing',
    'Textile Manufacturing', 'Chemical Industries', 'Mining Corporation', 'Healthcare Systems', 'Education Technology',
    'Entertainment Media', 'Security Solutions', 'Environmental Tech', 'Transportation Systems', 'Telecommunications',
    'Water Treatment', 'Fashion Design', 'Gaming Studios', 'Space Technology', 'Furniture Design',
    'Printing Services', 'Packaging Solutions', 'Laboratory Equipment', 'Sports Equipment', 'Defense Systems'
]

english_names = [
    'John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson',
    'Sophie Martin', 'James Lee', 'Emma Anderson', 'Oliver Taylor', 'Isabella Thomas',
    'William Jackson', 'Olivia White', 'Ethan Harris', 'Ava Martinez', 'Noah Robinson',
    'Mia Clark', 'Lucas Rodriguez', 'Charlotte Lewis', 'Benjamin Walker', 'Amelia Hall',
    'Henry Allen', 'Harper Young', 'Alexander King', 'Evelyn Wright', 'Sebastian Lopez',
    'Ella Hill', 'Jack Scott', 'Aria Green', 'Mason Adams', 'Luna Baker',
    'Logan Nelson', 'Layla Carter', 'Elijah Mitchell', 'Chloe Perez', 'Matthew Roberts',
    'Avery Turner', 'Daniel Phillips', 'Sofia Campbell', 'Joseph Parker', 'Victoria Evans',
    'David Edwards', 'Grace Collins', 'Samuel Stewart', 'Zoe Sanchez', 'Ryan Morris',
    'Penelope Rogers', 'Isaac Reed', 'Stella Cook', 'Christian Morgan', 'Nora Bell'
]

english_cities = [
    'San Francisco', 'New York', 'London', 'Berlin', 'Sydney',
    'Paris', 'Singapore', 'Stockholm', 'Austin', 'Toronto',
    'Tokyo', 'Manchester', 'Munich', 'Amsterdam', 'Seattle',
    'Zurich', 'Milan', 'Dublin', 'Brussels', 'Seoul',
    'Chicago', 'Copenhagen', 'Houston', 'Rotterdam', 'Boston',
    'Oslo', 'San Jose', 'Singapore', 'Melbourne', 'Madrid',
    'Mumbai', 'São Paulo', 'Johannesburg', 'Philadelphia', 'Edinburgh',
    'Los Angeles', 'Tel Aviv', 'Helsinki', 'Vienna', 'Hong Kong',
    'Dubai', 'Paris', 'San Francisco', 'Cape Canaveral', 'Gothenburg',
    'Hamburg', 'Atlanta', 'Basel', 'Denver', 'Arlington'
]

# 제품 카테고리 (한글/영어)
korean_products = [
    ('노트북', '전자제품'), ('마우스', '전자제품'), ('키보드', '전자제품'), ('모니터', '전자제품'), ('외장 SSD', '저장장치'),
    ('USB 메모리', '저장장치'), ('이어폰', '오디오'), ('스피커', '오디오'), ('웹캠', '전자제품'), ('태블릿', '전자제품'),
    ('프린터', '사무기기'), ('복합기', '사무기기'), ('스탠드', '사무용품'), ('의자', '가구'), ('캐비닛', '가구'),
    ('책상', '가구'), ('램프', '사무용품'), ('충전기', '전자제품'), ('케이블', '전자제품'), ('허브', '전자제품'),
    ('헤드셋', '오디오'), ('마이크', '오디오'), ('스캐너', '사무기기'), ('라벨기', '사무기기'), ('계산기', '사무용품'),
    ('화이트보드', '사무용품'), ('복사기', '사무기기'), ('파쇄기', '사무기기'), ('바인더', '사무용품'), ('필기구', '사무용품'),
    ('노트', '사무용품'), ('파일', '사무용품'), ('클립', '사무용품'), ('테이프', '사무용품'), ('가위', '사무용품'),
    ('스테이플러', '사무용품'), ('펀치', '사무용품'), ('자', '사무용품'), ('형광펜', '사무용품'), ('지우개', '사무용품'),
    ('수정테이프', '사무용품'), ('포스트잇', '사무용품'), ('달력', '사무용품'), ('플래너', '사무용품'), ('시계', '사무용품'),
    ('쓰레기통', '사무용품'), ('우산꽂이', '사무용품'), ('신발장', '가구'), ('사물함', '가구'), ('칸막이', '가구')
]

english_products = [
    ('Laptop Computer', 'Electronics'), ('Wireless Mouse', 'Electronics'), ('Mechanical Keyboard', 'Electronics'),
    ('Monitor 27inch', 'Electronics'), ('External SSD', 'Storage'), ('USB Flash Drive', 'Storage'),
    ('Wireless Earbuds', 'Audio'), ('Bluetooth Speaker', 'Audio'), ('HD Webcam', 'Electronics'),
    ('Tablet Device', 'Electronics'), ('Laser Printer', 'Office Equipment'), ('Multifunction Printer', 'Office Equipment'),
    ('Desk Lamp', 'Office Supplies'), ('Office Chair', 'Furniture'), ('File Cabinet', 'Furniture'),
    ('Standing Desk', 'Furniture'), ('LED Lamp', 'Office Supplies'), ('Power Adapter', 'Electronics'),
    ('USB Cable', 'Electronics'), ('USB Hub', 'Electronics'), ('Gaming Headset', 'Audio'),
    ('Studio Microphone', 'Audio'), ('Document Scanner', 'Office Equipment'), ('Label Printer', 'Office Equipment'),
    ('Calculator', 'Office Supplies'), ('Whiteboard', 'Office Supplies'), ('Copier', 'Office Equipment'),
    ('Paper Shredder', 'Office Equipment'), ('Ring Binder', 'Office Supplies'), ('Pen Set', 'Office Supplies'),
    ('Notebook', 'Office Supplies'), ('File Folder', 'Office Supplies'), ('Paper Clips', 'Office Supplies'),
    ('Adhesive Tape', 'Office Supplies'), ('Scissors', 'Office Supplies'), ('Stapler', 'Office Supplies'),
    ('Hole Punch', 'Office Supplies'), ('Ruler Set', 'Office Supplies'), ('Highlighter', 'Office Supplies'),
    ('Eraser', 'Office Supplies'), ('Correction Tape', 'Office Supplies'), ('Sticky Notes', 'Office Supplies'),
    ('Wall Calendar', 'Office Supplies'), ('Daily Planner', 'Office Supplies'), ('Wall Clock', 'Office Supplies'),
    ('Waste Bin', 'Office Supplies'), ('Umbrella Stand', 'Office Supplies'), ('Shoe Rack', 'Furniture'),
    ('Storage Locker', 'Furniture'), ('Privacy Screen', 'Furniture')
]

def generate_mssql_customers():
    """MSSQL용 Customers INSERT 문 생성"""
    sql = []
    
    for i in range(50):
        code = f"'CUST{i+1:03d}'"
        company = f"'(주){korean_companies[i]}'" if i < 10 else f"'{korean_companies[i]}'"
        name = f"'{korean_names[i]}'"
        email = f"'{korean_names[i].replace(' ', '').lower()}@{korean_companies[i].replace(' ', '').lower()}.co.kr'"
        phone = f"'02-{random.randint(1000,9999)}-{random.randint(1000,9999)}'"
        city = f"'{korean_cities[i % len(korean_cities)]}'"
        region = f"'{korean_regions[i % len(korean_regions)]}'"
        ctype = random.choice(['Premium', 'Regular', 'VIP'])
        credit = random.randint(150, 2000) * 100000
        
        sql.append(f"({code}, {company}, {name}, {email}, {phone}, '서울시 강남구', {city}, {region}, '대한민국', '{ctype}', {credit}.00, 1)")
    
    for i in range(50):
        code = f"'CUST{i+51:03d}'"
        company = f"'{english_companies[i]}'"
        name = f"'{english_names[i]}'"
        email = f"'{english_names[i].split()[0].lower()}@{english_companies[i].split()[0].lower()}.com'"
        phone = f"'+1-555-{random.randint(1000,9999)}'"
        city = f"'{english_cities[i]}'"
        ctype = random.choice(['Premium', 'Regular', 'VIP'])
        credit = random.randint(200, 2500) * 100000
        
        sql.append(f"({code}, {company}, {name}, {email}, {phone}, 'Address', {city}, 'State', 'USA', '{ctype}', {credit}.00, 1)")
    
    return ",\n".join(sql)

if __name__ == "__main__":
    print("-- Customers (100 records)")
    print("INSERT INTO dbo.Customers (CustomerCode, CustomerName, ContactName, Email, Phone, Address, City, Region, Country, CustomerType, CreditLimit, IsActive) VALUES")
    print(generate_mssql_customers())
    print("GO\n")

