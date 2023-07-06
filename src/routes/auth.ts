import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { env } from '../env'
const secret = env.SECRET_KEY

const prisma = new PrismaClient()

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth', async (request, reply) => {
    try {
      const authUserBodySchema = z.object({
        TX_EML: z.string(),
        TX_PSW: z.string(),
      })

      const { TX_EML, TX_PSW } = authUserBodySchema.parse(request.body)

      const auth = await authenticateUser(TX_EML, TX_PSW)

      if (!auth) {
        return reply.status(401).send()
      }

      reply.cookie('dietSessonId', auth.token, {
        path: '/',
        maxAge: 1000 * 60 * 60, // 1h
      })

      return reply.status(200).send()
    } catch (error: any) {
      console.log(error.errors)
      reply.status(400).send({ msg: 'Login error, please try again' })
    }
  })
}

export async function authenticateUser(TX_EML: string, TX_PSW: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        TX_EML,
      },
    })

    if (!user) {
      return null
    }

    const passwordMatches = await bcrypt.compare(TX_PSW, user.TX_PSW)

    if (!passwordMatches) {
      return null
    }

    const token = jwt.sign(
      {
        userId: user.CD_USR,
        userName: user.NM_USR,
      },
      secret,
      {
        expiresIn: '1h',
      },
    )

    return {
      token,
    }
  } catch (error) {
    console.log(error)
  } finally {
    prisma.$disconnect()
  }
}
