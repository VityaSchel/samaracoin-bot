import { cutInt } from './utils.js'
import { getBalanaceByID } from './balance.js'
import moment from 'moment-timezone'
import canvas from 'canvas'
const { createCanvas, loadImage } = canvas
import fetch from 'node-fetch'
import FormData from 'form-data'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

export async function samaraPicture(msg) {
  const balance = await getBalanaceByID(msg.from.id)

  const time = moment().tz('Europe/Samara')
  const [hours, minutes] = [Number(time.format('H')), Number(time.format('m'))]
  const minutesSinceNight = hours*60+minutes
  let ITEM_PRICE
  if(minutesSinceNight > 9*60 && minutesSinceNight <= 14*60) {
    ITEM_PRICE = 0.1
  } else if (minutesSinceNight > 14*60 && minutesSinceNight <= 20*60) {
    ITEM_PRICE = 0.5
  } else if (minutesSinceNight > 20*60 || minutesSinceNight <= 9*60) {
    ITEM_PRICE = 0.01
  }

  if(msg.photo) ITEM_PRICE *= 3

  if(balance <= ITEM_PRICE) {
    return global.bot.sendMessage(
      msg.chat.id,
      `<b>САМАРСКАЯ ОШИБОЧКА:</b> Не хватает SAMARACOIN! Стоимость: ${ITEM_PRICE} SAMARACOIN за картинку.`,
      { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
    )
  } else {
    const sentMsg = await global.bot.sendMessage(
      msg.chat.id,
      `Генерирую изображение за ${ITEM_PRICE} SAMARACOIN...`,
      { reply_to_message_id: msg.message_id }
    )
    const collection = global.db.collection('balance')
    let hasErrors = false
    let picture
    try {
      picture = await generatePic(msg)
    } catch (e) {
      hasErrors = true
      console.error(e)
    }
    global.bot.deleteMessage(msg.chat.id, sentMsg.message_id)
    if(!hasErrors){
      const newBalance = cutInt(balance - ITEM_PRICE)
      await collection.updateOne({ userID: msg.from.id }, { $set: { balance: newBalance } })
      global.bot.sendPhoto(msg.chat.id, picture, { reply_to_message_id: msg.message_id })
    }
  }
}

const generatePic = async msg => {
  let photoURL = 'https://thispersondoesnotexist.com/image',
    width = 1024,
    height = 1024

  const customPhoto = msg.photo
  if(customPhoto) {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const photoVersion = customPhoto[customPhoto.length - 1]
    const fileID = photoVersion.file_id
    const responseRaw = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileID}`)
    const response = await responseRaw.json()
    const filePath = response.result.file_path
    photoURL = `https://api.telegram.org/file/bot${TOKEN}/${filePath}?file_id=${fileID}`
    width = photoVersion.width
    height = photoVersion.height
  }

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const image = await loadImage(photoURL)
  ctx.drawImage(image, 0, 0, width, height)
  const dataURL = canvas.toDataURL()
  if(!await drawMask(dataURL, ctx)) {
    global.bot.sendMessage(
      msg.chat.id,
      '<b>САМАРСКАЯ ОШИБОЧКА:</b> Не получилось найти лицо на фото. Средства возвращены на ваш баланс.',
      { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
    )
    throw 'Couldn\'t find face'
  }
  return canvas.toBuffer('image/png', { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE })
}

const drawMask = async (canvasDataURL, ctx, detectAllFaces = false) => {
  const formData  = new FormData()
  formData.append('api_key', process.env.FACEPLUSPLUS_API_KEY)
  formData.append('api_secret', process.env.FACEPLUSPLUS_API_SECRET)
  formData.append('image_base64', canvasDataURL)
  formData.append('return_landmark', 1)
  const responseRaw = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
    method: 'POST',
    body: formData
  })
  const response = await responseRaw.json()
  for(let i = 0; i < (detectAllFaces ? response.faces.length : 1); i++){
    const faces = response.faces
    if(!faces || !faces[0]) return false
    const facePos = faces[0].landmark

    const leftEyePos = facePos.left_eye_center
    const rightEyePos = facePos.right_eye_center
    const leftEarPos = facePos.contour_left2
    const rightEarPos = facePos.contour_right2
    const nosePos = facePos.nose_tip
    const lipsPos = facePos.mouth_upper_lip_bottom

    const faceWidth = rightEarPos.x - leftEarPos.x

    const sizeWidth = faceWidth
    const sizeHeight = faceWidth

    const path = dirname(fileURLToPath(import.meta.url))+'/face_sprites'

    const leftEyeSprite = await loadImage(`${path}/left_eye.png`)
    ctx.drawImage(leftEyeSprite, leftEyePos.x-sizeWidth/2, leftEyePos.y-sizeHeight/2, sizeWidth, sizeHeight)

    const rightEyeSprite = await loadImage(`${path}/right_eye.png`)
    ctx.drawImage(rightEyeSprite, rightEyePos.x-sizeWidth/2, rightEyePos.y-sizeHeight/2, sizeWidth, sizeHeight)

    const leftEarSprite = await loadImage(`${path}/left_ear.png`)
    ctx.drawImage(leftEarSprite, leftEarPos.x-(sizeWidth*0.75)/2, leftEarPos.y-(sizeHeight*0.75)/2, sizeWidth*0.75, sizeHeight*0.75)

    const rightEarSprite = await loadImage(`${path}/right_ear.png`)
    ctx.drawImage(rightEarSprite, rightEarPos.x-(sizeWidth*0.75)/2, rightEarPos.y-(sizeHeight*0.75)/2, sizeWidth*0.75, sizeHeight*0.75)

    const noseSprite = await loadImage(`${path}/nose.png`)
    ctx.drawImage(noseSprite, nosePos.x-(sizeWidth*0.75)/2, nosePos.y-(sizeHeight*0.75)/2, sizeWidth*0.75, sizeHeight*0.75)

    const lipsSprite = await loadImage(`${path}/lips.png`)
    ctx.drawImage(lipsSprite, lipsPos.x-sizeWidth/2, lipsPos.y-sizeHeight/2, sizeWidth, sizeHeight)
  }
  return true
}
