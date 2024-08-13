// Sample data for Body Stats Chart (you can replace this with real data)
const ctx = document.getElementById('bodyStatsChart').getContext('2d');
const bodyStatsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Weight (kg)',
            data: [70, 69, 68, 67, 66, 65],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
        },
        {
            label: 'Body Fat (%)',
            data: [20, 19, 18, 17, 16, 15],
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: true,
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});