// 定義變數及初始化
let allExercises = [];
let selectedExercise = null;
let selectedExerciseName = "";

const filterCriteria = {
    bodyPart: null,
    equipment: null,
    category: null
};

const quickStartButton = document.querySelector(".qS-button");
const finishButton = document.querySelector(".finish");
const confirmationDialog = document.getElementById("confirmationDialog");
const saveButton = document.getElementById("saveButton");
const discardButton = document.getElementById("discardButton");
const workoutSection = document.querySelector(".workout");
const viewSection = document.querySelector(".view");
const addButton = document.querySelector(".add-button");
const addExerciseModal = document.getElementById("addExerciseModal");
const modalTitleButton = document.querySelector(".modal-title");
const exerciseSearchInput = document.getElementById("exerciseSearch");
const infoDialog = document.getElementById("infoDialog");
const dialogExerciseName = document.getElementById("dialogExerciseName");
const dialogImages = document.getElementById("dialogImages");
const dialogInstructions = document.getElementById("dialogInstructions");
const dialogCategory = document.getElementById("dialogCategory");

// 初始化
fetchExercises();
generateDropdownItems(); // 生成下拉選單項
toggleModalTitleButtonState(); // 初始化按鈕狀態

// 定義函數
// 從後端獲取運動數據
async function fetchExercises() {
    try {
        const response = await fetch("/api/exercises");
        const data = await response.json();
        allExercises = data; // 保存所有的運動項目數據
        generateExerciseList(data);
    } catch (error) {
        console.error("Error fetching exercises:", error);
    }
}
function base64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode("0x" + p1);
    }));
}
function base64Decode(str) {
    return decodeURIComponent(atob(str).split("").map(c => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
}
// 根據傳入的運動數據生成列表
function generateExerciseList(exercises) {
    const exerciseList = document.getElementById("exerciseList");
    const noResultsMessage = document.getElementById("noResultsMessage");

    exerciseList.innerHTML = ""; // 清空當前列表

    if (exercises.length === 0) {
        noResultsMessage.classList.remove("hide");
    } else {
        noResultsMessage.classList.add("hide");
        exercises.forEach(exercise => {
            const encodedExercise = base64Encode(JSON.stringify(exercise));
            const exerciseHTML = `
                <div class="exercise-item">
                    <img src="${exercise.images[0]}" alt="${exercise.name}" class="exercise-image">
                    <div class="exercise-info">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-body-part">${exercise.primary_muscles.join(", ")} / ${exercise.equipment}</div>
                    </div>
                    <img src="/static/images/info.png" alt="info" class="info-button" data-exercise="${encodedExercise}">
                </div>
            `;
            exerciseList.insertAdjacentHTML("beforeend", exerciseHTML);
        });

        document.querySelectorAll(".info-button").forEach(button => {
            button.addEventListener("click", (event) => {
                const exercise = JSON.parse(base64Decode(event.target.dataset.exercise));
                showInfoDialog(exercise);
            });
        });

        document.querySelectorAll(".exercise-item").forEach(item => {
            item.addEventListener("click", () => handleExerciseSelection(item));
        });
    }
}
function showInfoDialog(exercise) {
    dialogExerciseName.textContent = exercise.name;
    dialogImages.innerHTML = exercise.images.map(image => `<img src="${image}" alt="${exercise.name}" class="dialog-image">`).join("");
    dialogInstructions.innerHTML = exercise.instructions.map(instruction => `<li>${instruction}</li>`).join("");
    dialogCategory.textContent = exercise.category;
    infoDialog.showModal();
}
function closeInfoDialog() {
    infoDialog.close();
}
// 搜尋功能
function searchExercises() {
    const searchQuery = document.getElementById("exerciseSearch").value.toLowerCase();
    if (searchQuery === "") {
        generateExerciseList(allExercises);
    } else {
        const filteredExercises = allExercises.filter(exercise =>
            exercise.name.toLowerCase().includes(searchQuery) ||
            exercise.primary_muscles.some(muscle => muscle.toLowerCase().includes(searchQuery)) || // 檢查 primary_muscles 中的每個元素
            exercise.category.toLowerCase().includes(searchQuery)
        );
        generateExerciseList(filteredExercises);
    }
}
// 動態生成下拉選單項
function generateDropdownItems() {
    const bodyParts = ["abdominals", "hamstrings", "calves", "shoulders", "adductors", "glutes", "quadriceps", "biceps", "forearms", "abductors", "triceps", "chest", "lower back", "traps", "middle back", "lats", "neck"];
    const equipment = ["body only", "machine", "kettlebells", "dumbbell", "cable", "barbell", "bands", "medicine ball", "exercise ball", "e-z curl bar", "foam roll"];
    const categories = ["strength", "stretching", "plyometrics", "strongman", "powerlifting", "cardio", "olympic weightlifting"];

    const bodyPartDropdown = document.getElementById("bodyPartDropdown");
    const equipmentDropdown = document.getElementById("equipmentDropdown");
    const categoryDropdown = document.getElementById("categoryDropdown");

    bodyParts.forEach(part => {
        const itemHTML = `<div class="dropdown-item">${part}</div>`;
        bodyPartDropdown.insertAdjacentHTML("beforeend", itemHTML);
    });

    equipment.forEach(eq => {
        const itemHTML = `<div class="dropdown-item">${eq}</div>`;
        equipmentDropdown.insertAdjacentHTML("beforeend", itemHTML);
    });

    categories.forEach(cat => {
        const itemHTML = `<div class="dropdown-item">${cat}</div>`;
        categoryDropdown.insertAdjacentHTML("beforeend", itemHTML);
    });

    // 添加事件監聽
    document.querySelectorAll("#bodyPartDropdown .dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            filterByBodyPart(item.textContent);
        });
    });

    document.querySelectorAll("#equipmentDropdown .dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            filterByEquipment(item.textContent);
        });
    });

    document.querySelectorAll("#categoryDropdown .dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            filterByCategory(item.textContent);
        });
    });
}
// 切換下拉選單的顯示和隱藏
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isVisible = !dropdown.classList.contains("hide");

    closeAllDropdowns();

    if (!isVisible) {
        dropdown.classList.remove("hide");
    }
}
// 篩選功能
function filterByBodyPart(bodyPart) {
    highlightSelectedItem("bodyPartDropdown", bodyPart);
}
function filterByEquipment(equipment) {
    highlightSelectedItem("equipmentDropdown", equipment);
}
function filterByCategory(category) {
    highlightSelectedItem("categoryDropdown", category);
}
function highlightSelectedItem(dropdownId, selectedItem) {
    const dropdown = document.getElementById(dropdownId);
    const items = dropdown.querySelectorAll(".dropdown-item");
    let alreadySelected = false;

    items.forEach(item => {
        if (item.textContent === selectedItem) {
            if (item.classList.contains("selected")) {
                item.classList.remove("selected");
                alreadySelected = true;
            } else {
                item.classList.add("selected");
            }
        } else {
            item.classList.remove("selected");
        }
    });

    dropdown.classList.add("hide"); // 自動收起下拉選單

    // 如果已經選擇，則取消選擇並清除相應的篩選條件
    if (alreadySelected) {
        if (dropdownId === "bodyPartDropdown") {
            filterCriteria.bodyPart = null;
        } else if (dropdownId === "equipmentDropdown") {
            filterCriteria.equipment = null;
        } else if (dropdownId === "categoryDropdown") {
            filterCriteria.category = null;
        }
    } else {
        if (dropdownId === "bodyPartDropdown") {
            filterCriteria.bodyPart = selectedItem;
        } else if (dropdownId === "equipmentDropdown") {
            filterCriteria.equipment = selectedItem;
        } else if (dropdownId === "categoryDropdown") {
            filterCriteria.category = selectedItem;
        }
    }

    applyFilters();
}
function applyFilters() {
    let filteredExercises = allExercises;

    if (filterCriteria.bodyPart) {
        filteredExercises = filteredExercises.filter(exercise => exercise.primary_muscles.includes(filterCriteria.bodyPart));
    }
    if (filterCriteria.equipment) {
        filteredExercises = filteredExercises.filter(exercise => exercise.equipment === filterCriteria.equipment);
    }
    if (filterCriteria.category) {
        filteredExercises = filteredExercises.filter(exercise => exercise.category === filterCriteria.category);
    }

    generateExerciseList(filteredExercises);
}
// 關閉所有下拉選單
function closeAllDropdowns() {
    document.getElementById("bodyPartDropdown").classList.add("hide");
    document.getElementById("equipmentDropdown").classList.add("hide");
    document.getElementById("categoryDropdown").classList.add("hide");
}
// 顯示新增運動框
function showAddExerciseModal() {
    addExerciseModal.showModal();
}
// 關閉新增運動框
function closeAddExerciseModal() {
    addExerciseModal.close();
}
// 清除所有選中的項目
function clearSelections() {
    document.querySelectorAll(".dropdown-item, .exercise-item").forEach(item => {
        item.classList.remove("selected");
    });
    modalTitleButton.disabled = true;
    selectedExercise = null;
}
// 更新框標題按鈕狀態
function toggleModalTitleButtonState() {
    modalTitleButton.disabled = selectedExercise === null;
}
// 處理運動項目的選擇
function handleExerciseSelection(item) {
    if (item.classList.contains("selected")) {
        item.classList.remove("selected");
        selectedExercise = null;
        selectedExerciseName = "";
    } else {
        clearSelections();
        item.classList.add("selected");
        selectedExercise = item;
        const exerciseNameElement = item.querySelector(".exercise-name");
        if (exerciseNameElement) {
            selectedExerciseName = exerciseNameElement.textContent;
        } else {
            console.warn("Could not find '.exercise-name' element in:", item);
            selectedExerciseName = "";
        }
    }
    toggleModalTitleButtonState();
}
// 切換顯示區域
function toggleSections(hideWorkout) {
    if (hideWorkout) {
        workoutSection.classList.add("hide");
        viewSection.classList.remove("hide");
    } else {
        workoutSection.classList.remove("hide");
        viewSection.classList.add("hide");
    }
}
// 新增一組運動項目
function addSetRow(button) {
    const exerciseTable = button.closest(".exercise-table");
    const currentRows = exerciseTable.querySelectorAll(".table-row");
    const newRowNumber = currentRows.length + 1;
    const newRowHTML = `
        <div class="table-row">
            <div class="cell">${newRowNumber}</div>
            <div class="cell">—</div>
            <div class="cell"><input type="number" placeholder="kg" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
            <div class="cell"><input type="number" value="0" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
            <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
            <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
        </div>
    `;
    button.insertAdjacentHTML("beforebegin", newRowHTML);

    // 更新新增行的按鈕狀態
    updateCheckButtons();

    // 為新添加的刪除按鈕添加事件監聽
    const newDeleteButton = button.previousElementSibling.querySelector(".delete-btn");
    newDeleteButton.addEventListener("click", function() {
        deleteRow(newDeleteButton);
    });

    // 更新所有行的序號
    updateRowNumbers(exerciseTable);
}
// 刪除一行
function deleteRow(button) {
    const row = button.closest(".table-row");
    const exerciseTable = row.closest(".exercise-table");
    row.remove();

    // 更新所有行的序號
    if (exerciseTable) {
        updateRowNumbers(exerciseTable);
    }
}
// 更新所有行的序號
function updateRowNumbers(exerciseTable) {
    exerciseTable.querySelectorAll(".table-row").forEach((row, index) => {
        row.querySelector(".cell").textContent = index + 1;
    });
}
// 更新按鈕狀態
function updateCheckButtons() {
    document.querySelectorAll(".exercise").forEach(exercise => {
        exercise.querySelectorAll(".table-row").forEach(row => {
            const kgInput = row.querySelector(".kgInput");
            const repsInput = row.querySelector(".repsInput");
            const checkBtn = row.querySelector(".check-btn");
            const deleteBtn = row.querySelector(".delete-btn");

            if (kgInput && repsInput && checkBtn) {
                function updateButtonState() {
                    // 按鈕初始狀態設置為可點擊
                    checkBtn.classList.add("active");
                    checkBtn.style.pointerEvents = "auto";
                }

                kgInput.addEventListener("input", updateButtonState);
                repsInput.addEventListener("input", updateButtonState);

                checkBtn.addEventListener("click", function() {
                    if (kgInput.value && repsInput.value) {
                        checkBtn.style.backgroundColor = "limegreen";
                        checkBtn.style.color = "white";
                        row.style.backgroundColor = "lightgreen";
                        row.classList.remove("shake"); // 移除晃動效果
                    } else {
                        checkBtn.style.backgroundColor = "crimson";
                        checkBtn.style.color = "white";
                        row.style.backgroundColor = "lightcoral";
                        row.classList.add("shake"); // 添加晃動效果
                        setTimeout(() => row.classList.remove("shake"), 500); // 確保晃動效果只持續短暫時間
                    }
                });

                // 初始化按鈕狀態
                updateButtonState();
            } else {
                console.warn("Could not find expected elements in row:", row);
            }

            if (deleteBtn) {
                deleteBtn.addEventListener("click", function() {
                    deleteRow(deleteBtn);
                });
            }
        });

        // 為新增的 Add Set 按鈕添加事件監聽，確保沒有重複綁定
        const addSetButton = exercise.querySelector(".add-set");
        addSetButton.removeEventListener("click", addSetRowHandler);
        addSetButton.addEventListener("click", addSetRowHandler);
    });
}
// 添加運動項目到 workout section 中
function addExercise() {
    if (selectedExerciseName) {
        const exerciseHTML = `
            <div class="exercise">
                <h3>${selectedExerciseName}</h3>
                <img src="/static/images/remove.png" class="exercise-remove-btn" alt="remove">
                <div class="exercise-table">
                    <div class="table-row-header">
                        <div class="cell">Set</div>
                        <div class="cell">Previous</div>
                        <div class="cell">kg</div>
                        <div class="cell">Reps</div>
                        <div class="cell">check</div>
                        <div class="cell">Delete</div>
                    </div>
                    <div class="table-row">
                        <div class="cell">1</div>
                        <div class="cell">—</div>
                        <div class="cell"><input type="number" placeholder="kg" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><input type="number" value="10" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                        <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                    </div>
                    <div class="table-row">
                        <div class="cell">2</div>
                        <div class="cell">—</div>
                        <div class="cell"><input type="number" placeholder="kg" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><input type="number" value="15" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                        <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                    </div>
                    <button class="add-set">Add Set</button>
                </div>
            </div>
        `;
        document.querySelector(".add-button").insertAdjacentHTML("beforebegin", exerciseHTML);

        // 自動關閉模態框
        closeAddExerciseModal();

        // 更新按鈕狀態
        setTimeout(updateCheckButtons, 0); // 使用 setTimeout 確保 DOM 已更新

        // 為刪除 exercise 按鈕添加事件監聽
        document.querySelectorAll(".exercise-remove-btn").forEach(button => {
            button.addEventListener("click", function() {
                deleteExercise(button);
            });
        });
    }
}
// 刪除運動項目
function deleteExercise(button) {
    const exercise = button.closest(".exercise");
    exercise.remove();
}
// 處理新增行按鈕事件的函數
function addSetRowHandler(event) {
    addSetRow(event.currentTarget);
}
// 主邏輯和事件監聽
document.querySelectorAll(".add-set").forEach(button => {
    button.addEventListener("click", addSetRowHandler);
});
quickStartButton.addEventListener("click", () => {
    toggleSections();
});
finishButton.addEventListener("click", () => {
    confirmationDialog.showModal();
});
confirmationDialog.addEventListener("click", (event) => {
    if (event.target === confirmationDialog) {
        confirmationDialog.close();
    }
});
saveButton.addEventListener("click", () => {
    confirmationDialog.close();
    toggleSections(true);
    alert("重訓紀錄已儲存！");
});
discardButton.addEventListener("click", () => {
    confirmationDialog.close();
    toggleSections(true);
    alert("重訓紀錄未儲存！");
});
addButton.addEventListener("click", () => {
    showAddExerciseModal();
});
addExerciseModal.addEventListener("click", (event) => {
    if (event.target === addExerciseModal) {
        closeAddExerciseModal();
    }
});
modalTitleButton.addEventListener("click", addExercise);
// 添加對輸入框的事件監聽器
exerciseSearchInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        searchExercises();
    }
});
// 添加對輸入框內容變化的監聽器，內容清空時顯示所有運動數據
exerciseSearchInput.addEventListener("input", function(event) {
    const searchQuery = event.target.value.toLowerCase();
    if (searchQuery === "") {
        generateExerciseList(allExercises);
    }
});
document.querySelectorAll(".exercise-remove-btn").forEach(button => {
    button.addEventListener("click", function() {
        deleteExercise(button);
    });
});

// 處理運動標題相關功能
const topicContainer = document.querySelector(".topic-container");
const topic = topicContainer.querySelector(".topic");
const topicInput = topicContainer.querySelector(".topic-input");
const editIcon = topicContainer.querySelector(".edit-icon");
const cameraIcon = topicContainer.querySelector(".camera-icon");
// 獲取今天的日期並格式化
const today = new Date();
const formattedDate = `${today.getMonth() + 1}/${today.getDate()}`;
const defaultTopic = `${formattedDate} Workout`;
// 設置默認的主題
topic.textContent = defaultTopic;
topicInput.value = defaultTopic;
// 事件監聽
editIcon.addEventListener("click", () => {
    topic.classList.add("hide");
    topicInput.classList.remove("hide");
    topicInput.classList.add("show");
    topicInput.focus();
});
topicInput.addEventListener("blur", () => {
    topic.textContent = topicInput.value;
    topic.classList.remove("hide");
    topicInput.classList.add("hide");
    topicInput.classList.remove("show");
});
topicInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        topicInput.blur();
    }
});