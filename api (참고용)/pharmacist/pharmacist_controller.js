//pharmacist_controller.js

const { 
    confirmUser,
    idConfirm,
    create, updatePharmacist,
    getTerms, phoneConfirm, 
    insertPhoneAuth, getPhoneAuth, getPhoneAuthCode, updateAuthSuccess, updatePhoneAuth,
    confirmPharmacyBN,
    getPharmacyData, 
    insertPharmacy, updatePharmacy,

    confirmSurgeonCount,confirmDepartmentCount, confirmSymptomCount,
    insertSurgeon, insertDepartment, insertSymptom,

    deleteDepartment, deleteSymptom,
    updatePassword, getUserPassword, 

    getPharmacistIdx, getPharmacistData, licenseConfirm,
    getPharmacistPharmacy, getPharmacistStatus,
    pharmacyFirstPharmacist,
    updateStatus,
  } = require("./pharmacist_service");
  
  const { genSaltSync, hashSync, compareSync } = require("bcrypt");
  const cookieParser = require("cookie-parser");
  const { sign } = require("jsonwebtoken");
  const crypto = require('crypto');
  
  const Schema = require('validate');
  const emailValidator = require("email-validator");
  const { isFunction } = require("util");
  
  const number_rule = /[0-9]$/;
  const phone_rule = /(^01[0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  const number_comma_rule = /[0-9,]$/;
  const business_number_rule = /([0-9]{3})-([0-9]{2})-([0-9]{5})/;
  const coordinate_rule = /[0-9.]$/;
  const time_rule = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
  
  module.exports = {

    createPharmacist: async(req, res) => {
      try {
        console.log("pharmacist-createPharmacist");
        
        const reqBodySchema = new Schema({
          id: {
            type :String,
            required : true,
            length:{max:255},
            message : "아이디를 확인해주세요."
          },
          pw1: {
            type :String,
            required : true,
            length:{min:8, max:12},
            message : "비밀번호를 확인해주세요."
          },
          pw2: {
            type :String,
            required : true,
            length:{min:8, max:12},
            message : "비밀번호를 확인해주세요."
          },
          name: {
            type :String,
            required : true,
            length:{min:1, max:255},
            message : "이름을 확인해주세요."
          },
          phone: {
            type :String,
            required : true,
            match: phone_rule,
            length:{min:10, max:13},
            message : "휴대폰 번호를 확인해주세요."
          },
          code: {
            type :String,
            required : true,
            length: 6,
            message: "인증번호를 확인해주세요."
          },    
          license_number: {
            type :String,
            required : true,
            match: number_rule,
            length:{max:20},
            message: "면허번호를 입력해주세요."
          },


          pharmacy:{
            type :String,
            match : number_rule,
            message: "약국 고유번호를 확인해주세요."
          },
          pharmacy_name:{
            type :String,
            length:{max:255},
          },
          business_number:{
            type :String,
            match: business_number_rule,
            length:{max:12},
            message: "사업자 번호를 확인해주세요."
          },
          contact_number:{
            type :String,
            length:{max:255},
          },
          address:{
            type :String,
            length:{max:255},
          },
          address_detail:{
            type :String,
            length:{max:255},
          },
          lat:{
            type :String,
            match : coordinate_rule,
            length:{max:255},
            message : "위도값을 확인해주세요."
          },
          lng:{
            type :String,
            match : coordinate_rule,
            length:{max:255},
            message : "경도값을 확인해주세요."
          },
        });
  
        var body = req.body;
  
        const validError = reqBodySchema.validate(body);
        if(validError.length > 0){
          throw({
            status: 400,
            message: validError[0].message
          });
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
  
        // 휴대폰번호 중복검사
        const phoneFlag = await phoneConfirm(body.phone);
        if(phoneFlag != 0){
          throw({
            status: 400,
            message: '해당 휴대폰 번호는 이미 회원가입이 되어있습니다.'
          });
        }
  
        // 약사면허 중복검사
        const licenseFlag = await licenseConfirm(body.license_number);
        if(licenseFlag != 0){
          throw({
            status: 400,
            message: '해당 면허번호로 이미 가입되어있습니다.'
          });
        }
  
        // 비밀번호 검사
        if(body.pw1 != body.pw2){
          throw({
            status: 400,
            message: '비밀번호가 다릅니다 확인해주세요.'
          });
        }
  
        // sha512 password
        body.pw1 = crypto.createHash('sha512').update(body.pw1).digest('hex').toUpperCase();
        body.phone = body.phone.replace(phone_rule, "$1-$2-$3");
  
        // 약사 면허증 파일
        //console.log(req.files.license_file);
        if(req.files.license_file != undefined){
          req.body.license_file = req.files.license_file[0].filename;
          let mimetype = req.files.license_file[0].mimetype;
          if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
            throw({
              status: 400,
              message: '약사 면허증은 이미지만 업로드 가능합니다.'
            });
          }
        }else{
          throw({
            status: 400,
            message: '약사 면허증 이미지를 업로드 해주세요.'
          });
        }
  
  
        // 약국 로직 부분
        var pharmacyObj = {};
        var pharmacy_ph_idx = null;

        if(body.pharmacy == undefined){
          // 약국 정보가 없어서 약국도 등록함
          if(body.business_number == undefined){
            throw({
              status: 400,
              message: '사업자 번호를 확인해주세요.'
            });
          }else{
            pharmacyObj.business_number = body.business_number;
          }
  
          // 약국 사업자 번호로 동일한 병원이 있는지 확인.  
          var pharmacyBNData = await confirmPharmacyBN(body.business_number);
  
          if(pharmacyBNData != undefined){
            pharmacy_ph_idx = pharmacyBNData.phc_idx;
          }else{
            if(body.pharmacy_name == undefined){
              throw({
                status: 400,
                message: '약국이름을 확인해주세요.'
              });
            }else{
                pharmacyObj.pharmacy_name = body.pharmacy_name;
            }
            if(body.contact_number == undefined){
              throw({
                status: 400,
                message: '전화번호를 확인해주세요.'
              });
            }else{
                pharmacyObj.contact_number = body.contact_number;
            }
            if(body.address == undefined){
              throw({
                status: 400,
                message: '주소를 확인해주세요.'
              });
            }else{
                pharmacyObj.address = body.address;
            }
            if(body.address_detail != undefined){
                pharmacyObj.address_detail = body.address_detail;
            }else{
                pharmacyObj.address_detail = "";
            }
            if(body.lat == undefined){
              throw({
                status: 400,
                message: '위도를 확인해주세요.'
              });
            }else{
                pharmacyObj.lat = body.lat;
            }
            if(body.lng == undefined){
              throw({
                status: 400,
                message: '경도를 확인해주세요.'
              });
            }else{
                pharmacyObj.lng = body.lng;
            }

            var temp_lat = body.lat;
            var temp_lng = body.lng;
    
            var coordLatFlag = coordinateLatConfirm(temp_lat);
            if(!coordLatFlag){
              throw({
                status: 400,
                message: "유효하지 않는 위도값입니다."
              });
            }
            var coordLngFlag = coordinateLngConfirm(temp_lng);
            if(!coordLngFlag){
              throw({
                status: 400,
                message: "유효하지 않는 경도값입니다."
              });
            }
  
            // 사업자 등록증
            if(req.files.business_file != undefined){
              pharmacyObj.business_file = req.files.business_file[0].filename;
              let mimetype = req.files.business_file[0].mimetype;
              if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
                throw({
                  status: 400,
                  message: '사업자 등록증은 이미지만 업로드 가능합니다.'
                });
              }
            }else{
              throw({
                status: 400,
                message: '사업자 등록증 이미지를 업로드 해주세요.'
              });
            }
  
            // 약국 등록하기
            var insertResult = await insertPharmacy(pharmacyObj);
            pharmacy_ph_idx = insertResult.insertId;
          }
        }else{
        // 약국 정보가 있음
          var pharmacyData = await getPharmacyData(body.pharmacy);

          if(pharmacyData == undefined){
            throw({
              status: 400,
              message: '약국 고유번호를 정확히 입력해주세요.'
            });
          }
          pharmacy_ph_idx = pharmacyData.phc_idx;
        }

        req.body.pharmacy_ph_idx = pharmacy_ph_idx;
  
        //console.log(req.body);
        //console.log(req.files);
        
        // 요일별 약사 활동 시간
        var ph_info = [
          {open : "09:00" , close : "18:00" , active : false},
          {open : "09:00" , close : "18:00" , active : false},
          {open : "09:00" , close : "18:00" , active : false},
          {open : "09:00" , close : "18:00" , active : false},
          {open : "09:00" , close : "18:00" , active : false},
          {open : "09:00" , close : "18:00" , active : false},
          {open : "09:00" , close : "18:00" , active : false},
        ];
  
        //console.log(body);
        body.ph_info = JSON.stringify(ph_info);
        const createResult = await create(body);
        var insertId = createResult[0].insertId;

        
        const user = { mb_no : insertId , id: body.id , name: body.name };      
        const accessToken = sign(user, process.env.ACCESS_PHARMACIST_TOKEN_SECRET , {
          expiresIn: "365 days"
        });
        const refreshToken = sign(user, process.env.REFRESH_PHARMACIST_TOKEN_SECRET , {
          expiresIn: "365 days"
        });
        
        // 인증 완료처리
        // await updateAuthSuccess(authData['idx']);
  
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
    updatePharmacist: async(req, res) => {
      try {
        console.log("pharmacist-updatePharmacist");
        
        const reqBodySchema = new Schema({
          name: {
            type :String,
            length:{max:255},
          },
          pw1: {
            type :String,
            length:{min:8, max:12},
            message : "비밀번호를 확인해주세요."
          },
          pw2: {
            type :String,
            length:{min:8, max:12},
            message : "비밀번호를 확인해주세요."
          },
          phone: {
            type :String,
            match: phone_rule,
            length:{min:10, max:13},
            message : "휴대폰 번호를 확인해주세요."
          },
          code: {
            type :String,
            length: 6,
            message: "인증번호를 확인해주세요."
          },
          ph_info: {
            type :String
          },

          pharmacy:{
            type :String,
            match : number_rule,
            message: "약국 고유번호를 확인해주세요."
          },
          pharmacy_name:{
            type :String,
            length:{max:255},
          },
          business_number:{
            type :String,
            match: business_number_rule,
            length:{max:12},
            message: "사업자 번호를 확인해주세요."
          },
          contact_number:{
            type :String,
            length:{max:255},
          },
          address:{
            type :String,
            length:{max:255},
          },
          address_detail:{
            type :String,
            length:{max:255},
          },
          lat:{
            type :String,
            match : coordinate_rule,
            length:{max:255},
            message : "위도값을 확인해주세요."
          },
          lng:{
            type :String,
            match : coordinate_rule,
            length:{max:255},
            message : "경도값을 확인해주세요."
          },
        });
  
        var body = req.body;
  
        const validError = reqBodySchema.validate(body);
        if(validError.length > 0){
          throw({
            status: 400,
            message: validError[0].message
          });
        }

        var pharmacistObj = {};    // 약사 수정정보
        var pharmacyObj = {};  // 약국 수정정보
        
        var mb_no = req.user.mb_no;
        
        // 약사 이름 변경
        if(body.name != undefined){
          pharmacistObj.name = body.name;
        }

        // 휴대폰번호 중복검사
        if(body.phone != undefined){
          const phoneFlag = await phoneConfirm(body.phone);
          if(phoneFlag != 0){
            throw({
              status: 400,
              message: '수정하려는 휴대폰 번호는 이미 회원가입이 되어있습니다.'
            });
          }
          body.phone = body.phone = body.phone.replace(phone_rule, "$1-$2-$3");
  
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
          pharmacistObj.phone = body.phone;
        }
  
        // 비밀번호 변경
        if(body.pw1 != undefined && body.pw2 != undefined){
          // 비밀번호 검사
          if(body.pw1 != body.pw2){
            throw({
              status: 400,
              message: '비밀번호가 다릅니다 확인해주세요.'
            });
          }
          // sha512 password
          body.pw1 = crypto.createHash('sha512').update(body.pw1).digest('hex').toUpperCase();
          pharmacistObj.pwd = body.pw1;
        }
          
        // 파일 관련 면서사진
        if(req.files != undefined){
          // 약사 면허증 파일
          if(req.files.license_file != undefined){
            let mimetype = req.files.license_file[0].mimetype;
            if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
              throw({
                status: 400,
                message: '의사 면허증은 이미지만 업로드 가능합니다.'
              });
            }
            req.body.license_file = req.files.license_file[0].filename;
            pharmacistObj.license_file = req.body.license_file;
          }
        }

        if(body.ph_info != undefined){
          var ph_info_temp = [];
          try {
            ph_info_temp = JSON.parse(body.ph_info);
          } catch (error) {
            throw({
              status: 400,
              message: '영업시간 관련 데이터의 형식을 확인해주세요.'
            });
          }
          
          // 형식 검사
          if(ph_info_temp.length != 7){
            throw({
              status: 400,
              message: '영업시간 관련 데이터가 정확하지 않습니다.'
            });
          }
  
          ph_info_temp.forEach(element => {
            if(!time_rule.test(element.open)){
              throw({
                status: 400,
                message: '오픈시간이 정확하지 않습니다.'
              });
            }
            if(!time_rule.test(element.close)){
              throw({
                status: 400,
                message: '종료시간이 정확하지 않습니다.'
              });
            }
            if(!(element.active === true || element.active === false)){
              throw({
                status: 400,
                message: '휴무 여부 데이터를 확인해주세요.'
              });
            }
          });
          pharmacistObj.ph_info = body.ph_info;
        }
          
        // 약국소유자 검사 첫번째로 등록한사람만 약국을 수정할 수 있음
        
        var pharmacyData =  await getPharmacistPharmacy(mb_no);
        if(pharmacyData == undefined){
          throw({
            status: 400,
            message: '약사의 약국정보를 찾을 수 없습니다.'
          });
        }
        var pharmacy_idx = pharmacyData.pharmacy_ph_idx;
  
        var pharmacistResult = await pharmacyFirstPharmacist(pharmacy_idx);        

        if(pharmacistResult == undefined){
          throw({
            status: 400,
            message: '약국에 등록된 약사 정보를 찾을 수 없습니다.'
          });
        }
        var firstPharmacist = pharmacistResult.ph_idx;
  
        // 첫번째로 병원에 등록된 사람만 병원 정보를 수정할 수 있음.
        if(firstPharmacist == mb_no){
          
          if(body.pharmacy_name != undefined){
            pharmacyObj.pharmacy_name = body.pharmacy_name;         
          }
          if(body.contact_number != undefined){
            pharmacyObj.contact_number = body.contact_number;
          }
          if(body.address != undefined){
            pharmacyObj.address = body.address;
          }
          if(body.address_detail != undefined){
            pharmacyObj.address_detail = body.address_detail;
          }
          if(body.lat != undefined){
            var temp_lat = body.lat;
            var coordLatFlag = coordinateLatConfirm(temp_lat);
            if(!coordLatFlag){
              throw({
                status: 400,
                message: "유효하지 않는 위도값입니다."
              });
            }
            pharmacyObj.lat = body.lat;
          }
          if(body.lng != undefined){
            var temp_lng = body.lng;
            var coordLngFlag = coordinateLngConfirm(temp_lng);
            if(!coordLngFlag){
              throw({
                status: 400,
                message: "유효하지 않는 경도값입니다."
              });
            }
            pharmacyObj.lng = body.lng;
          }
        }
        // console.log(pharmacistObj);
        // console.log(pharmacyObj);

        if(Object.keys(pharmacistObj).length != 0){
          var pharmacistUpdateResult = await updatePharmacist(mb_no , pharmacistObj);
        }
        if(Object.keys(pharmacyObj).length != 0){
          var pharmacyUpdateResult = await updatePharmacy(pharmacy_idx , pharmacyObj);
        }
        
        // 인증 완료처리
        if(body.phone != undefined){
          await updateAuthSuccess(authData['idx']);
        }

        // 약사 상태가 반려상태일경우 대기로 변경
        var resultPharmacistStatus = await getPharmacistStatus(mb_no);
        if(resultPharmacistStatus != undefined){
          const status = resultPharmacistStatus.is_passed;
          if(status == "반려"){
            await updateStatus(mb_no , "대기");
          }
        }
  
        return res.status(200).json ({
          status: 200,
          message: "success"       
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    login: async(req, res) => {
      try{
        console.log("pharmacist-login");
        const body = req.body;
  
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
    
        // validate
        const validError = reqBodySchema.validate(req.body);
        if(validError.length > 0){
          throw({
            status: 400,
            message: validError[0].message
          });
        }
        
        // sha512 password
        body.pw = crypto.createHash('sha512').update(body.pw).digest('hex').toUpperCase();
  
        
        const userResult = await confirmUser(body.id , body.pw);
        //console.log(userResult);
  
        if(userResult == undefined){
          throw({
            status: 400,
            message: '아이디 또는 비밀번호를 확인해주세요.'
          });
        }
        if(userResult.is_passed == "대기"){
          throw({
            status: 400,
            message: '계정승인 대기중입니다.'
          });
        }
        if(userResult.is_passed == "중지"){
          throw({
            status: 400,
            message: '계정중지 상태입니다.'
          });
        }
  
        const user = { mb_no : userResult.ph_idx , id: userResult.id , name: userResult.ph_name };
  
        const accessToken = sign(user, process.env.ACCESS_PHARMACIST_TOKEN_SECRET , {
          expiresIn: "365 days"
        });
        const refreshToken = sign(user, process.env.REFRESH_PHARMACIST_TOKEN_SECRET , {
          expiresIn: "365 days"
        });
  
        if(userResult.is_passed == "반려"){
          return res.cookie("x_auth", accessToken, {
            maxAge: 1000 * 30,
            httpOnly: true,
          }).status(400).json ({
            status: 400,
            message: "회원 반려상태입니다.",
            accessToken: accessToken,
            refreshToken: refreshToken,
          });
        }
        
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
    terms: async(req, res) => {
      try{
        console.log('pharmacist-terms');
        const terms = await getTerms('service-pharmacist-web');
        return res.status(200).json ({
          status: 200,
          message: "success",
          terms: terms
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }  
    },
    authPhone: async(req, res) => {
      try{
        console.log('pharmacist-authPhone');
  
        const reqBodySchema = new Schema({
          "phone": {
            type :String,
            required : true,
            match: /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/,
            length:{min:12, max:13},
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
       
        const phoneNumber = req.body.phone;
  
        var Num=""; 
        for(var i=0;i<6;i++) 
        { 
          Num+=Math.floor(Math.random()*10); 
        }
  
        console.log("phone : " + phoneNumber);
        console.log("code : " + Num);
  
        // 인증코드 저장
        await insertPhoneAuth(phoneNumber, Num);
  
        // 알리고 api
        // var dataBody = "key=ubrfpaw88tenzh0dhm4dr2v4ue08mwn1&user_id=dev1newmeon&sender=010-9052-5810&receiver="+phoneNumber+"&msg=캣도그쇼 휴대폰 인증번호입니다. ["+Num+"]";
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
        console.log('pharmacist-confirmAuth');
  
        const reqBodySchema = new Schema({
          "phone": {
            type :String,
            required : true,
            match: /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/,
            length:{min:12, max:13},
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
    idConfirm: async(req, res) => {
      try{
        console.log('pharmacist-idConfirm');
  
        const reqBodySchema = new Schema({
          "id": {
            type :String,
            required : true,
            message : "아이디를 확인해주세요."
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
  
        // email valid
        const emailValidError = emailValidator.validate(req.body.id);
        if(!emailValidError){
          throw({
            status: 400,
            message: '이메일 형식에 맞지 않습니다.'
          });
        }
  
        var idConfirmResult = await idConfirm(req.body.id);
  
        if(idConfirmResult != 0){
          throw({
            status: 400,
            message: '이미 가입된 이메일 입니다.'
          });
        }
  
        return res.status(200).json ({
          status: 200,
          message: "success"
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }  
    },
    licenseConfirm: async(req, res) => {
      try{
        console.log('pharmacist-licenseConfirm');
  
        const reqBodySchema = new Schema({
          "license_number": {
            type :String,
            match: number_rule,
            length:{max:20},
            required : true,
            message : "면허번호를 확인해주세요."
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
  
        // 의사면허 중복검사
        const licenseFlag = await licenseConfirm(req.body.license_number);
        if(licenseFlag != 0){
          throw({
            status: 400,
            message: '해당 면허번호로 이미 가입되어있습니다.'
          });
        }
  
        return res.status(200).json ({
          status: 200,
          message: "success"
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }  
    },
    businessConfirm: async(req, res) => {
      try{
        console.log('pharmacist-businessConfirm');
  
        const reqBodySchema = new Schema({
          "business_number": {
            type :String,
            required : true,
            match: business_number_rule,
            length:{max:12},
            message: "사업자 번호를 확인해주세요."
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
        
        var BusinessData = null;
  
        var pharmacy = await confirmPharmacyBN(req.body.business_number);
  
        if(pharmacy != undefined){
            pharmacy.business_file = process.env.HELLODOCTOR_DATA_PHARMACIST_URL+pharmacy.business_file;
            BusinessData = pharmacy;
        } 
  
        return res.status(200).json ({
          status: 200,
          message: "success",
          data: BusinessData
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }  
    },
    getPharmacist: async(req, res) => {
      try {
        console.log("pharmacist-getPharmacist");
  
        const user = req.user;
        const mb_id = user.mb_no;
  
        var tempData = await getPharmacistData(mb_id);
  
        tempData.license_file = process.env.HELLODOCTOR_DATA_PHARMACIST_URL+tempData.license_file;
        tempData.business_file = process.env.HELLODOCTOR_DATA_PHARMACIST_URL+tempData.business_file;
  
        if(tempData == undefined){
          throw({
            status: 400,
            message: "의사를 찾을 수 없습니다.",
          });
        }
    
        tempData.ph_info = JSON.parse(tempData.ph_info);
  
        delete tempData.phc_idx;
        delete tempData.reg_date;
        delete tempData.is_passed;
        delete tempData.up_date;
        delete tempData.business_type;
        delete tempData.business_category;
  
        return res.status(200).json ({
          status: 200,
          message: "success",
          data : tempData,
          file_url : process.env.HELLODOCTOR_DATA_PHARMACIST_URL
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
            length:{min:8, max:12},
            message : "비밀번호를 확인해주세요."
          },
          "pw2": {
            type :String,
            required : true,
            length:{min:8, max:12},
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
        const authData = await getPhoneAuth(body.phone, body.code);
        // 인증시간, 인증여부 확인
        if(authData == undefined){
          throw({
            status: 400,
            message: '이메일 인증에 실패하였습니다.'
          });
        }else if(authData['auth'] == 'true'){
          throw({
            status: 400,
            message: '인증에 실패하였습니다. 인증요청을 다시 해 주세요.'
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
 

    //라우터 미들웨어
    confirmPassed: async(req, res , next) => {
      try{
        console.log('doctor-confirmPassed');
        const user = req.user;
        const mb_id = user.mb_no;
        const doctorData = await getPharmacistIdx(mb_id);
        
        if(doctorData == undefined){
          throw({
            status: 400,
            message: '회원정보를 찾을수 없습니다.'
          });
        }     
  
        if(!(doctorData.is_passed == "승인" || doctorData.is_passed == "반려")){
          throw({
            status: 400,
            message: '접근권한이 없습니다.'
          });
        }
        
        next();
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }  
    },
    confirmAccessPharmacist: async(req, res , next) => {
      try{
        console.log('pharmacist-confirmAccessPharmacist');
        const user = req.user;
        const mb_no = user.mb_no;
        const pharmacistData = await getPharmacistIdx(mb_no);
        
        if(pharmacistData == undefined){
          throw({
            status: 400,
            message: '회원정보를 찾을수 없습니다.'
          });
        }     
  
        if(!(pharmacistData.is_passed == "승인" || pharmacistData.is_passed == "반려")){
          throw({
            status: 400,
            message: '접근권한이 없습니다.'
          });
        }
        
        next();
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }  
    },
    //라우터 미들웨어 끝
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

function coordinateLatConfirm(lat){
    // 위도 검사 -90 ~ +90 경도 검사 -180 ~ +180
    var temp_lat = parseInt(lat);
    if(!(temp_lat > -90 && temp_lat < 90)) return false;

    return true;
}


function coordinateLngConfirm(lng){
  // 위도 검사 -90 ~ +90 경도 검사 -180 ~ +180
  var temp_lng = parseInt(lng);
  if(!(temp_lng > -180 && temp_lng < 180)) return false;

  return true;
}