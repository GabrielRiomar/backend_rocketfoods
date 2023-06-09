const knex = require('../database/knex')
const { hash, compare } = require('bcryptjs')
const AppError = require('../utils/AppError')

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body

    // Check if user email already exists in the database
    const checkUserExists = await knex('users').where('email', email).first()

    if (checkUserExists) {
      throw new AppError('E-mail already in use.', 401)
    }

    //Check if password meets the minimum length requirement
    if (password.length < 6) {
      throw new AppError('Password should have a minimum of 6 characters.', 400)
    }

    const hashedPassword = await hash(password, 8)

    await knex('users').insert({
      name: name,
      email: email,
      password: hashedPassword
    })

    return response.status(201).json()
  }

  async update(request, response) {
    const { name, email, password, old_password } = request.body
    const user_id = request.user.id

    const database = await sqliteConnection()
    const user = await knex('users').where('id', user_id).first()

    if (!user) {
      throw new AppError('User not found.', 401)
    }

    const userWithUpdatedEmail = await knex('users')
      .where('email', email)
      .first()

    if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
      throw new AppError('E-mail already on use.', 401)
    }

    user.name = name ?? user.name
    user.email = email ?? user.email

    if (password && !old_password) {
      throw new AppError('Please, inform your Old Password')
    }

    if (password && old_password) {
      const checkOldPassword = await compare(old_password, user.password)

      if (!checkOldPassword) {
        throw new AppError('Password does not match', 401)
      }

      user.password = await hash(password, 8)
    }

    await knex('users')
      .where('id', user_id)
      .update({
        name: user.name,
        email: user.email,
        password: user.password,
        updated_at: knex.raw("DATETIME('NOW')")
      })
    return response.status(200).json()
  }
}

module.exports = UsersController
