export function cutInt(number) {
  return Number(Number(number).toFixed(6))
}

export function random(min, max) {
  const randomNumber = min + Math.random() * (max - min)
  return cutInt(randomNumber)
}

export function markdownEscape(text) {
  return text.replace(/([^ø])(_|\*|\[|\]|\(|\)|~|`|>|#|\+|-|=|\||\{|\}|\.|!)/gui, '$1\\$2').replace(/ø/g, '')
}

export function escapeHTML(text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
}

export const getUserORQuery = (userID, userName) => {
  const idProvided = userID !== 0 && userID !== undefined
  const nameProvided = userName !== '' && userName !== undefined
  if(idProvided && !nameProvided) {
    return { userID: userID }
  } else if (!idProvided && nameProvided) {
    return { userName: userName }
  } else {
    return { $or: [ { userID: userID }, { userName: userName } ]}
  }
}


export const entityFromMsg = (msg) => {
  const userEntity = msg.entities && msg.entities.filter(entity => entity.type === 'text_mention')[0]
  return userEntity && userEntity.user.id
}

export const hasUserEntity = (username, entities) => {
  const usernameRegex = /^@[a-zA-Z0-9_]{5,32}$/
  const hasUser = entity => entity.type === 'text_mention'
  return usernameRegex.test(username) || entities.some(hasUser)
}
