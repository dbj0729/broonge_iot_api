// diag_service.js

const {connection} = require("../../config/database");

module.exports = {
  // 증상 리스트
  getSymptomList: async() => {
    const [rows] = await (await connection()).execute(
      `select * from symptom order by name asc;`,
		  []
		);
    return rows;
  },
  // 진료과 리스트
  getDepartmentList: async() => {
    const [rows] = await (await connection()).execute(
      ` select * from department order by name asc; `,
		  []
		);
    return rows;
  },
  // 진료과 가져오기
  getDepartment: async(dp_idx) => {
    const [rows] = await (await connection()).execute(
      ` select * from department where dp_idx = ? ; `,
		  [dp_idx]
		);
    return rows[0];
  },
  // 문진표 가져오기
  getQuestionnaire: async(p_idx) => {
    const [rows] = await (await connection()).execute(
      ` select * from questionnaire where p_idx = ? order by q_idx desc `,
      [p_idx]
    );
    return rows[0];
  },
  // 진료요청 등록
  insertQuestionnaire: async(data) => {
    const result = await (await connection()).execute(
      ` insert into questionnaire 
        ( p_idx, dp_idx, symptom, image_cnt, pay_method, card_number, card_type, alram, regdate, status )
        values
        ( ?, ?, ?, ?, ?, ?, ?, ?, now(), 'writed' )`,
      [
        data.p_idx,
        data.dp_idx,
        data.symptom,
        data.image_cnt,
        data.pay_method,
        data.card_number,
        data.card_type,
        data.alram
      ]
    );
    return result;
  },
  updateQuestionnaire: async(q_idx, data) => {
    const result = await (await connection()).execute(
      ` update questionnaire set dp_idx = ? , symptom = ? , image_cnt = ?, pay_method = ?, card_number = ? , card_type = ?, alram = ?, status = ? where q_idx = ?`,
      [
        data.dp_idx,
        data.symptom,
        data.image_cnt,
        data.pay_method,
        data.card_number,
        data.card_type,
        data.alram,
        data.status,
        q_idx,
      ]
    );
    return result;
  },
  // 문진표 상태변경
  updateQuestionnaireStatus: async(q_idx, status) => {
    const result = await (await connection()).execute(
      ` update questionnaire set status = ? where q_idx = ?`,
      [status, q_idx]
    );
    return result;
  },
  // 진료요청 첨부파일 등록
  insertQuestionnaireImage: async(data) => {
    const result = await (await connection()).execute(
      ` insert into questionnaire_image ( questionnaire_q_idx, file_name, regdate ) 
        values ${data} ; `,
        []
    );
    return result;
  },
  // 문진표를 가지고 있는지, 상태여부 확인
  confirmUserQuestionnaire: async(p_idx) => {
    const [rows] = await (await connection()).execute(
      ` select status from questionnaire where p_idx = ? order by q_idx desc limit 1; `,
      [p_idx]
    );
    return rows[0];
  },
  // 환자 문진표 idx로 가져오기
  getQuestionnaireByIdx: async(q_idx) => {
    const [rows] = await (await connection()).execute(
      ` select * from questionnaire where q_idx = ?; `,
        [q_idx]
    );
    return rows[0];
  },
  // 환자 문진표 이미지 가져오기
  getQuestionnaireImage: async(q_idx) => {
    const [rows] = await (await connection()).execute(
      ` select file_name from questionnaire_image where questionnaire_q_idx = ? order by qimg_idx asc`,
        [q_idx]
    );
    return rows;
  },
  // 환자 문진표 이미지 삭제
  deleteQuestionnaireImage: async(q_idx, file) => {
    const result = await (await connection()).execute(
      ` delete from questionnaire_image where questionnaire_q_idx = ? and file_name not in (${file}) ; `,
      [q_idx]
    );
    return result;
  },
  // 의사 문진표 작성
  insertKarte: async(data) => {
    const result = await (await connection()).execute(
      ` insert into karte 
        ( patients_idx, dp_idx, symptom, image_cnt, pay_method, card_number, card_type, alram, regdate, dc_idx )
        values
        ( ?, ?, ?, ?, ?, ?, ?, ?, now(), ? )`,
      [
        data.p_idx,
        data.dp_idx,
        data.symptom,
        data.image_cnt,
        data.pay_method,
        data.card_number,
        data.card_type,
        data.alram,
        data.dc_idx
      ]
    );
    return result;
  },
  // 의사 문진표 첨부파일 등록
  insertKarteImage: async(data) => {
    const result = await (await connection()).execute(
      ` insert into karte_image ( karte_q_idx, file_name, regdate ) 
        values ${data} ; `,
        []
    );
    return result;
  },
  // 의사 문진표 개수 가져오기 (나중에 상태조건 추가할것)
  getKarteCount: async(dc_idx) => {
    const [row] = await (await connection()).execute(
      ` select count(*) as cnt from karte where dc_idx = ? `,
      [dc_idx]
    );
    return row[0].cnt;
  }
};