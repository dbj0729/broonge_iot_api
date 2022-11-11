//pharmacist_service.js

const {connection} = require("../../config/database");

module.exports = {
    create: async(data) => {
        const result = await (await connection()).execute(
        `insert into pharmacist 
            ( pharmacy_ph_idx , id , pwd,
            ph_name, ph_phone , 
            license_number, license_file,
            ph_info,
            reg_date , up_date
        ) 
            values
            ( ?, ?, ?,
            ?, ?,
            ?, ?,
            ?,
            now() , now()
            )`,
        [
            data.pharmacy_ph_idx, data.id, data.pw1,
            data.name , data.phone,
            data.license_number, data.license_file,
            data.ph_info
        ]
        );
        return result;
    },
    updatePharmacist: async(mb_no, data) => {
        var setStr = "set";
        var setTemp = "";
        var setArray = [];

        if(data.pwd !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " pwd = ? ";
            setArray.push(data.pwd);
        }
        if(data.name !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " ph_name = ? ";
            setArray.push(data.name);
        }
        if(data.ph_info !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " ph_info = ? ";
            setArray.push(data.ph_info);
        }
        if(data.phone !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " ph_phone = ? ";
            setArray.push(data.phone);
        }

        setArray.push(mb_no);
        setStr = setStr + setTemp;

        if(setStr == "set") return false;
        
        const result = await (await connection()).execute(
        ` update pharmacist `+setStr+` where ph_idx = ? `,
        setArray
        );
        return result;
    },
    confirmUser: async(id, pw) => {
        const [rows, fields] = await (await connection()).execute(
            `select * from pharmacist where id = ? and pwd = ?`,
            [id , pw]
        );
        return rows[0];
    },
    idConfirm: async(id) => {
        const [rows, fields] = await (await connection()).execute(
            `select count(*) as cnt from pharmacist where id = ?`,
            [id]
        );
        return rows[0].cnt;
    },
    phoneConfirm: async(id) => {
            const [rows, fields] = await (await connection()).execute(
            `select count(*) as cnt from pharmacist where ph_phone = ?`,
            [id]
            );
            return rows[0].cnt;
    },
    licenseConfirm: async(license_number) => {
        const [rows, fields] = await (await connection()).execute(
        `select count(*) as cnt from pharmacist where license_number = ?`,
        [license_number]
        );
        return rows[0].cnt;
    },


    confirmPharmacyBN: async(business_number) => {
        const [rows, fields] = await (await connection()).execute(
        `select * from pharmacy where business_number = ?`,
        [business_number]
        );
        return rows[0];
    },

    getPharmacyData: async(pharmacy_idx) => {
        const [rows, fields] = await (await connection()).execute(
        `select *  from pharmacy where phc_idx = ?`,
        [pharmacy_idx]
        );
        return rows[0];
    },
    insertPharmacy: async(PharmacyObj) => {
            const [result] = await (await connection()).execute(
            `insert into pharmacy
                (business_number , business_file,
                    pharmacy_name, contact_number,
                    address, address_detail, lat, lng,
                    reg_date, up_date)
                values(
                    ? , ? ,
                    ? , ? ,
                    ? , ? , ? , ? ,
                    now() , now()
                )`,
            [
                PharmacyObj.business_number , PharmacyObj.business_file,
                PharmacyObj.pharmacy_name , PharmacyObj.contact_number,
                PharmacyObj.address, PharmacyObj.address_detail, PharmacyObj.lat , PharmacyObj.lng
                 ]
            );
        return result;
    },
    updatePharmacy: async(phc_idx, data) => {
        var setStr = "set";
        var setTemp = "";
        var setArray = [];

        if(data.pharmacy_name !== undefined){
            setTemp = setTemp + ((setTemp!="")?",":"") + " pharmacy_name = ? ";
            setArray.push(data.pharmacy_name);
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
        
        setArray.push(phc_idx);
        setStr = setStr + setTemp;

        if(setStr == "set") return false;
        
        const result = await (await connection()).execute(
        ` update pharmacy `+setStr+` where phc_idx = ? `,
        setArray
        );
        return result;
    },


    // 인증코드 저장
    insertPhoneAuth: async(phone, code) => {
        const result = await (await connection()).execute(
            ` insert into  pharmacist_auth ( phone, code ) 
            values (?, ?)`,
            [phone, code]
            );
        return result;
    },
    // 인증완료된 인증코드 검색
    getPhoneAuth: async(phone) => {
        const [rows] = await (await connection()).execute(
            ` select idx, code, reg_date, auth, is_success from pharmacist_auth where phone = ? and auth = ? order by idx desc limit 1`,
            [phone, 'true']
        );
        return rows[0];
    },
    // 인증정보 확인
    getPhoneAuthCode: async(phone, code) => {
        const [rows] = await (await connection()).execute(
            ` select idx, code, reg_date, auth, is_success, date_add(reg_date, interval 5 MINUTE) as expiry_date from pharmacist_auth where phone = ? and code = ? order by idx desc limit 1`,
            [phone, code]
            );
        return rows[0];
    },
    // 인증완료처리
    updatePhoneAuth: async(idx) => {
        const result = await (await connection()).execute(
            ` update pharmacist_auth set auth = 'true' where idx = ? `,
            [idx]
            );
        return result;
    },
    updateAuthSuccess: async(idx) => {
        const result = await (await connection()).execute(
            ` update pharmacist_auth set is_success = 'true' where idx = ? `,
            [idx]
            );
        return result;
    },

    updateStatus: async(ph_idx , status) => {
        const result = await (await connection()).execute(
            ` update pharmacist set is_passed = ? where ph_idx = ? `,
            [status , ph_idx]
            );
        return result;
    },

    getPharmacistIdx: async(idx) => {
        const [rows] = await (await connection()).execute(
        ` select ph_idx ,
            pharmacy_ph_idx ,
            id ,
            ph_name as name,
            ph_status ,
            ph_phone as phone,
            license_number ,
            license_file ,
            ph_info ,
            is_passed ,
            reg_date ,
            up_date
            from pharmacist
            where ph_idx = ? `,
        [idx]
        );
        return rows[0];
    },
    getPharmacistData: async(idx) => {
        const [rows] = await (await connection()).execute(
        ` select 
            id ,
            ph_name as name,
            ph_status,
            ph_phone as phone,
            license_number,
            license_file,
            ph_info,
            temp2.*
            from
            (select * from pharmacist where ph_idx = ?) as temp1
            left join
            (select * from pharmacy) as temp2
            on temp1.pharmacy_ph_idx = temp2.phc_idx`,
        [idx]
        );
        return rows[0];
    },
    getPharmacistPharmacy: async(idx) => {
        const [rows] = await (await connection()).execute(
        ` select pharmacy_ph_idx from pharmacist where ph_idx = ? `,
        [idx]
        );
        return rows[0];
    },
    pharmacyFirstPharmacist: async(idx) => {
        const [rows] = await (await connection()).execute(
        ` select ph_idx from pharmacist where pharmacy_ph_idx = ? order by ph_idx asc limit 1 `,
        [idx]
        );
        return rows[0];
    },




    getPharmacistStatus: async(idx) => {
        const [rows] = await (await connection()).execute(
        ` select is_passed from pharmacist where ph_idx = ? `,
        [idx]
        );
        return rows[0];
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
};