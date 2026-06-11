#DROP TABLE CLIENT_INFO;
CREATE TABLE CLIENT_INFO (
	CLI_NUM INT AUTO_INCREMENT												#고객번호
	, CLI_COMP_NAME VARCHAR(100) NOT NULL UNIQUE 			#고객사명
	, CLI_MANAGER_NAME VARCHAR(50) NOT NULL 					#고객사 담당자 명
	, URL_NUM INT NOT NULL UNIQUE											#고객사 링크 URL 일련번호
	, CLI_TEL VARCHAR(15)															#고객사 연락처
	, CLI_MANAGER_TEL VARCHAR(15)											#고객사 담당자 연락처
	, JOIN_DATE DATETIME DEFAULT SYSDATE() 						#고객사 등록일
	, CLI_STATUS INT DEFAULT 1												#고객사 활동 상태(1:거래중, 2:활동없음)
	, CONSTRAINT PK_CLIENT_INFO PRIMARY KEY (CLI_NUM)
);


-- 원단(제품) 정보 테이블
CREATE TABLE PRODUCT_INFO (
    PROD_NUM      INT AUTO_INCREMENT,
    PROD_CODE     VARCHAR(30)  NOT NULL UNIQUE,   -- ex) AT-1680-080
    PROD_CATEGORY VARCHAR(50),
    PROD_NAME     VARCHAR(100) NOT NULL,           -- 정식 명칭
    PROD_PRICE    INT,
    MANUFACTURER  VARCHAR(50),
    PROD_STATUS   INT DEFAULT 1,
    REG_DATE      DATETIME DEFAULT SYSDATE(),
    CONSTRAINT PK_PRODUCT_INFO PRIMARY KEY (PROD_NUM)
);

-- 고객사별 원단 별칭 매핑 테이블
CREATE TABLE CLIENT_FABRIC_ALIAS (
    ALIAS_NUM         INT AUTO_INCREMENT,
    CLI_NUM           INT          NOT NULL,        -- FK → CLIENT_INFO.CLI_NUM
    PROD_NUM          INT          NOT NULL,        -- FK → PRODUCT_INFO.PROD_NUM
    CLIENT_FAB_NAME   VARCHAR(100) NOT NULL,        -- 고객사가 부르는 이름
    REG_DATE          DATETIME DEFAULT SYSDATE(),
    CONSTRAINT PK_CLIENT_FABRIC_ALIAS  PRIMARY KEY  (ALIAS_NUM),
    CONSTRAINT UQ_CLI_PROD             UNIQUE       (CLI_NUM, PROD_NUM),       -- 고객사·원단 쌍 유일
    CONSTRAINT UQ_CLI_NAME             UNIQUE       (CLI_NUM, CLIENT_FAB_NAME), -- 같은 고객사 내 별칭 중복 불가
    CONSTRAINT FK_ALIAS_CLIENT         FOREIGN KEY  (CLI_NUM) REFERENCES CLIENT_INFO(CLI_NUM),
    CONSTRAINT FK_ALIAS_PROD           FOREIGN KEY  (PROD_NUM) REFERENCES PRODUCT_INFO(PROD_NUM)
);


CREATE TABLE ORDER_INFO (
    ORDER_NUM   INT AUTO_INCREMENT,
    URL_NUM     INT          NOT NULL,
    ORDER_ID    VARCHAR(30)  NOT NULL UNIQUE,
    STATUS      VARCHAR(20)  DEFAULT 'PENDING',
    ORDER_DATE  DATETIME     DEFAULT SYSDATE(),
    CONSTRAINT PK_ORDER_INFO  PRIMARY KEY (ORDER_NUM),
    CONSTRAINT FK_ORDER_CLIENT FOREIGN KEY (URL_NUM) REFERENCES CLIENT_INFO(URL_NUM)
);

CREATE TABLE ORDER_ITEM (
    ITEM_NUM      INT AUTO_INCREMENT,
    ORDER_NUM     INT          NOT NULL,
    PRODUCT       VARCHAR(50),
    PRODUCT_LABEL VARCHAR(100),
    WIDTH         INT,
    LENGTH        INT,
    ROLLS         INT,
    DESTINATION   VARCHAR(500),
    NOTE          TEXT,
    CONSTRAINT PK_ORDER_ITEM PRIMARY KEY (ITEM_NUM),
    CONSTRAINT FK_ITEM_ORDER  FOREIGN KEY (ORDER_NUM) REFERENCES ORDER_INFO(ORDER_NUM)
);

ALTER TABLE ORDER_INFO DROP COLUMN DESTINATION;
ALTER TABLE ORDER_ITEM ADD COLUMN DESTINATION VARCHAR(500);

