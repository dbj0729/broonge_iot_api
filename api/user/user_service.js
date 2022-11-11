//user_service.js

const {connection} = require("../../config/database");

module.exports = {
  create: async(data) => {

    var reco_id = null;
    var reco_hp = null;

    if(data.reco_id != undefined){
      reco_id = data.reco_id;
    }
    if(data.reco_hp != undefined){
      reco_hp = data.reco_hp;
    }

    const result = await (await connection()).execute(
      `insert into patients 
        ( id, pwd, name, email, phone, ssn ) 
        values
        (?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.pw1,
        data.name,
        data.id,
        data.phone,
        data.ssn
      ]
    );
    return result;
  },
	confirmUser: async(id, pw) => {
		const [rows, fields] = await (await connection()).execute(
			`select * from patients where id = ? and pwd = ?`,
			[id , pw]
		);
		return rows[0];
	},
	idConfirm: async(id) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from patients where id = ?`,
		  [id]
		);
		return rows[0].cnt;
  },
  phoneConfirm: async(id) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from patients where phone = ?`,
		  [id]
		);
		return rows[0].cnt;
  },
  getTerms: async(type) => {
		const [rows] = await (await connection()).execute(
		  ` select title, contents from terms where type = ? limit 1`,
		  [type]
		);
		return rows[0];
  },
  // 인증코드 저장
  insertPhoneAuth: async(phone, code) => {
    const result = await (await connection()).execute(
		  ` insert into  patients_auth ( phone, code ) 
        values (?, ?)`,
		  [phone, code]
		);
    return result;
  },
  // 인증정보 확인
  getPhoneAuthCode: async(phone, code) => {
    const [rows] = await (await connection()).execute(
		  ` select idx, code, reg_date, auth, is_success, date_add(reg_date, interval 5 MINUTE) as expiry_date from patients_auth where phone = ? and code = ? order by idx desc limit 1`,
		  [phone, code]
		);
    return rows[0];
  },
  // 인증완료처리
  updatePhoneAuth: async(idx) => {
    const result = await (await connection()).execute(
		  ` update patients_auth set auth = 'true' where idx = ? `,
		  [idx]
		);
    return result;
  },
  updateAuthSuccess: async(idx) => {
    const result = await (await connection()).execute(
		  ` update patients_auth set is_success = 'true' where idx = ? `,
		  [idx]
		);
    return result;
  },
  // 인증완료된 인증코드 검색
  getPhoneAuth: async(phone) => {
    const [rows] = await (await connection()).execute(
		  ` select idx, code, reg_date, auth, is_success from patients_auth where phone = ? and auth = ? order by idx desc limit 1`,
		  [phone, 'true']
		);
    return rows[0];
  },
  // 비밀번호 중복여부 검사
  getUserPassword: async(phone, pwd) => {
    const [rows] = await (await connection()).execute(
		  ` select count(*) as cnt from patients where phone = ? and pwd = ? `,
		  [phone, pwd]
		);
    return rows[0].cnt;
  },
  // 비밀번호 변경
  updatePassword: async(phone, pwd) => {
    const [rows] = await (await connection()).execute(
      ` update patients set pwd = ? where phone = ? `,
		  [pwd, phone]
    );
  },
  // id로 회원정보 검색
  getUserById: async(id) => {
    const [rows] = await (await connection()).execute(
      ` select idx as p_idx, name, ssn, phone from patients where id = ? `,
		  [id]
    );
    return rows[0]
  },
  // idx로 회원정보 검색
  getUserByIdx: async(p_idx) => {
    const [rows] = await (await connection()).execute(
      ` select idx as p_idx, name, phone, ssn from patients where idx = ? `,
		  [p_idx]
    );
    return rows[0]
  },
  // 아이디 찾기
  findIdData: async(name, phone) => {
    const [rows] = await (await connection()).execute(
      ` select idx, id, name, phone from patients where name = ? and phone = ?; `,
		  [name, phone]
    );
    return rows[0]
  },
  // 신용카드 중복검사
  cardConfirm: async(idx, number) => {
    const [rows] = await (await connection()).execute(
      ` select count(*) as cnt from card where patients_idx = ? and number = ? `,
      [idx, number]
    );
    return rows[0].cnt
  },
  // 신용카드 등록
  insertCardData: async(idx, data) => {
    const result = await (await connection()).execute(
      ` insert into card ( patients_idx, number, expired_MM, expired_YY, password, is_default, regdate, card_type ) 
        values
        ( ?, ?, ?, ?, ?, ?, now(), '' )`,
      [
        idx,
        data.number,
        data.expired_mm,
        data.expired_yy,
        data.pwd,
        data.is_default,
      ]
    );
    return result;
  },
  getCardData: async(patients_idx, c_idx) => {
    const [rows] = await (await connection()).execute(
      ` select * from card where patients_idx = ? and c_idx = ? `,
      [patients_idx, c_idx]
    );
    return rows[0]
  },
  getCardByNumber: async(p_idx, number) => {
    const [rows] = await (await connection()).execute(
      ` select * from card where patients_idx = ? and number = ? `,
      [p_idx, number]
    );
    return rows[0]
  },
  userCardList: async(patients_idx) => {
    const [rows] = await (await connection()).execute(
      ` select c_idx, number, expired_MM, expired_YY, password, card_type, card_image, is_default from card where patients_idx = ? order by c_idx asc`,
      [patients_idx]
    );
    return rows;
  },
  deleteCardData: async(c_idx) => {
    const result = await (await connection()).execute(
      ` delete from card where c_idx = ?; `,
      [c_idx]
    );
    return result;
  },
  updateCardData: async(c_idx, data) => {
    var setStr = "set";
    var setTemp = "";
    var setArray = [];

    if(data.pwd !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " password = ? ";
      setArray.push(data.pwd);
    }
    // if(data.card_type !== undefined){
    //   setTemp = setTemp + ((setTemp!="")?",":"") + " card_type = ? ";
    //   setArray.push(data.card_type);
    // }
    if(data.card_image !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " card_image = ? ";
      setArray.push(data.card_image);
    }
    if(data.is_default !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " is_default = ? ";
      setArray.push(data.is_default);
    }

    setArray.push(c_idx);
    setStr = setStr + setTemp;

    if(setStr == "set") return false;
    
    const result = await (await connection()).execute(
      ` update card `+setStr+` where c_idx = ? `,
       setArray
    );
    return result;
  },
  releaseDefaultCard: async(patients_idx) => {
    const result = await (await connection()).execute(
      ` update card set is_default = ? where patients_idx = ? and is_default = ? `,
      [ 'false', patients_idx, 'true']
    );
    return result;
  },
  insertAddressData: async(p_idx, data) => {
    const result = await (await connection()).execute(
      ` insert into address_save
        ( patients_idx, address1, address2, door_block_flag, door_password, lat, lng, is_default, regdate )
        values 
        ( ?, ?, ?, ?, ?, ?, ?, ?, now() ) ; `,
        [ 
          p_idx,
          data.address,
          data.address_detail,
          data.is_doorlock,
          data.pwd,
          data.lat,
          data.lng,
          data.is_default,
        ]
    );
    return result;
  },
  updateAddressData: async(add_idx, data) => {
    var setStr = "set";
    var setTemp = "";
    var setArray = [];

    if(data.address !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " address1 = ? ";
      setArray.push(data.address);
    }
    if(data.address_detail !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " address2 = ? ";
      setArray.push(data.address_detail);
    }
    if(data.lat !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " lat = ? ";
      setArray.push(data.lat);
    }
    if(data.lng !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " lng = ? ";
      setArray.push(data.lng);
    }
    if(data.is_doorlock !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " door_block_flag = ? ";
      setArray.push(data.is_doorlock);
    }
    if(data.pwd !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " door_password = ? ";
      setArray.push(data.pwd);
    }
    if(data.is_default !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " is_default = ? ";
      setArray.push(data.is_default);
    }

    setArray.push(add_idx);
    setStr = setStr + setTemp;

    if(setStr == "set") return false;

    var sql = ` update address_save `+setStr+` where add_idx = ? `;
    
    const result = await (await connection()).execute(
      sql, setArray
    );
    
    return result;
  },
  deleteAddressData: async(p_idx, add_idx) => {
    const result = await (await connection()).execute(
      ` delete from address_save where add_idx = ? and patients_idx = ?; `,
      [ add_idx, p_idx ]
    );
    return result;
  },
  patientsAddressList: async(p_idx) => {
    const [rows] = await (await connection()).execute(
      ` select add_idx, address1, address2, door_block_flag, door_password, lat, lng, is_default from address_save where patients_idx = ? order by is_default desc, regdate desc `,
      [ p_idx ]
    );
    return rows;
  },
  // 주소지 있는지 확인
  confirmAddress: async(p_idx, add_idx) => {
    const [rows] = await (await connection()).execute(
      ` select count(*) as cnt from address_save where add_idx = ? and patients_idx = ? `,
      [ add_idx, p_idx ]
    );
    return rows[0].cnt;
  },
  getPatientsAddress: async(p_idx, add_idx) =>{
    const [rows] = await (await connection()).execute(
      ` select add_idx, address1, address2, lat, lng, is_default from address_save where patients_idx = ? and add_idx = ?; `,
      [ p_idx, add_idx ]
    );
    return rows[0];
  },
  getDefaultAddress: async(p_idx) => {
    const [rows] = await (await connection()).execute(
      ` select add_idx, address1, address2, lat, lng from address_save where patients_idx = ? and is_default = 'true' `,
      [ p_idx ]
    );
    return rows[0];
  },
  releaseDefaultAddress: async(p_idx) => {
    const result = await (await connection()).execute(
      ` update address_save set is_default = 'false' where patients_idx = ? and is_default = 'true' `,
      [ p_idx ]
    );
    return result;
  },
  // 가까운 장소 찾기
  getNearbyPlace: async(type, lat, lng) => {
    let sql = '';
    if(type == 'hospital'){
      sql = ` select hospital.*, info, status from
              (select h_idx as idx, hospital_name as name, contact_number, address, address_detail, lat, lng, 
                TRUNCATE((ST_DISTANCE_SPHERE(POINT(?, ?), POINT(lng, lat)) / 1000), 2) AS distance
                FROM hospital where is_passed = '승인') as hospital
              inner join
              (select dc_idx, hospital_h_idx, dc_info as info, dc_status as status from doctor where is_passed = '승인') as doctor
              on hospital.idx = doctor.hospital_h_idx
              group by idx
              ORDER BY distance asc, idx asc; `;
    }else{
      sql = ` select pharmacy.*, info, status from
              (select phc_idx as idx, pharmacy_name as name, contact_number, address, address_detail, lat, lng as lng, 
                TRUNCATE((ST_DISTANCE_SPHERE(POINT(?, ?), POINT(lng, lat)) / 1000), 2) AS distance
                FROM pharmacy where is_passed = '승인' ORDER BY distance asc, idx asc) as pharmacy
              inner join 
              (select pharmacy_ph_idx, ph_info as info, ph_status as status from pharmacist where is_passed = '승인') as pharmacist
              on pharmacy.idx = pharmacist.pharmacy_ph_idx
              group by idx
              ORDER BY distance asc, idx asc; `;
    }
    const [rows] = await (await connection()).execute(
      sql,[lng, lat]
    );
    return rows;
  },
  // 의사 리스트
  getDoctorList: async(page, listSize, type, tag, search, order, lat, lng) => {
    let sql_order = " order by ";
    let sql_where = " where dc_idx != '' ";
    let union = '';
    let param = [lng, lat];
    let result = [];

    let limit_offset = (page - 1) * listSize;

    if(type == 'department'){
      union = `select doctor_dc_idx, name from
      (select doctor_dc_idx, department_dp_idx from doctor_department) as a 
      left join 
      (select dp_idx, name from department) as b 
      on a.department_dp_idx = b.dp_idx`;
    }else{
      union = `select doctor_dc_idx, name from 
      (select doctor_dc_idx, symptom_sy_idx from doctor_symptom) as a
      left join
      (select sy_idx, name from symptom) as b
      on a.symptom_sy_idx = b.sy_idx`;
    }
    
    if(tag != ''){
      sql_where += " and dc_union.name = ? ";
      param.push(tag);
    }

    if(search != ''){
      sql_where += " and dc_name like ? or hospital_name like ?";
      param.push(`%${search}%`);
      param.push(`%${search}%`);
    }

    switch(order){
      case "review":
        sql_order += " comment_count desc ";
        break;
        case "rank":
        sql_order += " dc_point desc ";
        break;
      case "video":
        sql_where += " and cam_flag = 'true' ";
        sql_order += " distance asc ";
        break;
      default:
        sql_order += " distance asc ";
    }
    sql_order += " , dc_idx desc"
    
    const [rows] = await (await connection()).execute(
      `select SQL_CALC_FOUND_ROWS doctor.* from
      (
        select dc_idx, dc_name, profile_file, dc_info, dc_status, dc_point, dc_phone, comment_count, cam_flag, hospital_name, distance from
        (select dc_idx, dc_name, profile_file, dc_info, dc_status, dc_point, dc_phone, comment_count, cam_flag, hospital_h_idx from doctor where is_passed = '승인') as doctor
        left join
        (select h_idx, hospital_name, TRUNCATE((ST_DISTANCE_SPHERE(POINT(?, ?), POINT(lng, lat)) / 1000), 2) AS distance from hospital) as hospital
        on doctor.hospital_h_idx = hospital.h_idx
      ) as doctor
      left join
      (${union}) as dc_union
      on doctor.dc_idx = dc_union.doctor_dc_idx
      ${sql_where}
      group by dc_idx
      ${sql_order}
      limit ${limit_offset}, ${listSize}`,
		  param
    );
    
    const [res] =  await (await connection()).execute(
      `SELECT FOUND_ROWS() AS cnt;`,[]
    );
    
    result.lists = rows;
    result.total_cnt = res[0].cnt;

    return result;
  },
  // 의사 상세
  getDoctor: async(dc_idx, p_idx) => {
    const [rows] = await (await connection()).execute(
      `select dc.*, if(dc_like.doctor_dc_idx is null, 'false', 'true') as like_flag  from 
      (select dc_idx, hospital_h_idx, dc_name, profile_file, introduce, dc_status, dc_point, dc_phone, comment_count, cam_flag, dc_info from doctor where dc_idx = ? and is_passed = '승인') as dc
      left join 
      (select doctor_dc_idx from like_doctor where patients_idx = ?) as dc_like
      on dc.dc_idx = dc_like.doctor_dc_idx`,
		  [dc_idx, p_idx]
		);
    return rows[0];
  },
  // 병원정보 가져오기
  getHospital: async(h_idx) => {
    const [rows] = await (await connection()).execute(
      ` select h_idx, hospital_name, contact_number, contact_number, address, address_detail from hospital where h_idx = ? `,
		  [h_idx]
		);
    return rows[0];
  },
  // 전문의 가져오기
  getDoctorSurgeon: async(dc_idx) => {
    const [rows] = await (await connection()).execute(
      ` select group_concat(name) as surgeon from 
        (select doctor_dc_idx, surgeon_surgeon_idx from doctor_surgeon where doctor_dc_idx = ?) as a
        left join
        (select surgeon_idx, name from surgeon) as b
        on a.surgeon_surgeon_idx = b.surgeon_idx`,
		  [dc_idx]
		);
    return rows[0];
  },
  // 진료과목 가져오기
  getDoctorDepartment: async(dc_idx) => {
    const [rows] = await (await connection()).execute(
        `select group_concat(name) as department from
        (select doctor_dc_idx, department_dp_idx from doctor_department where doctor_dc_idx = ? ) as a 
        left join 
        (select dp_idx, name from department) as b 
        on a.department_dp_idx = b.dp_idx`,
		  [dc_idx]
		);
    return rows[0];
  },
  // 의사 리뷰 가져오기
  getDoctorReview: async(start, listSize, dc_idx) => {
    const [rows] = await (await connection()).execute(
        ` select dcr_idx, point, content, regdate, name from 
          (select dcr_idx, point, content, regdate, patients_idx from doctor_review where doctor_dc_idx = ?) as review
          left join
          (select idx, name from patients) as patients
          on review.patients_idx = patients.idx
          order by dcr_idx desc
          limit ${start} , ${listSize}`,
		  [dc_idx]
		);
    return rows;
  },
  // 리뷰개수, 평점 가져오기
  getDoctorReviewCount: async(dc_idx) => {
    const [rows] = await (await connection()).execute(
      ` select count(*) as cnt, avg(point) as point from doctor_review where doctor_dc_idx = ? `,
      [dc_idx]
    );

    // 평점 반올림 처리
    rows[0].point = Math.round(rows[0].point * 10) / 10;

    return rows[0];
  },
  // 의사가 있는지 없는지
  confirmDoctor: async(dc_idx) => {
    const [rows] = await (await connection()).execute(
      ` select count(*) as cnt, ifnull(dc_point, 0) as point from doctor where dc_idx = ? and is_passed = '승인' `,
      [dc_idx]
    );
    return rows[0];
  },
  // 자주가는 의사 등록
  insertLikeDoctor: async(p_idx, dc_idx) => {
    const result = await (await connection()).execute(
      ` insert into like_doctor ( patients_idx, doctor_dc_idx) values ( ?, ? ) `,
      [p_idx, dc_idx]
    );
    return result;
  },
  // 자주가는 의사 삭제
  deleteLikeDoctor: async(p_idx, dc_idx) => {
    const result = await (await connection()).execute(
      ` delete from like_doctor where patients_idx = ? and doctor_dc_idx = ?; `,
      [p_idx, dc_idx]
    );
    return result;
  },
  // 메인용 자주가는 의사 리스트
  getMainLikeDoctorList: async(p_idx) => {
    const [rows] = await (await connection()).execute(
      ` select dc.* from 
        (select like_idx, doctor_dc_idx from like_doctor where patients_idx = ?) as dc_like
        inner join 
        (select dc_idx, (select hospital_name from hospital where h_idx = doctor.hospital_h_idx) as hospital_name, dc_name, dc_info, dc_status from doctor where is_passed = '승인') as dc
        on dc.dc_idx = dc_like.doctor_dc_idx
        order by like_idx desc
        limit 2`,
      [p_idx]
    );
    return rows;
  },
  // 자주가는 의사 리스트
  getLikeDoctorList: async(page, listSize, p_idx) => {
    let limit_offset = (page - 1) * listSize;
    let result = [];
    
    const [rows] = await (await connection()).execute(
      ` select SQL_CALC_FOUND_ROWS dc.* from 
        (select like_idx, doctor_dc_idx from like_doctor where patients_idx = ?) as dc_like
        inner join 
        (select dc_idx, (select hospital_name from hospital where h_idx = doctor.hospital_h_idx) as hospital_name, dc_name, dc_info, dc_status, dc_point, profile_file, cam_flag from doctor where is_passed = '승인') as dc
        on dc.dc_idx = dc_like.doctor_dc_idx
        order by like_idx desc
        limit ${limit_offset}, ${listSize}`,
      [p_idx]
    );

    const [res] =  await (await connection()).execute(
      `SELECT FOUND_ROWS() AS cnt;`,[]
    );

    result.list = rows;
    result.total_cnt = res[0].cnt;
    return result;
  },
  updateDoctorPoint: async(dc_idx, point) => {
    const result = await (await connection()).execute(
      ` update doctor set dc_point = ? where dc_idx = ? `,
      [point, dc_idx]
    );
    return result;
  },
  // 앱 토큰정보 수정
  updateAppToken:async(p_idx, token) =>{
    const result = await (await connection()).execute(
      ` update patients set token = ? where idx = ? `,
      [token, p_idx]
    );
    return result;
  },
  // 내가 쓴 리뷰 가져오기
  getMyreviewList: async(page, listSize, p_idx) => {
    let result = [];

    let limit_offset = (page - 1) * listSize;

    const [rows] = await (await connection()).execute(
      ` select dcr_idx, point, dc_name, hospital_name, content, regdate, name from 
        (select idx, name from patients where idx = ?) as patients
        inner join
        (	
          select dcr_idx, point, dc_name, hospital_name, content, regdate, patients_idx from
          (select dc_idx, dc_name, (select hospital_name from hospital where h_idx = doctor.hospital_h_idx) as hospital_name from doctor where dc_idx is not null) as doctor
          left join
          (select dcr_idx, point, content, regdate, patients_idx, doctor_dc_idx from doctor_review) as review
          on doctor.dc_idx = review.doctor_dc_idx
        ) as review
        on review.patients_idx = patients.idx
        order by dcr_idx desc
        limit ${limit_offset}, ${listSize}`,
      [p_idx]
    );
    
    const [res] =  await (await connection()).execute(
      `SELECT FOUND_ROWS() AS cnt;`,[]
    );
    
    result.list = rows;
    result.total_cnt = res[0].cnt;

    return result;
  },
  // 리뷰 가져오기
  getReview: async(p_idx, dcr_idx) => {
    const [rows] = await (await connection()).execute(
      ` select dcr_idx, dc_idx, dc_name, hospital_name, point, content, regdate from
        (select dc_idx, dc_name, (select hospital_name from hospital where h_idx = doctor.hospital_h_idx) as hospital_name from doctor where dc_idx is not null) as doctor
        inner join
        (select dcr_idx, point, content, regdate, patients_idx, doctor_dc_idx from doctor_review where dcr_idx = ? and patients_idx = ?) as review
        on doctor.dc_idx = review.doctor_dc_idx; `,
      [dcr_idx, p_idx]
    );
    return rows[0];
  },
  // 리뷰 수정
  updateReview: async(dcr_idx, data) => {
    var setStr = "set";
    var setTemp = "";
    var setArray = [];

    if(data.point !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " point = ? ";
      setArray.push(data.point);
    }
    if(data.content !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " content = ? ";
      setArray.push(data.content);
    }

    setArray.push(dcr_idx);
    setStr = setStr + setTemp;
    
    if(setStr == "set") return false;

    const result = await (await connection()).execute(
      ` update doctor_review `+setStr+` where dcr_idx = ? `,
       setArray
    );
    return result;
  },
  // 리뷰 삭제
  deleteReviewData: async(dcr_idx) => {
    const result = await (await connection()).execute(
      ` delete from doctor_review where dcr_idx = ?; `,
      [dcr_idx]
    );
    return result;
  }
};