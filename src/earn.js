import { sendHelp } from './help.js'
import { random, getUserORQuery } from './utils.js'
import { addToBalance } from './balance.js'
import moment from 'moment-timezone'

export function matchSamara(msg) {
  if(containsSamara(msg.text)){
    if(msg.chat.type === 'private') {
      sendNoSamaraInDmError(msg)
    } else {
      earnCommand(msg)
    }
  } else {
    if(msg.chat.type === 'private') {
      sendHelp(msg)
    }
  }
}

const sendNoSamaraInDmError = msg => {
  global.bot.sendMessage(
    msg.chat.id,
    '<b>САМАРСКАЯ ОШИБОЧКА:</b> Никакой Самары в личных сообщениях с ботом! Добавьте его в чат и зарабатывайте там!',
    { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
  )
}

const earnCommand = async (msg) => {
  const MIN_EARN = 0.000005
  const MAX_EARN = 0.000025

  const earnsOverall = await getEarnsOverall(msg.from.id, msg.from?.username?.toLowerCase())
  const membersInChat = await global.bot.getChatMembersCount(msg.chat.id)

  const EARNS_OVERALL_MULTIPLIER = multiplierFromEarns(earnsOverall)
  const CHAT_MEMBERS_MULTIPLIER = multiplierFromChatMembers(membersInChat)
  const SAMARA_TIME_MULTIPLIER = multiplierFromSamaraTime()
  const WEEKEND_MULTIPLIER = multiplierFromDayOfWeek()

  const allMultipliers = EARNS_OVERALL_MULTIPLIER * CHAT_MEMBERS_MULTIPLIER * SAMARA_TIME_MULTIPLIER * WEEKEND_MULTIPLIER
  const balanceDelta = random(MIN_EARN, MAX_EARN)
  addToBalance(msg.from.id, msg.from.username.toLowerCase(), balanceDelta * allMultipliers)
}

function containsSamara(msg) {
  const GLOBAL_REGEX = /(самарск(ий|ая|ое|ие|ого|ой|их|ому|ой|им|ую|ими|ом)|самар(а|е|ы|у|ой)|самарочка|самарчанин|самарчанка|самарчаночка|самарище|самарщина)/gmiu
  return GLOBAL_REGEX.test(msg)
}

const multiplierFromChatMembers = members_count => {
  if(members_count <= 1) return 0 // не начисляются
  else return Number((1 + members_count / 250).toFixed(2))
}

const multiplierFromSamaraTime = () => {
  const time = moment().tz('Europe/Samara')
  const [hours, minutes] = [Number(time.format('H')), Number(time.format('m'))]
  const minutesSinceNight = hours * 60 + minutes
  const MAX_EARNINGS_TIME_START = 4 * 60 + 30
  const MAX_EARNINGS_TIME_END = 5 * 60 + 50
  const MIN_EARNINGS_TIME_START = 16 * 60 + 0
  const MIN_EARNINGS_TIME_END = 1 * 60 + 30
  if (minutesSinceNight >= MAX_EARNINGS_TIME_START && minutesSinceNight <= MAX_EARNINGS_TIME_END) {
    const MAX_EARNINGS_MULTIPLIER = 2
    return MAX_EARNINGS_MULTIPLIER
  }
  if (minutesSinceNight >= MIN_EARNINGS_TIME_START || minutesSinceNight <= MIN_EARNINGS_TIME_END) {
    const MIN_EARNINGS_MULTIPLIER = 1
    return MIN_EARNINGS_MULTIPLIER
  }
  return 1.25
}

const multiplierFromDayOfWeek = () => {
  const dayOfWeek = Number(moment().tz('Europe/Samara').format('d'))
  const MONDAY = 1
  const TUESDAY = 2
  const WEDNESDAY = 3
  const THURSDAY = 4
  const FRIDAY = 5
  const SATURDAY = 6
  const SUNDAY = 0

  switch (dayOfWeek) {
    case MONDAY:
    case WEDNESDAY:
    case THURSDAY:
      return 1

    case TUESDAY:
    case SUNDAY:
      return 0.89

    case FRIDAY:
    case SATURDAY:
      return 1.2
  }
}

const multiplierFromEarns = earnsOverall => {
  const MIN_LIMIT = 25
  if (earnsOverall < MIN_LIMIT)
    return 1
  else
    return Number(Number(1 + (earnsOverall / MIN_LIMIT)).toFixed(2))
}

const getEarnsOverall = async (userID, userName = undefined) => {
  const collection = global.db.collection('balance')
  const user = await collection.findOne(getUserORQuery(userID, userName))
  if(user === null)
    return 0
  else
    return Number(user.earnsOverall)
}
