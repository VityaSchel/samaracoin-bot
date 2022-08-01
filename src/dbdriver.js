import mongo from 'mongodb'
const dburl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_IP}:${process.env.MONGODB_PORT}`
const dbName = 'users'
export const dbclient = new mongo.MongoClient(dburl)
export function connect() {
  return new Promise(resolve => {
    global.dbclient = dbclient
    dbclient.connect(err => {
      if(err) throw err
      console.log('Connected successfully to server')
      const db = dbclient.db(dbName)
      resolve(db)
    })
  })
}