-- 입고처 정보 테이블
CREATE TABLE SUPPLIER_INFO (
    SUP_NUM          INT AUTO_INCREMENT,
    SUP_NAME         VARCHAR(100) NOT NULL,
    SUP_TEL          VARCHAR(20),
    SUP_MANAGER_NAME VARCHAR(50),
    SUP_MANAGER_TEL  VARCHAR(20),
    SUP_STATUS       INT DEFAULT 1,
    REG_DATE         DATETIME DEFAULT SYSDATE(),
    CONSTRAINT PK_SUPPLIER_INFO PRIMARY KEY (SUP_NUM)
);

INSERT INTO SUPPLIER_INFO (SUP_NAME, SUP_TEL, SUP_MANAGER_NAME, SUP_MANAGER_TEL, SUP_STATUS)
VALUES
  ('한솔제지 영업부',       '02-3287-1000', '김상훈', '010-1111-2222', 1),
  ('무림페이퍼 유통팀',     '02-2122-3300', '이정민', '010-3333-4444', 1),
  ('신풍제지 영업1팀',      '031-490-5500', '박준혁', '010-5555-6666', 1),
  ('삼화제지 대리점',       '032-670-7700', '최유진', '010-7777-8888', 1),
  ('SKC 필름사업부',        '02-3787-9000', '정서연', '010-9999-0000', 1),
  ('코오롱인더스트리 지류팀', '02-3677-1100', '강민수', '010-1234-5678', 1),
  ('현대지류산업 영업팀',   '031-320-2200', '윤지혜', '010-2345-6789', 1);



INSERT INTO CLIENT_INFO
  (CLI_COMP_NAME, CLI_MANAGER_NAME, URL_NUM, CLI_TEL, CLI_MANAGER_TEL, JOIN_DATE, CLI_STATUS)
VALUES
  ('서울베이커리',   '김민준', 10245, '02-555-1180',  '010-2244-1180', '2025-03-12', 1),
  ('부산떡공방',     '이수현', 20631, '051-302-7711', '010-7711-7711', '2025-04-04', 1),
  ('제주감귤원',     '박지훈', 30482, '064-888-2030', '010-2030-2030', '2025-05-15', 1),
  ('한밭다과',       '최서연', 41728, '042-621-3344', '010-9821-3344', '2025-06-01', 1),
  ('코리아베이커리', '정도윤', 51290, '031-705-0099', '010-7050-0099', '2024-12-20', 0),
  ('라온스튜디오',   '장하은', 60843, '02-415-9921',  '010-1592-9921', '2025-07-09', 1),
  ('동해수산',       '윤서준', 71355, '033-444-0710', '010-4407-0710', '2025-08-22', 1),
  ('별빛카페',       '한지유', 81920, '02-998-2105',  '010-2105-2105', '2025-08-30', 1),
  ('에이스인쇄',     '오민서', 92011, '032-770-4488', '010-4488-4488', '2024-09-03', 0),
  ('초록정원',       '신유빈', 10567, '02-330-1212',  '010-1212-1212', '2025-09-14', 1),
  ('푸른들녘',       '백시우', 11048, '061-555-7373', '010-7373-7373', '2025-10-01', 1),
  ('햇살양조장',     '강예린', 12760, '043-202-6060', '010-6060-6060', '2025-10-18', 1);


INSERT INTO PRODUCT_INFO
  (PROD_CODE, PROD_CATEGORY, PROD_NAME, PROD_PRICE, MANUFACTURER, PROD_STATUS)
