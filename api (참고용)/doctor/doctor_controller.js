//doctor_controller.js

const { 
  confirmUser,
  idConfirm,
  create, updateDoctor,
  getTerms, phoneConfirm, 
  insertPhoneAuth, getPhoneAuth, getPhoneAuthCode, updateAuthSuccess, updatePhoneAuth,
  confirmHospitalBN, getHospitalData, 
  insertHospital, updateHospital,
  confirmSurgeonCount,confirmDepartmentCount, confirmSymptomCount,
  insertSurgeon, insertDepartment, insertSymptom,
  deleteDepartment, deleteSymptom,
  updatePassword, getUserPassword, getDoctorList, getDoctorIdx, getDoctorData, licenseConfirm,
  getDoctorHospital, getDoctorStatus,
  hospitalFirstDoctor,
  updateStatus,
  getSymptomList, getDepartmentList, getSurgeonList,
  getDoctorSymptom, getDoctorDepartment, getDoctorSurgeon
} = require("./doctor_service");

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
  createDoctor: async(req, res) => {
    try {
      console.log("doctor-createDoctor");
      
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
        department: {
          type :String,
          required : true,
          match: number_comma_rule,
          length:{min:1},
          message: "진료과 고유번호를 확인해주세요."
        },
        /*
        surgeon: {
          type :String,
          required : true,
          match: number_comma_rule,
          length:{min:1},
          message: "전문의 고유번호를 확인해주세요."
        },*/
        symptom: {
          type :String,
          required : true,
          match: number_comma_rule,
          length:{min:1},
          message: "증상 고유번호를 확인해주세요."
        },
        license_number: {
          type :String,
          required : true,
          match: number_rule,
          length:{max:20},
          message: "면허번호를 입력해주세요."
        },
        introduce:  {
          type :String,
          required : true,
          message: "의사 소개를 입력해주세요."
        },

        hospital:{
          type :String,
          match : number_rule,
          message: "병원 고유번호를 확인해주세요."
        },


        hospital_name:{
          type :String,
          length:{max:255},
        },
        business_number:{
          type :String,
          match: business_number_rule,
          length:{max:12},
          message: "사업자 번호를 확인해주세요."
        },
        /*
        business_type:{
          type :String,
          length:{max:255},
        },
        business_category:{
          type :String,
          length:{max:255},
        },*/
        ceo:{
          type :String,
          length:{max:255},
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

      // 의사면허 중복검사
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

      // 의사 면허증 파일
      //console.log(req.files.license_file);
      if(req.files.license_file != undefined){
        req.body.license_file = req.files.license_file[0].filename;
        let mimetype = req.files.license_file[0].mimetype;
        if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
          throw({
            status: 400,
            message: '의사 면허증은 이미지만 업로드 가능합니다.'
          });
        }
      }else{
        throw({
          status: 400,
          message: '의사 면허증 이미지를 업로드 해주세요.'
        });
      }

      // 의사 프로필 파일
      if(req.files.profile_file != undefined){
        req.body.profile_file = req.files.profile_file[0].filename;
        let mimetype = req.files.profile_file[0].mimetype;
        if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
          throw({
            status: 400,
            message: '의사 프로필은 이미지만 업로드 가능합니다.'
          });
        }
      }else{
        throw({
          status: 400,
          message: '의사 프로필 이미지를 업로드 해주세요.'
        });
      }
      
      // 전문의 확인 로직
      /*
      var surgeon = body.surgeon;
      var surgeonArr = surgeon.split(',');
      var confirmSurgeonResult = await confirmSurgeonCount(surgeon);
      if(surgeonArr.length != confirmSurgeonResult){
        throw({
          status: 400,
          message: '전문의를 정확히 입력해주세요.'
        });
      }
      */

      // 진료과 확인 로직
      var department = body.department;
      var departmentArr = department.split(',');
      var confirmDepartmentResult = await confirmDepartmentCount(department);
      
      if(departmentArr.length != confirmDepartmentResult){
        throw({
          status: 400,
          message: '진료과를 정확히 입력해주세요.'
        });
      }

      // 증상 확인 로직
      var symptom = body.symptom;
      var symptomArr = symptom.split(',');
      var confirmSymptomResult = await confirmSymptomCount(symptom);

      if(symptomArr.length != confirmSymptomResult){
        throw({
          status: 400,
          message: '증상을 정확히 입력해주세요.'
        });
      }

      // 병원 로직 부분
      var hospitalObj = {};
      var hospital_h_idx = null;
      if(body.hospital == undefined){
        // 병원 정보가 없어서 병원도 등록함
        if(body.business_number == undefined){
          throw({
            status: 400,
            message: '사업자 번호를 확인해주세요.'
          });
        }else{
          hospitalObj.business_number = body.business_number;
        }

        // 병원 사업자 번호로 동일한 병원이 있는지 확인.  
        var hospitalBNData = await confirmHospitalBN(body.business_number);

        if(hospitalBNData != undefined){
          hospital_h_idx = hospitalBNData.h_idx;
        }else{
          if(body.hospital_name == undefined){
            throw({
              status: 400,
              message: '병원이름을 확인해주세요.'
            });
          }else{
            hospitalObj.hospital_name = body.hospital_name;
          }
          /* 업종 업태 안받음
          if(body.business_type == undefined){
            throw({
              status: 400,
              message: '업종을 확인해주세요.'
            });
          }else{
            hospitalObj.business_type = body.business_type;
          }
          if(body.business_category == undefined){
            throw({
              status: 400,
              message: '업태을 확인해주세요.'
            });
          }else{
            hospitalObj.business_category = body.business_category;
          }
          */
          if(body.ceo == undefined){
            throw({
              status: 400,
              message: '대표명을 확인해주세요.'
            });
          }else{
            hospitalObj.ceo = body.ceo;
          }
          if(body.contact_number == undefined){
            throw({
              status: 400,
              message: '전화번호를 확인해주세요.'
            });
          }else{
            hospitalObj.contact_number = body.contact_number;
          }
          if(body.address == undefined){
            throw({
              status: 400,
              message: '주소를 확인해주세요.'
            });
          }else{
            hospitalObj.address = body.address;
          }
          if(body.address_detail != undefined){
            hospitalObj.address_detail = body.address_detail;
          }else{
            hospitalObj.address_detail = "";
          }
          if(body.lat == undefined){
            throw({
              status: 400,
              message: '위도를 확인해주세요.'
            });
          }else{
            hospitalObj.lat = body.lat;
          }
          if(body.lng == undefined){
            throw({
              status: 400,
              message: '경도를 확인해주세요.'
            });
          }else{
            hospitalObj.lng = body.lng;
          }

          // 좌표 유효검사
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
            hospitalObj.business_file = req.files.business_file[0].filename;
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

          // 병원 등록하기
          var insertResult = await insertHospital(hospitalObj);
          hospital_h_idx = insertResult.insertId;
        }
      }else{
      // 병원 정보가 있음
        var hospitalData = await getHospitalData(body.hospital);

        if(hospitalData == undefined){
          throw({
            status: 400,
            message: '병원 고유번호를 정확히 입력해주세요.'
          });
        }
        hospital_h_idx = hospitalData.h_idx;
      }
      req.body.hospital_h_idx = hospital_h_idx;

      //console.log(req.body);
      //console.log(req.files);
      
      // 요일별 의사 활동 시간
      var dc_info = [
        {open : "09:00" , close : "18:00" , active : false},
        {open : "09:00" , close : "18:00" , active : false},
        {open : "09:00" , close : "18:00" , active : false},
        {open : "09:00" , close : "18:00" , active : false},
        {open : "09:00" , close : "18:00" , active : false},
        {open : "09:00" , close : "18:00" , active : false},
        {open : "09:00" , close : "18:00" , active : false},
      ];

      //console.log(body);
      body.dc_info = JSON.stringify(dc_info);      
      const createResult = await create(body);
      var insertId = createResult[0].insertId;
      /*
      for(var i = 0 ; i < surgeonArr.length ; i++){
        var insertResult = await insertSurgeon( insertId , surgeonArr[i]);
      }*/

      for(var i = 0 ; i < departmentArr.length ; i++){
        var insertResult = await insertDepartment( insertId , departmentArr[i]);
      }
      for(var i = 0 ; i < symptomArr.length ; i++){
        var insertResult = await insertSymptom( insertId , symptomArr[i]);
      }
      
      const user = { mb_no : insertId , id: body.id , name: body.name };      
      const accessToken = sign(user, process.env.ACCESS_DOCTOR_TOKEN_SECRET , {
        expiresIn: "365 days"
      });
      const refreshToken = sign(user, process.env.REFRESH_DOCTOR_TOKEN_SECRET , {
        expiresIn: "365 days"
      });
      
      // 인증 완료처리
      await updateAuthSuccess(authData['idx']);

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

  updateDoctor: async(req, res) => {
    try {
      console.log("doctor-updateDoctor");
      
      const reqBodySchema = new Schema({
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
        department: {
          type :String,
          match: number_comma_rule,
          length:{min:1},
          message: "진료과 고유번호를 확인해주세요."
        },
        symptom: {
          type :String,
          match: number_comma_rule,
          length:{min:1},
          message: "증상 고유번호를 확인해주세요."
        },
        introduce:  {
          type :String,
          message: "의사 소개를 입력해주세요."
        },
        dc_info: {
          type :String
        },
        hospital:{
          type :String,
          match : number_rule,
          message: "병원 고유번호를 확인해주세요."
        },
        hospital_name:{
          type :String,
          length:{max:255},
        },
        business_number:{
          type :String,
          match: business_number_rule,
          length:{max:12},
          message: "사업자 번호를 확인해주세요."
        },
        ceo:{
          type :String,
          length:{max:255},
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


      var doctorObj = {};    // 의사 수정정보
      var hospitalObj = {};  // 병원 수정정보

      var mb_no = req.user.mb_no;

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
        doctorObj.phone = body.phone;
      }

      // 의사이름
      if(body.name != undefined){
        doctorObj.name = body.name;
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
        doctorObj.pwd = body.pw1;
      }

      // 의사 소개
      if(body.introduce != undefined){
        doctorObj.introduce = body.introduce;
      }
      
      // 파일 관련 면서사진 , 프로파일 사진
      if(req.files != undefined){
        // 의사 면허증 파일
        if(req.files.license_file != undefined){
          let mimetype = req.files.license_file[0].mimetype;
          if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
            throw({
              status: 400,
              message: '의사 면허증은 이미지만 업로드 가능합니다.'
            });
          }
          req.body.license_file = req.files.license_file[0].filename;
          doctorObj.license_file = req.body.license_file;
        }
        // 의사 프로필 파일
        if(req.files.profile_file != undefined){
          let mimetype = req.files.profile_file[0].mimetype;
          if(!(mimetype == "image/jpeg" || mimetype == "image/png")){
            throw({
              status: 400,
              message: '의사 프로필은 이미지만 업로드 가능합니다.'
            });
          }
          req.body.profile_file = req.files.profile_file[0].filename;
          doctorObj.profile_file = req.body.profile_file;
        }
      }
      
      // 진료과 확인
      if(body.department != undefined && body.department != ""){
        var department = body.department;
        var departmentArr = department.split(',');
        var confirmDepartmentResult = await confirmDepartmentCount(department);
        if(departmentArr.length != confirmDepartmentResult){
          throw({
            status: 400,
            message: '진료과를 정확히 입력해주세요.'
          });
        }

        // delete department 
        var deleteResult = await deleteDepartment(mb_no);
        // insert department
        for(var i = 0 ; i < departmentArr.length ; i++){
          var insertResult = await insertDepartment( mb_no , departmentArr[i]);
        }
      }
      // 증상 확인 로직
      if(body.symptom != undefined && body.symptom != ""){
        var symptom = body.symptom;
        var symptomArr = symptom.split(',');
        var confirmSymptomResult = await confirmSymptomCount(symptom);
  
        if(symptomArr.length != confirmSymptomResult){
          throw({
            status: 400,
            message: '증상을 정확히 입력해주세요.'
          });
        }
        // delete department 
        var deleteResult = await deleteSymptom(mb_no);
        // insert department
        for(var i = 0 ; i < symptomArr.length ; i++){
          var insertResult = await insertSymptom( mb_no , symptomArr[i]);
        }
      }

      // 병원 로직 부분

      // 병원소유자 검사 첫번째로 등록한사람만 병원을 수정할 수 있음
      var hospitalData =  await getDoctorHospital(mb_no);
      if(hospitalData == undefined){
        throw({
          status: 400,
          message: '의사의 병원정보를 찾을 수 없습니다.'
        });
      }
      var hospital_idx = hospitalData.hospital_h_idx;

      var doctorResult = await hospitalFirstDoctor(hospital_idx);
      if(doctorResult == undefined){
        throw({
          status: 400,
          message: '병원에 등록된 의사 정보를 찾을 수 없습니다.'
        });
      }
      var firstDoctor = doctorResult.dc_idx;

      // 첫번째로 병원에 등록된 사람만 병원 정보를 수정할 수 있음.
      if(firstDoctor == mb_no){
        
        if(body.hospital_name != undefined){
          hospitalObj.hospital_name = body.hospital_name;         
        }
        if(body.ceo != undefined){
          hospitalObj.ceo = body.ceo;
        }
        if(body.contact_number != undefined){
          hospitalObj.contact_number = body.contact_number;
        }
        if(body.address != undefined){
          hospitalObj.address = body.address;
        }
        if(body.address_detail != undefined){
          hospitalObj.address_detail = body.address_detail;
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
          hospitalObj.lat = body.lat;
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
          hospitalObj.lng = body.lng;
        }
      }

      if(body.dc_info != undefined){
        var dc_info_temp = [];
        try {
          dc_info_temp = JSON.parse(body.dc_info);
        } catch (error) {
          throw({
            status: 400,
            message: '영업시간 관련 데이터의 형식을 확인해주세요.'
          });
        }
        
        // 형식 검사
        if(dc_info_temp.length != 7){
          throw({
            status: 400,
            message: '영업시간 관련 데이터가 정확하지 않습니다.'
          });
        }

        dc_info_temp.forEach(element => {
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
        doctorObj.dc_info = body.dc_info;
      }
      
      // const createResult = await create(body);
      // var insertId = createResult[0].insertId;

      if(Object.keys(doctorObj).length != 0){
        var doctorUpdateResult = await updateDoctor(mb_no , doctorObj);
      }
      if(Object.keys(hospitalObj).length != 0){
        var hospitalUpdateResult = await updateHospital(hospital_idx , hospitalObj);
      }
      
      // 인증 완료처리
      if(body.phone != undefined){
        await updateAuthSuccess(authData['idx']);
      }    

      // 의사 상태가 반려상태일경우 대기로 변경
      var resultDoctorStatus = await getDoctorStatus(mb_no);
      if(resultDoctorStatus != undefined){
        const status = resultDoctorStatus.is_passed;
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
      console.log("doctor-login");
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


      const user = { mb_no : userResult.dc_idx , id: userResult.id , name: userResult.dc_name };

      const accessToken = sign(user, process.env.ACCESS_DOCTOR_TOKEN_SECRET , {
        expiresIn: "365 days"
      });
      const refreshToken = sign(user, process.env.REFRESH_DOCTOR_TOKEN_SECRET , {
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
      console.log('doctor-terms');
      const terms = await getTerms('service-doctor-web');
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
      console.log('doctor-authPhone');

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
      console.log('doctor-confirmAuth');

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
      console.log('doctor-idConfirm');

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
      console.log('doctor-licenseConfirm');

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
      console.log('doctor-businessConfirm');

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

      var hospital = await confirmHospitalBN(req.body.business_number);

      if(hospital != undefined){
        hospital.business_file = process.env.HELLODOCTOR_DATA_DOCTOR_URL+hospital.business_file;
        BusinessData = hospital;
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

  diagSymptom: async(req, res) => {
    try {
      console.log("doctor-diagSymptom");

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
  diagDepartment: async(req, res) => {
    try {
      console.log("doctor-diagDepartment");

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
  /*
  surgeon: async(req, res) => {
    try {
      console.log("doctor-surgeon");

      const tempData = await getSurgeonList();
      
      return res.status(200).json ({
        status: 200,
        message: "success",
        list: tempData
      });
    } catch (error) {
      console.log(error.message);
      returnError(res,error);
    }
  },*/

  getDoctor: async(req, res) => {
    try {
      console.log("doctor-getDoctor");

      const user = req.user;
      const mb_id = user.mb_no;

      var tempData = await getDoctorData(mb_id);

      tempData.license_file = process.env.HELLODOCTOR_DATA_DOCTOR_URL+tempData.license_file;
      tempData.profile_file = process.env.HELLODOCTOR_DATA_DOCTOR_URL+tempData.profile_file;
      tempData.business_file = process.env.HELLODOCTOR_DATA_DOCTOR_URL+tempData.business_file;

      if(tempData == undefined){
        throw({
          status: 400,
          message: "의사를 찾을 수 없습니다.",
        });
      }

      // 증상진료
      const symptom = await getDoctorSymptom(mb_id);
      var symptomArr = [];
      symptom.forEach(element => {
        symptomArr.push(element.sy_idx);
      });
      tempData.symptom = symptomArr.join(',');
      // 과목진료
      const department = await getDoctorDepartment(mb_id);
      var departmentArr = [];
      department.forEach(element => {
        departmentArr.push(element.dp_idx);
      });
      tempData.department = departmentArr.join(',');
      /*
      // 전문의
      const surgeon = await getDoctorSurgeon(mb_id);
      var surgeonArr = [];
      surgeon.forEach(element => {
        surgeonArr.push(element.surgeon_idx);
      });
      tempData.surgeon = surgeonArr.join(',');
      */

      tempData.dc_info = JSON.parse(tempData.dc_info);

      delete tempData.h_idx;
      delete tempData.reg_date;
      delete tempData.is_passed;
      delete tempData.up_date;
      delete tempData.business_type;
      delete tempData.business_category;

      return res.status(200).json ({
        status: 200,
        message: "success",
        data : tempData,
        file_url : process.env.HELLODOCTOR_DATA_DOCTOR_URL
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
  doctorList: async(req, res) => {
    try {
      console.log("user-doctorList");
      // 데이터 받기
      const reqBodySchema = new Schema({
        "type": {
          type: String,
          required: true,
          enum: ['1', '2'],
          message: "검색 타입을 확인해주세요.",
        },
        "tag": {
          type: String,
        },
        "search": {
          type: String,
        },
        "order": {
          type: String,
          required: true,
          enum: ["default","review","rank","video"],
          message: "정렬방식을 확인해주세요.",
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
      
      const search = body.search;
      const tag = body.tag;
      const order = body.order;
      const type = body.type;

      const doctorList = await getDoctorList(type, tag, search, order);
      console.log(doctorList);
      
      return res.status(200).json ({
        status: 200,
        message: "success",
        list: doctorList
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
      const doctorData = await getDoctorIdx(mb_id);
      
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
  confirmAccessDoctor: async(req, res , next) => {
    try{
      console.log('doctor-confirmAccessDoctor');
      const user = req.user;
      const mb_id = user.mb_no;
      const doctorData = await getDoctorIdx(mb_id);
      
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