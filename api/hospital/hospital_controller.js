//hospital_controller.js

const { } = require("./hospital_service");

const cookieParser = require("cookie-parser");
const { sign } = require("jsonwebtoken");
const crypto = require('crypto');
const Schema = require('validate');
const emailValidator = require("email-validator");
const phone_rule = /(^01[0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;

module.exports = {
  create: async(req, res) => {
    try {
      console.log("hospital-create");
      
      const reqBodySchema = new Schema({
        hospital_name : {
          type :String,
          required : true,
          length:{max:255},
          message : "병원명을 확인해주세요."
        },
        business_number : {
          type :String,
          required : true,
          length:{max:255},
          message : "사업자 번호를 확인해주세요."
        },
        business_type : {
          type :String,
          required : true,
          length:{max:255},
          message : "휴대폰 번호를 확인해주세요."
        },
        ceo : {
          type :String,
          required : true,
          message: "대표를 확인해주세요."
        },
        phone : {
          type :String,
          required : true,
          match: phone_rule,
          length:{min:10, max:13},
          message : "휴대폰 번호를 확인해주세요."
        },
        address : {
          type :String,
          required : true,
          message: "대표를 확인해주세요."
        },
        address_detail : {
          type :String,
          message: "대표를 확인해주세요."
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

      // email valid
      const emailValidError = emailValidator.validate(body.id);
      if(!emailValidError){
        throw({
          status: 400,
          message: '아이디는 이메일 형식이여야 합니다.'
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

      //const createResult = await create(body);

      var insertId = createResult[0].insertId;

      // 인증 완료처리
      //await updatePhoneAuth(authData['idx']);

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
}

// 날짜변환 (초 단위까지);

function convTime(date){
  var date = new Date(date);
  var year = date.getFullYear();
  var month = ("0" + (1 + date.getMonth())).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);
  var hours = ("0" + date.getDate()).slice(-2);
  var minutes = ("0" + date.getMinutes()).slice(-2);
  var seconds = ("0" + date.getSeconds()).slice(-2);
  var time = year +"-"+ month +"-"+ day + " " + hours + ":" + minutes + ":" + seconds;
  return time;
}