//doctor_service.js

const {connection} = require("../../config/database");

module.exports = {
  create: async(data) => {
    const result = await (await connection()).execute(
      `insert into doctor 
        ( hospital_h_idx , id , pwd,
          dc_name, dc_phone , 
          license_number, license_file,
          profile_file , introduce ,
          dc_info,
          reg_date , up_date
       ) 
        values
        ( ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?,
          ?,
          now() , now()
        )`,
      [
        data.hospital_h_idx,  data.id , data.pw1,
        data.name , data.phone ,
        data.license_number, data.license_file,
        data.profile_file, data.introduce,
        data.dc_info
      ]
    );
    return result;
  },
  updateDoctor: async(mb_no, data) => {
    var setStr = "set";
    var setTemp = "";
    var setArray = [];

    if(data.name !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " dc_name = ? ";
      setArray.push(data.name);
    }
    if(data.pwd !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " pwd = ? ";
      setArray.push(data.pwd);
    }
    if(data.introduce !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " introduce = ? ";
      setArray.push(data.introduce);
    }
    if(data.dc_info !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " dc_info = ? ";
      setArray.push(data.dc_info);
    }
    if(data.phone !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " dc_phone = ? ";
      setArray.push(data.phone);
    }
    if(data.profile_file !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " profile_file = ? ";
      setArray.push(data.profile_file);
    }

    setArray.push(mb_no);
    setStr = setStr + setTemp;

    if(setStr == "set") return false;
    
    const result = await (await connection()).execute(
      ` update doctor `+setStr+` where dc_idx = ? `,
       setArray
    );
    return result;
  },
	confirmUser: async(id, pw) => {
		const [rows, fields] = await (await connection()).execute(
			`select * from doctor where id = ? and pwd = ?`,
			[id , pw]
		);
		return rows[0];
	},
	idConfirm: async(id) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from doctor where id = ?`,
		  [id]
		);
		return rows[0].cnt;
  },
  phoneConfirm: async(id) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from doctor where dc_phone = ?`,
		  [id]
		);
		return rows[0].cnt;
  },
  licenseConfirm: async(license_number) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from doctor where license_number = ?`,
		  [license_number]
		);
		return rows[0].cnt;
  },
  confirmHospitalBN: async(business_number) => {
		const [rows, fields] = await (await connection()).execute(
		  `select * from hospital where business_number = ?`,
		  [business_number]
		);
		return rows[0];
  },
  getHospitalData: async(hospital_idx) => {
		const [rows, fields] = await (await connection()).execute(
		  `select *  from hospital where h_idx = ?`,
		  [hospital_idx]
		);
		return rows[0];
  },
  insertHospital: async(hospitalObj) => {
		const [result] = await (await connection()).execute(
		  `insert into hospital
       (business_number , business_file,
        hospital_name, ceo, contact_number,
        address, address_detail, lat, lng,
        reg_date, up_date)
       values(
         ? , ? ,
         ? , ? , ? ,
         ? , ? , ? , ? ,
         now() , now()
       )`,
		  [
        hospitalObj.business_number , hospitalObj.business_file,
        hospitalObj.hospital_name , hospitalObj.ceo , hospitalObj.contact_number,
        hospitalObj.address, hospitalObj.address_detail, hospitalObj.lat , hospitalObj.lng
      ]
		);
		return result;
  },

  updateHospital: async(h_idx, data) => {
    var setStr = "set";
    var setTemp = "";
    var setArray = [];

    if(data.hospital_name !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " hospital_name = ? ";
      setArray.push(data.hospital_name);
    }
    if(data.ceo !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " ceo = ? ";
      setArray.push(data.ceo);
    }
    if(data.contact_number !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " contact_number = ? ";
      setArray.push(data.contact_number);
    }
    if(data.address !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " address = ? ";
      setArray.push(data.address);
    }
    if(data.address_detail !== undefined){
      setTemp = setTemp + ((setTemp!="")?",":"") + " address_detail = ? ";
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

    setTemp = setTemp + ((setTemp!="")?",":"") + " up_date = now() ";

    setArray.push(h_idx);
    setStr = setStr + setTemp;

    if(setStr == "set") return false;
    
    const result = await (await connection()).execute(
      ` update hospital `+setStr+` where h_idx = ? `,
       setArray
    );
    return result;
  },

  
  confirmSurgeonCount: async(surgeonStr) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from surgeon where surgeon_idx in (${surgeonStr})`,
		  []
		);
		return rows[0].cnt;
  },
  confirmDepartmentCount: async(departmentStr) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from department where dp_idx in (${departmentStr})`,
		  []
		);
		return rows[0].cnt;
  },
  confirmSymptomCount: async(symptomStr) => {
		const [rows, fields] = await (await connection()).execute(
		  `select count(*) as cnt from symptom where sy_idx in (${symptomStr})`,
		  []
		);
		return rows[0].cnt;
  },

  // 인증코드 저장
  insertPhoneAuth: async(phone, code) => {
    const result = await (await connection()).execute(
		  ` insert into  doctor_auth ( phone, code ) 
        values (?, ?)`,
		  [phone, code]
		);
    return result;
  },
  // 인증완료된 인증코드 검색
  getPhoneAuth: async(phone) => {
      const [rows] = await (await connection()).execute(
        ` select idx, code, reg_date, auth, is_success from doctor_auth where phone = ? and auth = ? order by idx desc limit 1`,
        [phone, 'true']
      );
      return rows[0];
  },
  // 인증정보 확인
  getPhoneAuthCode: async(phone, code) => {
    const [rows] = await (await connection()).execute(
		  ` select idx, code, reg_date, auth, is_success, date_add(reg_date, interval 5 MINUTE) as expiry_date from doctor_auth where phone = ? and code = ? order by idx desc limit 1`,
		  [phone, code]
		);
    return rows[0];
  },
  // 인증완료처리
  updatePhoneAuth: async(idx) => {
    const result = await (await connection()).execute(
		  ` update doctor_auth set auth = 'true' where idx = ? `,
		  [idx]
		);
    return result;
  },
  updateStatus: async(dc_idx , status) => {
    const result = await (await connection()).execute(
		  ` update doctor set is_passed = ? where dc_idx = ? `,
		  [status , dc_idx]
		);
    return result;
  },
  updateAuthSuccess: async(idx) => {
    const result = await (await connection()).execute(
		  ` update doctor_auth set is_success = 'true' where idx = ? `,
		  [idx]
		);
    return result;
  },

  insertSurgeon: async(doctorId, idx) => {
    const result = await (await connection()).execute(
		  ` insert into doctor_surgeon(doctor_dc_idx , surgeon_surgeon_idx) values(? , ?)`,
		  [doctorId , idx]
		);
    return result;
  },
  insertDepartment: async(doctorId, idx) => {
    const result = await (await connection()).execute(
		  ` insert into doctor_department(doctor_dc_idx , department_dp_idx) values(? , ?)`,
		  [doctorId , idx]
		);
    return result;
  },
  insertSymptom: async(doctorId, idx) => {
    const result = await (await connection()).execute(
		  ` insert into doctor_symptom(doctor_dc_idx , symptom_sy_idx) values(? , ?)`,
		  [doctorId , idx]
		);
    return result;
  },

  deleteDepartment:  async(doctorId) => {
    const result = await (await connection()).execute(
		  ` delete from doctor_department where doctor_dc_idx = ?`,
		  [doctorId]
		);
    return result;
  },
  deleteSymptom: async(doctorId) => {
    const result = await (await connection()).execute(
		  ` delete from doctor_symptom where doctor_dc_idx = ?`,
		  [doctorId]
		);
    return result;
  },


  getSymptomList: async() => {
    const [rows] = await (await connection()).execute(
      `select sy_idx , name , detail from symptom order by name asc;`,
      []
    );
    return rows;
  },
  getDepartmentList: async() => {
    const [rows] = await (await connection()).execute(
      ` select dp_idx , name , en_name , abbreviation from department order by name asc; `,
      []
    );
    return rows;
  },
  getSurgeonList:  async() => {
    const [rows] = await (await connection()).execute(
      ` select surgeon_idx , name , en_name , abbreviation from surgeon order by name asc; `,
      []
    );
    return rows;
  },
  getDoctorIdx: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select dc_idx ,
          hospital_h_idx ,
          id ,
          dc_name as name,
          dc_status ,
          dc_point ,
          dc_phone as phone,
          license_number ,
          license_file ,
          dc_info ,
          comment_count ,
          cam_flag ,
          is_passed ,
          token,
          reg_date ,
          up_date
          from doctor
          where dc_idx = ? `,
      [idx]
    );
    return rows[0];
  },
  getDoctorData: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select 
          id ,
          dc_name as name,
          dc_status ,
          dc_point ,
          dc_phone as phone,
          license_number ,
          license_file ,
          profile_file,
          introduce,
          dc_info ,
          comment_count ,
          cam_flag ,
          token,
          temp2.*
          from
          (select * from doctor where dc_idx = ?) as temp1
          left join
          (select * from hospital) as temp2
          on temp1.hospital_h_idx = temp2.h_idx`,
      [idx]
    );
    return rows[0];
  },
  getDoctorHospital: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select hospital_h_idx from doctor where dc_idx = ? `,
      [idx]
    );
    return rows[0];
  },
  getDoctorStatus: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select is_passed from doctor where dc_idx = ? `,
      [idx]
    );
    return rows[0];
  }, 
  hospitalFirstDoctor: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select dc_idx from doctor where hospital_h_idx = ? order by dc_idx asc limit 1 `,
      [idx]
    );
    return rows[0];
  },
  getDoctorSymptom: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select symptom_sy_idx as sy_idx from doctor_symptom where doctor_dc_idx = ? `,
      [idx]
    );
    return rows;
  },
  getDoctorDepartment: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select department_dp_idx as dp_idx from doctor_department where doctor_dc_idx = ? `,
      [idx]
    );
    return rows;
  },
  getDoctorSurgeon: async(idx) => {
    const [rows] = await (await connection()).execute(
      ` select surgeon_surgeon_idx as surgeon_idx from doctor_surgeon where doctor_dc_idx = ? `,
      [idx]
    );
    return rows;
  },
  getTerms:  async(type) => {
    const [rows] = await (await connection()).execute(
      ` select contents from terms where type = ?`,
      [type]
    );
    return rows[0].contents;
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
  // 의사 리스트
  getDoctorList: async(type, tag, search, order, lat, lng) => {
    let sql_order = " order by ";
    let sql_where = " where dc_idx != '' ";
    let union = '';
    let param = [lng, lat];

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
      `select doctor.* from
      (
        select dc_idx, dc_name, dc_status, dc_point, dc_phone, comment_count, cam_flag, hospital_name, distance from
        (select dc_idx, dc_name, dc_status, dc_point, dc_phone, comment_count, cam_flag, hospital_h_idx from doctor where is_passed = '승인') as doctor
        left join
        (select h_idx, hospital_name, TRUNCATE((ST_DISTANCE_SPHERE(POINT(?, ?), POINT(lng, lat)) / 1000), 2) AS distance from hospital) as hospital
        on doctor.hospital_h_idx = hospital.h_idx
      ) as doctor
      left join
      (${union}) as dc_union
      on doctor.dc_idx = dc_union.doctor_dc_idx
      ${sql_where}
      ${sql_order}`,
		  param
		);
    return rows;
  },
};