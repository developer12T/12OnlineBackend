const mssql = require('mssql');

// โหลดค่าเชื่อมต่อฐานข้อมูลจากไฟล์ .env
const config = {
  server: process.env.server,
  database: process.env.databaseauth,
  user: process.env.user,
  password: process.env.password,
  options: {
    encrypt: process.env.encrypt === 'true', 
    trustServerCertificate: process.env.trustServerCertificate === 'true',
  },
};
  

// เมื่อต้องการเชื่อมต่อกับฐานข้อมูล
exports.connect = async () => {
  try {
    await mssql.connect(config);
    console.log('Connected to MSSQL database!');
  } catch (error) {
    console.error('Error connecting to MSSQL database:', error);
  }
};
