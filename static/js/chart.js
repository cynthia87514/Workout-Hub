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
            bmr = 1; tdee = 1; tef = 1; neat = 1; eee = 1;
            updateTdeeChart();
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

        const remainingEnergy = tdee - bmr;
        tef = remainingEnergy * 0.33;
        neat = remainingEnergy * 0.33;
        eee = remainingEnergy - (tef + neat);

        updateTdeeChart();
    } else {
        console.error("Failed to fetch body information.");
        bmr = 1; tdee = 1; tef = 1; neat = 1; eee = 1;
        updateTdeeChart();
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

// TDEE 圖表
function updateTdeeChart() {
    const defaultBmr = bmr;
    const defaultTef = tef;
    const defaultNeat = neat;
    const defaultEee = eee;

    const ctx = document.getElementById("tdeeChart").getContext("2d");
    const tdeeChart = new Chart(ctx, {
        type: "doughnut",   
        data: {
            labels: ["BMR", "TEF", "NEAT", "EEE"],
            datasets: [{
                label: "TDEE 組成部分",
                data: [defaultBmr, defaultTef, defaultNeat, defaultEee],
                backgroundColor: ["#C9DABF", "#9CA986", "#808D7C", "#5F6F65"],
                borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: "left",
                    align: 'center',
                    labels: {
                        boxWidth: 20,
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            family: "Caladea",
                        }
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ": " + tooltipItem.raw.toFixed(2) + " kcal";
                        }
                    }
                },
                centerText: {}
            }
        }
    });

    // 註冊插件
    Chart.register(centerTextPlugin);
}

// 自定義 Chart.js 插件，用於在 doughnut 圖表的中心顯示文字
const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
        if (chart.config.type === 'doughnut') {
            var width = chart.width,
                height = chart.height,
                ctx = chart.ctx;

            ctx.restore();
            const fontSize = 20;
            ctx.font = fontSize + "px Caladea";
            ctx.textBaseline = "middle";

            const legendWidth = 80;
            const availableWidth = width - legendWidth;
            const text = "TDEE";
            const textX = Math.round((availableWidth - ctx.measureText(text).width) / 2) + legendWidth;
            const textY = height / 2;

            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    }
};

// TDEE Percentage 圖表
function renderTDEEPercentage() {
    const ctx2 = document.getElementById('tdeeAdjustmentChart').getContext('2d');
    const tdeeAdjustmentChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Fat Loss', 'Maintenance', 'Muscle Gain'],
            datasets: [
                {
                    label: '75% Possible Muscle Loss',
                    data: [75, 0, 0],
                    backgroundColor: '#d1d5db',
                },
                {
                    label: '80% Aggressive Fat Loss',
                    data: [80, 0, 0],
                    backgroundColor: '#9ca3af',
                },
                {
                    label: '85% Standard Fat Loss',
                    data: [85, 0, 0],
                    backgroundColor: '#6c757d',
                },
                {
                    label: '90% Minimal Fat Loss',
                    data: [90, 0, 0],
                    backgroundColor: '#495057',
                },
                {
                    label: '100% Maintenance',
                    data: [0, 100, 0],
                    backgroundColor: '#C9DABF',
                },
                {
                    label: '105% Minimal Muscle Gain',
                    data: [0, 0, 105],
                    backgroundColor: '#A3B9CC',
                },
                {
                    label: '110% Standard Muscle Gain',
                    data: [0, 0, 110],
                    backgroundColor: '#7B91AE',
                },
                {
                    label: '115% Aggressive Muscle Gain',
                    data: [0, 0, 115],
                    backgroundColor: '#5A7495',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.dataset.label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        font: {
                            size: 11,
                            family: 'Caladea',
                        },
                        boxWidth: 10,
                        padding: 10,
                    },
                },
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    beginAtZero: false,
                    min: 70,
                    max: 115,
                    title: {
                        display: true,
                        text: 'TDEE Percentage',
                        font: {
                            size: 12,
                            family: 'Caladea',
                        },
                    },
                    ticks: {
                        stepSize: 5,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
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
    const bodyStatsChart = new Chart(ctx3, {
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
                        text: 'Date'
                    }
                }
            }
        }
    });
}