//user_controller.js

const { confirmUser, idConfirm, create, getTerms, phoneConfirm, insertPhoneAuth, getPhoneAuth, updatePhoneAuth, updatePassword, getUserPassword, getUserById,
  cardConfirm, insertCardData, findIdData, getPhoneAuthCode, updateAuthSuccess, getCardData, deleteCardData, userCardList, updateCardData, releaseDefaultCard,
  insertAddressData, confirmAddress, updateAddressData, deleteAddressData, patientsAddressList, getDefaultAddress, getNearbyPlace, getPatientsAddress, releaseDefaultAddress,
  getDoctorList, getDoctor, getHospital, getDoctorDepartment, getDoctorSurgeon, getDoctorReviewCount, getDoctorReview, confirmDoctor, insertLikeDoctor, deleteLikeDoctor, 
  getMainLikeDoctorList, updateAppToken, getLikeDoctorList, getMyreviewList, getReview, updateReview, updateDoctorPoint, deleteReviewData } = require("./user_service");
const cookieParser = require("cookie-parser");
const { sign } = require("jsonwebtoken");
const crypto = require('crypto');
  
const Schema = require('validate');
const emailValidator = require("email-validator");
const { getUserQuestionnaire, confirmUserQuestionnaire, getKarteCount } = require("../diagnosis/diag_service");

