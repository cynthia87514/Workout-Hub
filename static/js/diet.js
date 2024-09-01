// 定義變數
let bodyInformation = null;
const ctxLeft = document.getElementById("calories-chart-left").getContext("2d");
const ctxIntake = document.getElementById("calories-chart-intake").getContext("2d");
const bmrValueUp = document.getElementById("bmr-value-up");
const bmrValueDown = document.getElementById("bmr-value-down");
const tdeeValueUp = document.getElementById("tdee-value-up");
const tdeeValueDown = document.getElementById("tdee-value-down");
const multipleElement = document.getElementById("multiple");
const numberElement = document.getElementById("number");
const goalSelect = document.getElementById("goal-select");
const caloriesLeft = document.getElementById("calories-left");
const intakeForm = document.getElementById("intake-form");

const goalMultipliers = {
    "aggressive-fat-loss": 0.80,
    "standard-fat-loss": 0.85,
    "minimal-fat-loss": 0.90,
    "maintenance": 1.00,
    "minimal-muscle-gain": 1.05,
    "standard-muscle-gain": 1.10,
    "aggressive-muscle-gain": 1.15
};

// Calories Left Today 圖表初始化
const caloriesLeftChart = new Chart(ctxLeft, {
    type: "doughnut",
    data: {
        labels: ["Left", "Consume"],
        datasets: [{
            data: [0.0001, 0.0001],
            backgroundColor: ["#ffffff"],
            borderWidth: 1,
            borderColor: ["#cccccc"]
        }]
    },
    options: {
        cutout: "70%",
        responsive: true
    }
});

// Macros Intake Today 圖表初始化
const caloriesIntakeChart = new Chart(ctxIntake, {
    type: "doughnut",
    data: {
        labels: ["Protein", "Carbs", "Fats"],
        datasets: [{
            data: [0.0001, 0.0001, 0.0001],
            backgroundColor: ["#ffffff"],
            borderWidth: 1,
            borderColor: ["#cccccc"]
        }]
    },
    options: {
        cutout: "70%",
        responsive: true
    }            
});

// 初始化
initialize();

// 定義函數
// --------------------------------------------------
// 初始化流程
async function initialize() {
    await fetchBodyInformation();
    updateCaloriesToConsume();
    fetchTodayDietRecords();

    // 添加事件監聽
    // --------------------------------------------------
    // 改變 Goal 下拉選單
    goalSelect.addEventListener("change", updateCaloriesToConsume);
    // 提交 Intake 表單
    intakeForm.addEventListener("submit", handleFormSubmit);
}

