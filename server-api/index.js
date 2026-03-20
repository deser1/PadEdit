const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const sql = require('mssql');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.post('/api/query', async (req, res) => {
  const { type, host, port, user, password, database, query } = req.body;

  if (!type || !host || !user || !password || !query) {
    return res.status(400).json({ error: 'Brak wymaganych parametrów logowania lub zapytania.' });
  }

  try {
    let results = [];

    if (type === 'mysql') {
      const connection = await mysql.createConnection({
        host,
        port: port || 3306,
        user,
        password,
        database: database || undefined
      });
      const [rows] = await connection.execute(query);
      results = rows;
      await connection.end();

    } else if (type === 'mssql') {
      const config = {
        user,
        password,
        server: host,
        port: parseInt(port) || 1433,
        database: database || undefined,
        options: {
          encrypt: false,
          trustServerCertificate: true
        }
      };
      await sql.connect(config);
      const result = await sql.query(query);
      results = result.recordset;
      await sql.close();

    } else if (type === 'oracle') {
      const connectString = `${host}:${port || 1521}${database ? '/' + database : ''}`;
      const connection = await oracledb.getConnection({
        user,
        password,
        connectString
      });
      const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      results = result.rows;
      await connection.close();

    } else {
      return res.status(400).json({ error: 'Nieobsługiwany typ bazy danych.' });
    }

    res.json({ success: true, data: results });

  } catch (error) {
    console.error(`Błąd zapytania (${type}):`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/test-connection', async (req, res) => {
  const { type, host, port, user, password, database } = req.body;

  try {
    if (type === 'mysql') {
      const connection = await mysql.createConnection({
        host, port: port || 3306, user, password, database: database || undefined
      });
      await connection.ping();
      await connection.end();
    } else if (type === 'mssql') {
      const config = {
        user, password, server: host, port: parseInt(port) || 1433, database: database || undefined,
        options: { encrypt: false, trustServerCertificate: true }
      };
      await sql.connect(config);
      await sql.close();
    } else if (type === 'oracle') {
      const connectString = `${host}:${port || 1521}${database ? '/' + database : ''}`;
      const connection = await oracledb.getConnection({ user, password, connectString });
      await connection.close();
    }
    res.json({ success: true, message: 'Połączono pomyślnie' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer DB Proxy uruchomiony na porcie ${PORT}`);
});
