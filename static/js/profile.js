// 1. 變數定義
// --------------------------------------------------
// 通用變數
const usernameTitle = document.getElementById("username-title");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
let bmr, tdee, tef, neat, eee;

// 頭像編輯相關變數
const editAvatarBtn = document.getElementById("edit-avatar-btn");
const deleteAvatarBtn = document.getElementById("delete-avatar-btn");
const avatarForm = document.getElementById("avatar-form");
const avatarInput = document.getElementById("avatar-input");
const confirmAvatarBtn = document.getElementById("confirm-avatar-btn");
const cancelAvatarBtn = document.getElementById("cancel-avatar-btn");
const avatar = document.getElementById("avatar-img");

// 帳戶資訊編輯相關按鈕
const editPersonalBtn = document.getElementById("edit-personal-btn");
const savePersonalBtn = document.getElementById("save-personal-btn");
const cancelPersonalBtn = document.getElementById("cancel-personal-btn");
const editPasswordBtn = document.getElementById("edit-password-btn");
const savePasswordBtn = document.getElementById("save-password-btn");
const cancelPasswordBtn = document.getElementById("cancel-password-btn");

// 身體資訊編輯相關按鈕
const messageContainerMale = document.getElementById("male-form-message");
const editBodyBtnMale = document.getElementById("edit-body-btn-male");
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

const messageContainerFemale = document.getElementById("female-form-message");
const editBodyBtnFemale = document.getElementById("edit-body-btn-female");
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

// 電子郵件錯誤提示
const emailErrorText = document.createElement("small");
emailErrorText.style.color = "red";
emailInput.parentNode.appendChild(emailErrorText);

// 密碼狀態提示
const passwordStatus = document.createElement("small");
const newPasswordStatus = document.createElement("small");
const confirmPasswordStatus = document.createElement("small");
currentPasswordInput.parentNode.appendChild(passwordStatus);
newPasswordInput.parentNode.appendChild(newPasswordStatus);
confirmPasswordInput.parentNode.appendChild(confirmPasswordStatus);

// 緩存變數
let cachedPassword = null;
let debounceTimeout = null;
let originalMaleValues = maleInputs.map(input => input.value);
let originalFemaleValues = femaleInputs.map(input => input.value);

// 2. 功能函數定義
// --------------------------------------------------

// 初始化 Profile 頁面
function initializeProfilePage() {
    if (currentUserInfo) {
        usernameTitle.textContent = currentUserInfo.username;
        usernameInput.value = currentUserInfo.username;
        emailInput.value = currentUserInfo.email;
        if (currentUserInfo.profile_image_url) {
            avatar.src = currentUserInfo.profile_image_url;
        }
    } else {
        console.error("User information is not available.");
        window.location.href = "/";
    }
}

// 開啟/取消編輯模式
function enableEditMode(inputs, editBtn, saveBtn, cancelBtn) {
    inputs.forEach(input => input.disabled = false);
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
}

function cancelEditMode(inputs, originalValues, editBtn, saveBtn, cancelBtn) {
    inputs.forEach((input, index) => {
        input.value = originalValues[index];
        input.disabled = true;
        input.classList.remove("is-invalid", "is-valid");
    });
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
    messageContainerMale.style.display = "none";
    messageContainerFemale.style.display = "none";
}

// 驗證並更新使用者信息
async function validateAndUpdatePersonalInfo(username, email, token) {
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

        return true;
    } else {
        alert("Failed to update personal information, please try again.");
        return false;
    }
}

// 密碼相關功能
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

function resetPasswordInputs() {
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";

    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;

    passwordStatus.textContent = "";
    newPasswordStatus.textContent = "";
    confirmPasswordStatus.textContent = "";
}

// 頭像上傳和刪除
function setUploadingState(isUploading) {
    const uploadSpinner = document.getElementById("upload-spinner");
    const uploadText = document.getElementById("upload-text");

    if (isUploading) {
        uploadSpinner.style.display = "inline-block";
        uploadText.textContent = "Saving...";
        confirmAvatarBtn.classList.add("disabled");
        confirmAvatarBtn.disabled = true;
    } else {
        uploadSpinner.style.display = "none";
        uploadText.textContent = "Save Changes";
        confirmAvatarBtn.classList.remove("disabled");
        confirmAvatarBtn.disabled = false;
    }
}

