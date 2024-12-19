require('dotenv').config();
const express = require('express');
const pool = require('./pgConf.js');
const db = require('./dbSQL.js'); 


const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());


const doccID = process.env.EMPRESA;
console.log(doccID);
app.get('/api/dashboard', async (req, res) => {  
  try {
    //As querys "response" são as querys que eu pego os dados do banco postgree que já tá instalado no cliente

    // Query dos produtos
    const response = await pool.query(`
      SELECT SUM("PRECOCUSTO") AS total_preco_custo, SUM("PRECOVENDA") AS total_preco_venda 
      FROM "C000025" 
      INNER JOIN "C000100" ON ("CODPRODUTO" = "CODIGO");
    `);

    // Query do caixa
    const responseCaixa = await pool.query(`
SELECT "CODIGO", "CODCAIXA", "CODOPERADOR", "DATA", "SAIDA", "ENTRADA", 
       "CODCONTA", "HISTORICO", 
       CASE 
           WHEN "MOVIMENTO" = 0 THEN 'IMPLANTAÇÃO DE SALDO'
           WHEN "MOVIMENTO" = 1 THEN 'LANCTO. ENTRADA'
           WHEN "MOVIMENTO" = 2 THEN 'LANCTO. SAÍDA'
           WHEN "MOVIMENTO" = 3 THEN 'VENDA DINHEIRO'
           WHEN "MOVIMENTO" = 4 THEN 'VENDA CREDIÁRIO'
           WHEN "MOVIMENTO" = 5 THEN 'VENDA CHEQUE À VISTA'
           WHEN "MOVIMENTO" = 6 THEN 'VENDA CHEQUE À PRAZO'
           WHEN "MOVIMENTO" = 7 THEN 'VENDA CARTÃO CRÉDITO'
           WHEN "MOVIMENTO" = 8 THEN 'VENDA CARTÃO DÉBITO'
           WHEN "MOVIMENTO" = 9 THEN 'RECEBTO. DINHEIRO'
           WHEN "MOVIMENTO" = 10 THEN 'RECEBTO. CHEQUE A.V.'
           WHEN "MOVIMENTO" = 11 THEN 'RECEBTO. CHEQUE A.P.'
           WHEN "MOVIMENTO" = 12 THEN 'RECEBTO. CARTÃO'
           WHEN "MOVIMENTO" = 13 THEN 'RECEBTO. JUROS'
           WHEN "MOVIMENTO" = 14 THEN 'DESCONTO NO RECEBTO'
           WHEN "MOVIMENTO" = 15 THEN 'RECEBTO. BOLETO'
           WHEN "MOVIMENTO" = 16 THEN 'OUTRAS ENTRADAS'
           WHEN "MOVIMENTO" = 17 THEN 'OUTRAS SAÍDAS'
           WHEN "MOVIMENTO" = 18 THEN 'O.S. DINHEIRO'
           WHEN "MOVIMENTO" = 19 THEN 'O.S. CREDIÁRIO'
           WHEN "MOVIMENTO" = 20 THEN 'O.S. CHEQUE À VISTA'
           WHEN "MOVIMENTO" = 21 THEN 'O.S. CARTÃO CRÉDITO'
           WHEN "MOVIMENTO" = 22 THEN 'O.S. PIX'
           WHEN "MOVIMENTO" = 23 THEN 'O.S. CARTÃO DÉBITO'
           WHEN "MOVIMENTO" = 25 THEN 'PAGTO - CAIXA'
           WHEN "MOVIMENTO" = 26 THEN 'PAGTO - BANCO'
           WHEN "MOVIMENTO" = 27 THEN 'PAGTO - CHEQUE TERC.'
           WHEN "MOVIMENTO" = 40 THEN 'VENDA TRANSFERÊNCIA'
           WHEN "MOVIMENTO" = 41 THEN 'TROCA/CRÉDITO'
           WHEN "MOVIMENTO" = 42 THEN 'PIX'
           ELSE 'OUTRO'
       END AS "TIPO_MOVIMENTO",
       "VALOR", "CODNFSAIDA", "CODIGO_VENDA", "HORA"
  FROM "C000044"
   WHERE "DATA" >= CURRENT_DATE - INTERVAL '1 months';
    `);

    // Query das vendas
    const responseVendas = await pool.query(`
SELECT "C000061"."CODIGO", "C000061"."NUMERO", "CFOP", "DATA", "CODCLIENTE", "VALOR_PRODUTOS", 
       "TOTAL_NOTA", "NOME",
       "DESCONTO", 
       "MODELO_NF", 
       CASE 
           WHEN "NFE_SITUACAO" = 3 THEN 'ORÇAMENTO'
           WHEN "NFE_SITUACAO" = 5 THEN 'CONTIGENCIA'
           WHEN "NFE_SITUACAO" = 6 THEN 'EMITIDA'
           WHEN "NFE_SITUACAO" = 8 THEN 'CANCELADA'
           ELSE 'OUTRO'
       END AS "DESCRICAO_SITUACAO"
  FROM "C000061"
  INNER JOIN "C000007" ON ("C000007"."CODIGO" = "CODCLIENTE")
 WHERE "DATA" >= CURRENT_DATE - INTERVAL '1 months';
    `);

    const responseComissoes = await pool.query(`
      SELECT "CODVENDEDOR", SUM("TOTAL_NOTA") AS "TOTAL_GERAL", "NOME"
      FROM (
          SELECT DISTINCT "C000061"."CODIGO", "C000061"."CODVENDEDOR", "C000061"."TOTAL_NOTA", "C000008"."NOME"
          FROM "C000061"
          LEFT JOIN "C000008" ON ("C000061"."CODVENDEDOR" = "C000008"."CODIGO")
          LEFT JOIN "C000044" ON "C000061"."CODIGO" = "CODIGO_VENDA"
          WHERE ("C000061"."SITUACAO" <> 2 OR "C000061"."SITUACAO" IS NULL)
            AND "MODELO_NF" = '65'
            AND "NUMERO_TROCA" IS NULL 
            AND "CODVENDEDOR" <> ''
            AND ("VALOR_RECEBIDO" <> 0 OR "VALOR_RECEBIDO" IS NULL) 
            AND "C000008"."NOME" <> ''  
            AND EXTRACT(MONTH FROM "C000061"."DATA") = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM "C000061"."DATA") = EXTRACT(YEAR FROM CURRENT_DATE)
      ) AS Subquery
      GROUP BY "CODVENDEDOR", "NOME"
      ORDER BY "TOTAL_GERAL" DESC;
    `);

    // Exclusão das tabelas para após isso recriá-las e atualizar os dados
    db.query(`DROP TABLE IF EXISTS dashboardProdutos${doccID};`, (err, results) => {
      if (err) throw err;
      console.log('Tabela dashboardProdutos excluída com sucesso!');
    });
    db.query(`DROP TABLE IF EXISTS dashboardCaixa${doccID};`, (err, results) => {
      if (err) throw err;
      console.log('Tabela dashboardCaixa excluída com sucesso!');
    });
    db.query(`DROP TABLE IF EXISTS dashboardVendas${doccID};`, (err, results) => {
      if (err) throw err;
      console.log('Tabela dashboardVendas excluída com sucesso!');
    })
    db.query(`DROP TABLE IF EXISTS dashboardComissoes${doccID};`, (err, results) => {
      if (err) throw err;
      console.log('Tabela dashboardComissoes excluída com sucesso!');
    })  


    // Criação das tabelas
    // db.query(`
    //   CREATE TABLE IF NOT EXISTS dashboardProdutos${doccID} (
    //   ID_PRECOS INT AUTO_INCREMENT PRIMARY KEY, 
    //   PRECO_CUSTO FLOAT, 
    //   PRECO_VENDA FLOAT,
    //   UNIQUE KEY (ID_PRECOS) -- Adicione uma chave única
    // );
    // `, (err, results) => {
    //   if (err) throw err;
    //   console.log('Tabela dashboardProdutos criada com sucesso!');
    // });

     "VALOR", "CODNFSAIDA", "CODIGO_VENDA", "HORA" 
    
    db.query(`
      CREATE TABLE IF NOT EXISTS dashboardCaixa${doccID} (
        ID_CAIXA INT AUTO_INCREMENT PRIMARY KEY,
        CODIGO VARCHAR(255),
        CODCAIXA INT,
        CODOPERADOR INT,
        CODCONTA INT,
        HISTORICO VARCHAR(255),
        TIPO_MOVIMENTO VARCHAR(255), 
        DATA DATETIME,
        SAIDA FLOAT, 
        ENTRADA FLOAT, 
        VALOR FLOAT,
        CODNFSAIDA INT,
        CODIGO_VENDA INT,
        HORA DATETIME,
        UNIQUE KEY (ID_CAIXA)
      );
      `, (err, results) => {
      if (err) throw err;
      console.log('Tabela dashboardCaixa criada com sucesso!');
    });


// "C000061"."CODIGO", "C000061"."NUMERO", "CFOP", "DATA", "CODCLIENTE", "VALOR_PRODUTOS", 
//        "TOTAL_NOTA", "NOME",
//        "DESCONTO", 
//        "MODELO_NF", 
//        CASE 
//            WHEN "NFE_SITUACAO" = 3 THEN 'ORÇAMENTO'
//            WHEN "NFE_SITUACAO" = 5 THEN 'CONTIGENCIA'
//            WHEN "NFE_SITUACAO" = 6 THEN 'EMITIDA'
//            WHEN "NFE_SITUACAO" = 8 THEN 'CANCELADA'
//            ELSE 'OUTRO'
//        END AS "DESCRICAO_SITUACAO"





    db.query(`
        CREATE TABLE IF NOT EXISTS dashboardVendas${doccID} (
        ID_VENDAS INT AUTO_INCREMENT PRIMARY KEY, 
        DATA DATETIME,
        VALOR_PRODUTOS FLOAT, 
        TOTAL_NOTA FLOAT,
        NOME VARCHAR(255),
        DESCONTO FLOAT,
        CODCLIENTE INT,
        MODELO_NF INT,
        DESCRICAO_SITUACAO VARCHAR(255),
        NUMERO VARCHAR(255),
        CFOP VARCHAR(255),
        UNIQUE KEY (ID_VENDAS) 
    )`, (err, results) => {
      if (err) throw err;
      console.log('Tabela dashboardVendas criada com sucesso!');
    });

    db.query(`
      CREATE TABLE IF NOT EXISTS dashboardComissoes${doccID} (
        ID_COMISSOES INT AUTO_INCREMENT PRIMARY KEY, 
        CODVENDEDOR INT,
        VALOR_TOTAL FLOAT,
        NOME VARCHAR(255),
        UNIQUE KEY (ID_COMISSOES)
      );
      `, (err, results) =>{
      if (err) throw err;
      console.log('Tabela dashboardComissoes criada com sucesso!');
    })

    // Inserir dados em dashboardProdutos
    // response.rows.forEach(row => {
    //   db.query(`
    //     INSERT INTO dashboardProdutos${doccID} (PRECO_CUSTO, PRECO_VENDA) 
    //     VALUES (?, ?) ON DUPLICATE KEY UPDATE 
    //     PRECO_CUSTO = VALUES(PRECO_CUSTO), 
    //     PRECO_VENDA = VALUES(PRECO_VENDA);`, [row.total_preco_custo, row.total_preco_venda], (err, results) => {
    //     if (err) throw err;
    //     console.log('Dados inseridos em dashboardProdutos:', results);
    //   });
    // });

    // Inserir dados em dashboardCaixa


    
    responseCaixa.rows.forEach(row => {
      //Aqui é onde é feito os inserts no banco da Hostinger o mySql
      // Ele pega o que vem do banco postgree e insere no banco da Hostinger
      db.query(`
        INSERT INTO dashboardCaixa${doccID} (DATA, SAIDA, ENTRADA, VALOR, CODIGO, CODCAIXA, CODOPERADOR, CODCONTA, TIPO_MOVIMENTO, HISTORICO) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
        SAIDA = VALUES(SAIDA), 
        ENTRADA = VALUES(ENTRADA), 
        VALOR = VALUES(VALOR),
        DATA = VALUES(DATA),
        HORA = VALUES(HORA),
        CODIGO = VALUES(CODIGO),
        CODCAIXA = VALUES(CODCAIXA),
        CODOPERADOR = VALUES(CODOPERADOR),
        CODCONTA = VALUES(CODCONTA),
        TIPO_MOVIMENTO = VALUES(TIPO_MOVIMENTO),
        HISTORICO = VALUES(HISTORICO)`, [row.DATA, row.SAIDA, row.ENTRADA, row.VALOR, row.CODIGO, row.CODCAIXA, row.CODOPERADOR, row.CODCONTA, row.TIPO_MOVIMENTO, row.HISTORICO], (err, results) => {
        if (err) throw err;
        console.log('Dados inseridos em dashboardCaixa:', results);
      });
    });
    // DATA DATETIME,
    // VALOR_PRODUTOS FLOAT, 
    // TOTAL_NOTA FLOAT,
    // NOME VARCHAR(255),
    // DESCONTO FLOAT,
    // CODCLIENTE INT,
    // MODELO_NF INT,
    // DESCRICAO_SITUACAO VARCHAR(255),
    // NUMERO VARCHAR(255),
    // CFOP VARCHAR(255)
    // Inserir dados em dashboardVendas
    responseVendas.rows.forEach(row => {
      db.query(`
        INSERT INTO dashboardVendas${doccID} (DATA ,VALOR_PRODUTOS, TOTAL_NOTA, NOME, DESCONTO, CODCLIENTE, MODELO_NF, DESCRICAO_SITUACAO, NUMERO, CFOP) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
        VALOR_PRODUTOS = VALUES(VALOR_PRODUTOS),
        TOTAL_NOTA = VALUES(TOTAL_NOTA),
        DATA = VALUES(DATA),
        NOME = VALUES(NOME),
        DESCONTO = VALUES(DESCONTO),
        CODCLIENTE = VALUES(CODCLIENTE),
        MODELO_NF = VALUES(MODELO_NF),
        DESCRICAO_SITUACAO = VALUES(DESCRICAO_SITUACAO),
        NUMERO = VALUES(NUMERO),
        CFOP = VALUES(CFOP)`, [row.DATA, row.VALOR_PRODUTOS, row.TOTAL_NOTA, row.NOME, row.DESCONTO, row.CODCLIENTE, row.MODELO_NF, row.DESCRICAO_SITUACAO, row.NUMERO, row.CFOP], (err, results) => {
        if (err) throw err;
        console.log('Dados inseridos em dashboardVendas:', results);
      });
    });

    responseComissoes.rows.forEach(row => {
      db.query(`
        INSERT INTO dashboardComissoes${doccID} (CODVENDEDOR, VALOR_TOTAL, NOME) 
        VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE
        VALOR_TOTAL = VALUES(VALOR_TOTAL),
        NOME = VALUES(NOME)`, [row.CODVENDEDOR, row.TOTAL_GERAL, row.NOME], (err, results) => {
        if (err) throw err;
        console.log('Dados inseridos em dashboardComissoes:', results);
      });
    });
    db.end();
    res.send('Dados inseridos com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).send('Ocorreu um erro.');
  }
});





app.listen(3000, () => {
  console.log('Server listening on port 3000');

  require('./request.js');
})