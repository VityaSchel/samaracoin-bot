import $D from 'dedent'

/* eslint-disable no-irregular-whitespace */
export const sendHelp = msg => {
  global.bot.sendMessage(
    msg.chat.id,
    $D`SAMARACOIN — альткоин и централизованная валюта, которую можно \
       зарабатывать, отправляя в чат слово <b>САМАРА</b> и его склонения и формы.

       Чем больше вы пишите <b>Самарских</b> слов вообще в чате, тем больше получаете \
       SAMARACOIN за один раз.

       В зависимости от времени в <b>Самарочке</b>, вы будете получать \
       больше или меньше SAMARACOIN за раз.

       Еще один фактор — количество участников чата. Чем больше \
       участников — тем больше SAMARACOIN за раз. В чатах, где участников \
       меньше двух, SAMARACOIN не начисляются!

       SAMARACOIN начисляется на ваш внутренний счет между чатами. Баланс — /samaracoin.
       Вы можете перевести SAMARACOIN другим с помощью команды /transfersmr.


       Купить сгенерированный ботом фотолуп (0.5 SAMARACOIN) — /samarapic.
       Наложить маску на вашу фотографию (1.5 SAMARACOIN) — /samarapic с вложением.
       В зависимости от времени в <b>Самаре</b>, цены могут сильно снижаться.
       Казино — /casinosamara.

       1 ОКРОШ = 0.100000 SAMARACOIN (1/10)
       1 КРОЛ  = 0.000100 SAMARACOIN (1/10 000)
       1 КРОШ = 0.000001 SAMARACOIN (1/1 000 000)

       Вопросы и поддержка: @gadzas`,
    { reply_to_message_id: msg.message_id, parse_mode: 'HTML' }
  )
}
