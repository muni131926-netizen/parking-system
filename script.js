let slots = []
let selectedSlot = null

async function loadSlots() {
    const res = await fetch("http://localhost:3000/slots")
    slots = await res.json()
    renderSlots()
}

function renderSlots() {
    const left = document.getElementById("left")
    const right = document.getElementById("right")

    left.innerHTML = ""
    right.innerHTML = ""

    for (let i = 0; i < 10; i++) {
        left.innerHTML += createSlot(i)
    }

    for (let i = 10; i < 20; i++) {
        right.innerHTML += createSlot(i)
    }
}

function createSlot(i) {
    const s = slots.find(x => x.index === i) || {
        index: i,
        status: "empty"
    }

    return `
        <div class="car ${s.status}" onclick="toggleSlot(${i})">
            ${i + 1}
        </div>
    `
}

async function toggleSlot(i) {
    selectedSlot = i

    const s = slots.find(x => x.index === i)

    let newStatus =
        s.status === "empty" ? "process" :
        s.status === "process" ? "booked" : "empty"

    let user = localStorage.getItem("user") || "Guest"

    await fetch("http://localhost:3000/slot/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            index: i,
            status: newStatus,
            user: newStatus === "booked" ? user : ""
        })
    })

    loadSlots()
}

function confirmBooking() {
    if (selectedSlot === null) {
        alert("Select slot first")
        return
    }

    const s = slots.find(x => x.index === selectedSlot)

    if (s && s.status === "booked") {
        alert("Slot " + (selectedSlot + 1) + " confirmed")
    } else {
        alert("Book slot first")
    }
}

async function showBookings() {
    const res = await fetch("http://localhost:3000/bookings")
    const data = await res.json()

    let popup = document.getElementById("popup")

    let html = "<h3>Bookings</h3>"

    data.forEach(b => {
        html += `<p>${b.user} → Slot ${b.index + 1}</p>`
    })

    popup.innerHTML = html
    popup.style.display = "block"
}

function logout() {
    localStorage.removeItem("user")
    window.location.href = "login.html"
}

window.onclick = function (e) {
    let popup = document.getElementById("popup")
    if (e.target === popup) popup.style.display = "none"
}

loadSlots()
