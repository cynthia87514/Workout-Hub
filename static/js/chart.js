// 獲得 Body Information 資料及渲染 Body Status 圖表
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
            return;
        }

        let pbfPosition;

        if (bodyInfo.gender === "Male") {
            document.getElementById("male-height").value = bodyInfo.height;
            document.getElementById("male-weight").value = bodyInfo.weight;
            document.getElementById("male-age").value = bodyInfo.age;
            document.getElementById("male-neck").value = bodyInfo.neck_circumference || "";
            document.getElementById("male-waist").value = bodyInfo.waist_circumference || "";
            document.getElementById("male-activity-level").value = bodyInfo.activity_level;

            document.querySelector(".pbf-bar-male").style.display = "flex";
            document.querySelector(".pbf-scale-male").style.display = "block";
            document.querySelector(".pbf-bar-female").style.display = "none";
            document.querySelector(".pbf-scale-female").style.display = "none";
            pbfPosition = calculatePbfIndicatorPosition(bodyInfo.pbf, 2, 27);
            
            showMaleForm();
            originalMaleValues = maleInputs.map(input => input.value); // 更新原始值
        } else if (bodyInfo.gender === "Female") {
            document.getElementById("female-height").value = bodyInfo.height;
            document.getElementById("female-weight").value = bodyInfo.weight;
            document.getElementById("female-age").value = bodyInfo.age;
            document.getElementById("female-neck").value = bodyInfo.neck_circumference || "";
            document.getElementById("female-waist").value = bodyInfo.waist_circumference || "";
            document.getElementById("female-hip").value = bodyInfo.hip_circumference || "";
            document.getElementById("female-activity-level").value = bodyInfo.activity_level;
            
            document.querySelector(".pbf-bar-male").style.display = "none";
            document.querySelector(".pbf-scale-male").style.display = "none";
            document.querySelector(".pbf-bar-female").style.display = "flex";
            document.querySelector(".pbf-scale-female").style.display = "block";
            pbfPosition = calculatePbfIndicatorPosition(bodyInfo.pbf, 10, 35);
            
            showFemaleForm();
            originalFemaleValues = femaleInputs.map(input => input.value); // 更新原始值
        }
        document.querySelectorAll(".pbf-indicator").forEach(indicator => {
            indicator.style.left = `${pbfPosition}%`;
        });
        document.querySelectorAll(".pbf-title").forEach(title => {
            title.textContent = `${bodyInfo.pbf} %`;
        });

        const bmiPosition = calculateBmiIndicatorPosition(bodyInfo.bmi);
        document.querySelector(".bmi-indicator").style.left = `${bmiPosition}%`;
        document.querySelector(".bmi-title").textContent = `${bodyInfo.bmi}`;

        bmr = bodyInfo.bmr;
        tdee = bodyInfo.tdee;
        document.querySelector(".bmr-title").textContent = `${bmr} kcal`;
        document.querySelector(".tdee-title").textContent = `${tdee} kcal`;
    } else {
        console.error("Failed to fetch body information.");
    }
}

function calculatePbfIndicatorPosition(pbf, minPbf, maxPbf) {
    if (pbf < minPbf) pbf = minPbf;
    if (pbf > maxPbf) pbf = maxPbf;
    const position = ((pbf - minPbf) / (maxPbf - minPbf)) * 100;
    return position;
}

function calculateBmiIndicatorPosition(bmi, minBmi = 15, maxBmi = 40) {
    if (bmi < minBmi) bmi = minBmi;
    if (bmi > maxBmi) bmi = maxBmi;
    const position = ((bmi - minBmi) / (maxBmi - minBmi)) * 100;
    return position;
}

// Body History 圖表
function updateBodyStatsChart(bodyHistory) {
    let labels, weights, pbfs;

    if (bodyHistory.length > 0) {
        const recentHistory = bodyHistory.slice(-10);
        
        labels = recentHistory.map(record => new Date(record.recorded_at).toLocaleDateString());
        weights = recentHistory.map(record => record.weight);
        pbfs = recentHistory.map(record => record.pbf || 0);
    } else {
        labels = ["No Data"];
        weights = [0];
        pbfs = [0];
    }

    const ctx3 = document.getElementById("bodyStatsChart").getContext("2d");
    
    if (bodyStatsChart instanceof Chart) {
        bodyStatsChart.destroy();
    }
    
    bodyStatsChart = new Chart(ctx3, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Weight (kg)",
                data: weights,
                borderColor: "#A8C0A0",
                backgroundColor: "rgba(168, 192, 160, 0.2)",
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: "PBF (%)",
                data: pbfs,
                borderColor: "#849BA6",
                backgroundColor: "rgba(132, 155, 166, 0.2)",
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 120,
                    ticks: {
                        stepSize: 5
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Date"
                    }
                }
            }
        }
    });
}