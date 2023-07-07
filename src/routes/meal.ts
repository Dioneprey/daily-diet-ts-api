import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authMiddleware } from '../middlewares/auth-middlewares'
import { decode } from 'jsonwebtoken'
import { UserToken } from '../interfaces/user-token.interface'

const prisma = new PrismaClient()

export async function mealRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const token = request.cookies.dietSessonId

      // @ts-expect-error Token always exist
      const userObject: UserToken = decode(token)
      const userId = userObject.userId

      const meals = await prisma.meal.findMany({
        where: {
          CD_USU: userId,
        },
      })

      reply.status(200).send({ meals })
    } catch (error) {}
  })

  app.get(
    '/:id',
    { preHandler: authMiddleware },
    async (request: any, reply) => {
      try {
        const mealId = request.params.id
        const token = request.cookies.dietSessonId

        // @ts-expect-error Token always exist
        const userObject: UserToken = decode(token)
        const userId = userObject.userId

        const meal = await prisma.meal.findMany({
          where: {
            CD_USU: userId,
            CD_MEA: mealId,
          },
        })

        reply.status(200).send({ meal })
      } catch (error) {}
    },
  )

  app.post('/', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const token = request.cookies.dietSessonId

      // @ts-expect-error Token always exist
      const userObject: UserToken = decode(token)
      const userId = userObject.userId
      const createUserBodySchema = z.object({
        NM_MEA: z.string(),
        TX_DSC: z.string(),
        TF_DIE: z.enum(['T', 'F']).default('F'), // T = True | F = False
      })

      const { NM_MEA, TX_DSC, TF_DIE } = createUserBodySchema.parse(
        request.body,
      )

      await prisma.meal.create({
        data: {
          CD_USU: userId,
          NM_MEA,
          TX_DSC,
          TF_DIE,
        },
      })

      reply.status(201).send({})
    } catch (error) {
      console.log(error)
      reply.status(500).send({})
    }
  })

  app.patch(
    '/:id',
    { preHandler: authMiddleware },
    async (request: any, reply) => {
      try {
        const mealId = request.params.id
        const token = request.cookies.dietSessonId
        // @ts-expect-error Token always exist
        const userObject: UserToken = decode(token)
        const userId = userObject.userId

        const createUserBodySchema = z.object({
          NM_MEA: z.string(),
          TX_DSC: z.string(),
          TF_DIE: z.enum(['T', 'F']).default('F'), // T = True | F = False
        })
        const { NM_MEA, TX_DSC, TF_DIE } = createUserBodySchema.parse(
          request.body,
        )
        await prisma.meal.updateMany({
          where: {
            CD_MEA: mealId,
            CD_USU: userId,
          },
          data: {
            NM_MEA,
            TX_DSC,
            TF_DIE,
            DH_CAD: new Date(),
          },
        })
        reply.status(201).send({})
      } catch (error) {
        console.log(error)
        reply.status(500).send({})
      }
    },
  )

  app.delete(
    '/:id',
    { preHandler: authMiddleware },
    async (request: any, reply) => {
      try {
        const mealId = request.params.id
        const token = request.cookies.dietSessonId

        // @ts-expect-error Token always exist
        const userObject: UserToken = decode(token)
        const userId = userObject.userId

        await prisma.meal.deleteMany({
          where: {
            CD_USU: userId,
            CD_MEA: mealId,
          },
        })

        reply.status(200).send({})
      } catch (error) {
        console.log(error)
        reply.status(500).send({})
      }
    },
  )

  app.get('/metric', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const token = request.cookies.dietSessonId

      // @ts-expect-error Token always exist
      const userObject: UserToken = decode(token)
      const userId = userObject.userId

      const meals = await prisma.meal.findMany({
        where: {
          CD_USU: userId,
        },
      })
      const totalMeals = meals.length

      const mealsInsideDiet = meals.filter((meal) => {
        return meal.TF_DIE === 'T'
      })

      const mealsOffDiet = meals.filter((meal) => {
        return meal.TF_DIE === 'F'
      })

      let maxSequence = 0
      let currentSequence = 0

      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i]

        if (meal.TF_DIE === 'T') {
          currentSequence += 1

          if (currentSequence > maxSequence) {
            maxSequence = currentSequence
          }
        } else {
          currentSequence = 0
        }
      }

      return {
        TOTAL: totalMeals,
        INSIDE_DIET: mealsInsideDiet.length,
        OFF_DIET: mealsOffDiet.length,
        INSIDE_DIET_SEQUENCE: maxSequence,
      }
    } catch (error) {
      console.log(error)
      reply.status(500).send({})
    }
  })
}
