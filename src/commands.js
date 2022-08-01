import { matchSamara } from './earn.js'
import { balanceCommand } from './balance.js'
import { transferCommand } from './transfer.js'
import { samaraPicture } from './picture.js'
import { casinoSamara, setBet } from './casino.js'
import { sendHelp } from './help.js'

export const messageEventCommands = async msg => {
  if(!msg.text && !msg.caption) { return }
  const commandMatches = commands.some(command => {
    const [commandName, argsAmount, callback] = command
    const { hasCommand, args } = parseCommand(msg.text ?? msg.caption, `/${commandName}`, argsAmount)
    hasCommand && callback(msg, args)
    return hasCommand
  })
  if(!commandMatches) matchSamara(msg)
}

const commands = [
  ['helpsamara', 0, sendHelp],
  ['samaracoin', 1, balanceCommand],
  ['transfersmr', 2, transferCommand],
  ['samarapic', 1, samaraPicture],
  ['casinosamara', 0, casinoSamara],
  ['betsamara', 1, setBet]
]

const parseCommand = (text, commandName, limitArguments, withSuffix) => {
  if(withSuffix) commandName += '@samaracoinbot'
  if(text === commandName || text.indexOf(`${commandName} `) === 0){
    let argumentsUnparsed = text.split(commandName)[1]
    if(argumentsUnparsed === '' || argumentsUnparsed === ' ') {
      return { hasCommand: true, args: [] }
    } else {
      if(argumentsUnparsed.indexOf(' ') === 0) argumentsUnparsed = argumentsUnparsed.substring(1)
      return { hasCommand: true, args: argumentsUnparsed.split(' ', limitArguments) }
    }
  } else {
    if(withSuffix) return { hasCommand: false, args: null }
    else return parseCommand(text, commandName, limitArguments, true)
  }
}
