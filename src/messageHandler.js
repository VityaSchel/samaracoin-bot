import { messageEventDice } from './dice.js'
import { messageEventCommands } from './commands.js'

export async function onMessage(msg) {
  if (!msg || msg.from.is_bot || msg.chat.type === 'channel' || msg.forward_from !== undefined) return
  messageEventDice(msg)
  messageEventCommands(msg)
}
