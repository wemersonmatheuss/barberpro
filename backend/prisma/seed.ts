import { PrismaClient, Role, AuthProvider } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('dev123456', 10)

  const adminCpf = '98765432100'
  await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {
      cpf: adminCpf,
      role: Role.ADMIN,
      provider: AuthProvider.LOCAL,
      name: 'Admin',
      lastName: 'BarberPro',
      passwordHash: password,
      isActive: true,
    },
    create: {
      name: 'Admin',
      lastName: 'BarberPro',
      email: 'admin@demo.local',
      passwordHash: password,
      cpf: adminCpf,
      role: Role.ADMIN,
      provider: AuthProvider.LOCAL,
      phone: null,
    },
  })
  console.log('Seed ok. Ambiente limpo (sem dados de demonstração).')
  console.log('ADMIN: admin@demo.local / dev123456')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
