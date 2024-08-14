// 定義變數 
const usernameTitle = document.getElementById("username-title");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const emailErrorText = document.createElement("small");  // 用於顯示 Email 錯誤信息 
emailErrorText.style.color = "red";
emailInput.parentNode.appendChild(emailErrorText);

const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const passwordStatus = document.createElement("small");  // 用於顯示當前密碼驗證狀態 
const newPasswordStatus = document.createElement("small");  // 用於顯示新密碼驗證狀態 
const confirmPasswordStatus = document.createElement("small");  // 用於顯示確認密碼驗證狀態 
currentPasswordInput.parentNode.appendChild(passwordStatus);
newPasswordInput.parentNode.appendChild(newPasswordStatus);
confirmPasswordInput.parentNode.appendChild(confirmPasswordStatus);

const editPersonalBtn = document.getElementById("edit-personal-btn");
const savePersonalBtn = document.getElementById("save-personal-btn");
const cancelPersonalBtn = document.getElementById("cancel-personal-btn");
const editPasswordBtn = document.getElementById("edit-password-btn");
const savePasswordBtn = document.getElementById("save-password-btn");
const cancelPasswordBtn = document.getElementById("cancel-password-btn");

let cachedPassword = null;  // 緩存已經驗證的密碼 
let debounceTimeout = null; // 防抖的 timeout 

// 定義函數 
// 初始化 Profile 頁面 
function initializeProfilePage() {
    if (currentUserInfo) {
        usernameTitle.textContent = currentUserInfo.username;
        usernameInput.value = currentUserInfo.username;
        emailInput.value = currentUserInfo.email;
    } else {
        console.error("User information is not available.");
        window.location.href = "/introduction";
    }
}
// 開啟編輯模式
function enableEditMode(inputs, editBtn, saveBtn, cancelBtn) {
    inputs.forEach(input => input.disabled = false);
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
}
// 取消編輯模式 
function cancelEditMode(inputs, originalValues, editBtn, saveBtn, cancelBtn) {
    inputs.forEach((input, index) => {
        input.value = originalValues[index];
        input.disabled = true;
    });
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
}
// 驗證電子郵件並更新使用者資訊 
async function validateAndUpdatePersonalInfo(username, email, token) {
    // 檢查 Email 是否重複
    const emailCheckResponse = await fetch("/api/profile/check-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email })
    });

    const emailCheckData = await emailCheckResponse.json();

    if (!emailCheckData.isAvailable) {
        emailErrorText.textContent = "This Email is already in use";
        emailInput.style.backgroundColor = "#f8d7da"; 
        return false;
    }

    // 如果 Email 未重複，保存使用者資訊 
    const response = await fetch("/api/profile/update-user-info", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username, email })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);

        currentUserInfo.username = username;
        currentUserInfo.email = email;
        usernameTitle.textContent = currentUserInfo.username;

        alert("Personal information updated successfully.");
        return true;
    } else {
        alert("Failed to update personal information.");
        return false;
    }
}
// 驗證密碼 
async function verifyPassword(inputPassword) {
    if (inputPassword === cachedPassword) {
        return { isPasswordCorrect: true };
    }

    const token = localStorage.getItem("token");
    const response = await fetch("/api/profile/verify-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: inputPassword })
    });

    const data = await response.json();

    if (data.isPasswordCorrect) {
        cachedPassword = inputPassword;
    }

    return data;
}
// 重置密碼編輯狀態 
function resetPasswordInputs() {
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";

    currentPasswordInput.disabled = true;
    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;

    passwordStatus.textContent = "";
    newPasswordStatus.textContent = "";
    confirmPasswordStatus.textContent = "";
}

