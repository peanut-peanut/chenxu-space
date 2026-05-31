import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const phone = process.env.ADMIN_PHONE ?? '13800000000'
  const password = process.env.ADMIN_PASSWORD
  const nickname = process.env.ADMIN_NICKNAME ?? 'chenxu'

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required for seeding admin user')
  }

  const exists = await prisma.user.findUnique({ where: { phone } })
  if (exists) {
    console.log(`Admin already exists: ${phone}`)
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const admin = await prisma.user.create({
    data: { phone, email, password: hashed, nickname, role: 'admin' },
  })

  console.log(`Admin created: ${admin.phone} (id=${admin.id})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
