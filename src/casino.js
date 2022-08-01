import { getBalanaceByID } from './balance.js'
import { rollDice } from './dice.js'
import { cutInt } from './utils.js'
import $D from 'dedent'

const betToString = bet => bet === 'all' ? 'Весь баланс' : `${bet} SAMARACOIN`

export const casinoSamara = msg => {
  global.bot.sendMessage(
    msg.chat.id,
    $D`Сыграйте в Самарское казино: отправьте <b><u>в ответ на это сообщение</u></b> \
       (или любое другое мое сообщение) одно из следующих эмодзи: 🎲 или 🎰

       Если вам выпадет 1 красная точка 🎲 наверху кубика, вы получаете \
       6х ставки, если не выпадает, проигрываете всю ставку.

       Если вам выпадает три семерки 🎰 на слотах, вы получаете 64х ставки.
       Если вам выпадает три BAR, вы получаете 32х ставки.
       Если вам выпадает три одинаковых ягоды на слотах (🍋 или 🍇), вы получаете 16х ставки.
       Если в ряд ничего одинакового не выпадает, проигрываете всю ставку.

       Персональную ставку можно узнать и изменить командой /betsamara (по умолчанию ${DEFAULT_CASINO_BET} SAMARACOIN)

       <b><u>Бот играет с вами в казино, только если вы ответили на любое его сообщение</u></b>`,
    { reply_to_message_id: msg.message_id })
}

export const setBet = async (msg, args) => {
  let newBet = args[0]
  if(newBet === undefined) {
    const currentBet = await getCurrentBet(msg.from.id)
    global.bot.sendMessage(
      msg.chat.id,
      `Ваша текущая ставка для казино: ${betToString(currentBet)}. \nУстановить новую: <pre>/betsamara (число)</pre> ИЛИ <pre>/betsamara all</pre>`,
      { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
    )
  } else {
    if(newBet !== 'all') newBet = cutInt(newBet)
    if(newBet <= 0 || !newBet || newBet === Infinity){
      return global.bot.sendMessage(
        msg.chat.id,
        'Ставка для казино должна быть числом больше нуля ИЛИ словом <pre>all</pre> (весь баланс) \nНапример, <pre>/betsamara 0.0001</pre> ИЛИ <pre>/betsamara all</pre>',
        { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
      )
    } else {
      await saveNewBet(msg.from.id, newBet)
      global.bot.sendMessage(
        msg.chat.id,
        `Ваша новая ставка для казино: ${betToString(newBet)}`,
        { reply_to_message_id: msg.message_id }
      )
    }
  }
}

const DEFAULT_CASINO_BET = 0.000100
const getCurrentBet = async userID => {
  const collection = global.db.collection('balance')
  const user = await collection.findOne({ userID })
  const bet = user?.casinoBet
  if(bet === undefined) return DEFAULT_CASINO_BET
  else if(bet === 'all') return 'all'
  else return cutInt(bet)
}

const saveNewBet = async (userID, newBet) => {
  const collection = global.db.collection('balance')
  await collection.updateOne({ userID }, { $set: { casinoBet: newBet } })
}

export async function playCasino(msg) {
  const balance = await getBalanaceByID(msg.from.id)
  const personalBet = await getCurrentBet(msg.from.id)
  const allIn = personalBet === 'all'
  const neededBalance = allIn ? balance : personalBet

  if(balance < neededBalance){
    return global.bot.sendMessage(
      msg.chat.id,
      `Не хватает SAMARACOIN для игры в казино. Ставка: ${allIn ? 'весь ваш баланс' : personalBet}, у вас на счету: ${balance}`,
      { reply_to_message_id: msg.message_id }
    )
  }

  if(allIn && balance === 0){
    return global.bot.sendMessage(
      msg.chat.id,
      'У вас на счету <pre>0 SAMARACOIN</pre>, ваша ставка: весь баланс. Изменить ставку: <pre>/betsamara (число)</pre>',
      { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
    )
  }


  const betMultiplier = rollDice(msg)
  const balanceDelta = neededBalance * betMultiplier

  const newBalance = cutInt(balance + balanceDelta)
  const collection = global.db.collection('balance')
  collection.updateOne({ userID: msg.from.id }, { $set: { balance: newBalance } })

  const success = betMultiplier > 0
  let message = success
    ? `Ставка сыграла! Выигрыш: <pre>${balanceDelta} SAMARACOIN</pre>.`
    : `Ставка не сыграла. Вы проиграли <pre>${-balanceDelta} SAMARACOIN</pre>.`

  if(success && allIn)
    message += '\nВы ставили весь баланс, поэтому не можете играть, пока не заработаете еще немного SAMARACOINS. Изменить ставку: <pre>/betsamara (число)</pre>'

  message += '\nЧтобы сыграть еще раз, ответьте на это сообщение одним из эмодзи: 🎲 или 🎰. Подробности: /casinosamara'

  const emojiTimeout = { '🎲': 3000, '🎰': 1500 }
  setTimeout(() => {
    global.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id, parse_mode: 'HTML' })
  }, emojiTimeout[msg.dice.emoji])
}
