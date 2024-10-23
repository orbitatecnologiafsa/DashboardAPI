const mysql = require('mysql2');

// Crie a conexão com os dados da Hostinger
const connection = mysql.createConnection({
  host: '193.203.175.133', // substitua pelo seu host
  user: 'u585686210_root',         // substitua pelo nome de usuário
  password: 'Vagalume@2024',       // substitua pela sua senha
  database: 'u585686210_DashboardDB' // substitua pelo nome do banco de dados
});

module.exports = connection;

// // Conectando ao banco
// connection.connect((err) => {
//   if (err) {
//     console.error('Erro ao conectar ao banco de dados: ', err);
//     return;
//   }
//   console.log('Conectado ao banco de dados MySQL!');
// });

// // Exemplo de query
// connection.query('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))', (err, results) => {
//   if (err) {
//     console.error('Erro na query: ', err);
//     return;
//   }
//   console.log('Resultados: ', results);
// });

// // Fechando a conexão quando não for mais necessário
// connection.end();
