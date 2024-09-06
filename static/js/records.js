var calendarEl = document.getElementById("calendar");
var previousMonth = null;

// 月曆初始化
var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    themeSystem: "bootstrap",
    fixedWeekCount: true,
    showNonCurrentDates: true,
    aspectRatio: 1.5,
    dayMaxEvents: true, // FullCalendar 默認 "+n more" 功能
    eventOrder: "created_at,-title",
    eventClick: function(info) {
        const workoutId = info.event.id;
        fetchWorkoutDetail(workoutId);
    },
    // 監聽月份切換事件
    datesSet: function(info) {
        const currentMonth = getCurrentViewMonth(calendar);

        // 檢查是否與之前的月份不同，避免重複請求
        if (!previousMonth || currentMonth.year !== previousMonth.year || currentMonth.month !== previousMonth.month) {
            loadWorkoutData(currentMonth.year, currentMonth.month);
            previousMonth = currentMonth;  // 更新為當前加載的月份
        }
    }
});

calendar.render();

// 獲取目前日曆顯示的月份（根據 fullCalendar 的視圖）
function getCurrentViewMonth(calendar) {
    const view = calendar.view;
    const start = view.currentStart;  // 視圖的起始日期
    const year = start.getFullYear();
    const month = start.getMonth() + 1; // getMonth() 從 0 開始，所以 +1
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
                const dateObj = new Date(workout.created_at);
                    
                // 提取年份、月份、日期
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                
                const startDate = `${year}-${month}-${day}`;
                calendar.addEvent({
                    id: workout.id,
                    title: workout.title,
                    start: startDate,
                    allDay: true,
                    created_at: workout.created_at,
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
    const dateObj = new Date(workout.created_at);
    const formattedDate = dateObj.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false  // 使用 24 小时制
    }).replace(/\//g, "/").replace(/, /g, " "); // 轉換日期格式，並移除默認的逗號

    const modalContent = `
        <div class="modal-content">
            <img src="/static/images/remove.png" class="remove-btn" alt="remove">
            <h2>${workout.title}</h2>
            <p>${formattedDate}</p>
            <ul>
                ${workout.workout_items.map(item => `
                    <li>
                        <strong>${item.exercise_name}</strong>
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