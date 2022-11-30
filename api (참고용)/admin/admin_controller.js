//doctor_controller.js

const { 
    confirmUser,
    insertNotice, getNoticeCount, updateNotice, deleteNotice, getNoticeList, getNotice,
    getDoctorCount,getDoctorList,
  } = require("./admin_service");


  const { sign } = require("jsonwebtoken");
  const crypto = require('crypto');
  
  const Schema = require('validate');
  const emailValidator = require("email-validator");
  const { env } = require("process");
  
  const number_rule = /[0-9]$/;
  const phone_rule = /(^01[0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  const number_comma_rule = /[0-9,]$/;
  const business_number_rule = /([0-9]{3})-([0-9]{2})-([0-9]{5})/;
  const coordinate_rule = /[0-9.]$/;
  
  module.exports = {

    login: async(req, res) => {
      try{
        console.log("admin-login");
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
  
        const user = { mb_no : userResult.idx , id: userResult.id , name: "최고관리자" };
  
        const accessToken = sign(user, process.env.ACCESS_ADMIN_TOKEN_SECRET , {
          expiresIn: "365 days"
        });
        const refreshToken = sign(user, process.env.REFRESH_ADMIN_TOKEN_SECRET , {
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

    noticeImageUpload: async(req, res) => {
      try{
        console.log("admin-imageUpload");

        if(req.file.mimetype != "image/jpeg"){
          throw({
            status: 400,
            message: "이미지 형식의 파일만 업로드 가능합니다."
          });
        }

        return res.status(200).json ({
          status: 200,
          message: "success",
          file_url: process.env.HELLODOCTOR_DATA_NOTICE_URL+req.file.filename
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    createNotice: async(req, res) => {
      try{
        console.log("admin-createNotice");
        const body = req.body;
  
        const reqBodySchema = new Schema({
          "title": {
              type :String,
              required : true,
              message: '제목을 입력해주세요.'
          },
          "contents": {
              type :String,
              required : true,
              message: '내용을 입력해주세요.'
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
        
        var noticeObj = { 
          title : body.title,
          contents : body.contents
        }

        var result = await insertNotice(noticeObj);
        
        return res.status(200).json ({
          status: 200,
          message: "success",
          data : {
            notice_idx : result.insertId
          }
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    updateNotice:async(req, res) => {
      try{
        console.log("admin-updateNotice");
        const body = req.body;
        const params = req.params;

        const reqParamsSchema = new Schema({
          notice_idx : {
            type: String,
            required : true,
            match: /^[\d]+$/,
            message: "공지사항 고유번호를 확인해주세요."
          },
        });
  
        // validate
        const validError1 = reqParamsSchema.validate(params);
        if(validError1.length > 0){
          throw({
            status: 400,
            message: validError1[0].message
          });
        }
  
        const reqBodySchema = new Schema({
          "title": {
              type :String,
          },
          "contents": {
              type :String,
          }
        });
        
        // validate
        const validError = reqBodySchema.validate(body);
        if(validError.length > 0){
          throw({
            status: 400,
            message: validError[0].message
          });
        }

        const notice_idx = parseInt(params.notice_idx);
        var notice = await getNotice(notice_idx);

        if(notice == undefined){
          throw({
            status: 400,
            message: "게시판 내용을 찾을 수 없습니다."
          });
        }

        var noticeObj = { 
          title : body.title,
          contents : body.contents
        }

        noticeObj.title = (noticeObj.title.trim() == "")?undefined:noticeObj.title;
        noticeObj.contents = (noticeObj.contents.trim() == "")?undefined:noticeObj.contents;

        var updateResult = await updateNotice(params.notice_idx , noticeObj);
       
        return res.status(200).json ({
          status: 200,
          message: "success"
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    deleteNotice: async(req, res) => {
      try{
        console.log("admin-deleteNotice");

        const reqParamsSchema = new Schema({
          notice_idx : {
            type: String,
            required : true,
            match: /^[\d]+$/,
            message: "공지사항 고유번호를 확인해주세요."
          },
        });
  
        const params = req.params;
  
        const validError = reqParamsSchema.validate(params);
        if(validError.length > 0){
          throw({
            status: 400,
            message: validError[0].message
          });
        }
        
        const notice_idx = parseInt(params.notice_idx);
        var notice = await getNotice(notice_idx);

        if(notice == undefined){
          throw({
            status: 400,
            message: "게시판 내용을 찾을 수 없습니다."
          });
        }

        var deleteResult = await deleteNotice(notice_idx);
        
        return res.status(200).json ({
          status: 200,
          message: "success"
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    getNotice: async(req, res) => {
      try {
        console.log("admin-getNotice");

        const reqParamsSchema = new Schema({
          notice_idx : {
            type: String,
            required : true,
            match: /^[\d]+$/,
            message: "공지사항 고유번호를 확인해주세요."
          },
        });
  
        const params = req.params;
  
        const validError = reqParamsSchema.validate(params);
        if(validError.length > 0){
          throw({
            status: 400,
            message: validError[0].message
          });
        }

        const notice_idx = params.notice_idx;
        var notice = await getNotice(notice_idx);

        if(notice == undefined){
          throw({
            status: 400,
            message: "게시판 내용을 찾을 수 없습니다."
          });
        }

        return res.status(200).json ({
          status: 200,
          message: "success",
          data : notice
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    noticeList: async(req, res) => {
      try {
        console.log("admin-noticeList");
        // 데이터 받기
        const reqQuerySchema = new Schema({
          size:{
            type: String,
            match: /^[\d]+$/,
            message: "사이즈 형식을 확인해주세요."
          },
          page:{
            type: String,
            match: /^[\d]+$/,
            message: "페이지번호 형식을 확인해주세요."
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
        if(query.size == undefined){
          query.size = 10;
        }
  
        const listSize = parseInt(query.size);
        let curPage = parseInt(query.page);
        const totalCount = await getNoticeCount();
        let totalPage = Math.ceil(totalCount / listSize);// 전체 페이지수
        let start = 0;
  
        // 페이징
        if (curPage <= 1){
          start = 0;
          curPage = 1;
        }else{
          start = (curPage - 1) * listSize;
        }
  
        const notice = await getNoticeList(start, listSize);

        for(var i = 0 ; i < notice.length ; i++){
          notice[i].number = totalCount - (((curPage - 1) * listSize)  + i);
        }
  
        return res.status(200).json ({
          status: 200,
          message: "success",
          page: curPage,
          listSize: listSize,
          totalPage: totalPage,
          totalCount: totalCount,
          lists: notice,
        });
      } catch (error) {
        console.log(error.message);
        returnError(res,error);
      }
    },
    doctorList:  async(req, res) => {
      try {
        console.log("admin-doctorList");
        // 데이터 받기
        const reqQuerySchema = new Schema({
          size:{
            type: String,
            match: /^[\d]+$/,
            message: "사이즈 형식을 확인해주세요."
          },
          page:{
            type: String,
            match: /^[\d]+$/,
            message: "페이지번호 형식을 확인해주세요."
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
        if(query.size == undefined){
          query.size = 20;
        }
  
        const listSize = parseInt(query.size);
        let curPage = parseInt(query.page);
        const totalCount = await getDoctorCount();
        let totalPage = Math.ceil(totalCount / listSize);// 전체 페이지수
        let start = 0;
  
        // 페이징
        if (curPage <= 1){
          start = 0;
          curPage = 1;
        }else{
          start = (curPage - 1) * listSize;
        }
  
        const notice = await getDoctorList(start, listSize);

        for(var i = 0 ; i < notice.length ; i++){
          notice[i].number = totalCount - (((curPage - 1) * listSize)  + i);
        }
  
        return res.status(200).json ({
          status: 200,
          message: "success",
          page: curPage,
          listSize: listSize,
          totalPage: totalPage,
          totalCount: totalCount,
          lists: notice,
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
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
  
    var time = year +"-"+ month +"-"+ day + " " + hours + ":" + minutes + ":" + seconds;
    return time;
  }