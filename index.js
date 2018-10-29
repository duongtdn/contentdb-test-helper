"use strict"

const DatabaseAbstractor = require('database-abstractor');

const contentdb = new DatabaseAbstractor();

const db = {
  host: null,
  port: null
}

const emb01 = {
  "courseId": "emb-01",
  "detail": { "status" : "active" },
  "data" : [
    {
      "id": "1", 
      "title": "Topic 1 is the first topic, id define topic number",
      "contents": [
        {
          "id": 0, "player": "YOUTUBE", "src": "r6bkETisayg", "title": "Nick and Dave Conversation",
          "sub": {
            "0": {
              "id": 0, "player": "QUIZ", "src": "quiz1", "title": "Quiz 1 for test",
              "sub": {"0": {"id": 0, "player": "QUIZ", "src": "quiz2", "title": "Quiz 2 for test"}}
            }
          }
        },
        {
          "id": 1, "player": "YOUTUBE", "src": "X6a9odk6b_c", "title": "How to make friend and infulence people"
        }
      ]
    },
    {
      "id": "1a", 
      "title": "Topic 1 is the first topic, id define topic number",
      "contents": [
        {"id": 0, "player": "QUIZ", "src": "quiz1", "title": "Quiz for test"}
      ]
    },
    {
      "id": "2", 
      "title": "The second one, whatever name can be used",
      "contents": [
        {"id": 0, "player": "YOUTUBE", "src": "X6a9odk6b_c", "title": "Games of Thrones theme song: piano cover "},
        {"id": 1, "player": "YOUTUBE", "src": "XQMnT9baoi8", "title": "Dragonborn is comming: piano cover"},
        {"id": 3, "player": "YOUTUBE", "src": "dUNm721wTec", "title": "Age of agression"}
      ]
    },
    {
      "id": "3", 
      "title": "Name should not too long",
      "contents": [
        {"id": 0, "player": "YOUTUBE", "src": "3zTVaWH40lY", "title": "History of Westeros: The Wall"},
        {"id": 1, "player": "YOUTUBE", "src": "r6bkETisayg", "title": "The last storyline"}
      ]
    }
  ]
}

module.exports = {

  _dbready: false,

  _tables: null,

  _users: {},

  queue: [],

  use({host, port}) {
    db.host = host;
    db.port = port;

    contentdb.use(require('contentdb-dynamodb-driver')(
      {
        region : 'us-west-2', 
        endpoint : `${db.host}:${db.port}`
      },
      (err, data) => {
        if (err) {
          console.log('Failed to init local db')
          throw new Error(err)
        } else {
          this._dbready = true;
          this._tables = data.TableNames;
          if (this.queue.length > 0) {
            this.queue.forEach(fn => this[fn.name].apply(this,fn.args))
          }
        }
      }
    ))

    return this;
  },

  init(done) {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    if (this._tables) {
      if (this._tables.indexOf('CONTENT') === -1) {
        console.log('\nInitializing CONTENT Table...')
        return this.new(() => {
          console.log('CONTENT Table is created and ready to use.');
          done && done();
        });
      } else {
        console.log('CONTENT Table already exists');
        done && done();
        return this;
      }
    } else {
      this.queue.push({name: 'init', args: [done]})
    }
  },

  new(done) {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    if (this._dbready) {
      contentdb.createTable((err, data) => {
        if (err) {
          console.log('Failed to create CONTENT table')
          console.log(err);
        } else {  
          this._createNewEntries(done);
        }
      })
    } else {
      this.queue.push({name: 'new', args: [done]})
    }
    return this;
  },

  reset () {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    const self = this;
    if (this._dbready) {
      contentdb.dropTable(function(err, data) {
        if (err) {
          console.log('Failed to drop ENROLL table')
          console.log(err);
        } else {
          console.log('Dropped old CONTENT table')
          contentdb.createTable((err, data) => {
            if (err) {
              console.log('Failed to create CONTENT table')
              console.log(err);
            } else {  
              self._createNewEntries();
            }
          })
        }
      })
    } else {
      this.queue.push({name: 'reset', args: [done]})
    }
    return this;
  },

  _createNewEntry(uid, content) {
    return new Promise((resolve, reject) => {
      contentdb.createContent({ uid, content }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data)
        }
      })
    })
  },

  _createNewEntries(done) {
    console.log('Creating new content...')  
    Promise.all([
      this._createNewEntry('tester@team.com', emb01), 
    ]).then(values => {
      console.log('Created all contents.')
      done && done();
    }).catch(function(err) {
      console.log(err);
      done && done(err)
    });
    return this;
  }

}

