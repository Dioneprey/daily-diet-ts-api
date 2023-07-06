import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const prisma = new PrismaClient()

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    try {
      const createUserBodySchema = z.object({
        NM_USR: z.string().nonempty(),
        TX_EML: z.string().nonempty(),
        TX_PSW: z.string().nonempty(),
      })

      const { NM_USR, TX_EML, TX_PSW } = createUserBodySchema.parse(
        request.body,
      )

      const saltRounds = 10
      const hashedPass = bcrypt.hashSync(TX_PSW, saltRounds)

      const emailUsed = await prisma.user.findUnique({
        where: {
          TX_EML,
        },
      })

      if (emailUsed)
        return reply.status(400).send({ msg: 'Email already in use' })

      await prisma.user.create({
        data: {
          NM_USR,
          TX_EML,
          TX_PSW: hashedPass,
        },
      })

      reply.status(201)
    } catch (error) {
      console.log(error)
      reply.status(400)
    }
  })
}
