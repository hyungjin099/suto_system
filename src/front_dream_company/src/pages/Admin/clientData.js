/* 고객사 시드 데이터 (CLIENT_INFO 스키마 기준)
 * - id: 화면용 키 (cliNum)
 * - cliCode: 거래처코드 (주문 페이지 URL 식별자)
 * - useType: 사용구분 (등록/미사용 등 문자열)
 */

export const seedClients = () => [
  {
    id: 1,
    cliCode: "5048179051",
    name: "(주)시스픽",
    ceoName: "김진곤",
    tel: "053-255-0300",
    fax: "053-256-0501",
    managerName: "",
    managerPhone: "",
    email: "sispic1@naver.com",
    address: "대구광역시 달서구 성서로9길 18",
    useType: "등록",
    createdAt: new Date(2025, 2, 12),
    updatedAt: new Date(2025, 8, 21),
  },
  {
    id: 2,
    cliCode: "6178114451",
    name: "(주)우진문화",
    ceoName: "송재구",
    tel: "051-305-1804",
    fax: "051-305-1809",
    managerName: "",
    managerPhone: "010-2335-5279",
    email: "woojin1804@naver.com",
    address: "부산광역시 사상구 낙동대로 1420번길 41, 410-413",
    useType: "등록",
    createdAt: new Date(2025, 3, 4),
    updatedAt: new Date(2025, 9, 1),
  },
  {
    id: 3,
    cliCode: "6211833467",
    name: "고려정보시스템",
    ceoName: "신수선",
    tel: "055-389-2700",
    fax: "055-901-0365",
    managerName: "",
    managerPhone: "",
    email: "",
    address: "경상남도 양산시 북정로 65",
    useType: "등록",
    createdAt: new Date(2025, 4, 15),
    updatedAt: new Date(2025, 9, 18),
  },
];
