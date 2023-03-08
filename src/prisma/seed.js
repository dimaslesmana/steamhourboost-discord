const { PrismaClient } = require('@prisma/client');
const environments = require('../environments');
const { LICENSE_TYPE } = require('../constants');
const prisma = new PrismaClient();

const exampleDiscordId = environments.DISCORD_ADMIN_ID;
const exampleLicenseCode = 'AB3D-EF7H-9JKL-MNOP';

async function seedLicenseType() {
  const licenseTypeData = [
    { id: LICENSE_TYPE.FREE, name: 'Free' },
    { id: LICENSE_TYPE.PREMIUM, name: 'Premium' },
  ];

  for (const licenseType of licenseTypeData) {
    await prisma.licenseType.upsert({
      where: { id: licenseType.id },
      update: licenseType,
      create: licenseType,
    });
  }
}

async function seedLicenseCode() {
  await prisma.licenseCodes.upsert({
    where: { code: exampleLicenseCode },
    update: { code: exampleLicenseCode, licenseTypeId: LICENSE_TYPE.FREE },
    create: { code: exampleLicenseCode, licenseTypeId: LICENSE_TYPE.FREE },
  });
}

async function seedDiscordAccount() {
  await prisma.discordAccounts.upsert({
    where: { discordId: exampleDiscordId },
    update: {},
    create: {
      discordId: exampleDiscordId,
      licenseCode: {
        connect: { code: exampleLicenseCode },
      },
    },
  });

  // Update license status after being used by a user
  await prisma.licenseCodes.update({
    where: { code: exampleLicenseCode },
    data: {
      isUsed: true,
    },
  });
}

async function main() {
  await seedLicenseType();
  await seedLicenseCode();
  // await seedDiscordAccount();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
