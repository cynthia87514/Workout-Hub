var calendarEl = document.getElementById("calendar");
var isInitialLoad = true;

// 月曆初始化
var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    themeSystem: "bootstrap",
    fixedWeekCount: true,
    showNonCurrentDates: true,
    aspectRatio: 1.5,
    dayMaxEvents: true, // FullCalendar 默認 "+n more" 功能
    eventClick: function(info) {
        const workoutId = info.event.id;
        fetchWorkoutDetail(workoutId);
    }
});

calendar.render();

function getCurrentMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return { year: year, month: month };
}

function loadWorkoutData(year, month) {
    const monthstring = `${year}-${String(month).padStart(2, "0")}`;

    const token = localStorage.getItem("token");

    fetch(`/api/workouts/month/${monthstring}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        calendar.removeAllEvents();

        if (Array.isArray(data)) {
            data.forEach(workout => {
                calendar.addEvent({
                    id: workout.id,
                    title: workout.title,
                    start: workout.date,
                    allDay: true,
                    classNames: ["custom-event"]
                });
            });
        } else {
            console.error("Unexpected data format:", data);
        }
    })
    .catch(error => console.error("Error fetching workouts:", error));
}
// 獲取並顯示指定 workout 詳細資訊
function fetchWorkoutDetail(workoutId) {
    const token = localStorage.getItem("token");

    fetch(`/api/workout/${workoutId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        showWorkoutDetailModal(data);
    })
    .catch(error => console.error("Error fetching workout details:", error));
}
// 顯示 workout 詳細資訊框
function showWorkoutDetailModal(workout) {
    const modalContent = `
        <div class="modal-content">
            <img src="/static/images/remove.png" class="remove-btn" alt="remove">
            <h2>${workout.title}</h2>
            <p>Date: ${workout.date}</p>
            <ul>
                ${workout.workout_items.map(item => `
                    <li>
                        <strong>${item.name}</strong>
                        <ul>
                            ${item.item_sets.map(set => `
                                <li>Set ${set.set_number}: ${set.weight ? set.weight + "kg" : ""} ${set.reps ? set.reps + " reps" : ""}</li>
                            `).join("")}
                        </ul>
                    </li>
                `).join("")}
            </ul>
            <button class="close-button">Close</button>
        </div>
    `;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = modalContent;

    // 刪除按鈕的事件監聽
    modal.querySelector(".remove-btn").addEventListener("click", function() {
        deleteWorkout(workout.id, modal);
    });

    // 關閉資訊框的事件監聽
    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
    modal.querySelector(".close-button").addEventListener("click", function() {
        closeModal(modal);
    });

    document.body.appendChild(modal);
}
// 刪除 workout 紀錄
function deleteWorkout(workoutId, modal) {
    const token = localStorage.getItem("token");

    fetch(`/api/workout/${workoutId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        closeModal(modal);
        const event = calendar.getEventById(workoutId);
        if (event) {
            event.remove();
        }
    })
    .catch(error => console.error("Error deleting workout:", error));
}
// 關閉模態框
function closeModal(modal) {
    if (modal) {
        modal.remove();
    }
}

const initialViewDate = calendar.getDate();
const currentMonth = getCurrentMonth(initialViewDate);
loadWorkoutData(currentMonth.year, currentMonth.month);