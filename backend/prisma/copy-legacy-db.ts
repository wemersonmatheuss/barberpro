/**
 * Copia dados do banco legado (ex.: barbershop) para o DATABASE_URL atual (ex.: barberpro).
 *
 * Requer: mesmo schema nos dois (migrations já aplicadas no destino).
 * Uso na pasta backend:
 *   FORCE_CLEAR=1 npx ts-node --transpile-only prisma/copy-legacy-db.ts
 * Ou no PowerShell:
 *   $env:FORCE_CLEAR='1'; npx ts-node --transpile-only prisma/copy-legacy-db.ts
 *
 * Origem padrão: troca o nome do banco no final da URL por "barbershop".
 * Ou defina SOURCE_DATABASE_URL no .env.
 */
import 'dotenv/config'

import { Prisma, PrismaClient } from '@prisma/client'

function deriveSourceDatabaseUrl(targetUrl: string): string {
  const fromEnv = process.env.SOURCE_DATABASE_URL?.trim()
  if (fromEnv) return fromEnv
  // postgresql://user:pass@host:5432/barberpro  -> .../barbershop
  const m = targetUrl.match(/^(.*:\d+\/)([^/?]+)(\?.*)?$/)
  if (!m) {
    throw new Error('DATABASE_URL não reconhecido; defina SOURCE_DATABASE_URL explicitamente.')
  }
  return `${m[1]}barbershop${m[3] ?? ''}`
}

async function clearTarget(tx: Prisma.TransactionClient) {
  await tx.appointment.deleteMany({})
  await tx.blockedSlot.deleteMany({})
  await tx.professionalService.deleteMany({})
  await tx.professional.deleteMany({})
  await tx.service.deleteMany({})
  await tx.user.deleteMany({})
}

async function main() {
  const targetUrl = process.env.DATABASE_URL?.trim()
  if (!targetUrl) throw new Error('DATABASE_URL ausente.')

  const sourceUrl = deriveSourceDatabaseUrl(targetUrl)
  console.log(`Origem: ${sourceUrl.replace(/:[^:@/]+@/, ':****@')}`)
  console.log(`Destino: ${targetUrl.replace(/:[^:@/]+@/, ':****@')}`)

  const source = new PrismaClient({ datasourceUrl: sourceUrl })
  const target = new PrismaClient({ datasourceUrl: targetUrl })

  try {
    await source.$connect()
    await target.$connect()

    if (process.env.FORCE_CLEAR === '1') {
      console.log('Limpando tabelas de negócio no destino...')
      await target.$transaction(async (tx) => clearTarget(tx))
    }

    const users = await source.user.findMany()
    const services = await source.service.findMany()
    const professionals = await source.professional.findMany()
    const professionalServices = await source.professionalService.findMany()
    const appointments = await source.appointment.findMany()
    const blockedSlots = await source.blockedSlot.findMany()

    console.log(
      `Lido na origem: ${users.length} usuários · ${services.length} serviços · ${professionals.length} profissionais · ` +
        `${professionalServices.length} preços · ${appointments.length} agendamentos · ${blockedSlots.length} bloqueios`,
    )

    if (
      users.length === 0 &&
      services.length === 0 &&
      professionals.length === 0 &&
      appointments.length === 0
    ) {
      console.warn('Origem parece vazia. Confira SOURCE_DATABASE_URL e se o banco legado existe.')
    }

    await target.$transaction(async (tx) => {
      // Ordem FK: usuários → serviços → profissionais → vínculo preço → agendamentos → bloqueios
      if (users.length) await tx.user.createMany({ data: users })
      if (services.length) await tx.service.createMany({ data: services })
      if (professionals.length) await tx.professional.createMany({ data: professionals })
      if (professionalServices.length)
        await tx.professionalService.createMany({ data: professionalServices })
      if (appointments.length) await tx.appointment.createMany({ data: appointments })
      if (blockedSlots.length) await tx.blockedSlot.createMany({ data: blockedSlots })
    })

    console.log('Cópia concluída.')
  } finally {
    await source.$disconnect()
    await target.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
