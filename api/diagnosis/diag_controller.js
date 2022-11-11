// diag_controller.js

const { getSymptomList, getDepartmentList, getDepartment, insertQuestionnaire, insertQuestionnaireImage, insertKarte, insertKarteImage, getQuestionnaire, getQuestionnaireImage, getQuestionnaireByIdx, deleteQuestionnaireImage, updateQuestionnaire, updateQuestionnaireStatus } = require("./diag_service");
const { getCardData, getDoctor, getCardByNumber } = require("../user/user_service");

const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const cookieParser = require("cookie-parser");
const { sign } = require("jsonwebtoken");
const crypto = require('crypto');
  
const Schema = require('validate');
const emailValidator = require("email-validator");

const card_rule = /^([\d]{4})-?([\d]{4})-?([\d]{4})-?([\d]{4})$/;

module.exports = {
  // 증상진료
  diagSymptom: async(req, res) => {
    try {
      console.log("diag-diagSymptom");

      const tempData = await getSymptomList();

      return res.status(200).json ({
        status: 200,
        message: "success",
        list: tempData,
        file_url: process.env.HELLODOCTOR_DATA_SYMPTROM_URL        
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  // 과목 진료
  diagDepartment: async(req, res) => {
    try {
      console.log("diag-diagSubject");

      const tempData = await getDepartmentList();
      
      return res.status(200).json ({
        status: 200,
        message: "success",                            
        list: tempData,
        file_url: process.env.HELLODOCTOR_DATA_DEPARTMENT_URL
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  // 진료요청
  createQuestionnaire: async(req, res) => {
    try {
      console.log("diag-createQuestionnaire");

      const reqBodySchema = new Schema({
        dp_idx: {
          type :String,
          required : true,
          message : "진료받으실 과목을 선택해주세요."
        },
        symptom: {
          type :String,
          required : true,
          message: "증상을 입력해주세요."
        },
        c_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "카드번호를 확인해주세요.",
        },
        alram: {
          type :String,
          required : true,
          enum: ['true', 'false'],
          message: "알람 이용여부를 선택해주세요.",
        },
        dc_idx: {
          type: String,
          match: /^[\d]+$/,
          message: "의사를 선택해주세요.",
        }
      });

      const body = req.body;

      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      // 진료과목 확인
      const department = await getDepartment(body.dp_idx);
      if(department == undefined){
        throw({
          status: 400,
          message: "진료과목을 찾을 수 없습니다."
        });
      }

      // 카드 확인
      const card = await getCardData(req.user.mb_no, body.c_idx);
      if(card == undefined){
        throw({
          status: 400,
          message: "카드 정보를 찾을 수 없습니다."
        });
      }
      
      if(body.dc_idx != undefined){
        // 의사 확인
        const doctor = getDoctor(body.dc_idx, req.user.mb_no);
        if(doctor == undefined){
          throw({
            status: 400,
            message: "의사 정보를 찾을 수 없습니다."
          });
        }
      }
      
      const file_cnt = req.files.length;

      var temp_data = {
        dp_idx: body.dp_idx,
        symptom: body.symptom,
        image_cnt: file_cnt,
        pay_method: 'card',
        card_number: card['number'],
        card_type: '',
        alram: body.alram,
        status: 'writed',
      }

      // 문진표가 없을경우 문진표 추가, 있을경우 문진표 수정
      const questionnaire = await getQuestionnaire(req.user.mb_no);
      if(questionnaire == undefined){
        temp_data.p_idx = req.user.mb_no;

        var insertResult = await insertQuestionnaire(temp_data);
        var insertId = insertResult[0].insertId;
      }else if(questionnaire.status == 'requested'){
        throw({
          status: 400,
          message: "진료요청 신청하신 문진표는 수정할 수 없습니다.",
        });
      }else{
        // 문진표 수정
        await updateQuestionnaire(questionnaire.q_idx, temp_data);
        var insertId = questionnaire.q_idx;
        
        // 첨부파일 초기화 처리
        await deleteQuestionnaireImage(questionnaire.q_idx, "''");
      }

      // 파일 업로드
      if(file_cnt != 0){
        let files = [];
        for(var i = 0; i < file_cnt; i++){
          temp_arr = `( '${insertId}', '${req.files[i].filename}' , now() )`;
          
          files.push(temp_arr);
        }
        await insertQuestionnaireImage(files);
      }

      if(body.dc_idx != null){
        // 환자 문진표 수정
        await updateQuestionnaireStatus(questionnaire.q_idx, 'requested');

        // 의사 문진표에 복사
        temp_data.dc_idx = body.dc_idx;
        temp_data.p_idx = req.user.mb_no;

        insertResult = await insertKarte(temp_data);
        insertId = insertResult[0].insertId;

        // 파일 업로드
        if(file_cnt != 0){
          let files = [];
          for(var i = 0; i < file_cnt; i++){
            temp_arr = `( '${insertId}', '${req.files[i].filename}' , now() )`;
            
            files.push(temp_arr);
          }
          await insertKarteImage(files);
        }

        return res.status(200).json ({
          status: 200,
          message: "success",
        });
      }else{
        return res.status(200).json ({
          status: 200,
          message: "문진표 작성이 완료되었습니다. 의사를 선택해주세요.",
        });
      }
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  // 문진표 가져오기
  getQuestionnaire: async(req, res) => {
    try{
      console.log('diag-getQuestionnaire');

      const questionnaire = await getQuestionnaire(req.user.mb_no);
      if(questionnaire == undefined){
        throw({
          status: 400,
          message: "문진표를 찾을 수 없습니다.",
        });
      }

      const card = await getCardByNumber(req.user.mb_no, questionnaire.card_number);
      if(card == undefined){
        throw({
          status: 400,
          message: "카드 정보를 찾을 수 없습니다."
        });
      }

      let file = []
      if(questionnaire.image_cnt != 0){
        file = await getQuestionnaireImage(questionnaire.q_idx);
      }

      temp_data = {
        q_idx: questionnaire.q_idx,
        dp_idx: questionnaire.dp_idx,
        symptom: questionnaire.symptom,
        c_idx: card.c_idx,
        alram: questionnaire.alram,
        dc_idx: questionnaire.dc_idx,
        file
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
        data: temp_data,
        file_url: process.env.HELLODOCTOR_DATA_DIAGNOSIS_URL
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  // 문진표 수정
  updateQuestionnaire: async(req, res) => {
    try {
      console.log("diag-updateQuestionnaire");

      const reqParamsSchema = new Schema({
        q_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "문진표 고유번호를 확인해주세요.",
        },
      });

      const params = req.params;

      // validate
      const validError = reqParamsSchema.validate(params);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      const reqBodySchema = new Schema({
        dp_idx: {
          type :String,
          required : true,
          message : "진료받으실 과목을 선택해주세요."
        },
        symptom: {
          type :String,
          required : true,
          message: "증상을 입력해주세요."
        },
        c_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "카드번호를 확인해주세요.",
        },
        alram: {
          type :String,
          required : true,
          enum: ['true', 'false'],
          message: "알람 이용여부를 선택해주세요.",
        },
        dc_idx: {
          type: String,
          match: /^[\d]+$/,
          message: "의사 고유번호를 확인해주세요.",
        },
        old_file: {
          type :String
        }
      });

      const body = req.body;

      const validError1 = reqBodySchema.validate(body);
      if(validError1.length > 0){
        throw({
          status: 400,
          message: validError1[0].message
        });
      }

      // 작성한 문진표가 있는지 확인
      const questionnaire = await getQuestionnaireByIdx(params.q_idx);
      if(questionnaire == undefined){
        throw({
          status: 400,
          message: "문진표를 찾을 수 없습니다.",
        });
      }else if(questionnaire.status == 'requested'){
        throw({
          status: 400,
          message: "진료요청 신청하신 문진표는 수정할 수 없습니다.",
        });
      }else if(questionnaire.status == null){
        throw({
          status: 400,
          message: "문진표를 수정할 수 없습니다.",
        });
      }

      // 진료과목 확인
      const department = await getDepartment(body.dp_idx);
      if(department == undefined){
        throw({
          status: 400,
          message: "진료과목을 찾을 수 없습니다.",
        });
      }

      // 카드 확인
      const card = await getCardData(req.user.mb_no, body.c_idx);
      if(card == undefined){
        throw({
          status: 400,
          message: "카드 정보를 찾을 수 없습니다."
        });
      }

      if(body.dc_idx != undefined){
        // 의사 확인
        const doctor = getDoctor(body.dc_idx);
        if(doctor == undefined){
          throw({
            status: 400,
            message: "의사 정보를 찾을 수 없습니다."
          });
        }
      }

      const file_cnt = (req.files.length == undefined)? 0 : req.files.length;
      let image_cnt = file_cnt;
      let old_file;
      
      if(body.old_file != undefined){
        old_file = body.old_file.split('|');
        image_cnt += old_file.length;
      }

      // 문진표 수정
      var temp_data = {
        dp_idx: body.dp_idx,
        symptom: body.symptom,
        image_cnt: image_cnt,
        pay_method: 'card',
        card_number: card['number'],
        card_type: '',
        alram: body.alram,
        status: 'writed'
      }

      let result = await updateQuestionnaire(params.q_idx, temp_data);
      if(result == undefined){
        throw({
          status: 400,
          message: "문진표 수정중 문제가 발생하였습니다."
        });
      }

      // 이전 업로드 파일 확인
      if(questionnaire.image_cnt != 0){
        if(body.old_file != undefined){
          for(var i = 0; i < old_file.length; i++){
            old_file[i] = "'" + old_file[i] + "'";
          }

          // 첨부파일 삭제처리
          await deleteQuestionnaireImage(params.q_idx, old_file);
        }else{
          await deleteQuestionnaireImage(params.q_idx, "''");
        }
      }

      // 첨부파일 업로드
      if(file_cnt != 0){
        let files = [];
        for(var i = 0; i < file_cnt; i++){
          temp_arr = `( '${params.q_idx}', '${req.files[i].filename}' , now() )`;
          
          files.push(temp_arr);
        }
        await insertQuestionnaireImage(files);
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  // 의사 선택
  questionnaireDoctorSelct: async(req, res) => {
    try{
      console.log('diag-questionnaireDoctorSelct');

      const reqBodySchema = new Schema({
        dc_idx: {
          type: String,
          required: true,
          match: /^[\d]+$/,
          message: "의사를 선택해주세요.",
        }
      });

      const body = req.body;

      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      if(body.dc_idx != undefined){
        // 의사 확인
        const doctor = getDoctor(body.dc_idx, req.user.mb_no);
        if(doctor == undefined){
          throw({
            status: 400,
            message: "의사 정보를 찾을 수 없습니다."
          });
        }
      }

      const questionnaire = await getQuestionnaire(req.user.mb_no);
      if(questionnaire != undefined && questionnaire.status == 'writed'){
        // 의사 문진표에 복사
        questionnaire.dc_idx = body.dc_idx;

        insertResult = await insertKarte(questionnaire);
        insertId = insertResult[0].insertId;

        if(questionnaire.image_cnt != 0){
          file = await getQuestionnaireImage(questionnaire.q_idx);

          // 파일 업로드
          let files = [];
          for(var i = 0; i < questionnaire.image_cnt; i++){
            temp_arr = `( '${insertId}', '${file.file_name}' , now() )`;
            
            files.push(temp_arr);
          }
          await insertKarteImage(files);
        }

        // 환자 문진표 수정
        await updateQuestionnaireStatus(questionnaire.q_idx, 'requested');
      }else{
        // 문진표 작성 완료 이외의 상태일 경우
        throw({
          status: 400,
          message: "잘못된 접근입니다."
        });
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  // 진료요청 취소
  cancelQuestionnaire: async(req, res) => {
    try{
      console.log('diag-cancelQuestionnaire');

      // 문진표 가져오기
      const questionnaire = await getQuestionnaire(req.user.mb_no);
      if(questionnaire == undefined){
        throw({
          status: 400,
          message: "문진표를 찾을 수 없습니다."
        });
      }else if(questionnaire.status != 'requested'){
        throw({
          status: 400,
          message: "진료요청을 먼저 해 주세요."
        });
      }

      // 이미 진료가 끝났을 경우 취소 불가

      // 진료요청 취소처리
      await updateQuestionnaireStatus(questionnaire.q_idx, 'writed');

      // 의사 문진표 삭제해야할 경우 삭제처리

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
}