import { playCasino } from './casino.js'

const BOT_ID = process.env.TELEGRAM_BOT_ID
export async function messageEventDice(msg) {
  if(!msg.dice || !msg.reply_to_message || msg.reply_to_message?.from?.id !== BOT_ID) return

  if(['🎲', '🎰'].includes(msg.dice.emoji)) playCasino(msg)
}

export function rollDice(msg) {
  return decide(
    msg,
    m => m,
    m => -m
  )
}

function decide(msg, win, lose) {
  if(msg.dice.emoji === '🎲'){
    if (msg.dice.value === 1) return win(6)
    else return lose(1)
  } else if (msg.dice.emoji === '🎰'){
    const ALL_SEVEN = 64
    const ALL_GRAPE = 43
    const ALL_LEMON = 22
    const ALL_BAR = 1

    if (msg.dice.value === ALL_SEVEN) return win(64)
    else if (msg.dice.value === ALL_BAR) return win(32)
    else if ([ALL_GRAPE, ALL_LEMON].includes(msg.dice.value)) return win(16)
    else return lose(1)
  }
}
