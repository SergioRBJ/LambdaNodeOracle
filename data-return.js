'use strict';

const oracledb = require('oracledb');
const dbConfig = require('./config.json');
const os = require('os');
const fs = require('fs');

// mudar HOSALIASES do EC2 -- configurar váriavel de ambiente no Lambda
let str_host = os.hostname() + ' localhost\n';
fs.appendFile(process.env.HOSTALIASES,str_host , function(err){
	if(err) throw err;	
});

module.exports.handle = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // instanciar parâmetros do request
	let body = JSON.parse(event.body);
    let idUsuario = body.USERID;
    let idCompra = body.ID_COMPRA;

    let statusCode;
    let bodyMessage;

    try {

        //criando pool de conexao
        await oracledb.createPool({
          user: dbConfig.user,
          password: dbConfig.pass,
          connectString: dbConfig.connectionstring,
          poolTimeout: 60,
          queueTimeout: 60000,
    
        });

        console.log('Connection pool started');

        //iniciando conexão com o banco
        let connection;
        try {
            connection = await oracledb.getConnection();
            let sql = ``; // qualquer select padrão :)
            let binds = [];
            let options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
            let result = await connection.execute(sql, binds, options);

            //verifica se a consulta retornou algo
            let paramsConsulta;
            if(result.rows && result.rows.length){
                paramsConsulta = result.rows;
            }

            //fecha a conexão
            await connection.close();

            try {
                statusCode = 200;
                bodyMessage = {
                  cliente : paramsConsulta
                };
                } catch (err) {
                  console.error('error: ' + err.message);
                  statusCode = 404;
                  bodyMessage = {
                    message : 'Cliente não existe!'
                  };
                }
            } catch (err) {
                console.error('error: ' + err.message);
                statusCode = 502;
                bodyMessage = {
                    message : 'Erro ao conectar com o banco de dados!'
                };
            }
        } catch (err) {
            console.error('error: ' + err.message);
            statusCode = 502;
            bodyMessage = {
              message : 'Erro ao iniciar o pool de conexão!'
            };     
        } finally {

            // fecha o pool de conexão
            await closePoolAndExit();

            response = {
                statusCode,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(
                  bodyMessage
                ),
            };
              context.succeed(response);
        }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
  
      await oracledb.getPool().close(0);
      console.log('Pool closed');
    } catch(err) {
      console.error(err.message);
    }
}