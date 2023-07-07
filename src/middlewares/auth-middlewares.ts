import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../env'
const secret = env.SECRET_KEY

export const authMiddleware = (
  request: FastifyRequest,
  reply: FastifyReply,
  next: any,
) => {
  try {
    const token = request.cookies.dietSessonId

    if (!token) {
      return reply.status(401).send()
    }

    const decoded = jwt.verify(token, secret)

    if (!decoded) {
      return reply.status(401).send()
    }

    next()
  } catch (error) {
    console.log(error)
    reply.status(401).send({ msg: 'Invalid Token!' })
  }
}
