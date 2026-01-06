const mongoose = require('mongoose')

const logTableSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: false,
      index: true
    },
    number: {
      type: String,
      required: false
    },
    action: {
      type: String,
      required: false
    },
    action1: {
      type: String,
      required: false
    },
    action2: {
      type: String,
      required: false
    },
    action3: {
      type: String,
      required: false
    },
    createdAt: {
      type: String,
      required: false
    }
  },
  {
    collection: 'logTable',
    timestamps: false,
    versionKey: false
  }
)


module.exports = conn => {
  return {
    Logtable: conn.model('logtable', logTableSchema)
  }
}