// 取得使用者的 BMR 和 TDEE
async function fetchBodyInformation() {
    const response = await fetch("/api/profile/bodyinfo", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (response.ok) {
        const bodyInfo = await response.json();
        if (!bodyInfo.gender && !bodyInfo.height && !bodyInfo.weight && !bodyInfo.age) {
            bodyInformation = null;
        } else {
            bodyInformation = {
                "bmr": bodyInfo.bmr,
                "tdee": bodyInfo.tdee
            };
            renderPage();
        }
    } else {
        console.error("Failed to get body information.");
    }
}

// 渲染初始畫面
function renderPage() {
    bmrValueUp.textContent = "According to your body information,";
    bmrValueDown.textContent = `your BMR is ${bodyInformation.bmr} kcal`;
    bmrValueDown.style.color = "#b12b24";
    tdeeValueUp.textContent = "According to your body information,";
    tdeeValueDown.textContent = `your TDEE is ${bodyInformation.tdee} kcal`;
    tdeeValueDown.style.color = "#b12b24";
}

// 更新 Calories to Consume 中的乘數和結果
function updateCaloriesToConsume() {
    const selectedGoal = goalSelect.value;
    const multiplier = goalMultipliers[selectedGoal];
    
    multipleElement.textContent = multiplier.toFixed(2);

    if (bodyInformation && bodyInformation.tdee) {
        const calculatedCalories = (bodyInformation.tdee * multiplier).toFixed(2);
        numberElement.textContent = `${calculatedCalories} kcal`;

        fetchTodayDietRecords();
    } else {
        numberElement.textContent = `? kcal`;
        resetCaloriesChart();
    }
}

// 取得所有今日飲食記錄
async function fetchTodayDietRecords() {
    const response = await fetch("/api/diet", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (response.ok) {
        const dietRecords = await response.json();
        let totalConsumedCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;

        // 先清空表格中的已有記錄
        const tableBody = document.getElementById("diet-records");
        tableBody.innerHTML = "";

        dietRecords.diets.forEach(record => {
            appendDietRecord(record);
            totalConsumedCalories += record.calories;
            totalProtein += record.protein;
            totalCarbs += record.carbs;
            totalFats += record.fats;
        });

        updateCaloriesLeftAfterFetch(totalConsumedCalories);
        updateMacrosIntakeChart(totalProtein, totalCarbs, totalFats, totalConsumedCalories);
    } else {
        console.error("Failed to fetch today's diet records.");
    }
}

// 動態添加 Diet 記錄到表格
function appendDietRecord(record) {
    const tableBody = document.getElementById("diet-records");
    const row = document.createElement("tr");

    const recordedTime = new Date(record.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    row.innerHTML = `
        <td>${record.food}</td>
        <td>${record.quantity}</td>
        <td>${record.calories}</td>
        <td>${record.protein}</td>
        <td>${record.carbs}</td>
        <td>${record.fats}</td>
        <td>${recordedTime}</td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="deleteDietRecord(${record.id}, this)">Delete</button>
        </td>
    `;

    tableBody.appendChild(row);
}

// 更新 Calories Left Today 數值
function updateCaloriesLeftAfterFetch(consumedCalories) {
    if (!bodyInformation || isNaN(consumedCalories)) {
        resetCaloriesChart();
        return;
    }

    const totalCalories = parseFloat(numberElement.textContent.split(" ")[0]);
    let remainingCalories = totalCalories - consumedCalories;

    if (remainingCalories <= 0) {
        remainingCalories = 0;
    }

    const leftPercentage = ((remainingCalories / totalCalories) * 100).toFixed(2);
    const consumePercentage = ((consumedCalories / totalCalories) * 100).toFixed(2);

    // 更新 Calories Left Today 圖表
    caloriesLeftChart.data.labels = [
        `Left (${leftPercentage}%)`, 
        `Consume (${consumePercentage}%)`
    ];
    caloriesLeftChart.data.datasets[0].data = [remainingCalories, consumedCalories];
    caloriesLeftChart.data.datasets[0].backgroundColor = ["#b12b24", "#C9DABF"];
    caloriesLeftChart.data.datasets[0].borderColor = ["#b12b24", "#C9DABF"];
    caloriesLeft.textContent = `${remainingCalories.toFixed(2)} kcal`;
    caloriesLeftChart.update();
}

// 將 Calories Left Today 圖表重置為初始狀態
function resetCaloriesChart() {
    caloriesLeftChart.data.datasets[0].data = [0.0001, 0.0001];
    caloriesLeftChart.data.datasets[0].backgroundColor = ["#ffffff"];
    caloriesLeftChart.data.datasets[0].borderColor = ["#cccccc"];
    caloriesLeftChart.update();
    caloriesLeft.textContent = `? kcal`;
}

// 更新 Macros Intake Today 圖表
function updateMacrosIntakeChart(protein, carbs, fats, totalConsumedCalories) {
    if (protein === 0 && carbs === 0 && fats === 0) {
        resetMacrosChart();
    } else {
        const totalMacros = protein + carbs + fats;

        // 更新 Macros Intake Today 圖表
        caloriesIntakeChart.data.datasets[0].data = [protein, carbs, fats];
        caloriesIntakeChart.data.datasets[0].backgroundColor = ["#A3B9CC", "#7B91AE", "#5A7495"];
        caloriesIntakeChart.data.datasets[0].borderColor = ["#A3B9CC", "#7B91AE", "#5A7495"];
        caloriesIntakeChart.options.plugins.tooltip.callbacks = {
            label: function (tooltipItem) {
                const value = tooltipItem.raw;
                const percentage = ((value / totalMacros) * 100).toFixed(2);
                return `${tooltipItem.label}: ${value.toFixed(2)} g (${percentage}%)`;
            }
        };
        caloriesIntakeChart.update();
        document.getElementById("calories-intake").textContent = `${totalConsumedCalories.toFixed(2)} kcal`;
    }
}

// 將 Macros Intake Today 圖表重置到初始狀態
function resetMacrosChart() {
    caloriesIntakeChart.data.datasets[0].data = [0.0001, 0.0001, 0.0001];
    caloriesIntakeChart.data.datasets[0].backgroundColor = ["#ffffff"];
    caloriesIntakeChart.data.datasets[0].borderColor = ["#cccccc"];
    caloriesIntakeChart.update();
    document.getElementById("calories-intake").textContent = `? kcal`;
}

// 表單提交
function handleFormSubmit(event) {
    event.preventDefault();

    // 若顯示 "? kcal"，代表使用者尚未輸入身體資訊，阻止表單提交
    if (caloriesLeft.textContent === "? kcal") {
        showToast("Please go to Profile page, enter your body information to get more services.");
        return;
    }

    const form = document.getElementById("intake-form");
    const food = document.getElementById("food-input").value;
    const quantity = document.getElementById("quantity-input").value;
    const calories = document.getElementById("calories-input").value;
    const protein = document.getElementById("protein-input").value;
    const carbs = document.getElementById("carbs-input").value;
    const fats = document.getElementById("fats-input").value;

    const data = {
        food: food,
        quantity: parseFloat(quantity),
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats)
    };

    fetch("/api/diet", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.ok) {
            response.json().then(newRecord => {
                appendDietRecord(newRecord);
                updateCaloriesIntakeChart(data);
                fetchTodayDietRecords();
                form.reset();
            });
        } else {
            console.error("Failed to log intake");
        }
    }).catch(error => {
        console.error("Error:", error);
    });
}

// 顯示 Toast 提示
function showToast(message) {
    const toastContainer = document.createElement("div");
    toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toastContainer);

    const toast = new bootstrap.Toast(toastContainer.querySelector(".toast"));
    toast.show();

    // Toast 消失後自動移除容器
    toastContainer.addEventListener("hidden.bs.toast", () => {
        toastContainer.remove();
    });
}

// 更新 Calories Intake Today 圖表
function updateCaloriesIntakeChart(data) {
    const totalCalories = parseFloat(numberElement.textContent.split(" ")[0]);
    const consumedCalories = parseFloat(caloriesLeftChart.data.datasets[0].data[1]) + data.calories;
    const remainingCalories = totalCalories - consumedCalories;

    caloriesIntakeChart.data.datasets[0].data = [data.protein, data.carbs, data.fats];
    caloriesLeftChart.data.datasets[0].data = [remainingCalories, consumedCalories];
    caloriesIntakeChart.update();
    caloriesLeftChart.update();
}

// 刪除 Diet 記錄
function deleteDietRecord(id, btn) {
    fetch(`/api/diet/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    }).then(response => {
        if (response.ok) {
            const row = btn.parentNode.parentNode;
            row.parentNode.removeChild(row);

            fetchTodayDietRecords();
        } else {
            console.error("Failed to delete diet record.");
        }
    }).catch(error => {
        console.error("Error:", error);
    });
}