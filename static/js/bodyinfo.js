// 1. 變數定義
// --------------------------------------------------
// 通用變數
let bmr, tdee, tef, neat, eee;
let bodyStatsChart = null;
let currentForm = "Male";
const editBodyBtn = document.getElementById("edit-body-btn");

// 身體資訊編輯相關按鈕
const maleForm = document.getElementById("male-form");
const messageContainerMale = document.getElementById("male-form-message");
const saveBodyBtnMale = document.getElementById("save-body-btn-male");
const cancelBodyBtnMale = document.getElementById("cancel-body-btn-male");
const maleInputs = [
    document.getElementById("male-height"),
    document.getElementById("male-weight"),
    document.getElementById("male-age"),
    document.getElementById("male-neck"),
    document.getElementById("male-waist"),
    document.getElementById("male-activity-level")
];

const femaleForm = document.getElementById("female-form");
const messageContainerFemale = document.getElementById("female-form-message");
const saveBodyBtnFemale = document.getElementById("save-body-btn-female");
const cancelBodyBtnFemale = document.getElementById("cancel-body-btn-female");
const femaleInputs = [
    document.getElementById("female-height"),
    document.getElementById("female-weight"),
    document.getElementById("female-age"),
    document.getElementById("female-neck"),
    document.getElementById("female-waist"),
    document.getElementById("female-hip"),
    document.getElementById("female-activity-level")
];

// 緩存變數
let originalMaleValues = maleInputs.map(input => input.value);
let originalFemaleValues = femaleInputs.map(input => input.value);

// 2. 功能函數定義
// --------------------------------------------------
// 開啟/取消編輯模式
function enableEditMode(inputs, saveBtn, cancelBtn) {
    inputs.forEach(input => input.disabled = false);
    editBodyBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
}

function cancelEditMode(inputs, originalValues, saveBtn, cancelBtn) {
    inputs.forEach((input, index) => {
        input.value = originalValues[index];
        input.disabled = true;
        input.classList.remove("is-invalid", "is-valid");
    });
    editBodyBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
    messageContainerMale.style.display = "none";
    messageContainerFemale.style.display = "none";
}

// 個人身體資訊表單顯示
function showMaleForm() {
    maleForm.style.display = "block";
    femaleForm.style.display = "none";
    document.getElementById("male-btn").classList.add("active");
    document.getElementById("female-btn").classList.remove("active");
    cancelEditMode(femaleInputs, originalFemaleValues, saveBodyBtnFemale, cancelBodyBtnFemale);
    currentForm = "Male";
}

function showFemaleForm() {
    maleForm.style.display = "none";
    femaleForm.style.display = "block";
    document.getElementById("male-btn").classList.remove("active");
    document.getElementById("female-btn").classList.add("active");
    cancelEditMode(maleInputs, originalMaleValues, saveBodyBtnMale, cancelBodyBtnMale);
    currentForm = "Female";
}

async function fetchBodyHistory() {
    try {
        const response = await fetch("/api/profile/bodyhistory", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const bodyHistory = await response.json();

            if (bodyHistory && bodyHistory.length > 0) {
                updateBodyStatsChart(bodyHistory);;
            } else {
                updateBodyStatsChart([]);
            }
        } else {
            console.error("Failed to fetch body history:", response.statusText);
            updateBodyStatsChart([]);
        }
    } catch (error) {
        console.error("Error fetching body history:", error);
        updateBodyStatsChart([]);
    }
}

// 收集表單數據
function collectBodyInfo(gender) {
    let data = {};

    if (gender === "Male") {
        data = {
            gender: "Male",
            height: parseFloat(document.getElementById("male-height").value),
            weight: parseFloat(document.getElementById("male-weight").value),
            age: parseInt(document.getElementById("male-age").value),
            neck_circumference: parseFloat(document.getElementById("male-neck").value),
            waist_circumference: parseFloat(document.getElementById("male-waist").value),
            activity_level: extractActivityLevel(document.getElementById("male-activity-level").value)
        };
    } else if (gender === "Female") {
        data = {
            gender: "Female",
            height: parseFloat(document.getElementById("female-height").value),
            weight: parseFloat(document.getElementById("female-weight").value),
            age: parseInt(document.getElementById("female-age").value),
            neck_circumference: parseFloat(document.getElementById("female-neck").value),
            waist_circumference: parseFloat(document.getElementById("female-waist").value),
            hip_circumference: parseFloat(document.getElementById("female-hip").value),
            activity_level: extractActivityLevel(document.getElementById("female-activity-level").value)
        };
    }
    return data;
}

function extractActivityLevel(value) {
    return value.split(":")[0].trim();
}

// 檢查必填欄位是否有值
function checkRequiredFields(form) {
    const requiredFields = form.querySelectorAll(".required");
    let valid = true;

    requiredFields.forEach(field => {
        if (!field.value) {
            valid = false;
            field.classList.add("is-invalid");
        } else {
            field.classList.remove("is-invalid");
        }
    });

    return valid;
}

// 顯示提示消息
function showToast(message, success = true) {
    const toast = document.getElementById("toast");
    if (!toast) {
        createToastElement();
    }
    toast.textContent = message;
    toast.style.backgroundColor = success ? "#28a745" : "#dc3545";
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 5000);
}

function createToastElement() {
    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
}

// 將表單數據發送到後端
async function sendBodyInfo(data, inputs, saveBtn, cancelBtn) {
    const response = await fetch("/api/profile/upload-bodyinfo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        showToast("Body information updated successfully!", true);
        
        inputs.forEach(input => input.disabled = true);
        
        editBodyBtn.style.display = "inline-block";
        saveBtn.style.display = "none";
        cancelBtn.style.display = "none";

        await fetchBodyInformation();
        await fetchBodyHistory();
    } else {
        showToast("Failed to update body information.", false);
    }
}

function disableInputs(inputs) {
    inputs.forEach(input => input.disabled = true);
}

function hideSaveMessageAfterDelay(messageContainer, delay = 5000) {
    setTimeout(() => {
        messageContainer.style.display = "none";
    }, delay);
}

// 3. 事件監聽器添加
// --------------------------------------------------
// 頁面初始化
fetchBodyInformation();
fetchBodyHistory();
createToastElement();

editBodyBtn.addEventListener("click", () => {
    if (currentForm === "Male") {
        enableEditMode(maleInputs, saveBodyBtnMale, cancelBodyBtnMale);
    } else if (currentForm === "Female") {
        enableEditMode(femaleInputs, saveBodyBtnFemale, cancelBodyBtnFemale);
    }
});

cancelBodyBtnMale.addEventListener("click", () => {
    cancelEditMode(maleInputs, originalMaleValues, saveBodyBtnMale, cancelBodyBtnMale);
});

cancelBodyBtnFemale.addEventListener("click", () => {
    cancelEditMode(femaleInputs, originalFemaleValues, saveBodyBtnFemale, cancelBodyBtnFemale);
});

// 保存男性表單數據
document.getElementById("male-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (checkRequiredFields(document.getElementById("male-form"))) {
        const data = collectBodyInfo("Male");
        await sendBodyInfo(data, maleInputs, saveBodyBtnMale, cancelBodyBtnMale);
    } else {
        showToast("Please fill in all required fields.", false);
    }
});

// 保存女性表單數據
document.getElementById("female-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (checkRequiredFields(document.getElementById("female-form"))) {
        const data = collectBodyInfo("Female");
        await sendBodyInfo(data, femaleInputs, saveBodyBtnFemale, cancelBodyBtnFemale);
    } else {
        showToast("Please fill in all required fields.", false);
    }
});