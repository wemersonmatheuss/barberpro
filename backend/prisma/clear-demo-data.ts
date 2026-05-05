import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$transaction([
    prisma.appointment.deleteMany({}),
    prisma.blockedSlot.deleteMany({}),
    prisma.professionalService.deleteMany({}),
    prisma.professional.deleteMany({}),
    prisma.service.deleteMany({}),
    prisma.user.deleteMany({ where: { role: { not: Role.ADMIN } } }),
  ])

  console.log('Dados de demonstração removidos. Apenas usuários ADMIN foram mantidos.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
