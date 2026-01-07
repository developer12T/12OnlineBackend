const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    code: { type: String, required: true },
    running: { type: Number, default: 0 }
  },
  { timestamps: true }
)

// 🔐 กันเลขซ้ำระดับ DB
counterSchema.index({ year: 1, code: 1 }, { unique: true })

module.exports = conn => {
  return {
    Counter: conn.model('Counter', counterSchema)
  }
}
