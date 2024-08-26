const express = require('express')
const path = require('path')
const app = express()
app.use(express.json())
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')

const db_path = path.join(__dirname, 'userData.db')

let db = null

const initializeDb = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}

initializeDb()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPw = await bcrypt.hash(password, 13)
  const existQuery = `
    SELECT * 
    FROM user 
    WHERE username = "${username}";
  `
  const primaryQueryResult = await db.get(existQuery)
  if (primaryQueryResult === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const newQuery = `
       INSERT INTO user(username, name, password, gender, location)
       VALUES("${username}","${name}","${hashedPw}","${gender}","${location}");
      `
      await db.run(newQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const existQuery = `
    SELECT * 
    FROM user 
    WHERE username = "${username}";
  `
  const primaryQueryResult = await db.get(existQuery)
  if (!primaryQueryResult) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const passwordComparision = await bcrypt.compare(
      password,
      primaryQueryResult.password,
    )

    if (passwordComparision) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedPw = await bcrypt.hash(newPassword, 13)
  const existQuery = `
    SELECT * 
    FROM user 
    WHERE username = "${username}";
  `
  const primaryQueryResult = await db.get(existQuery)
  const passwordComparision = await bcrypt.compare(
    oldPassword,
    primaryQueryResult.password,
  )
  if (!passwordComparision) {
    response.status(400)
    response.send('Invalid current password')
  } else if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    const newQuery = `
    UPDATE user 
    SET password = "${hashedPw}"
    WHERE username = "${username}";
  `
    await db.run(newQuery)
    response.status(200)
    response.send('Password updated')
  }
})

module.exports = app