async function uploadAvatar(formData) {
    const response = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: formData
    });

    return await response.json();
}

function updateAvatarImage(imageUrl) {
    avatar.src = imageUrl;
}

function deleteAvatarImage(event) {
    event.preventDefault();
    
    fetch("/api/profile/delete-avatar", {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token"),
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "ok") {
            // 更新前端顯示的頭像
            avatar.src = "/static/images/user.png";
            confirmAvatarBtn.style.display = "none";
            avatarForm.style.display = "none";
            editAvatarBtn.style.display = "block";
        }
    })
    .catch(error => {
        console.error("Error deleting avatar:", error);
    });
}
// 個人身體資訊表單顯示
function showMaleForm() {
    document.getElementById("male-form").style.display = "block";
    document.getElementById("female-form").style.display = "none";
    document.getElementById("male-btn").classList.add("active");
    document.getElementById("female-btn").classList.remove("active");
    cancelEditMode(femaleInputs, originalFemaleValues, editBodyBtnFemale, saveBodyBtnFemale, cancelBodyBtnFemale);
}

function showFemaleForm() {
    document.getElementById("male-form").style.display = "none";
    document.getElementById("female-form").style.display = "block";
    document.getElementById("male-btn").classList.remove("active");
    document.getElementById("female-btn").classList.add("active");
    cancelEditMode(maleInputs, originalMaleValues, editBodyBtnMale, saveBodyBtnMale, cancelBodyBtnMale);
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
function showSaveMessage(messageContainer, message, success = true) {
    messageContainer.textContent = message;
    messageContainer.className = success ? "text-success" : "text-danger";
    messageContainer.style.display = "block";
}

// 將表單數據發送到後端
async function sendBodyInfo(data, messageContainer) {
    const response = await fetch("/api/profile/upload-bodyinfo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        showSaveMessage(messageContainer, "Body information updated successfully!", true);
    } else {
        showSaveMessage(messageContainer, "Failed to update body information.", false);
    }
}

// 3. 事件監聽器添加
// --------------------------------------------------
// 頁面初始化
fetchBodyInformation();
renderTDEEPercentage();
fetchBodyHistory();

// 頭像編輯相關事件
editAvatarBtn.addEventListener("click", function() {
    editAvatarBtn.style.display = "none";
    avatarForm.style.display = "block";
});

avatarInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            avatar.src = e.target.result;
            confirmAvatarBtn.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

deleteAvatarBtn.addEventListener("click", deleteAvatarImage);

cancelAvatarBtn.addEventListener("click", function() {
    if (currentUserInfo.profile_image_url) {
        avatar.src = currentUserInfo.profile_image_url;
    } else {
        avatar.src = "/static/images/user.png";
    }
    avatarInput.value = "";
    avatarForm.style.display = "none";
    confirmAvatarBtn.style.display = "none";
    editAvatarBtn.style.display = "block";
});

// 頭像上傳處理
avatarForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const file = avatarInput.files[0];
    
    if (file) {
        const formData = new FormData();
        formData.append("image", file);

        setUploadingState(true);

        uploadAvatar(formData)
            .then(data => {
                if (data.status === "ok") {
                    updateAvatarImage(data.profile_image_url);
                }
            })
            .catch(error => {
                console.error("Failed to upload avatar：", error);
                alert("Failed to upload avatar, please try again.");
            })
            .finally(() => {
                setUploadingState(false);
                confirmAvatarBtn.style.display = "none";
                avatarForm.style.display = "none";
                editAvatarBtn.style.display = "block";
            });
    }
});

// 開啟/取消個人信息編輯模式
editPersonalBtn.addEventListener("click", function() {
    enableEditMode([usernameInput, emailInput], editPersonalBtn, savePersonalBtn, cancelPersonalBtn);
});

cancelPersonalBtn.addEventListener("click", function() {
    cancelEditMode([usernameInput, emailInput], [currentUserInfo.username, currentUserInfo.email], editPersonalBtn, savePersonalBtn, cancelPersonalBtn);
    usernameTitle.textContent = currentUserInfo.username;
    usernameInput.value = currentUserInfo.username;
    emailInput.value = currentUserInfo.email;
    emailErrorText.textContent = "";
    emailInput.style.backgroundColor = "#e9ecef";
});

