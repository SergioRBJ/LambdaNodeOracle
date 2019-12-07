const oracledb = require('oracledb');
const os = require('os');
const fs = require('fs');
const dbConfig = require('./config.json');

// muda HOSALIASES do EC2
const str_host = `${os.hostname()} localhost\n`;
fs.appendFile(process.env.HOSTALIASES, str_host, function(err) {
  if (err) throw err;
});

module.exports.handle = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // resgatar parâmetros da requisição
  const body = JSON.parse(event.body);

  let statusCode;
  let bodyMessage;

  try {
    // criando pool de conexao
    await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.pass,
      connectString: dbConfig.connectionstring,
      poolTimeout: 60,
      queueTimeout: 60000,
    });

    console.log('Connection pool started');

    // iniciando conexão com o banco
    const connection = await oracledb.getConnection();
    const sql = ``; // qualquer select padrão :)
    const binds = [];
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const result = await connection.execute(sql, binds, options);

    // verifica se a consulta retornou algo
    let paramsConsulta;
    if (result.rows && result.rows.length) {
      paramsConsulta = result.rows;
    }

    // fecha a conexão
    await connection.close();

    // prepara retorno
    statusCode = 200;
    bodyMessage = {
      cliente: paramsConsulta,
    };
  } catch (err) {
    console.error(`error: ${err.message}`);

    statusCode = 500;
    bodyMessage = {
      message: 'Internal Server Error!',
    };
  } finally {
    // fecha o pool de conexão
    await closePoolAndExit();

    const response = {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(bodyMessage),
    };
    context.succeed(response);
  }
};

async function closePoolAndExit() {
  console.log('\nTerminating');
  try {
    await oracledb.getPool().close(0);
    console.log('Pool closed');
  } catch (err) {
    console.error(err.message);
  }
}
