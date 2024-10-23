const axios = require('axios');

// Função que faz a requisição para o endpoint
async function makeRequest() {
    try {
        const response = await axios.get('http://localhost:3000/api/dashboard');
        console.log('Resposta da API:', response.data);
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error);
    }
}

// Chama a função para fazer a requisição
makeRequest();