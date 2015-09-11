import express from 'express'
import {resource, route} from './src/resource-router-middleware'

const users = [{id:'foo', test: 'test'}]

@resource('user')
export default class UserResource {
  load(req, id, callback) {
    var user = users.find( user => user.id===id ),
    err = user ? null : 'Not found'
    callback(err, user)
  }

  list({ params }, res) {
    res.json(users)
  }

  create({ body }, res) {
    body.id = users.length.toString(36)
    users.push(body)
    res.json(body)
  }

  read({ user }, res) {
    res.json(user)
  }

  update({ user, body }, res) {
    for (let key in body) {
      if (key!=='id') {
        user[key] = body[key]
      }
    }
    res.status(204).send()
  }

  // Custom route
  @route.patch('/:user/:foo')
  updateFoo({user, params}, res) {
    user.foo = params.foo
    res.status(204).send()
  }

  delete({ user }, res) {
    users.splice(users.indexOf(user), 1)
    res.status(204).send()
  }
}

const app = express()
app.get('/', function(req, res) {
  res.send('test')
})

app.listen(4000)
app.use('/user', UserResource)
