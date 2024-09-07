// 定義變數及初始化
let allExercises = [];
let selectedExercise = null;
let selectedExerciseName = null;
let currentSaveAction = null;
let currentTemplateId = null;

const filterCriteria = {
    bodyPart: null,
    equipment: null,
    category: null
};

const placeholderCard = document.getElementById("placeholderCard");
const quickStartButton = document.querySelector(".qS-button");
const confirmationDialog = document.getElementById("confirmationDialog");
const confirmationMessage = document.querySelector("#confirmationDialog .dialog-content p");
const saveButton = document.getElementById("saveButton");
const discardButton = document.getElementById("discardButton");
const workoutSection = document.querySelector(".workout");
const newTemplateSection = document.querySelector(".newTemplate");
const viewSection = document.querySelector(".view");
const addButton = document.querySelector(".add-button");
const finishButton = document.querySelector(".finish");
const templateAddButton = document.querySelector(".templateAdd");
const templateSaveButton = document.querySelector(".templateSave");
const addExerciseModal = document.getElementById("addExerciseModal");
const modalTitleButtons = document.querySelectorAll(".modal-title");
const exerciseSearchInput = document.getElementById("exerciseSearch");
const infoDialog = document.getElementById("infoDialog");
const dialogExerciseName = document.getElementById("dialogExerciseName");
const dialogImages = document.getElementById("dialogImages");
const dialogInstructions = document.getElementById("dialogInstructions");
const dialogCategory = document.getElementById("dialogCategory");

// 初始化
fetchMyTemplates();
bindExampleTemplateEvents();
fetchExercises();
generateDropdownItems(); // 生成下拉選單項
toggleModalTitleButtonState(); // 初始化按鈕狀態

