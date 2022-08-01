import { cutInt, entityFromMsg, escapeHTML } from './utils.js'
import { getBalanaceByID } from './balance.js'

export async function transferCommand(msg, args) {
  if(!args[0] || !args[1] || !validateTransferArgs(args[1], args[0], msg.entities)) {
    transferErrorCommand(msg)
    return false
  }

  const amount = cutInt(args[0]) ?? 0
  if(amount <= 0 || !amount || amount === Infinity) return transferErrorCommand(msg)
  const userEntity = entityFromMsg(msg)
  const targetNickname = !userEntity && args[1].substring(1).toLowerCase()
  if((userEntity && userEntity === msg.from.id) || (targetNickname === msg.from.username?.toLowerCase())) {
    return global.bot.sendMessage(
      msg.chat.id,
      'Нельзя отправить перевод самому себе!',
      { reply_to_message_id: msg.message_id }
    )
  }
  const success = await transferOperation(msg.from.id, userEntity ? userEntity : args[1], amount)
  global.bot.sendMessage(
    msg.chat.id,
    `${success
      ? `Успешно отправлено ${amount} SAMARACOINS пользователю ${escapeHTML(args[1])}`
      : 'Недостаточно средств на балансе'
    }`,
    { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
  )
}

const validateTransferArgs = (username, amount, entities) => {
  const usernameRegex = /^@[a-zA-Z0-9_]*$/
  const hasUser = entity => entity.type === 'text_mention'
  const amountRegex = /^(\d|\d+(\.?\d{1,6}))$/
  const userCorrect = usernameRegex.test(username) || entities.some(hasUser)
  return userCorrect && amountRegex.test(amount)
}

const transferOperation = async (withdrawID, user, amount) => {
  if(String(user).indexOf('@') === 0){
    return await transferSMRByUsername(withdrawID, user.substring(1).toLowerCase(), amount)
  } else {
    return await transferSMRByID(withdrawID, user, amount)
  }
}

const transferSMRByUsername = async (withdrawID, userName, amount) => {
  return await transfer(withdrawID, { userName }, amount)
}

const transferSMRByID = async (withdrawID, userID, amount) => {
  return await transfer(withdrawID, { userID }, amount)
}

async function transfer(withdrawID, targetQuery, amount) {
  const balance = await getBalanaceByID(withdrawID)
  if(balance < amount) return false

  const collection = global.db.collection('balance')

  const withdrawUser = await collection.findOne({ userID: withdrawID })
  if(withdrawUser === null) return false

  const newBalanceOfWithdrawUser = cutInt(balance - amount)
  await collection.updateOne({ userID: withdrawID }, { $set: { balance: newBalanceOfWithdrawUser } })

  const targetUser = await collection.findOne(targetQuery)
  if(targetUser === null){
    collection.insertOne({ ...targetQuery, balance: cutInt(amount), lastEarn: 0, earnsOverall: 0 })
  } else {
    const newBalanceOfTargetUser = cutInt(targetUser.balance + amount)
    await collection.updateOne(targetQuery, { $set: { balance: newBalanceOfTargetUser } })
  }

  return true
}

const transferErrorCommand = (msg) => {
  global.bot.sendMessage(
    msg.chat.id,
    'Неправильный формат команды. <pre>/transfersmr 1.000000 @username</pre>',
    { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
  )
}
