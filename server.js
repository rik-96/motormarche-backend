const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const compression = require('compression');
const helmet = require('helmet');

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'rik',
    password: '"slashrockstillnow96"',
    database: 'smart-brain'
  }
});

const app = express();

app.use(helmet())
app.use(compression())
app.use(cors());
app.use(cors());
app.use(cors());
app.use(bodyParser.json());

app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
  .where('email', '=', req.body.email)
  .then(data => {
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if (isValid) {
      return db.select('*').from('users')
      .where('email', '=', req.body.email)
      .then(user => {
        res.json(user[0])
      })
      .catch(err => res.status(400).json('unable to get user'))
    } else {
      res.status(400).json('wrong credentials')
    }
  })
  .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
  const {name, email, password} = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
      .returning('*')
      .insert({
        email: loginEmail[0],
        name: name,
        joined: new Date()
      })
      .then(user => {
        res.json(user);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json('unable to register'))
})

app.listen(5055, () => {
  console.log("App is working!!");
})