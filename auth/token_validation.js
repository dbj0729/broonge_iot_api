//./auth/token_validation.js

const jwt = require("jsonwebtoken");

module.exports = {

  checkToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },
  refreshToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },

  doctorCheckToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.ACCESS_DOCTOR_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },
  doctorRefreshToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.REFRESH_DOCTOR_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },

  pharmacistCheckToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.ACCESS_PHARMACIST_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },
  pharmacistRefreshToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.REFRESH_PHARMACIST_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },

  adminCheckToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.ACCESS_ADMIN_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },
  adminRefreshToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.status(401).json ({
      status: 401,
      message: "Unauthorized"
    });

    jwt.verify(token, process.env.REFRESH_ADMIN_TOKEN_SECRET , (err , user) => {
        if(err) return res.status(403).json ({
          status: 403,
          message: "토큰이 만료되었습니다."
        });
        req.user = user;
        next();
    });
  },
};