VALUES
  ('AT-1680-080', '아트지',    '아트지 무광 80g 1680mm',        420,  '한솔제지',       1),
  ('AT-1080-080', '아트지',    '아트지 무광 80g 1080mm',        280,  '한솔제지',       1),
  ('AT-1680-100', '아트지',    '아트지 유광 100g 1680mm',       560,  '한솔제지',       1),
  ('AT-1080-100', '아트지',    '아트지 유광 100g 1080mm',       370,  '한솔제지',       1),
  ('AT-0800-080', '아트지',    '아트지 무광 80g 800mm',         210,  '한솔제지',       1),
  ('MO-1680-070', '모조지',    '모조지 백색 70g 1680mm',        320,  '무림페이퍼',     1),
  ('MO-1080-070', '모조지',    '모조지 백색 70g 1080mm',        220,  '무림페이퍼',     1),
  ('MO-1680-100', '모조지',    '모조지 백색 100g 1680mm',       450,  '무림페이퍼',     1),
  ('MO-0600-070', '모조지',    '모조지 백색 70g 600mm',         130,  '무림페이퍼',     1),
  ('KR-1680-090', '크라프트',  '크라프트 내추럴 90g 1680mm',   380,  '신풍제지',       1),
  ('KR-1080-090', '크라프트',  '크라프트 내추럴 90g 1080mm',   260,  '신풍제지',       1),
  ('KR-1680-120', '크라프트',  '크라프트 내추럴 120g 1680mm',  490,  '신풍제지',       1),
  ('KR-0800-090', '크라프트',  '크라프트 내추럴 90g 800mm',    190,  '신풍제지',       1),
  ('PT-1680-050', '투명 PET',  '투명 PET 50μm 1680mm',        1280, 'SKC',            1),
  ('PT-1080-050', '투명 PET',  '투명 PET 50μm 1080mm',         830, 'SKC',            1),
  ('PT-1680-075', '투명 PET',  '투명 PET 75μm 1680mm',        1740, 'SKC',            1),
  ('PT-0600-050', '투명 PET',  '투명 PET 50μm 600mm',          490, 'SKC',            1),
  ('YU-1680-080', '유포지',    '유포지 화이트 80μm 1680mm',   1620, '코오롱인더스트리', 1),
  ('YU-1080-080', '유포지',    '유포지 화이트 80μm 1080mm',   1080, '코오롱인더스트리', 1),
  ('YU-1680-100', '유포지',    '유포지 화이트 100μm 1680mm',  1980, '코오롱인더스트리', 1),
  ('YU-0800-080', '유포지',    '유포지 화이트 80μm 800mm',     780, '코오롱인더스트리', 1),
  ('SV-1080-050', '은박',      '은박 무광 50μm 1080mm',       2150, '현대지류산업',   1),
  ('SV-0800-050', '은박',      '은박 무광 50μm 800mm',        1620, '현대지류산업',   1),
  ('SV-1080-075', '은박',      '은박 유광 75μm 1080mm',       2840, '현대지류산업',   1),
  ('GD-1080-050', '금박',      '금박 무광 50μm 1080mm',       2980, '현대지류산업',   1),
  ('GD-0800-050', '금박',      '금박 무광 50μm 800mm',        2280, '현대지류산업',   1),
  ('GD-1080-075', '금박',      '금박 유광 75μm 1080mm',       3640, '현대지류산업',   1),
  ('FL-1080-080', '형광지',    '형광지 옐로우 80g 1080mm',     620, '삼화제지',       1),
  ('FL-1080-081', '형광지',    '형광지 핑크 80g 1080mm',       620, '삼화제지',       1),
  ('FL-1080-082', '형광지',    '형광지 그린 80g 1080mm',       620, '삼화제지',       1),
  ('FL-0600-080', '형광지',    '형광지 옐로우 80g 600mm',      340, '삼화제지',       1),
  ('AT-1200-080', '아트지',    '아트지 무광 80g 1200mm',       310, '한솔제지',       1),
  ('MO-1200-070', '모조지',    '모조지 백색 70g 1200mm',       245, '무림페이퍼',     1),
  ('KR-1200-090', '크라프트',  '크라프트 내추럴 90g 1200mm',   290, '신풍제지',       1),
  ('PT-1200-050', '투명 PET',  '투명 PET 50μm 1200mm',         920, 'SKC',            1),
  ('YU-1200-080', '유포지',    '유포지 화이트 80μm 1200mm',   1190, '코오롱인더스트리', 1);



-- 서울베이커리 (CLI_NUM=1)
INSERT INTO CLIENT_FABRIC_ALIAS (CLI_NUM, PROD_NUM, CLIENT_FAB_NAME) VALUES
  (1,  1, '대형아트무광'),
  (1,  2, '중형아트무광'),
  (1,  3, '대형아트유광'),
  (1,  6, '대형흰지'),
  (1,  7, '중형흰지'),
  (1, 14, '투명큰롤'),
  (1, 18, '유포대형');

-- 부산떡공방 (CLI_NUM=2)
INSERT INTO CLIENT_FABRIC_ALIAS (CLI_NUM, PROD_NUM, CLIENT_FAB_NAME) VALUES
  (2,  1, '80아트대'),
  (2,  4, '100아트중'),
  (2, 10, '크라프트대'),
  (2, 22, '은박중'),
  (2, 25, '금박중');

-- 제주감귤원 (CLI_NUM=3)
INSERT INTO CLIENT_FABRIC_ALIAS (CLI_NUM, PROD_NUM, CLIENT_FAB_NAME) VALUES
  (3,  6, '흰종이대'),
  (3,  7, '흰종이중'),
  (3, 14, '투명필름대'),
  (3, 15, '투명필름중'),
  (3, 24, '금속광중');

-- 한밭다과 (CLI_NUM=4)
INSERT INTO CLIENT_FABRIC_ALIAS (CLI_NUM, PROD_NUM, CLIENT_FAB_NAME) VALUES
  (4,  1, 'A타입아트'),
  (4,  2, 'B타입아트'),
  (4,  6, '기본지대'),
  (4, 18, '유포A'),
  (4, 19, '유포B'),
  (4, 28, '노랑형광');

SELECT * FROM CLIENT_INFO;