// 保存個人信息
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

// 密碼相關事件監聽
editPasswordBtn.addEventListener("click", function() {
    enableEditMode([currentPasswordInput], editPasswordBtn, savePasswordBtn, cancelPasswordBtn);
    resetPasswordInputs();  // 清除狀態信息 
    savePasswordBtn.disabled = true;  // 禁用 Save 按鈕 
});

cancelPasswordBtn.addEventListener("click", function() {
    resetPasswordInputs();
    currentPasswordInput.value = "";
    currentPasswordInput.disabled = true;
    editPasswordBtn.style.display = "inline-block";
    savePasswordBtn.style.display = "none";
    cancelPasswordBtn.style.display = "none";
});

// 驗證當前密碼
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
    const newPasswordValid = validatePassword(newPasswordInput.value);

    if (newPasswordValid) {
        newPasswordStatus.textContent = "✔ Valid password";
        newPasswordStatus.style.color = "green";
        confirmPasswordInput.disabled = false;
    } else {
        newPasswordStatus.textContent = "✘ The password must be at least 8 characters long and contain at least 1 number, 1 uppercase letter, and 1 lowercase letter";
        newPasswordStatus.style.color = "red";
        confirmPasswordInput.disabled = true;
        savePasswordBtn.disabled = true;
    }

    // 檢查 Confirm Password 是否與 New Password 匹配
    if (confirmPasswordInput.value !== "" && confirmPasswordInput.value !== newPasswordInput.value) {
        confirmPasswordStatus.textContent = "✘ Passwords do not match";
        confirmPasswordStatus.style.color = "red";
        savePasswordBtn.disabled = true;
    } else if (newPasswordValid && confirmPasswordInput.value === newPasswordInput.value) {
        confirmPasswordStatus.textContent = "✔ Passwords match";
        confirmPasswordStatus.style.color = "green";
        savePasswordBtn.disabled = false;
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
        currentPasswordInput.value = "";
        currentPasswordInput.disabled = true;
        editPasswordBtn.style.display = "inline-block";
        savePasswordBtn.style.display = "none";
        cancelPasswordBtn.style.display = "none";
    } else {
        alert("Failed to update password, plaese try again.");
    }
});

// 男性身體資訊編輯事件
editBodyBtnMale.addEventListener("click", () => {
    enableEditMode(maleInputs, editBodyBtnMale, saveBodyBtnMale, cancelBodyBtnMale);
});

cancelBodyBtnMale.addEventListener("click", () => {
    cancelEditMode(maleInputs, originalMaleValues, editBodyBtnMale, saveBodyBtnMale, cancelBodyBtnMale);
});

// 保存男性表單數據
document.getElementById("male-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (checkRequiredFields(document.getElementById("male-form"))) {
        const data = collectBodyInfo("Male");
        sendBodyInfo(data, messageContainerMale);
        editBodyBtnMale.style.display = "inline-block";
        saveBodyBtnMale.style.display = "none";
        cancelBodyBtnMale.style.display = "none";
        messageContainerMale.style.display = "none";
    } else {
        showSaveMessage(messageContainerMale, "Please fill in all required fields.", false);
    }
});

// 女性身體資訊編輯事件
editBodyBtnFemale.addEventListener("click", () => {
    enableEditMode(femaleInputs, editBodyBtnFemale, saveBodyBtnFemale, cancelBodyBtnFemale);
});

cancelBodyBtnFemale.addEventListener("click", () => {
    cancelEditMode(femaleInputs, originalFemaleValues, editBodyBtnFemale, saveBodyBtnFemale, cancelBodyBtnFemale);
});

// 保存女性表單數據
document.getElementById("female-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (checkRequiredFields(document.getElementById("female-form"))) {
        const data = collectBodyInfo("Female");
        sendBodyInfo(data, messageContainerFemale);
        editBodyBtnFemale.style.display = "inline-block";
        saveBodyBtnFemale.style.display = "none";
        cancelBodyBtnFemale.style.display = "none";
        messageContainerFemale.style.display = "none";
    } else {
        showSaveMessage(messageContainerFemale, "Please fill in all required fields.", false);
    }
});