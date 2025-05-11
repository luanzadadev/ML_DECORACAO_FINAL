const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');


require('dotenv').config();
const db = require('./db/conection');

const app = express();
const port = process.env.PORT || 3000;

// Verifica a conexão com o banco de dados antes de iniciar o servidor
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    return;
  }
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
  
  // Permitir uso de arquivos estáticos como CSS, imagens, JS
  app.use(express.static(path.join(__dirname, 'public')));

  // Middleware para receber dados de formulários
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Rota para a raiz do site
  app.get('/', (req, res) => {
    res.redirect('/login'); // Redireciona para a página de login
  });

  // Rota de Login
  app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  db.query('SELECT * FROM usuario WHERE email = ?', [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro interno no servidor' });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    bcrypt.compare(senha, result[0].senha, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao verificar a senha' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: 'Senha incorreta' });
      }

      // Simples resposta sem token
      return res.json({
        message: 'Login bem-sucedido',
        usuario: {
          id: result[0].id_usuario,
          nome: result[0].nome,
          email: result[0].email
        }
      });
    });
  });
});


  // Rota de Cadastro
  app.post('/cadastro', (req, res) => {
    const { nome, email, senha, cpf_cnpj, telefone, cidade, bairro, rua, numero_da_casa, cep } = req.body;

    // Verifica se o email já existe
    db.query('SELECT * FROM usuario WHERE email = ?', [email], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro interno no servidor' });
      }

      if (result.length > 0) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }

      // Criptografa a senha
      bcrypt.hash(senha, 10, (err, hashedPassword) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Erro ao criptografar a senha' });
        }

        // Insere o novo usuário no banco de dados
        const dataCadastro = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const query = 'INSERT INTO usuario (nome, email, senha, cpf_cnpj, telefone, cidade, bairro, rua, numero_da_casa, cep, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        db.query(query, [nome, email, hashedPassword, cpf_cnpj, telefone, cidade, bairro, rua, numero_da_casa, cep, dataCadastro], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
          }

          return res.json({ message: 'Cadastro bem-sucedido' });
        });
      });
    });
  });

  // Rota para Troca de Senha
  app.post('/troca-de-senha', (req, res) => {
    const { cpf_cnpj, senha_nova } = req.body;

    // Criptografa a nova senha
    bcrypt.hash(senha_nova, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao criptografar a senha' });
      }

      // Atualiza a senha no banco de dados
      db.query('UPDATE usuario SET senha = ? WHERE cpf_cnpj = ?', [hashedPassword, cpf_cnpj], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Erro ao atualizar a senha' });
        }

        if (result.affectedRows === 0) {
          return res.status(400).json({ message: 'CPF/CNPJ não encontrado' });
        }

        return res.json({ message: 'Senha alterada com sucesso' });
      });
    });
  });

  // Rota para as páginas estáticas
  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
  });

  app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cadastro.html'));
  });

  app.get('/troca-de-senha', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'troca_senha.html'));
  });

  // Iniciar o servidor somente após a conexão ser bem-sucedida
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
});
