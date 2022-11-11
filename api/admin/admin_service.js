//doctor_service.js

const {connection} = require("../../config/database");

module.exports = {

	confirmUser: async(id, pw) => {
		const [rows, fields] = await (await connection()).execute(
			`select * from admin where id = ? and pwd = ?`,
			[id , pw]
		);
		return rows[0];
	},

    insertNotice: async(noticeObj) => {
		const [result] = await (await connection()).execute(
			`insert into notice(title , contents , reg_date) 
             values (? , ? , now());`,
			[
                noticeObj.title,
                noticeObj.contents
            ]
		);
		return result;
	},

    updateNotice: async(notice_idx , noticeObj) => {
		var setStr = "set";
        var setTemp = "";
        var setArray = [];

        if(noticeObj.title !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " title = ? ";
            setArray.push(noticeObj.title);
        }
        if(noticeObj.contents !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " contents = ? ";
            setArray.push(noticeObj.contents);
        }

        setArray.push(notice_idx);
        setStr = setStr + setTemp;

        if(setStr == "set") return false;
        
        const result = await (await connection()).execute(
            `update notice `+setStr+` where notice_idx = ? `,
            setArray
        );
        return result;
	},

    deleteNotice: async(notice_idx) => {
		const [result] = await (await connection()).execute(
			`delete from notice where notice_idx = ?;`,
			[ notice_idx ]
		);
		return result;
	},

    getNoticeCount:  async() => {
		const [rows, fields] = await (await connection()).execute(
			`select count(*) as cnt from notice`,
			[]
		);
		return rows[0].cnt;
	},

    getNoticeList: async(start, listSize) => {
        const [rows] = await (await connection()).execute(
            ` select * from notice order by notice_idx desc limit ${start} , ${listSize}`,
            []
        );
        return rows;
    },

    getNotice: async(notice_idx) => {
        const [rows] = await (await connection()).execute(
            ` select * from notice where notice_idx = ?`,
            [notice_idx]
        );
        return rows[0];
    },


    getDoctorCount:  async() => {
		const [rows, fields] = await (await connection()).execute(
			`select count(*) as cnt from doctor`,
			[]
		);
		return rows[0].cnt;
	},

    getDoctorList: async(start, listSize) => {
        const [rows] = await (await connection()).execute(
            ` select * from doctor order by dc_idx desc limit ${start} , ${listSize}`,
            []
        );
        return rows;
    },

};