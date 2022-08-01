import { hasUserEntity, entityFromMsg, cutInt, getUserORQuery } from './utils.js'

export async function balanceCommand(msg, args) {
  const selfBalance = args[0] === undefined
  if(!selfBalance && !hasUserEntity(args[0], msg?.entities)) return sendBalanceErrorFormat(msg)

  const target = entityFromMsg(msg) ?? args[0]
  const balance = await getBalance(selfBalance ? msg.from.id : target)
  global.bot.sendMessage(
    msg.chat.id,
    `${selfBalance ? 'Ваш баланс' : 'Баланс пользователя'} со всех чатов: <pre>${balance} SAMARACOIN</pre>${selfBalance && balance === 0 ? '. Чтобы заработать, пишите слово Самара в чат. Подробности: /helpsamara' : ''}`,
    { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
  )
}

const sendBalanceErrorFormat = msg => {
  global.bot.sendMessage(
    msg.chat.id,
    'Неправильный формат команды. <pre>/samaracoin @username</pre>',
    { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
  )
}

async function getBalance(user) {
  if(String(user).indexOf('@') === 0){
    return await getBalanaceByUserName(user.substring(1).toLowerCase())
  } else {
    return await getBalanaceByID(user)
  }
}

export async function getBalanaceByUserName(username) {
  return await getBalanceFromDB({ userName: username })
}

export async function getBalanaceByID(userID) {
  return await getBalanceFromDB({ userID: userID })
}

async function getBalanceFromDB(query) {
  const collection = global.db.collection('balance')
  const user = await collection.findOne(query)
  if(user === null) return 0
  return cutInt(user.balance)
}

export async function addToBalance(userID, userName, balanceToAdd) {
  const SECONDS_5 = 1000 * 5
  const timeoutBetweenEarning = SECONDS_5

  const collection = global.db.collection('balance')
  const user = await collection.findOne(getUserORQuery(userID, userName))
  const userKeyAdd = {}
  if (userID) { userKeyAdd.userID = userID }
  if (userName) { userKeyAdd.userName = userName }
  if (user === null) {
    await collection.insertOne({ ...userKeyAdd, balance: balanceToAdd, lastEarn: Date.now(), earnsOverall: 1 })
  } else {
    if (Date.now() - user.lastEarn > timeoutBetweenEarning) {
      const newEarnedBalance = cutInt(user.balance + balanceToAdd)
      await collection.updateOne(
        getUserORQuery(userID, userName),
        { $set:
          { ...userKeyAdd, balance: newEarnedBalance, lastEarn: Date.now(), earnsOverall: user.earnsOverall + 1 }
        }
      )
    }
  }
}
