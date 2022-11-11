//index.js

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>practice</title>
</head>
<body>
  <h1>축하합니다!</h1>
  <h2>모뎀에서 올려준 정보가 등록되었습니다.</h2>
</body>
</html>
`;

global.returnError = function returnError(res , error , key = undefined){
  if(error == undefined) return false;
  else{
    if(error.status != undefined){
      if(key == undefined){
        return res.status(error.status).json ({
          status: error.status,
          message: error.message
        });
      }else{
        return res.status(error.status).json ({
          status: error.status,
          message: error.message,
          key : key
        });
      }
    }else{
      return res.status(500).json ({
        message: error.message
      });
    }
  }
}

app.use(cors());
const morgan = require('morgan');

require("dotenv").config();

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.text({defaultCharset: 'utf8'}))

// app.use("/uploads", express.static(__dirname + '/uploads'));

// const userRouter = require("./api/user/user_router");
// app.use("/api/user", userRouter);

// const diagRouter = require("./api/diagnosis/diag_router");
// app.use("/api/diag", diagRouter);

// const doctorRouter = require("./api/doctor/doctor_router");
// app.use("/api/doctor", doctorRouter);

// const pharmacistRouter = require("./api/pharmacist/pharmacist_router");
// app.use("/api/pharmacist", pharmacistRouter);
console.log("1")
// const adminRouter = require("./api/admin/admin_router");
const { connection } = require('./config/database');
// app.use("/api/admin", adminRouter);

// app.get('/', async (req, res) => {
  app.get('/:id', async (req, res) => {
  // const test = await (await connection()).execute(
  //   `insert into test (data) values('test!!!!')`
  // )
  const id = req.params.id
    console.log(req.params)
  
  
  const [rows, fields] = await (await connection()).execute(
    'select * from test WHERE id=?', [id]
  )
  res.json({rows})
})

app.post('/test', async (req, res) => {
  
  const body = req.body
  // console.log({body})
  
  var str_array = body.split(',');
  
  for(var i = 0; i < str_array.length; i++) {
     // Trim the excess whitespace.
     str_array[i] = str_array[i].replace(/^\s*/, "").replace(/\s*$/, "");
     // Add additional code here, such as:
  }

  const [test] = await (await connection()).execute(
    `insert into test (data_0, data_1, data_2, data_3, data_4, data_5, data_6, data_7, data_8, data_9)
    values(?,?,?,?,?,?,?,?,?,?)`,
    [str_array[0], str_array[1], str_array[2], str_array[3], str_array[4], str_array[5], str_array[6], str_array[7], str_array[8], str_array[9]]
  )
  
  const [rows, fields] = await (await connection()).execute(
    `select * from test ORDER BY id desc LIMIT 1`
  )

  res.json({rows})
})

app.listen(process.env.APP_PORT, () => {
  console.log(`service Process on PORT: ${process.env.APP_PORT}`);
});