const phone_rule = /(^01[0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
const card_rule = /^([\d]{4})-?([\d]{4})-?([\d]{4})-?([\d]{4})$/;
const coordinate_rule = /[0-9.]$/;
const ssn_rule = /^\d{2}([0]\d|[1][0-2])([0][1-9]|[1-2]\d|[3][0-1])[-]*[1-4]\d{6}$/;

module.exports = {
  createUser: async(req, res) => {
    try {
      console.log("user-createUser");
      const reqBodySchema = new Schema({
        "id": {
          type :String,
          required : true,
          length:{max:255},
          message : "아이디를 확인해주세요."
        },
        "pw1": {
          type :String,
          required : true,
          length:{min:4, max:16},
          message : "비밀번호를 확인해주세요."
        },
        "pw2": {
          type :String,
          required : true,
          length:{min:4, max:16},
          message : "비밀번호를 확인해주세요."
        },
        "name": {
          type :String,
          required : true,
          length:{min:1, max:255},
          message : "이름을 확인해주세요."
        },
        "phone": {
          type :String,
          required : true,
          match: phone_rule,
          length:{min:10, max:13},
          message : "휴대폰 번호를 확인해주세요."
        },
        "ssn": {
          type :String,
        },
        "code": {
          type :String,
          required : true,
          length: 6,
          message: "인증번호를 확인해주세요."
        },
      });

      const body = req.body;

      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      // 주민등록 확인 따로 처리 빈칸 값때문에
      if(body.ssn != '' && body.ssn != undefined){
        if(!ssn_rule.test(body.ssn)){
          throw({
            status: 400,
            message: "주민등록번호를 확인해주세요."
          });
        }

        const ssnArray = body.ssn.split('-');
        var s1 = ssnArray[0];
        var s2 = ssnArray[1];
        var f = isSSN(s1 , s2);

        if(!f) {
          throw({
            status: 400,
            message: "유효하지 않는 주민등록번호입니다. 확인해주세요."
          });
        }
      }

      // email valid
      const emailValidError = emailValidator.validate(body.id);
      if(!emailValidError){
        throw({
          status: 400,
          message: '아이디는 이메일 형식이여야 합니다.'
        });
      }

      // 인증요청 검색
      const authData = await getPhoneAuth(body.phone);
      
      // 인증여부 확인
      if(authData == undefined){
        throw({
          status: 400,
          message: '인증번호를 찾을 수 없습니다.'
        });
      }else if(authData['code'] != body.code){
        throw({
          status: 400,
          message: '잘못된 인증요청입니다.'
        });
      }else if(authData['is_success'] == 'true'){
        throw({
          status: 400,
          message: '유효하지 않은 인증코드입니다.'
        });
      }

      const idFlag = await idConfirm(body.id);
      if(idFlag != 0){
        throw({
          status: 400,
          message: '아이디가 이미 존재합니다.'
        });
      }

      // 전화번호 중복검사
      const phoneFlag = await phoneConfirm(body.phone);
      if(phoneFlag != 0){
        throw({
          status: 400,
          message: '해당 전화번호는 이미 사용중입니다.'
        });
      }

      if(body.pw1 != body.pw2){
        throw({
          status: 400,
          message: '비밀번호가 다릅니다 확인해주세요.'
        });
      }

      // sha512 password
      body.pw1 = crypto.createHash('sha512').update(body.pw1).digest('hex').toUpperCase();
      
      body.phone = body.phone.replace(phone_rule, "$1-$2-$3");
      body.ssn = (body.ssn)? body.ssn : '';

      const createResult = await create(body);
      var insertId = createResult[0].insertId;

      // 인증 완료처리
      await updateAuthSuccess(authData['idx']);

      const user = { mb_no : insertId , id: body.id , name: body.name };
      // console.log(user);

      const accessToken = sign(user, process.env.ACCESS_TOKEN_SECRET , {
        expiresIn: "365 days"
      });
      const refreshToken = sign(user, process.env.REFRESH_TOKEN_SECRET , {
        expiresIn: "365 days"
      });

      return res.cookie("x_auth", accessToken, {
        maxAge: 1000 * 30,
        httpOnly: true,
      }).status(200).json ({
        status: 200,
        message: "success",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  login: async(req, res) => {
    try{
      console.log("user-login");
      const reqBodySchema = new Schema({
        "id": {
          type :String,
          required : true,
          length:{min:4, max:255},
          message: '아이디를 확인해주세요.'
        },
        "pw": {
          type :String,
          required : true,
          length:{min:8, max:255},
          message: '비밀번호를 확인해주세요.'
        }
      });
      
      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      // sha512 password
      body.pw = crypto.createHash('sha512').update(body.pw).digest('hex').toUpperCase();
      const userResult = await confirmUser(body.id , body.pw);

      if(userResult == undefined){
        throw({
          status: 400,
          message: '회원 정보를 찾을수 없습니다.'
        });
      }

      // console.log(userResult);

      if(userResult == null){
        throw({
          status: 400,
          message: '아이디 또는 비밀번호를 확인해주세요.'
        });
      }

      const user = { mb_no : userResult.idx , id: userResult.id , name: userResult.name };

      const accessToken = sign(user, process.env.ACCESS_TOKEN_SECRET , {
        expiresIn: "365 days"
      });
      const refreshToken = sign(user, process.env.REFRESH_TOKEN_SECRET , {
        expiresIn: "365 days"
      });

      return res.cookie("x_auth", accessToken, {
        maxAge: 1000 * 30,
        httpOnly: true,
      }).status(200).json ({
        status: 200,
        message: "success",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  refresh: async(req, res) => {
    try{
      console.log("user-refresh");

      const userData = req.user;
      const user = { mb_no : userData.mb_no , id: userData.id , name: userData.name };
     
      const accessToken = sign(user, process.env.ACCESS_TOKEN_SECRET , {
        expiresIn: "1h"
      });

      return res.cookie("x_auth", accessToken, {
        maxAge: 1000 * 30,
        httpOnly: true,
      }).status(200).json ({
        status: 200,
        message: "success",
        accessToken: accessToken
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  main: async(req, res) => {
    try{
      console.log('user-main');

      // 회원정보
      const userData = await getUserById(req.user.id);
      
      let questionnaireFlag = 'false';
      // 문진표 작성여부
      const questionnaire = await confirmUserQuestionnaire(req.user.mb_no);
      if(questionnaire == undefined){
      }else if(questionnaire.status == 'writed'){
        questionnaireFlag = 'true';
      }else if(questionnaire.status == 'requested'){
        questionnaireFlag = 'requested';
      }

      userData.questionnaireFlag = questionnaireFlag;

      let dateNum = new Date().getDay();

      // 자주가는 의사
      const doctorList = await getMainLikeDoctorList(req.user.mb_no);
      if(doctorList[0] != undefined){
        for(const [idx, item] of doctorList.entries()){     
          let info = JSON.parse(item.dc_info)[dateNum];

          // 처방전 가져오기
          const karte_cnt = await getKarteCount(item.dc_idx);
          
          doctorList[idx].dc_status = checkDoctorStatus(info, karte_cnt);
      
          delete doctorList[idx].dc_info;
        };
      }

      // 기본 주소지
      const addressData = await getDefaultAddress(req.user.mb_no);
      if(addressData == undefined){
        addressData = null;
      }else{
        addressData.lat = parseFloat(addressData.lat);
        addressData.lng = parseFloat(addressData.lng);
      }
      
      return res.status(200).json ({
        status: 200,
        message: "success",
        user: userData,
        likeDoctorList: doctorList,
        address: addressData,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  updateAppToken: async(req, res) => {
    try{
      console.log('user-updateAppToken');

      const reqBodySchema = new Schema({
        token: {
          type :String,
          required : true,
          message : "토큰을 확인해주세요.",
        },
      });

      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      const result = await updateAppToken(req.user.mb_no, body.token);
      if(result[0] == undefined){
        throw{
          status: 400,
          message: '토큰정보를 수정하는데 실패하였습니다.'
        }
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
  terms: async(req, res) => {
    try{
      console.log('user-terms');
      
      const reqQuerySchema = new Schema({
        type: {
          type: String,
          required: true,
          enum: ['service', 'privacy', 'identity', 'sensitive', 'location', 'marketing'],
          message: "약관을 선택해주세요.",
        }
      });

      const query = req.query;

      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      query.type += '-user';

      const temp_data = await getTerms(query.type);

      return res.status(200).json ({
        status: 200,
        message: "success",
        data: temp_data
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }  
  },
  authPhone: async(req, res) => {
    try{
      console.log('user-authPhone');

      const reqBodySchema = new Schema({
        phone: {
          type :String,
          required : true,
          match: phone_rule,
          length:{min:10, max:13},
          message : "휴대폰 번호를 확인해주세요."
        },
      });

      // validate
      const validError = reqBodySchema.validate(req.body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      const phone = req.body.phone;

      var Num=""; 
      for(var i=0;i<6;i++) 
      { 
        Num+=Math.floor(Math.random()*10); 
      }

      // 인증코드 저장
      await insertPhoneAuth(phone, Num);

      // 알리고 api
      // var dataBody = "key=ubrfpaw88tenzh0dhm4dr2v4ue08mwn1&user_id=dev1newmeon&sender=010-9052-5810&receiver="+phone+"&msg=캣도그쇼 휴대폰 인증번호입니다. ["+Num+"]";
      // var response = null;
      
      // try {
      //   response = await fetch("https://apis.aligo.in/send/",{
      //     method: "post",
      //     body: dataBody,
      //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      //   });
      //   var json = await response.json();
      //   console.log(json);
      // } catch (error) {
      //   console.log(error);
      //   console.log(error.message);
      // }

      return res.status(200).json ({
        status: 200,
        message: "success",
        code: Num
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }  
  },
  confirmAuth: async(req, res) => {
    try{
      console.log('user-confirmAuth');

      const reqBodySchema = new Schema({
        "phone": {
          type :String,
          required : true,
          match: phone_rule,
          length:{min:10, max:13},
          message : "휴대폰 번호를 확인해주세요."
        },
        "code": {
          type :String,
          required : true,
          length: 6,
          message: "인증번호를 확인해주세요."
        }
      });

      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      // 인증요청 검색
      const authData = await getPhoneAuthCode(body.phone, body.code);
      
      // 인증시간, 인증여부 확인
      if(authData == undefined){
        throw({
          status: 400,
          message: '인증번호를 찾을 수 없습니다.'
        });
      }else if(authData['auth'] == 'true' || authData['is_success'] == 'true'){
        throw({
          status: 400,
          message: '유효하지 않은 인증코드입니다.'
        });
      }

      var nowDate = convTime(Date.now());
      var expiry_date = convTime(authData['expiry_date']);

      if(nowDate >= expiry_date){
        throw({
          status: 400,
          message: '인증시간이 만료되었습니다.'
        });
      }

      // 인증 완료처리
      await updatePhoneAuth(authData['idx']);

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  changePwd: async(req, res) => {
    try{
      console.log('user-changePwd');
      const reqBodySchema = new Schema({
        "pw1": {
          type :String,
          required : true,
          length:{min:4, max:16},
          message : "비밀번호를 확인해주세요."
        },
        "pw2": {
          type :String,
          required : true,
          length:{min:4, max:16},
          message : "비밀번호를 확인해주세요."
        },
        "phone": {
          type :String,
          required : true,
          match: phone_rule,
          length:{min:10, max:13},
          message : "휴대폰 번호를 확인해주세요."
        },
        "code": {
          type :String,
          required : true,
          length: 6,
          message: "인증번호를 확인해주세요."
        },
      });

      const body = req.body;

      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      if(body.pw1 != body.pw2){
        throw({
          status: 400,
          message: '비밀번호가 다릅니다 확인해주세요.'
        });
      }

      // 인증요청 검색
      const authData = await getPhoneAuth(body.phone);
      
      // 인증여부 확인
      if(authData == undefined){
        throw({
          status: 400,
          message: '인증번호를 찾을 수 없습니다.'
        });
      }else if(authData['code'] != body.code){
        throw({
          status: 400,
          message: '잘못된 인증요청입니다.'
        });
      }else if(authData['is_success'] == 'true'){
        throw({
          status: 400,
          message: '유효하지 않은 인증코드입니다.'
        });
      }

      // sha512 password
      body.pw1 = crypto.createHash('sha512').update(body.pw1).digest('hex').toUpperCase();

      const pwdFlag = await getUserPassword(body.phone, body.pw1);
      if(pwdFlag != 0){
        throw({
          status: 400,
          message: '기존에 사용하시는 비빌번호와 같습니다. 다시 입력해주세요.'
        });
      }

      // 비밀번호 변경완료
      await updatePassword(body.phone, body.pw1);

      // 인증 완료처리
      await updateAuthSuccess(authData['idx']);

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    } 
  },
  fileId: async(req, res) => {
    try {
      console.log("user-fileId");
      const reqBodySchema = new Schema({
        "name": {
          type :String,
          required : true,
          length:{min:1, max:255},
          message : "이름을 확인해주세요."
        },
        "phone": {
          type :String,
          required : true,
          match: phone_rule,
          length:{min:10, max:13},
          message : "휴대폰 번호를 확인해주세요."
        },
        "code": {
          type :String,
          required : true,
          length: 6,
          message: "인증번호를 확인해주세요."
        },
      });

      const body = req.body;

      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      // 인증요청 검색
      const authData = await getPhoneAuth(body.phone);
      
      // 인증여부 확인
      if(authData == undefined){
        throw({
          status: 400,
          message: '인증번호를 찾을 수 없습니다.'
        });
      }else if(authData['code'] != body.code){
        throw({
          status: 400,
          message: '잘못된 인증요청입니다.'
        });
      }else if(authData['is_success'] == 'true'){
        throw({
          status: 400,
          message: '유효하지 않은 인증코드입니다.'
        });
      }

      // 요청성공처리
      await updateAuthSuccess(authData['idx']);

      // 회원정보 검색
      const userData = await findIdData(body.name, body.phone);
      if(userData == undefined){
        throw({
          status: 400,
          message: '회원정보를 찾을 수 없습니다.'
        });
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
        data: userData
      });
    } catch(error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  getUser: async(req, res) => {
    try {
      console.log('user-getUser');
      const id = req.user.id;

      const userData = await getUserById(id);
      if(userData == undefined){
        throw({
          status: 400,
          message: '회원 정보를 찾을 수 없습니다.',
        });
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
        data: userData,
      });
    } catch {
      console.log(error.message);
      returnError(res,error);
    }
  },
  insertCard: async(req, res) => {
    try {
      console.log('user-insertCard');

      const reqBodySchema = new Schema({
        number: {
          type :String,
          required : true,
          match: card_rule,
          length: {min:16, max:19},
          message : "카드번호를 확인해주세요.",
        },
        expired: { 
          type :String,
          required : true,
          match: /^(0[1-9]|1[0-2])\/(\d{2})$/,
          message : "유효기간을 확인해주세요.",
        },
        pwd: {
          type :String,
          required : true,
          match: /^([\d]{2})$/,
          length: 2,
          message : "비밀번호를 확인해주세요.",
        },
      });

      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      // 카드번호 변환
      body.number = body.number.replace(card_rule, "$1-$2-$3-$4");
      
      // 유효기간 변환
      const temp_date = body.expired.split('/');
      body.expired_mm = temp_date[0];
      body.expired_yy = temp_date[1];
      
      // 카드 중복검사
      const cardFlag = await cardConfirm(req.user.mb_no, body.number);
      if(cardFlag != 0){
        throw{
          status: 400,
          message: '이미 등록된 카드 입니다.'
        }
      }

      const cardData = await userCardList(req.user.mb_no);
      
      // 카드를 처음 등록하는 경우 기본 카드로 설정
      if(cardData[0] == undefined){
        body.is_default = 'true';
      }else{
        body.is_default = 'false';
      }

      // 카드 등록
      const resultData = await insertCardData(req.user.mb_no, body);
      if(!resultData[0].insertId){
        throw({
          status: 400,
          message: '카드 등록중 문제가 발생하였습니다.'
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
  updateCard: async(req, res) => {
    try{
      console.log('user-updateCard');
      
      const reqParamsSchema = new Schema({
        c_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "카드번호를 확인해주세요.",
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
        pwd: {
          type :String,
          required : true,
          match: /^([\d]{2})$/,
          length: 2,
          message : "비밀번호를 확인해주세요.",
        },
      });

      const body = req.body;
      

      // validate
      const validError1 = reqBodySchema.validate(body);
      if(validError1.length > 0){
        throw({
          status: 400,
          message: validError1[0].message
        });
      }
      
      // 카드 확인
      const cardData = await getCardData(req.user.mb_no, params.c_idx);
      if(cardData == undefined){
        throw{
          status: 400,
          message: "카드 정보를 찾을 수 없습니다." 
        }
      }

      // 카드정보 수정
      var temp_data = {
        pwd: body.pwd,
      }
      const result = await updateCardData(params.c_idx, temp_data);
      if(result[0] == undefined){
        throw{
          status: 400,
          message: "정보 수정중 문제가 발생하였습니다." 
        }
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
  deleteCard: async(req, res) => {
    try{
      console.log('user-updateCard');

      const reqParamsSchema = new Schema({
        c_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "카드번호를 확인해주세요.",
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
      
      // 신용카드가 있는지
      const cardData = await getCardData(req.user.mb_no, params.c_idx);
      if(cardData == undefined){
        throw{
          status: 400,
          message: "카드 정보를 찾을 수 없습니다." 
        }
      }
      
      const resultData = await deleteCardData(params.c_idx);
      if(resultData[0] == undefined){
        throw{
          status: 400,
          message: "삭제중 문제가 발생하였습니다." 
        }
      }

      // 삭제하는 카드가 기본 카드일 경우
      if(cardData['is_default'] == 'true'){
        // 마지막에 등록된 카드를 기본 카드로 지정
        const cardList = await userCardList(req.user.mb_no);
        if(cardList[0] != undefined){
          // 카드 정보 수정
          var temp_data = {
            is_default: 'true',
          }
          await updateCardData(cardList[0].c_idx, temp_data)
        }
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
  changeDefaultCard: async(req, res) => {
    try{
      console.log('user-changeDefaultCard');

      const reqBodySchema = new Schema({
        c_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "카드번호를 확인해주세요.",
        },
      });

      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      const p_idx = req.user.mb_no;

      // 카드 확인
      const cardData = await getCardData(p_idx, body.c_idx);
      if(cardData == undefined){
        throw{
          status: 400,
          message: "카드 정보를 찾을 수 없습니다." 
        }
      }

      // 해당 카드가 이미 기본카드일 경우
      if(cardData['is_default'] == true){
        throw{
          status: 400,
          message: "이미 기본 결제 수단으로 등록되어 있습니다." 
        }
      }

      // 기존 기본카드 기본카드 해제
      await releaseDefaultCard(p_idx);

      // 기본카드 적용
      var temp_data = {
        is_default: 'true'
      }

      const result = await updateCardData(body.c_idx, temp_data);
      if(result[0] == undefined){
        throw{
          status: 400,
          message: "정보 수정중 문제가 발생하였습니다." 
        }
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
  getCardList: async(req, res) => {
    try{
      console.log('user-getCardList');

      const card_list = await userCardList(req.user.mb_no);

      return res.status(200).json ({
        status: 200,
        message: "success",
        lists: card_list,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    } 
  },
  insertAddress: async(req, res) => {
    try{
      console.log('user-insertAddress');
      
      const reqBodySchema = new Schema({
        address: {
          type :String,
          required : true,
          message : "주소를 입력해주세요.",
        },
        address_detail: {
          type :String,
          required : true,
          message : "상세주소를 입력해주세요.",
        },
        lat:{
          type :String,
          required: true,
          match : coordinate_rule,
          length:{max:255},
          message : "위도값을 확인해주세요."
        },
        lng:{
          type :String,
          required: true,
          match : coordinate_rule,
          length:{max:255},
          message : "경도값을 확인해주세요."
        },
        is_doorlock: {
          type :String,
          required : true,
          enum: ['true','false'],
          message : "공동현관 비밀번호 여부를 확인해주세요.",
        },
        pwd: {
          type :String,
          message : "공동현관 비밀번호를 입력해주세요.",
        },
      });

      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      if(body.is_doorlock == 'true' && (body.pwd == undefined || body.pwd == '')){
        throw({
          status: 400,
          message: '공동현관 비밀번호를 입력해주세요.'
        })
      }

      if(body.pwd == undefined){
        body.pwd = '';
      }

      const addressData = await getDefaultAddress(req.user.mb_no);
      if(addressData == undefined){
        body.is_default = 'true';
      }else{
        body.is_default = 'false';
      }

      // 주소가 등록되어있지 않은경우 기본 주소지로 등록
      const insertResult = await insertAddressData(req.user.mb_no, body);
      if(insertResult[0] == undefined){
        throw({
          status: 400,
          message: '주소지 등록중 문제가 발생하였습니다.'
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
  updateAddress: async(req, res) => {
    try{
      console.log('user-updateAddress');
      const reqParamsSchema = new Schema({
        add_idx: {
          type: String,
          required: true,
          match: /^[0-9]+$/,
          message: "고유번호를 확인해주세요.",
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
        address: {
          type: String,
          required: true,
          message: "주소를 입력해주세요.",
        },
        address_detail: {
          type: String,
          required: true,
          message: "상세주소를 입력해주세요.",
        },
        lat:{
          type: String,
          required: true,
          match: coordinate_rule,
          length: {max:255},
          message: "위도값을 확인해주세요."
        },
        lng:{
          type: String,
          required: true,
          match: coordinate_rule,
          length: {max:255},
          message: "경도값을 확인해주세요."
        },
        is_doorlock: {
          type: String,
          required: true,
          enum: ['true','false'],
          message: "공동현관 비밀번호 여부를 확인해주세요.",
        },
        pwd: {
          type: String,
          message: "공동현관 비밀번호를 입력해주세요.",
        },
      });

      const body = req.body;

      // validate
      const validError1 = reqBodySchema.validate(body);
      if(validError1.length > 0){
        throw({
          status: 400,
          message: validError1[0].message
        });
      }

      if(body.is_doorlock == 'true' && (body.pwd == undefined || body.pwd == '')){
        throw({
          status: 400,
          message: '공동현관 비밀번호를 입력해주세요.'
        })
      }else if(body.is_doorlock == 'false'){
        body.pwd = '';
      }

      const confirmAddr = await confirmAddress(req.user.mb_no, params.add_idx);
      if(confirmAddr == 0){
        throw({
          status: 400,
          message: '주소지 정보를 찾을 수 없습니다.'
        });
      }

      const updateResult = await updateAddressData(params.add_idx, body);
      if(updateResult[0] == undefined){
        throw({
          status: 400,
          message: '주소지 수정중 문제가 발생하였습니다.'
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
  deleteAddress: async(req, res) => {
    try{
      console.log('user-deleteAddress');
      const reqParamsSchema = new Schema({
        add_idx: {
          type: String,
          required: true,
          match: /^[0-9]+$/,
          message: "고유번호를 확인해주세요.",
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
      
      const addressData = await getPatientsAddress(req.user.mb_no, params.add_idx);
      if(addressData == undefined){
        throw{
          status: 400,
          message: "주소지를 찾을 수 없습니다." 
        }
      }

      const deleteResult = await deleteAddressData(req.user.mb_no, params.add_idx);
      if(deleteResult[0] == undefined){
        throw({
          status: 400,
          message: '주소지 삭제중 문제가 발생하였습니다.'
        });
      }

      // 삭제한 주소가 기본주소인 경우
      if(addressData['is_default'] == 'true'){
        const addressList = await patientsAddressList(req.user.mb_no);
        if(addressList[0] != undefined){
          var temp_data = {
            is_default: 'true'
          }
          await updateAddressData(addressList[0].add_idx, temp_data);
        }
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
  getAddressList: async(req, res) => {
    try{
      console.log('user-getAddressList');

      const addressList = await patientsAddressList(req.user.mb_no);

      return res.status(200).json ({
        status: 200,
        message: "success",
        lists: addressList
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    } 
  },
  changeDefaultAddress: async(req, res) => {
    try{
      console.log('user-changeDefaultAddress');

      const reqBodySchema = new Schema({
        add_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "주소지 번호를 확인해주세요.",
        },
      });

      const body = req.body;

      // validate
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      const add_idx = body.add_idx;

      // 주소지 확인
      const addressData = getPatientsAddress(req.user.mb_no, add_idx);

      // 해당 카드가 이미 기본카드일 경우
      if(addressData['is_default'] == true){
        throw{
          status: 400,
          message: "이미 기본주소로 등록되어 있습니다." 
        }
      }

      // 기존 기본주소 설정 해제
      await releaseDefaultAddress(req.user.mb_no);

      // 기본주소 적용
      var temp_data = {
        is_default: 'true'
      }

      const result = await updateAddressData(body.add_idx, temp_data);
      if(result[0] == undefined){
        throw{
          status: 400,
          message: "정보 수정중 문제가 발생하였습니다." 
        }
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
  searchMap: async(req, res) => {
    try{
      console.log('user-searchMap');

      const reqQuerySchema = new Schema({
        type: {
          type: String,
          required: true,
          enum: ['hospital', 'pharmacy'],
          message: "검색 타입을 선택해주세요."
        }
      });

      const query = req.query;

      // validate
      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      // 내 기본주소 가져오기
      const addressData = await getDefaultAddress(req.user.mb_no);
      if(addressData == undefined){
        throw({
          status: 400,
          message: "기본주소지를 등록해주세요",
        });
      }else{
        addressData.lat = parseFloat(addressData.lat);
        addressData.lng = parseFloat(addressData.lng);
      }

      let dateNum = new Date().getDay();
      let temp_date = new Date();
      let nowDate = convTime(temp_date);
      let today = getToday();

      // 해당 주소로 가까운 장소 찾기
      const temp_data = await getNearbyPlace(query.type, addressData.lat, addressData.lng);
      if(temp_data[0] != undefined){
        for(const [idx, item] of temp_data.entries()){
          temp_data[idx].lat = parseFloat(item.lat);
          temp_data[idx].lng = parseFloat(item.lng);

          // 진료가능여부, 진료시간
          let info = JSON.parse(item.info)[dateNum];
          
          let open = convTime(today+ " " + info.open);
          let close = convTime(today+ " " + info.close);

          if(open < nowDate && close > nowDate){
            temp_data[idx].status = "진료가능";
          }else{
            temp_data[idx].status = "진료마감";  
          }

          temp_data[idx].info = info;
        }
      }

      delete addressData.add_idx;

      return res.status(200).json ({
        status: 200,
        message: "success",
        lists: temp_data,
        defaultAddress : addressData
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    } 
  },
  doctorList: async(req, res) => {
    try {
      console.log("user-doctorList");
      // 데이터 받기
      const reqQuerySchema = new Schema({
        type: {
          type: String,
          required: true,
          enum: ['symptom', 'department'],
          message: "검색 타입을 확인해주세요.",
        },
        tag: {
          type: String,
          required: true,
          message: "검색 태그를 선택해주세요."
        },
        search: {
          type: String,
        },
        order: {
          type: String,
          required: true,
          enum: ["default","review","rank","video"],
          message: "정렬방식을 확인해주세요.",
        },
        page:{
          type: String,
          match: /^[\d]+$/,
          message: "페이지번호를 입력해주세요"
        }
      });

      const query = req.query;

      // validate
      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      const search = (query.search != undefined)? query.search : '';

      // 기본주소지 가져오기
      const addressData = await getDefaultAddress(req.user.mb_no);
      if(addressData == undefined){
        throw({
          status: 400,
          message: "기본주소지를 등록해주세요",
        });
      }

      if(query.page == undefined){
        query.page = 1;
      }

      const tag = (query.tag == 'all')? '': query.tag;
      
      const listSize = 10;
      let curPage= Number.parseInt(query.page);
      
      const temp_data = await getDoctorList(curPage, listSize, query.type, tag, search, query.order, addressData.lat,addressData.lng);
      const total_cnt = temp_data.total_cnt;
      let list = temp_data.lists;

      let totalPage = Math.ceil(temp_data.total_cnt / listSize);// 전체 페이지수

      let dateNum = new Date().getDay();

      if(total_cnt > 0){
        for(const [idx, item] of list.entries()){
          list[idx].dc_point = parseFloat(item.dc_point);
          let info = JSON.parse(item.dc_info)[dateNum];

          // 처방전 가져오기
          const karte_cnt = await getKarteCount(item.dc_idx);

          list[idx].dc_status = checkDoctorStatus(info, karte_cnt);
      
          delete list[idx].dc_info;
        };
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
        page: curPage,
        listSize: listSize,
        totalPage: totalPage,
        totalCount: total_cnt,
        list: list,
        profile_url: process.env.HELLODOCTOR_DATA_DOCTOR_URL,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  getDoctor: async(req, res) => {
    try {
      console.log("user-getDoctor");
      // 데이터 받기
      const reqQuerySchema = new Schema({
        dc_idx: {
          type: String,
          required: true,
          match: /^[0-9]+$/,
          message: "고유번호를 확인해주세요.",
        },
      });

      const query = req.query;

      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      // 의사정보
      const doctorData = await getDoctor(query.dc_idx, req.user.mb_no);
      if(doctorData == undefined){
        throw({
          status: 400,
          message: "의사를 찾을 수 없습니다.",
        });
      }
      
      // 병원정보
      const hospitalData = await getHospital(doctorData.hospital_h_idx);

      // 진료과목
      const department = await getDoctorDepartment(query.dc_idx);

      // 전문의 정보
      // const surgeon = await getDoctorSurgeon(query.dc_idx);
      
      // 처방전 개수
      const karte_cnt = await getKarteCount(query.dc_idx);

      // 진료시간 
      let dateNum = new Date().getDay();      
      let info = JSON.parse(doctorData.dc_info)[dateNum];

      doctorData.dc_status = checkDoctorStatus(info, karte_cnt);

      // 데이터 병합
      let temp_data = Object.assign(doctorData,department);
      // temp_data = Object.assign(temp_data,surgeon);
      temp_data.dc_info = JSON.parse(temp_data.dc_info);
      temp_data.profile_url = process.env.HELLODOCTOR_DATA_DOCTOR_URL;

      // 중복데이터 삭제
      delete temp_data.hospital_h_idx;

      return res.status(200).json ({
        status: 200,
        message: "success",
        doctor: temp_data,
        hospital: hospitalData,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  getDoctorReview: async(req, res) => {
    try {
      console.log("user-getDoctorReview");
      // 데이터 받기
      const reqQuerySchema = new Schema({
        dc_idx: {
          type: String,
          required: true,
          match: /^[0-9]+$/,
          message: "고유번호를 확인해주세요.",
        },
        page:{
          type: String,
          match: /^[\d]+$/,
          message: "페이지번호를 입력해주세요"
        }
      });

      const query = req.query;

      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      if(query.page == undefined){
        query.page = 1;
      }

      const doctor = await confirmDoctor(query.dc_idx);
      if(doctor == undefined){
        throw({
          status: 400,
          message: "의사를 찾을 수 없습니다.",
        });
      }

      const temp_data = await getDoctorReviewCount(query.dc_idx);
      
      const listSize = 10;
      let curPage = Number.parseInt(query.page);
      let totalCount = temp_data.cnt;
      let point = parseFloat(temp_data.point);
      let totalPage = Math.ceil(totalCount / listSize);// 전체 페이지수
      let start = 0;

      // 페이징
      if (curPage <= 1){
        start = 0;
        curPage = 1;
      }else{
        start = (curPage - 1) * listSize;
      }

      const review = await getDoctorReview(start, listSize, query.dc_idx);
      if(review[0] != undefined){
        review.forEach(function(item, index){
          review[index].point = parseFloat(item.point);
        })
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
        page: curPage,
        listSize: listSize,
        totalPage: totalPage,
        totalCount: totalCount,
        avgPoint: point,
        lists: review,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  doctorLike: async(req, res) => {
    try {
      console.log("user-doctorLike");
      // 데이터 받기
      const reqBodySchema = new Schema({
        dc_idx: {
          type: String,
          required: true,
          match: /^[0-9]+$/,
          message: "고유번호를 확인해주세요.",
        },
      });

      const body = req.body;
      
      const validError = reqBodySchema.validate(body);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }
      
      const doctor = await getDoctor(body.dc_idx, req.user.mb_no);
      if(doctor == undefined){
        throw({
          status: 400,
          message: "의사를 찾을 수 없습니다.",
        });
      }

      if(doctor.like_flag == 'true'){
        await deleteLikeDoctor(req.user.mb_no, body.dc_idx);
      }else{
        await insertLikeDoctor(req.user.mb_no, body.dc_idx);
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
  likeDoctorList: async(req, res) => {
    try {
      console.log("user-likeDoctorList");
      // 데이터 받기
      const reqQuerySchema = new Schema({
        page:{
          type: String,
          match: /^[\d]+$/,
          message: "페이지번호를 확인해주세요."
        }
      });

      const query = req.query;

      // validate
      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      if(query.page == undefined){
        query.page = 1;
      }
      
      const listSize = 10;
      let curPage= Number.parseInt(query.page);
      
      const temp_data = await getLikeDoctorList(curPage, listSize, req.user.mb_no);
      const total_cnt = temp_data.total_cnt;
      let list = temp_data.list;

      let totalPage = Math.ceil(temp_data.total_cnt / listSize); // 전체 페이지수

      let dateNum = new Date().getDay();

      if(total_cnt > 0){
        for(const [idx, item] of list.entries()){
          list[idx].dc_point = parseFloat(item.dc_point);
          
          let info = JSON.parse(item.dc_info)[dateNum];

          // 처방전 가져오기
          const karte_cnt = await getKarteCount(item.dc_idx);
          
          list[idx].dc_status = checkDoctorStatus(info, karte_cnt);
      
          delete list[idx].dc_info;
        };
      }
      
      return res.status(200).json ({
        status: 200,
        message: "success",
        page: curPage,
        listSize: listSize,
        totalPage: totalPage,
        totalCount: total_cnt,
        list: list,
        profile_url: process.env.HELLODOCTOR_DATA_DOCTOR_URL,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  getMyReview: async(req, res) => {
    try {
      console.log("user-getDoctorReview");
      // 데이터 받기
      const reqQuerySchema = new Schema({
        page:{
          type: String,
          match: /^[\d]+$/,
          message: "페이지번호를 입력해주세요"
        }
      });

      const query = req.query;

      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      if(query.page == undefined){
        query.page = 1;
      }
      
      const listSize = 10;
      let curPage = Number.parseInt(query.page);

      const temp_data = await getMyreviewList(curPage, listSize, req.user.mb_no);
      const list = temp_data.list;
      const totalCount = temp_data.total_cnt;

      if(totalCount > 0){
        list.forEach(function(item, idx){
          list[idx].point = parseFloat(item.point);
        })
      }
      
      let totalPage = Math.ceil(totalCount / listSize);// 전체 페이지수

      return res.status(200).json ({
        status: 200,
        message: "success",
        page: curPage,
        listSize: listSize,
        totalPage: totalPage,
        totalCount: totalCount,
        list: list,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  getReview: async(req, res) => {
    try {
      console.log("user-getDoctorReview");
      // 데이터 받기
      const reqQuerySchema = new Schema({
        dcr_idx:{
          type: String,
          required: true,
          match: /^[\d]+$/,
          message: "리뷰 고유번호를 입력해주세요"
        }
      });

      const query = req.query;

      const validError = reqQuerySchema.validate(query);
      if(validError.length > 0){
        throw({
          status: 400,
          message: validError[0].message
        });
      }

      const temp_data = await getReview(req.user.mb_no, query.dcr_idx);
      if(temp_data == undefined){
        throw({
          status: 400,
          message: '리뷰를 찾을 수 없습니다.'
        });
      }else{
        temp_data.point = parseFloat(temp_data.point);
      }

      return res.status(200).json ({
        status: 200,
        message: "success",
        data: temp_data,
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  updateReview: async(req, res) => {
    try {
      console.log("user-getDoctorReview");
      const reqParamsSchema = new Schema({
        dcr_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "리뷰 고유번호를 확인해주세요.",
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
        point: {
          type :String,
          required : true,
          match: /^(\d.\d)+$/,
          message : "평점을 확인해주세요."
        },
        content: {
          type :String,
          required : true,
          message: "내용을 입력해주세요."
        },
      });

      const body = req.body;

      const validError1 = reqBodySchema.validate(body);
      if(validError1.length > 0){
        throw({
          status: 400,
          message: validError1[0].message
        });
      }

      // 작성한 리뷰가 있는지 확인
      const review = await getReview(req.user.mb_no, params.dcr_idx);
      if(review == undefined){
        throw({
          status: 400,
          message: '리뷰를 찾을 수 없습니다.'
        });
      }

      const result = await updateReview(params.dcr_idx, body);
      if(result[0] == undefined){
        throw({
          status: 400,
          message: '리뷰 수정중 문제가 발생하였습니다.'
        });
      }

      // 리뷰 평점 가져오기
      const doctorReview = await getDoctorReviewCount(review.dc_idx);
      if(doctorReview.cnt > 0){
        doctorReview.point = parseFloat(doctorReview.point);
      }

      // 의사 평점 수정
      await updateDoctorPoint(review.dc_idx, doctorReview.point);

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },
  deleteReview: async(req, res) => {
    try {
      console.log("user-getDoctorReview");
      const reqParamsSchema = new Schema({
        dcr_idx: {
          type :String,
          required : true,
          match: /^[\d]+$/,
          message : "리뷰 고유번호를 확인해주세요.",
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

      // 작성한 리뷰가 있는지 확인
      const review = await getReview(req.user.mb_no, params.dcr_idx);
      if(review == undefined){
        throw({
          status: 400,
          message: '리뷰를 찾을 수 없습니다.'
        });
      }

      const result = await deleteReviewData(params.dcr_idx);
      if(result[0] == undefined){
        throw({
          status: 400,
          message: '리뷰 수정중 문제가 발생하였습니다.'
        });
      }

      // 리뷰 평점 가져오기
      const doctorReview = await getDoctorReviewCount(review.dc_idx);
      if(doctorReview.cnt > 0){
        doctorReview.point = parseFloat(doctorReview.point);
      }
      

      // 의사 평점 수정
      await updateDoctorPoint(review.dc_idx, doctorReview.point);

      // 리뷰 가능여부 변경

      return res.status(200).json ({
        status: 200,
        message: "success",
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  }
}

// 날짜변환 (초 단위까지);
function convTime(date){
  var date = new Date(date);
  var year = date.getFullYear();
  var month = ("0" + (1 + date.getMonth())).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);
  var hours = ("0" + date.getHours()).slice(-2);
  var minutes = ("0" + date.getMinutes()).slice(-2);
  var seconds = ("0" + date.getSeconds()).slice(-2);

  var time = year +"-"+ month +"-"+ day + " " + hours + ":" + minutes + ":" + seconds;
  return time;
}

// 오늘 날짜 가져오기
function getToday(){
  var date = new Date();
  var year = date.getFullYear();
  var month = ("0" + (1 + date.getMonth())).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);

  var today = year +"-"+ month +"-"+ day;
  return today;
}

function isSSN(s1, s2) {
  n = 2;
  sum = 0;

  for (i=0; i<s1.length; i++)
  sum += Number(s1.substr(i, 1)) * n++;

  for (i=0; i<s2.length-1; i++) {
    sum += Number(s2.substr(i, 1)) * n++;
    if (n == 10) n = 2;
  }
 
  c = 11 - sum % 11;
  if (c == 11) c = 1;
  if (c == 10) c = 0;
  if (c != Number(s2.substr(6, 1))) return false;
  else return true;
}

function checkDoctorStatus(data, cnt){
  let temp_date = new Date();
  let today = getToday();
  let nowDate = convTime(temp_date);

  let open = convTime(today+ " " + data.open);
  let close = convTime(today+ " " + data.close);

  // 진료시간, 처방전 비교해서 출력
  // 시간이 첫번째 status가 두번째
  if(open < nowDate && close > nowDate){
    if(cnt > 0){
      data.dc_status = "대기";
    }else{
      data.dc_status = "즉시";
    }
  }else if(data.dc_status != '종료'){
    // 진료시간 이외의 시간에 진료할 경우
    if(cnt > 0){
      data.dc_status = "대기";
    }else{
      data.dc_status = "즉시";
    }
  }

  return data.dc_status;
}