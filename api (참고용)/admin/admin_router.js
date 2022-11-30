//doctor_router.js

const { 
    login,
    noticeImageUpload,
    createNotice, deleteNotice, updateNotice , getNotice, noticeList,
    doctorList, 
} = require("./admin_controller");
const router = require("express").Router();
const { adminCheckToken, adminRefreshToken } = require("../../auth/token_validation");

const multer = require('multer');
const path = require('node:path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function(request, file, cb) { // 저장위치설정 
        cb(null,'uploads/notice')
    },
    filename: function(requset, file, cb) { // 파일 저장할때 제목설정
        var extension = path.extname(file.originalname); // 이미지파일확장자명
        var strArray = file.originalname.split('.');
        var name = strArray[0]+'-'+Date.now();
        var filename = crypto.createHash('sha512').update(name).digest('hex').toUpperCase().substr(0,16);
        cb(null, 'notice-'+filename+extension) // 저장되는 시점의 시간으로 이미지 저장
    }
});

const upload = multer({ storage: storage });

router.post("/login", upload.none(), login);                                                           // 로그인
router.post("/noticeImageUpload" , adminCheckToken , upload.single('file') , noticeImageUpload);       // 이미지 업로드
router.post("/notice", adminCheckToken , upload.none(),  createNotice);                                // 공지사항 작성
router.patch("/notice/:notice_idx" , adminCheckToken , upload.none() , updateNotice );                 // 공지사항 수정하기
router.get("/notice/:notice_idx" , upload.none() , getNotice);                                         // 공지사항 내용 가져오기
router.get("/noticeList", upload.none() ,noticeList);                                                  // 공지사항 리스트
router.delete("/notice/:notice_idx" , adminCheckToken , upload.none() , deleteNotice);                 // 공지사항 삭제하기


router.get("/doctorList" , upload.none() , doctorList);     // 의사 리스트 + 상태창
//router.get("/doctorList" , upload.none() , doctorList);     // 약사 리스트 + 상태창


module.exports = router;