// 定義函數
// 從後端獲取 My Templates
async function fetchMyTemplates() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`/api/workout/templates`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.length === 0) {
            placeholderCard.style.display = "block";
        } else {
            placeholderCard.style.display = "none";
            renderTemplates(data);
        }
    } catch (error) {
        console.error("Error fetching template workouts:", error);
    }
}
function renderTemplates(templates) {
    const container = document.querySelector(".myTemplates .template-card-box");

    const templateCards = container.querySelectorAll(".template-card[data-template-id]");
    templateCards.forEach(card => card.remove());

    templates.forEach(template => {
        let workoutItemsHTML = "";

        const workoutItems = template.workout_items || [];

        workoutItems.forEach(item => {
            workoutItemsHTML += `<li>${item.exercise_name}</li>`;
        });

        const templateHTML = `
            <div class="template-card" data-template-id="${template.id}" style="position: relative;">
                <div class="template-title">${template.title}</div>
                <img src="/static/images/three-dots.png" alt="more-info" class="more-info-button">
                <ul class="template-content">
                    ${workoutItemsHTML}
                </ul>
                <div class="options-menu hide">
                    <div class="close-menu">&times;</div>
                    <button class="edit-template">Edit</button>
                    <button class="delete-template">Delete</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", templateHTML);
    });

    // 添加事件監聽，點擊時顯示更多資訊
    const moreInfoButtons = document.querySelectorAll(".more-info-button");
    moreInfoButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.stopPropagation(); // 防止事件冒泡導致點擊 card 時觸發其他事件
            const optionsMenu = this.parentNode.querySelector(".options-menu");
            optionsMenu.classList.remove("hide");
            optionsMenu.classList.add("show");
        });
    });

    // 添加事件監聽，點擊時隱藏更多資訊
    const closeButtons = document.querySelectorAll(".close-menu");
    closeButtons.forEach(button => {
        button.addEventListener("click", closeOptionsMenu);
    });

    // 添加事件監聽，點擊時渲染 My Template 詳細內容
    const myTemplateCards = document.querySelectorAll(".myTemplates .template-card");
    myTemplateCards.forEach(card => {
        card.addEventListener("click", function() {
            const templateId = this.getAttribute("data-template-id");
            const selectedTemplate = templates.find(t => t.id == templateId);
            clickMyTemplate(selectedTemplate);
        });
    });

    // 添加事件監聽，更多資訊中的按鈕
    const editButtons = document.querySelectorAll(".edit-template");
    const deleteButtons = document.querySelectorAll(".delete-template");

    editButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.stopPropagation();
            const templateId = this.closest(".template-card").getAttribute("data-template-id");
            const selectedTemplate = templates.find(t => t.id == templateId);
            renderEditTemplate(selectedTemplate);
            closeOptionsMenu();
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.stopPropagation();
            const templateId = this.closest(".template-card").getAttribute("data-template-id");
            deleteTemplate(templateId);
        });
    });
}
function closeOptionsMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    const optionsMenu = this.parentNode || document.querySelector(".options-menu.show");
    if (optionsMenu) {
        optionsMenu.classList.remove("show");
        optionsMenu.classList.add("hide");
    }
}
function renderEditTemplate(template) {
    toggleSections(newTemplateSection);

    templateTopic.textContent = template.title;
    templateTopicInput.value = template.title;

    template.workout_items.forEach(item => {
        addTemplateExercise(item.exercise_name, item.item_sets, item.id);
    });

    currentTemplateId = template.id;
    currentSaveAction = "editTemplate";
}

function deleteTemplate(templateId) {
    const token = localStorage.getItem("token");

    fetch(`/api/workout/templates/${templateId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        closeOptionsMenu();
        const card = document.querySelector(`.template-card[data-template-id="${templateId}"]`);
        if (card) {
            card.remove();
        }
        
        const container = document.querySelector(".myTemplates .template-card-box");
        const remainingCards = container.querySelectorAll(".template-card");
         
        if (remainingCards.length === 0) {
            placeholderCard.style.display = "block";
        }
    })
    .catch(error => console.error("Error deleting template:", error));
}

// 绑定 Example Templates 的事件監聽
function bindExampleTemplateEvents() {
    const exampleTemplateCards = document.querySelectorAll(".exampleTemplates .template-card");
    exampleTemplateCards.forEach(card => {
        card.addEventListener("click", function() {
            const templateName = this.querySelector('.template-title').textContent.trim();
            clickExampleTemplate(templateName);
        });
    });
}
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
    modalTitleButtons.forEach(modalTitleButton => {
        modalTitleButton.disabled = true;
    })
    selectedExercise = null;
}
// 更新框標題按鈕狀態
function toggleModalTitleButtonState() {
    modalTitleButtons.forEach(modalTitleButton => {
        modalTitleButton.disabled = selectedExercise === null;
    })
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
function toggleSections(sectionToShow) {
    viewSection.classList.add("hide");
    workoutSection.classList.add("hide");
    newTemplateSection.classList.add("hide");

    sectionToShow.classList.remove("hide");

    if (sectionToShow === newTemplateSection) {
        if (currentTemplateId) {
            currentSaveAction = "editTemplate";
        } else {
            currentSaveAction = "saveTemplate";
        }
    } else if (sectionToShow === workoutSection) {
        currentSaveAction = "saveWorkout";
    } else {
        currentSaveAction = null;
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
            <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
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
function addExercise(insertBeforeElement) {
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
                        <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><input type="number" value="10" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                        <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                    </div>
                    <div class="table-row">
                        <div class="cell">2</div>
                        <div class="cell">—</div>
                        <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><input type="number" value="10" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                        <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                        <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                    </div>
                    <button class="add-set">Add Set</button>
                </div>
            </div>
        `;
        insertBeforeElement.insertAdjacentHTML("beforebegin", exerciseHTML);

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
// 儲存運動菜單到 DB
async function saveWorkout() {
    const workoutItems = collectWorkoutItems();
    const workoutData = {
        title: topic.textContent,
        workout_items: workoutItems,
        is_template: false
    };

    await sendWorkoutData(workoutData, "POST", "/api/workout", true);
}

// 儲存新模板到 DB
async function saveTemplate() {
    const workoutItems = collectWorkoutItems();
    const templateData = {
        title: templateTopic.textContent,
        workout_items: workoutItems,
        is_template: true
    };

    await sendWorkoutData(templateData, "POST", "/api/workout");
}

// 編輯模板並保存到 DB
async function editTemplate() {
    const workoutItems = collectWorkoutItems();
    const templateData = {
        title: templateTopic.textContent,
        workout_items: workoutItems,
        is_template: true
    };

    await sendWorkoutData(templateData, "PUT", `/api/workout/templates/${currentTemplateId}`);
}

// 收集運動或模板項目
function collectWorkoutItems() {
    const exercises = document.querySelectorAll(".exercise");
    const workoutItems = [];
    const includeId = currentSaveAction === "editTemplate";

    exercises.forEach(exercise => {
        const exerciseName = exercise.querySelector("h3").innerText;
        const itemId = exercise.getAttribute('data-item-id');
        const sets = [];
        exercise.querySelectorAll(".table-row").forEach(row => {
            const setNumber = parseInt(row.querySelector(".cell:nth-child(1)").innerText);
            const weight = parseFloat(row.querySelector(".kgInput").value) || 0;
            const reps = parseInt(row.querySelector(".repsInput").value) || 0;
            const setId = row.getAttribute('data-set-id');
            const setItem = {
                set_number: setNumber,
                weight: weight,
                reps: reps
            };
            
            if (includeId && setId) {
                setItem.id = parseInt(setId);  // 确保 `id` 仅在编辑时包含
            } else {
                setItem.id = null;  // 如果没有 `id`，明确设置为 `null`
            }
            
            sets.push(setItem);
            
        });

        const workoutItem = {
            exercise_name: exerciseName,
            item_sets: sets
        };
        if (includeId && itemId) {
            workoutItem.id = parseInt(itemId);  // 仅在编辑时包含 id
        } else {
            workoutItem.id = null;  // 如果没有 `id`，明确设置为 `null`
        }

        workoutItems.push(workoutItem);
    });

    return workoutItems;
}
// 通用的 API 請求發送函數
async function sendWorkoutData(data, method, url, isNewWorkout = false) {
    const token = localStorage.getItem("token");

    // 只有在新增運動紀錄時需要處理 created_at
    if (isNewWorkout) {
        data.created_at = getCreatedAt(true);  // 根據是否選擇日期來決定 created_at
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail);
        }

        await response.json();

        if (data.is_template) {
            await fetchMyTemplates();  // 如果是模板，刷新模板列表
        }

        resetWorkoutSection();  // 重置運動表單或模板區域

    } catch (error) {
        console.error("Error:", error.message);
    }
}

// 清空 workout section
function resetWorkoutSection() {
    const exercises = document.querySelectorAll(".exercise");
    exercises.forEach(exercise => {
        exercise.remove();
    })
    // 設置默認的主題
    topic.textContent = defaultTopic;
    topicInput.value = defaultTopic;
    templateTopic.textContent = "My Template";
    templateTopicInput.value = "My Template";
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
// 初始化 Templates 的 workout section
function initializeTemplateWorkout(exerciseName) {
    const exerciseHTML = `
        <div class="exercise">
            <h3>${exerciseName}</h3>
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
                    <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                    <div class="cell"><input type="number" value="10" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                    <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                    <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                </div>
                <div class="table-row">
                    <div class="cell">2</div>
                    <div class="cell">—</div>
                    <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                    <div class="cell"><input type="number" value="10" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                    <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                    <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                </div>
                <div class="table-row">
                    <div class="cell">3</div>
                    <div class="cell">—</div>
                    <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                    <div class="cell"><input type="number" value="10" class="repsInput" min="0" oninput="this.setCustomValidity(''); if (!this.validity.valid) { this.value = ''; }"></div>
                    <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                    <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                </div>
                <button class="add-set">Add Set</button>
            </div>
        </div>
    `;
    addButton.insertAdjacentHTML("beforebegin", exerciseHTML);

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
// 點擊 New Templates
function clickNewTemplate() {
    toggleSections(newTemplateSection);
}
function insertExerciseSets(exerciseTable, sets) {
    sets.forEach((set, index) => {
        const setHTML = `
            <div class="table-row">
                <div class="cell">${index + 1}</div>
                <div class="cell">—</div>
                <div class="cell"><input type="number" placeholder="kg" step="0.01" class="kgInput" value="${set.weight || ''}" min="0"></div>
                <div class="cell"><input type="number" value="${set.reps || 10}" class="repsInput" min="0"></div>
                <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
            </div>
        `;
        exerciseTable.insertAdjacentHTML("beforeend", setHTML);
    });
}
function addTemplateExercise(exerciseName, itemSets, itemId) {
    const insertBeforeElement = (currentSaveAction === "saveTemplate" || currentSaveAction === "editTemplate") 
    ? templateAddButton 
    : addButton;

    const exerciseHTML = `
        <div class="exercise" data-item-id="${itemId}">
            <h3>${exerciseName}</h3>
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
                ${itemSets.map((set, index) => `
                    <div class="table-row">
                        <div class="cell">${index + 1}</div>
                        <div class="cell">—</div>
                        <div class="cell"><input type="number" value="${set.weight || ''}" placeholder="kg" step="0.01" class="kgInput" min="0"></div>
                        <div class="cell"><input type="number" value="${set.reps || ''}" placeholder="reps" class="repsInput" min="0"></div>
                        <div class="cell"><img src="/static/images/check.png" class="check-btn" alt="check"></div>
                        <div class="cell"><img src="/static/images/delete.png" class="delete-btn" alt="delete"></div>
                    </div>
                `).join('')}
                <button class="add-set">Add Set</button>
            </div>
        </div>
    `;

    insertBeforeElement.insertAdjacentHTML("beforebegin", exerciseHTML);

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

// 點擊 My Templates 開始
function clickMyTemplate(template) {
    toggleSections(workoutSection);

    const templateTitle = `${formattedDate} ${template.title}`;
    topic.textContent = templateTitle;
    topicInput.value = templateTitle;

    template.workout_items.forEach(item => {
        addTemplateExercise(item.exercise_name, item.item_sets);
    });
}

// 點擊 Example Templates 開始
function clickExampleTemplate(templateName) {
    toggleSections(workoutSection);

    const newTopic = `${formattedDate} ${templateName}`;
    topic.textContent = newTopic;
    topicInput.value = newTopic;

    // 找到所有 .exampleTemplates 下的 .template-card
    const templateCards = document.querySelectorAll('.exampleTemplates .template-card');
    let templateCard = null;

    // 遍歷每個 card，找到 title 與 templateName 匹配的卡片
    templateCards.forEach(card => {
        const titleElement = card.querySelector('.template-title');
        if (titleElement && titleElement.textContent.trim() === templateName) {
            templateCard = card;
        }
    });

    const exercises = templateCard.querySelectorAll(".template-content li");
    exercises.forEach((exercise) => {
        const exerciseName = exercise.textContent;
        initializeTemplateWorkout(exerciseName);
    });
}

// 主邏輯和事件監聽
document.querySelectorAll(".add-set").forEach(button => {
    button.addEventListener("click", addSetRowHandler);
});
quickStartButton.addEventListener("click", () => {
    toggleSections(workoutSection);
});
// workout section 的 save
finishButton.addEventListener("click", () => {
    confirmationMessage.textContent = "Save the workout record?";
    confirmationDialog.showModal();
});
// new Template section 的 save
templateSaveButton.addEventListener("click", () => {
    confirmationMessage.textContent = currentSaveAction === "editTemplate" ? 
        "Save the template changes?" : 
        "Save the template?";
    confirmationDialog.showModal();
});
confirmationDialog.addEventListener("click", (event) => {
    if (event.target === confirmationDialog) {
        confirmationDialog.close();
    }
});
saveButton.addEventListener("click", () => {
    confirmationDialog.close();
    if (currentSaveAction === "saveWorkout") {
        saveWorkout();
    } else if (currentSaveAction === "saveTemplate") {
        saveTemplate();
    } else if (currentSaveAction === "editTemplate") {
        editTemplate();
    }
    toggleSections(viewSection);
});
discardButton.addEventListener("click", () => {
    confirmationDialog.close();
    toggleSections(viewSection);
    resetWorkoutSection();
});
addButton.addEventListener("click", () => {
    showAddExerciseModal();
});
templateAddButton.addEventListener("click", () => {
    showAddExerciseModal();
});
addExerciseModal.addEventListener("click", (event) => {
    if (event.target === addExerciseModal) {
        closeAddExerciseModal();
    }
});
modalTitleButtons.forEach(modalTitleButton => {
    modalTitleButton.addEventListener("click", function() {
        let insertBeforeElement;
        if (!newTemplateSection.classList.contains("hide")) {
            insertBeforeElement = templateAddButton;
        } else if (!workoutSection.classList.contains("hide")) {
            insertBeforeElement = addButton;
        }
        addExercise(insertBeforeElement);
    })
})
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
const templateTopicContainer = document.querySelector(".template-topic-container");
const topic = topicContainer.querySelector(".topic");
const topicInput = topicContainer.querySelector(".topic-input");
const editIcon = topicContainer.querySelector(".edit-icon");
// const cameraIcon = topicContainer.querySelector(".camera-icon");
const templateTopic = templateTopicContainer.querySelector(".templateTopic");
const templateTopicInput = templateTopicContainer.querySelector(".templateTopic-input");
const templateEditIcon = templateTopicContainer.querySelector(".template-edit-icon");
// 獲取今天的日期並格式化
const today = new Date();
const formattedDate = `${today.getMonth() + 1}/${today.getDate()}`;
const defaultTopic = `${formattedDate} Workout`;
// 設置默認的主題
topic.textContent = defaultTopic;
topicInput.value = defaultTopic;
templateTopic.textContent = "My Template";
templateTopicInput.value = "My Template";
// 事件監聽
editIcon.addEventListener("click", () => {
    topic.classList.add("hide");
    topicInput.classList.remove("hide");
    topicInput.classList.add("show");
    topicInput.focus();
});
templateEditIcon.addEventListener("click", () => {
    templateTopic.classList.add("hide");
    templateTopicInput.classList.remove("hide");
    templateTopicInput.classList.add("show");
    templateTopicInput.focus();
});
topicInput.addEventListener("blur", () => {
    topic.textContent = topicInput.value;
    topic.classList.remove("hide");
    topicInput.classList.add("hide");
    topicInput.classList.remove("show");
});
templateTopicInput.addEventListener("blur", () => {
    templateTopic.textContent = templateTopicInput.value;
    templateTopic.classList.remove("hide");
    templateTopicInput.classList.add("hide");
    templateTopicInput.classList.remove("show");
});
topicInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        topicInput.blur();
    }
});
templateTopicInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        templateTopicInput.blur();
    }
});

// 選擇日曆圖標和日期選擇器
const calendarIcon = document.getElementById("calendarIcon");
const datePicker = document.getElementById("datePicker");

// 點擊日曆圖標時顯示或隱藏日期選擇器
calendarIcon.addEventListener("click", (event) => {
    event.stopPropagation();  // 防止事件冒泡
    toggleDatePicker();
});

// 選擇日期時更新標題中的日期
datePicker.addEventListener("change", () => {
    const selectedDate = new Date(datePicker.value);  // 獲取選擇的日期
    const formattedDate = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;  // 格式化日期

    // 更新 Workout 標題
    topic.textContent = `${formattedDate} Workout`;
    topicInput.value = `${formattedDate} Workout`;

    // 隱藏日期選擇器
    hideDatePicker();
});

// 全局點擊事件，用來隱藏日期選擇器
document.addEventListener("click", (event) => {
    if (event.target !== calendarIcon && event.target !== datePicker) {
        hideDatePicker();
    }
});

// 顯示或隱藏日期選擇器的函數
function toggleDatePicker() {
    if (datePicker.classList.contains("hide")) {
        datePicker.classList.remove("hide");  // 顯示日期選擇器
        datePicker.focus();  // 自動彈出日期選擇器
    } else {
        datePicker.classList.add("hide");  // 隱藏日期選擇器
    }
}

// 隱藏日期選擇器的函數
function hideDatePicker() {
    datePicker.classList.add("hide");
}

// 獲取 created_at 的值，結合選擇的日期和當前時間，或者當前時間
function getCreatedAt(useSelectedDate = false) {
    const now = new Date();  // 當前時間

    if (useSelectedDate && datePicker.value) {
        const selectedDate = new Date(datePicker.value);  // 使用選擇的日期
        // 將選擇的日期和當前時間結合
        selectedDate.setHours(now.getHours());
        selectedDate.setMinutes(now.getMinutes());
        selectedDate.setSeconds(now.getSeconds());

        return selectedDate.toISOString();  // 返回 ISO 格式時間
    }

    return now.toISOString();  // 返回當前時間的 ISO 格式
}