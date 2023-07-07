import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { usersRoutes } from './routes/users'
import { authRoutes } from './routes/auth'
import { authMiddleware } from './middlewares/auth-middlewares'
import { mealRoutes } from './routes/meal'

export const app = fastify()

app.register(cookie)
app.register(authRoutes)
app.register(usersRoutes, {
  prefix: 'users',
})
app.register(mealRoutes, {
  prefix: 'meal',
})

app.get('/', { preHandler: authMiddleware }, (request, reply) => {
  return reply.status(200).send()
})
