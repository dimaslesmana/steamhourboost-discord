const { prisma } = require('./prisma.service');
const { logger } = require('../utils/logger');

class DiscordAccount {
  static async insert(discordId, licenseCode) {
    try {
      return await prisma.discordAccounts.create({
        data: {
          discordId,
          licenseCode: {
            connect: { code: licenseCode },
          },
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to insert new Discord account to database');
    }
  }

  static async getAccount(discordId) {
    try {
      return await prisma.discordAccounts.findFirst({
        where: {
          discordId,
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to get Discord account from database');
    }
  }

  static async updateLicenseCode(discordId, licenseCode) {
    try {
      return await prisma.discordAccounts.update({
        where: { discordId },
        data: {
          licenseCode: {
            connect: { code: licenseCode },
          },
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to update license code in database');
    }
  }
}

module.exports = DiscordAccount;
