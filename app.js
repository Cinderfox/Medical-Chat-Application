const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');


const connection = mysql.createConnection({
  host: 'sql12.freemysqlhosting.net',
  user: 'sql12665172',
  password: 'QWLH5XHPB6',
  database: 'sql12665172'
});



app.use(cors());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/Credentials', (req, res) => {
  connection.query('SELECT Username, Password, Type, Doctor_id, Patient_id FROM UserDetails', (error, results, fields) => {
    if (error) throw error;

    const data = JSON.stringify(results);
    // const data = JSON.stringify("results");
    console.log(data);
    res.json(results);
  });
});

app.get('/consultation', (req, res) => {
  connection.query('SELECT c.Doctor_id, c.Patient_id, p.Name FROM consultation c, patient p WHERE p.Patient_id = c.Patient_id', (error1, results1, fields1) => {
    if (error1) throw error1;

    connection.query('SELECT c.Doctor_id, c.Patient_id, d.Name FROM consultation c, doctor d WHERE d.Doctor_id = c.Doctor_id', (error2, results2, fields2) => {
      if (error2) throw error2;

      const responseData = { consultationData: results1, patientData: results2 };
      console.log(responseData);
      res.json(responseData);
    });
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});