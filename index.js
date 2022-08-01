import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import fastify from 'fastify'
import { onMessage } from './src/messageHandler.js'
import { connect } from './src/dbdriver.js'

const port = 60766
const TOKEN = process.env.TELEGRAM_BOT_TOKEN

const app = fastify({ logger: true })

const bot = new TelegramBot(TOKEN)
global.bot = bot

app.post(`/bot${TOKEN}`, ({ body }) => {
  bot.processUpdate(body)
  return { ok: true }
})

app.listen(port, '127.0.0.1', async () => {
  console.log('SamaraCoinBot listening on port', port)

  global.db = await connect()

  bot.on('message', onMessage)
  await bot.setWebHook(`${process.env.WEBHOOK_URL}/bot${TOKEN}`, { drop_pending_updates: false })
})

process.on('SIGINT', async () => {
  await app.close()
  await global.dbclient.close()
  process.exit(2)
})
