const { appendFile } = require('fs');
var net = require('net');
const readlinePromises = require('node:readline');
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});

require("dotenv").config();

const IOT_PORT = process.env.IOT_PORT || '9090';

// IoT 에서 받는 Header byte size
let size_1 = 4;     // Sig.
let size_2 = 4;     // Group
let size_3 = 1;     // OP Code
let size_4 = 10;    // ID
let size_5 = 5;     // Version
let size_6 = 2;     // MSG Length
let size_7 = 2;     // Function_1
let size_8 = 2;     // Function_2
let size_9 = 2;     // Function_3
let size_10 = 23;   // Function_4
let size_11 = 4;    // Checksum

// Slice 로 진행하기에 그에 따른 글자 수에 따라 다음 단계를 불러오는 방식
let sig_1 = size_1;
let sig_2 = sig_1+size_2;
let sig_3 = sig_2+size_3;
let sig_4 = sig_3+size_4;
let sig_5 = sig_4+size_5;
let sig_6 = sig_5+size_6;
let sig_7 = sig_6+size_7;
let sig_8 = sig_7+size_8;
let sig_9 = sig_8+size_9;
let sig_10 = sig_9+size_10;
let sig_11 = sig_10+size_11;



// App 에서 IoT 로 정보를 보내기 위한 기본 변수들이다.
var sig_for_app = '1934';
var group_for_app = 'BR01';
var op_code_for_app = '3'; // 3번이 보내는 경우이다.
var bike_id_for_app = '1241212319'; // 이 ID 가 앱에서 눌렀을 때 전달 받는 ID 이다.
var version_for_app = 'V0.31';
var message_length_for_app = '35';
var send_default_data_preparation = sig_for_app + group_for_app + op_code_for_app + bike_id_for_app + version_for_app + message_length_for_app;


// 서버 생성
var server = net.createServer(function(socket){
	console.log(socket.address().address + "Connected to Broonge IoT Server");
	

//        app.use ~~(/:id)
// 이 부분은 app 에서 받는 부분이다.

        // IoT 에 잠금해제 보내는 예제
        const send_code = "01";
        const send_codes = send_default_data_preparation + send_code;

        // function 으로 만들기?
        const combined_send_codes = send_codes.split("");
        const send_codes_value = combined_send_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr);
        const send_codes_value_verification = send_codes_value.toString(16);
        // function 으로 만들기 끝?

        const send_codes_manually_added_0x = "0"+send_codes_value_verification;
        const final_send_codes = send_codes+send_codes_manually_added_0x;
        socket.write(final_send_codes);











	// client로 부터 오는 data를 화면에 출력
	socket.on('data', function(data){
		console.log('Received Data: ' + data);



        

        const data_elements = data;
        const sig = data_elements.slice(0,sig_1);
        const group = data_elements.slice(sig_1,sig_2);
        const op_code = data_elements.slice(sig_2,sig_3);
        const bike_id_from_iot = data_elements.slice(sig_3,sig_4);
        const version = data_elements.slice(sig_4,sig_5);
        const message_length = data_elements.slice(sig_5,sig_6);
        console.log(sig + '\r');
        console.log(group + '\r');
        console.log(op_code +'\r');
        console.log(bike_id_from_iot +'\r');
        console.log(version +'\r');
        console.log(message_length +'\r');

        const f_1_battery = data_elements.slice(sig_6,sig_7);
        const f_2_device_status = data_elements.slice(sig_7,sig_8);
        const f_3_err_info = data_elements.slice(sig_8,sig_9);
        const f_4_gps = data_elements.slice(sig_9,sig_10);
        console.log(f_1_battery + '\r');
        console.log(f_2_device_status + '\r');
        console.log(f_3_err_info +'\r');
        console.log(f_4_gps +'\r');

        const checksum = data_elements.slice(sig_10,sig_11);
        console.log(checksum +'\r');

        // 변경되는 값; 이 부분을 저장해야 한다.
        let manual_codes = f_1_battery+f_2_device_status+f_3_err_info+f_4_gps;

        if(manual_codes.length !== 0){
            const combined_manual_codes = manual_codes.split(""); // data 에서 온 raw 값을 글자 단위로 쪼갠 결과
            const manual_codes_value = combined_manual_codes.map(item => item.charCodeAt()).reduce((acc, curr) => acc + curr) // 쪼갠 결과를 하나씩 분배
            console.log({manual_codes_value});
            console.log(manual_codes_value.toString(16));
            console.log("here is the checksum:"+ checksum);
        
            // IoT 에서 보낸 값이 누락없이 잘 왔는지 모든 글자의 ASCII 코드 값을 다 더한 후 16진수로 변환해서
            // IoT 보냈던 Checksum 값과 동일한지를 확인하고 동일해야지만 서버에 저장된다.
            // 만약, Checksum 이 다른 경우에는 데이터를 버려버린다. IoT 에 Return 할 필요는 없다.
            // 단, 만약, 20회 이상 Checksum 오류가 나는 경우에는 관리자에게 안내를 해 줘야 한다.
            // 상기 안내를 위해서 별도의 안내 방법이 필요할 수도 있다.
            manual_codes_value_verification = manual_codes_value.toString(16); // 분배된 값을 16진수로 변경
            
            manually_added_0x = "0"+manual_codes_value_verification; // 마지막 checksum 에 0이 빠져서 0을 넣음
            console.log(manually_added_0x);

            if (checksum == manually_added_0x){
                try {
                    console.log("GOOD");
                    socket.write(`It's working!`); // 정상등록된 경우에는 IoT 에 뭔가를 전달할 필요는 없다.
                    // 이 부분부터 DB 에 저장하는 로직을 만든다.
                } catch (error) {
                    console.error(error);
                    
                }   
            }
            else{
                try {
                    console.log("Bad");
                    socket.write(`It's not working!`); // 상기 횟수에 따라 오류가 발생할 경우, 관리자 Alert 를 띄워야 한다.
                } catch (error) {
                    console.error(error);

                }   
            }
        }else{
            console.log("empty");
            console.log(manual_codes)
        }

        

	});
	// client와 접속이 끊기는 메시지 출력
	socket.on('close', function(){
		console.log('Client has left the IoT Server.');
	});
	// client가 접속하면 화면에 출력해주는 메시지
	socket.write('Welcome to the IoT Server');



    
    
});

// 에러가 발생할 경우 화면에 에러메시지 출력
server.on('error', function(err){
	console.log('err'+ err);
});

// .env 의 포트값으로 진행되던가 아니면 9090 으로 진행되던가 해서 접속이 가능하도록 대기
server.listen(IOT_PORT, function(){
	console.log(`Listening for requests on port ${IOT_PORT}`);
});

/*
3자리이면 앞에 0 한개 붙이시고,,,,,2자리 나오면 앞에 0 2개 이렇게

checksum length 를 count 하고,
실제 계산된 값의 length 를 구한다음,
그 length 에 있어서 자리수가 부족한 경우에는 0으로 매꾼다???
*/