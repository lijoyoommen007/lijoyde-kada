const mongoClient = require('mongodb').MongoClient
require('dotenv').config()
const State={
    db:null
}
// module.exports.connect = function(done){
//    const url ='mongodb://0.0.0.0:27017'
//    const dbname = 'LJGAMING'

//    mongoClient.connect(url,(err,data)=>{
//        if(err) return done(err)
//        State.db = data.db(dbname)
//        done()
//    })
// }
module.exports.connect = function(done){
    const url = process.env.MONGO_ID
    const dbname = 'LJGAMING' 

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        State.db = data.db(dbname)
        done()
    })
}
module.exports.get =  function(){
    return State.db
}

