// diag_router.js

const { diagSymptom, diagDepartment, createQuestionnaire, updateQuestionnaire, getQuestionnaire, questionnaireDoctorSelct, cancelQuestionnaire } = require("./diag_controller");
const router = require("express").Router();
const { checkToken, refreshToken } = require("../../auth/token_validation");

const multer = require('multer');
const path = require('node:path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function(request, file, cb) { // 저장위치설정 
        cb(null, './uploads/diagnosis')
    },
    filename: function(requset, file, cb) { // 파일 저장할때 제목설정
        var extension = path.extname(file.originalname); // 이미지파일확장자명
        var strArray = file.originalname.split('.');
        var name = crypto.createHash('sha512').update(strArray[0]+Date.now()).digest('hex').toUpperCase().substring(0,16);
        var filename = name+Date.now();
        cb(null, filename+extension) // 저장되는 시점의 시각으로 이미지 저장
    }
});

const upload = multer({ storage: storage });

router.get("/symptom", diagSymptom);               // 증상진료
router.get("/department", diagDepartment);         // 과목진료
router.get("/questionnaire", checkToken, getQuestionnaire);   // 문진표 가져오기
router.post("/questionnaire", upload.array("file"), checkToken, createQuestionnaire);    // 진료요청
router.patch("/questionnaire/:q_idx", upload.array("file"), checkToken, updateQuestionnaire);   // 문진표 수정
router.post("/questionnaire/doctor", upload.none(), checkToken, questionnaireDoctorSelct);      // 문진표 의사 선택
router.delete('/questionnaire/doctor', upload.none(), checkToken, cancelQuestionnaire);         // 진료요청 취소

module.exports = router;