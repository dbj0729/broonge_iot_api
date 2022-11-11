//doctor_router.js

const { 
    createPharmacist, updatePharmacist,
    login,
    authPhone, confirmAuth,
    idConfirm, licenseConfirm, businessConfirm,
    getPharmacist,
    diagSymptom, diagDepartment, 
    terms,
    confirmAccessPharmacist
} = require("./pharmacist_controller");
const router = require("express").Router();
const { pharmacistCheckToken, pharmacistRefreshToken } = require("../../auth/token_validation");

const multer = require('multer');
const path = require('node:path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function(request, file, cb) { // 저장위치설정 
        cb(null,'uploads/pharmacist')
    },
    filename: function(requset, file, cb) { // 파일 저장할때 제목설정
        var extension = path.extname(file.originalname); // 이미지파일확장자명
        var strArray = file.originalname.split('.');
        var name = strArray[0]+'-'+Date.now();
        var filename = crypto.createHash('sha512').update(name).digest('hex').toUpperCase().substr(0,16);
        cb(null, 'pharmacist-'+filename+extension) // 저장되는 시점의 시간으로 이미지 저장
    }
});


const upload = multer({ storage: storage });

router.post("/", upload.fields([ {name : "license_file"} , {name : "business_file"}]), createPharmacist);       // createPharmacist
router.patch("/", pharmacistCheckToken , confirmAccessPharmacist , upload.fields([ {name : "license_file"} , {name : "business_file"} ]), updatePharmacist);     // 약사 정보 수정

router.post("/idConfirm" , upload.none() , idConfirm);              // 이메일 중복검사
router.post("/licenseConfirm" , upload.none() , licenseConfirm);    // 약사면허 중복검사
router.post("/businessConfirm" , upload.none() , businessConfirm);  // 사업자등록번호 중복검사

router.post("/authPhone" , upload.none() , authPhone);              // 휴대폰 인증 요청
router.post("/confirmAuth" , upload.none() , confirmAuth);          // 인증여부 확인
router.post("/login", upload.none(), login);                        // 로그인

router.get("/terms", terms);                                   // 약사 서비스 약관
router.get("/" , upload.none() , pharmacistCheckToken , confirmAccessPharmacist , getPharmacist);  // 약사정보가져오기
/*


*/


module.exports = router;