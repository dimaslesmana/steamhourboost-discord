# steamhourboost-discord

---

## Requirements

- [Node.js](https://nodejs.org/).
- [Discord Bot Application Setup](https://discordjs.guide/preparations/setting-up-a-bot-application.html).
- Database. This project uses SQLite.
  - You can use any database that is supported by [Prisma](https://www.prisma.io/docs/reference/database-reference/supported-databases). However, make sure you adjust the Prisma schema file and its migration.
- **`.env`** file. See **`.env.example`** for example.

## Setup
1. Create an **`.env`** file based on the **`.env.example`** file.
2. Run **`npm install`**.
3. Run **`npx prisma db push`** to deploy the Prisma schema to the database without using migrations. [Read more](https://www.prisma.io/docs/reference/api-reference/command-reference#db-push).
   - You can use **`npx prisma migrate deploy`** to deploy existing migrations history to the database. [Read more](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-deploy).
4. Run **`npx prisma db seed`** to populate the database with the License type and License code example. [Read more](https://www.prisma.io/docs/guides/database/seed-database).
5. Run **`npx prisma generate`** to generate the Prisma Client. [Read more](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client).
6. Run **`npm run deploy-commands-global`** to register the Discord slash commands globally.
   - You may want to use **`npm run deploy-commands-guild`** to register the commands guild specific *(for development purposes)*. [Read more](https://discordjs.guide/creating-your-bot/command-deployment.html).
7. Run **`npm start`** to start the bot.

---

## Available Slash Commands

### Boost

#### `/boost add`

```
Add new Steam account to boost.
```

- `username` - **Required.** Steam account username.
- `password` - **Required.** Steam account password.
- `shared_secret` - *Optional.* Steam account shared secret.

#### `/boost list`

```
List all available Steam accounts.
```

#### `/boost steam-guard`

```
Set Steam Guard code for specific Steam account.
```

- `username` - **Required.** Steam account username.
- `code` - **Required.** Steam Guard code.

#### `/boost start`

```
Start boosting specific Steam account.
```

- `username` - **Required.** Steam account username.

#### `/boost restart`

```
Restart boosting. Include username to restart specific account.
```

- `username` - *Optional.* Steam account username.

#### `/boost stop`

```
Stop boosting specific Steam account.
```

- `username` - **Required.** Steam account username.

#### `/boost remove`

```
Remove specific Steam account.
```

- `username` - **Required.** Steam account username.

---

### User

#### `/user info`

```
View user info.
```

#### `/user register`

```
Register your Discord account using license key.
```

- `license_key` - **Required.** License key to register.

#### `/user change-license`

```
Change existing license key.
```

- `license_key` - **Required.** Your new license key.

---

### Config

#### `/config games`

```
Configure the games to boost for specific Steam account. Separate multiple App IDs with a comma. Example: 730,570,440.
```

- `username` - **Required.** Steam account username.
- `games` - **Required.** Games AppID.

#### `/config online-status`

```
Configure the online status for specific Steam account.
```

- `username` - **Required.** Steam account username.
- `status` - **Required.** Boolean true or false.

#### `/config shared-secret`

```
Configure the shared secret for specific Steam account to be used for Steam Guard Authentication.
```

- `username` - **Required.** Steam account username.
- `shared_secret` - *Optional.* Steam account shared secret.

---

### Admin

The slash command in this section can only be used by the Discord admins *(bot creators)* specified in the **`.env`** file.

#### `/admin license generate `

```
Generate new license key.
```

- `type` - **Required.** Type of license key to be created.
- `amount` - **Required.** Amount of license key to be created.
