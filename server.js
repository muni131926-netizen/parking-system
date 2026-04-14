const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()

app.use(express.json())
app.use(cors())

mongoose.connect("mongodb://localhost:27017/parking")

const SlotSchema = new mongoose.Schema({
    index: { type: Number, unique: true },
    status: { type: String, default: "empty" },
    user: { type: String, default: "" }
})

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
})

const Slot = mongoose.model("Slot", SlotSchema)
const User = mongoose.model("User", UserSchema)

const SECRET = "secretkey"

// ✅ FORCE CREATE 20 SLOTS EVERY TIME SERVER STARTS
const initSlots = async () => {
    const count = await Slot.countDocuments()

    if (count === 0) {
        let arr = []

        for (let i = 0; i < 20; i++) {
            arr.push({
                index: i,
                status: "empty",
                user: ""
            })
        }

        await Slot.insertMany(arr)
        console.log("20 slots created")
    }
}

initSlots()

app.get("/slots", async (req, res) => {
    let slots = await Slot.find().sort({ index: 1 })

    // 🔥 ENSURE ALWAYS 20 RETURNED
    let fixed = []

    for (let i = 0; i < 20; i++) {
        let found = slots.find(s => s.index === i)

        if (!found) {
            found = await Slot.create({
                index: i,
                status: "empty",
                user: ""
            })
        }

        fixed.push(found)
    }

    res.json(fixed)
})

app.post("/slot/update", async (req, res) => {
    const { index, status, user } = req.body

    await Slot.findOneAndUpdate(
        { index },
        { status, user },
        { upsert: true, new: true }
    )

    res.send("updated")
})

app.post("/register", async (req, res) => {
    const { username, password } = req.body

    const hash = await bcrypt.hash(password, 10)

    const user = new User({ username, password: hash })
    await user.save()

    res.send("registered")
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body

    const user = await User.findOne({ username })
    if (!user) return res.send("user not found")

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.send("wrong password")

    const token = jwt.sign({ username }, SECRET)

    res.json({ token })
})

app.get("/bookings", async (req, res) => {
    const data = await Slot.find({ status: "booked" })
    res.json(data)
})

app.listen(3000, () => console.log("Server running on 3000"))