// 主邏輯和事件監聽 
// 開啟 Personal Info 編輯模式
editPersonalBtn.addEventListener("click", function() {
    enableEditMode([usernameInput, emailInput], editPersonalBtn, savePersonalBtn, cancelPersonalBtn);
});
// 取消 Personal Info 編輯模式
cancelPersonalBtn.addEventListener("click", function() {
    cancelEditMode([usernameInput, emailInput], [currentUserInfo.username, currentUserInfo.email], editPersonalBtn, savePersonalBtn, cancelPersonalBtn);
});
// 保存使用者資訊 
document.getElementById("personal-info-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    emailErrorText.textContent = "";
    emailInput.style.backgroundColor = "";

    if (!usernameInput.value.trim() || !emailInput.value.trim()) {
        alert("Please fill in both Username and Email.");
        return;
    }

    const token = localStorage.getItem("token");
    const success = await validateAndUpdatePersonalInfo(usernameInput.value, emailInput.value, token);

    if (success) {
        usernameInput.disabled = true;
        emailInput.disabled = true;
        editPersonalBtn.style.display = "inline-block";
        savePersonalBtn.style.display = "none";
        cancelPersonalBtn.style.display = "none";
    }
});
// 開啟 Password Info 編輯模式
editPasswordBtn.addEventListener("click", function() {
    enableEditMode([currentPasswordInput], editPasswordBtn, savePasswordBtn, cancelPasswordBtn);
    resetPasswordInputs();  // 清除狀態資訊 
    savePasswordBtn.disabled = true;  // 禁用 Save 按鈕 
});
// 取消 Password Info 編輯模式
cancelPasswordBtn.addEventListener("click", function() {
    resetPasswordInputs();
    editPasswordBtn.style.display = "inline-block";
    savePasswordBtn.style.display = "none";
    cancelPasswordBtn.style.display = "none";
});
// 驗證目前密碼 
currentPasswordInput.addEventListener("input", function() {
    clearTimeout(debounceTimeout);

    if (currentPasswordInput.value.trim() === "") {
        passwordStatus.textContent = "";
        newPasswordInput.disabled = true;
        confirmPasswordInput.disabled = true;
        savePasswordBtn.disabled = true;
        return;
    }

    debounceTimeout = setTimeout(async function() {
        const result = await verifyPassword(currentPasswordInput.value);

        if (result.isPasswordCorrect) {
            passwordStatus.textContent = "✔ Correct password";
            passwordStatus.style.color = "green";
            newPasswordInput.disabled = false;
        } else {
            passwordStatus.textContent = "✘ Wrong password";
            passwordStatus.style.color = "red";
            newPasswordInput.disabled = true;
            confirmPasswordInput.disabled = true;
            savePasswordBtn.disabled = true;
        }
    }, 1000);
});
// 驗證新設密碼 
newPasswordInput.addEventListener("input", function() {
    if (validatePassword(newPasswordInput.value)) {
        newPasswordStatus.textContent = "✔ Valid password";
        newPasswordStatus.style.color = "green";
        confirmPasswordInput.disabled = false;
    } else {
        newPasswordStatus.textContent = "✘ The password must be at least 8 characters long and contain at least 1 number, 1 uppercase letter, and 1 lowercase letter";
        newPasswordStatus.style.color = "red";
        confirmPasswordInput.disabled = true;
        savePasswordBtn.disabled = true;
    }
});
// 驗證確認密碼 
confirmPasswordInput.addEventListener("input", function() {
    if (confirmPasswordInput.value === newPasswordInput.value) {
        confirmPasswordStatus.textContent = "✔ Passwords match";
        confirmPasswordStatus.style.color = "green";
        savePasswordBtn.disabled = false;
    } else {
        confirmPasswordStatus.textContent = "✘ Passwords do not match";
        confirmPasswordStatus.style.color = "red";
        savePasswordBtn.disabled = true;
    }
});
// 保存密碼修改 
document.getElementById("password-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    const response = await fetch("/api/profile/update-user-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPasswordInput.value })
    });

    if (response.ok) {
        alert("Password updated successfully.");
        resetPasswordInputs();
        editPasswordBtn.style.display = "inline-block";
        savePasswordBtn.style.display = "none";
        cancelPasswordBtn.style.display = "none";
    } else {
        alert("Failed to update password.");
    }
});

// Sample data for Body Stats Chart (you can replace this with real data)
// const ctx = document.getElementById("bodyStatsChart").getContext("2d");
// const bodyStatsChart = new Chart(ctx, {
//     type: "line",
//     data: {
//         labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
//         datasets: [{
//             label: "Weight (kg)",
//             data: [70, 69, 68, 67, 66, 65],
//             borderColor: "rgba(75, 192, 192, 1)",
//             backgroundColor: "rgba(75, 192, 192, 0.2)",
//             fill: true,
//         },
//         {
//             label: "Body Fat (%)",
//             data: [20, 19, 18, 17, 16, 15],
//             borderColor: "rgba(153, 102, 255, 1)",
//             backgroundColor: "rgba(153, 102, 255, 0.2)",
//             fill: true,
//         }]
//     },
//     options: {
//         scales: {
//             y: {
//                 beginAtZero: true
//             }
//         }
//     }
// });