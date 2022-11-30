// user_router.js

const { createUser, login, terms, authPhone, confirmAuth, changePwd, refresh, getUser, insertCard, fileId, updateCard, deleteCard, changeDefaultCard, getCardList, 
  insertAddress, updateAddress, deleteAddress, getAddressList, searchMap, changeDefaultAddress, doctorList, getDoctor, getDoctorReview, doctorLike, main, updateAppToken, 
  likeDoctorList, getMyReview, getReview, updateReview, deleteReview } = require("./user_controller");
const router = require("express").Router();
const { checkToken, refreshToken } = require("../../auth/token_validation");

const multer = require('multer');
const upload = multer({ dest: 'uploads' });

router.post("/", upload.none(), createUser);                         // create user
router.get("/", upload.none(), checkToken, getUser);                 // 프로필 정보
router.post("/login", upload.none(), login);                         // login
router.post("/refresh", upload.none(), refreshToken , refresh);      // refresh
router.get("/main", checkToken, main);                               // 메인데이터 가져오기

router.post("/token", upload.none(), checkToken, updateAppToken);    // 앱 토큰 수정

router.get("/terms", upload.none(), terms);                          // 이용약관
router.post("/authPhone" , upload.none() , authPhone);               // 휴대폰 인증 요청
router.post("/confirmAuth", upload.none(), confirmAuth);             // 인증여부 확인

router.patch("/changePwd", upload.none(), changePwd);                // 비밀번호 변경
router.post("/findId", upload.none(), fileId);                       // 아이디 찾기

router.post("/card", upload.none(), checkToken, insertCard);         // 신용카드 등록
router.patch("/card/:c_idx", upload.none(), checkToken, updateCard);        // 신용카드 수정
router.delete("/card/:c_idx", upload.none(), checkToken, deleteCard);       // 신용카드 삭제
router.get("/cardList", upload.none(), checkToken, getCardList);     // 신용카드 리스트
router.post('/changeDefaultCard', upload.none(), checkToken, changeDefaultCard) // 기본 결제수단 변경

router.post('/address', upload.none(), checkToken, insertAddress)    // 주소지 등록
router.patch('/address/:add_idx', upload.none(), checkToken, updateAddress)   // 주소지 수정
router.delete('/address/:add_idx', upload.none(), checkToken, deleteAddress)  // 주소지 삭제
router.get('/addressList', upload.none(), checkToken, getAddressList)   // 주소지 리스트
router.post('/changeDefaultAddress', upload.none(), checkToken, changeDefaultAddress); // 기본주소 변경
router.get('/searchMap', upload.none(), checkToken, searchMap);      // 가까운 병원/약국 찾기

router.get("/doctorList", upload.none(), checkToken, doctorList);       // 의사 리스트
router.get("/doctor", upload.none(), checkToken, getDoctor);            // 의사 상세
router.get("/doctorReview", upload.none(), checkToken, getDoctorReview); // 의사 리뷰 리스트

router.get("/likeDoctor", checkToken, likeDoctorList);    // 자주가는 의사 리스트
router.post("/likeDoctor", upload.none(), checkToken, doctorLike);       // 자주가는 의사등록, 삭제

router.get("/reviewList", upload.none(), checkToken, getMyReview);        // 내가 작성한 리뷰 리스트
router.get("/review", checkToken, getReview);                             // 리뷰 상세
router.patch("/review/:dcr_idx", upload.none(), checkToken, updateReview);     // 리뷰 수정
router.delete("/review/:dcr_idx", upload.none(), checkToken, deleteReview);    // 리뷰 삭제


module.exports = router;