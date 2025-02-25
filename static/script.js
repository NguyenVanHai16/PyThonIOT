let isUpdating = false;
let isEspOn = false;
let weatherData = [];
let myChart;
let sensorInterval = 5000;
let currentTimeframe = "day";
// Loại bỏ initialEspData vì không cần thiết nữa, sử dụng dữ liệu thời gian thực từ ESP

const allowedCities = [
    "Hà Nội", "TP Hồ Chí Minh", "Đà Nẵng", "Bắc Ninh", "Cần Thơ",
    "Sơn La", "Thái Bình", "Thái Nguyên", "Thừa Thiên Huế"
];

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("temperature").innerText = "--°C";
    document.getElementById("humidity").innerText = "--%";

    setButtonState("🚀 Bật ESP", false);
    isEspOn = false;

    document.getElementById("sensorInterval").addEventListener("change", updateSensorInterval);
    document.getElementById("dayButton").addEventListener("click", () => updateDisplayPeriod("day"));
    document.getElementById("weekButton").addEventListener("click", () => updateDisplayPeriod("week"));
    document.getElementById("monthButton").addEventListener("click", () => updateDisplayPeriod("month"));
    document.getElementById("yearButton").addEventListener("click", () => updateDisplayPeriod("year"));
    document.getElementById("espButton").addEventListener("click", function () {
        if (isUpdating) return;
        isEspOn ? handleTurnOffESP() : handleTurnOnESP();
    });

    await fetchWeatherData();
    setInterval(fetchEspData, sensorInterval);
});

function updateSensorInterval() {
    sensorInterval = parseInt(document.getElementById("sensorInterval").value);
    console.log(`⏳ Chu kỳ đọc cảm biến: ${sensorInterval / 1000} giây`);
    if (isEspOn) {
        clearInterval(window.espInterval);
        window.espInterval = setInterval(fetchEspData, sensorInterval);
    }
}

function updateDisplayPeriod(period) {
    currentTimeframe = period;
    const currentCityData = getCurrentDisplayedCityData();
    updateChart(currentCityData, period);
}

async function fetchWeatherData() {
    try {
        const response = await fetch("http://localhost:5000/api/latest");
        if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        const jsonResponse = await response.json();
        if (!Array.isArray(jsonResponse)) throw new Error("API không trả về mảng!");

        weatherData = jsonResponse.filter(city => allowedCities.includes(city.city) || city.city === "ESP_Location");
        console.log("📡 Dữ liệu từ API:", weatherData);
        if (weatherData.length === 0) {
            console.warn("⚠️ Không có dữ liệu hợp lệ sau khi lọc!");
            return false;
        }

        generateCityList();
        const displayedCity = document.getElementById("city").innerText === "Đang tải..." ? weatherData[0].city : document.getElementById("city").innerText;
        const foundCity = weatherData.find(city => city.city === displayedCity) || weatherData[0];

        updateWeatherUI(foundCity);
        updateChart(foundCity, currentTimeframe);
        updateForecastTable(foundCity);
        return true;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        return false;
    }
}

async function fetchEspData() {
    if (!isEspOn) return;
    try {
        const response = await fetch("http://localhost:5000/api_esp");
        if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        const data = await response.json();
        console.log("📡 Dữ liệu từ ESP (raw):", data);

        // Chuyển đổi dữ liệu thành số, đảm bảo giá trị hợp lệ
        const temp = Number(data.temperature) || 0;
        const humid = Number(data.humidity) || 0;
        console.log("📡 Dữ liệu từ ESP (số):", { temperature: temp, humidity: humid });

        // Cập nhật giao diện
        document.getElementById("temperature").innerText = `${temp}°C`;
        document.getElementById("humidity").innerText = `${humid}%`;

        // Cập nhật weatherData cho ESP_Location
        const espIndex = weatherData.findIndex(city => city.city === "ESP_Location");
        if (espIndex !== -1) {
            weatherData[espIndex].temperature = temp;
            weatherData[espIndex].humidity = humid;

            // Cập nhật tất cả các loại biểu đồ và bảng dự đoán nếu đang ở ESP Location
            if (document.getElementById("city").innerText === "ESP Location") {
                updateChart(weatherData[espIndex], currentTimeframe); // Cập nhật biểu đồ (ngày, tuần, tháng, năm) với dữ liệu thời gian thực
                updateForecastTable(weatherData[espIndex]); // Cập nhật bảng dự đoán với dữ liệu thời gian thực
            }
        } else {
            console.error("⚠️ Không tìm thấy ESP_Location trong weatherData!");
            // Thêm dữ liệu mặc định nếu không tìm thấy ESP_Location
            weatherData.push({
                city: "ESP_Location",
                temperature: temp,
                humidity: humid,
                pm10: 0,
                pm25: 0,
                uv_index: 0
            });
            if (document.getElementById("city").innerText === "ESP Location") {
                updateChart(weatherData[weatherData.length - 1], currentTimeframe);
                updateForecastTable(weatherData[weatherData.length - 1]);
            }
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu ESP:", error.message);
        document.getElementById("temperature").innerText = "--°C";
        document.getElementById("humidity").innerText = "--%";
    }
}

function generateCityList() {
    const datalist = document.getElementById("cityList");
    datalist.innerHTML = "";
    weatherData.forEach(cityData => {
        if (cityData.city !== "ESP_Location") {
            const option = document.createElement("option");
            option.value = cityData.city;
            datalist.appendChild(option);
        }
    });
}

function updateWeatherUI(data) {
    if (!data) return;
    document.getElementById("city").innerText = data.city === "ESP_Location" ? "ESP Location" : data.city;
    document.getElementById("temperature").innerText = data.temperature !== undefined && data.temperature !== null ? `${data.temperature}°C` : "--°C";
    document.getElementById("humidity").innerText = data.humidity !== undefined && data.humidity !== null ? `${data.humidity}%` : "--%";
    document.getElementById("uvIndex").innerText = data.uv_index !== undefined && data.uv_index !== null ? data.uv_index : "--";
    document.getElementById("pm10").innerText = data.pm10 !== undefined && data.pm10 !== null ? `${data.pm10} µg/m³` : "-- µg/m³";
    document.getElementById("pm25").innerText = data.pm25 !== undefined && data.pm25 !== null ? `${data.pm25} µg/m³` : "-- µg/m³";
    console.log("📡 Cập nhật UI:", data);
}

document.getElementById("searchButton").addEventListener("click", function () {
    const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
    const foundCity = weatherData.find(city => city.city.toLowerCase() === searchValue);
    if (foundCity) {
        updateWeatherUI(foundCity);
        updateChart(foundCity, currentTimeframe);
        updateForecastTable(foundCity);
    } else {
        alert("⚠️ Không tìm thấy tỉnh trong danh sách!");
    }
});

function handleTurnOnESP() {
    isUpdating = true;
    isEspOn = true;
    setButtonState("🛑 Tắt ESP", true);
    fetchWeatherData().then(() => {
        setButtonState("🛑 Tắt ESP", false);
        window.espInterval = setInterval(fetchEspData, sensorInterval);
        isUpdating = false;
        const espData = weatherData.find(city => city.city === "ESP_Location");
        if (espData) {
            updateWeatherUI(espData);
            updateChart(espData, currentTimeframe);

            // Lấy dữ liệu ESP ngay lập tức khi nhấn "Bật ESP"
            fetchEspData().then(() => {
                const espIndex = weatherData.findIndex(city => city.city === "ESP_Location");
                if (espIndex !== -1) {
                    updateChart(weatherData[espIndex], currentTimeframe); // Cập nhật tất cả các loại biểu đồ
                    updateForecastTable(weatherData[espIndex]); // Cập nhật bảng dự đoán
                } else {
                    console.error("⚠️ Không tìm thấy ESP_Location trong weatherData!");
                    updateChart({ ...espData, temperature: 28.42, humidity: 57.08 }, currentTimeframe);
                    updateForecastTable({ ...espData, temperature: 28.42, humidity: 57.08 });
                }
            }).catch(error => console.error("Lỗi khi lấy dữ liệu ESP ban đầu:", error));
        }
    }).catch(error => console.error("Lỗi khi bật ESP:", error));
}

function handleTurnOffESP() {
    isEspOn = false;
    setButtonState("🚀 Bật ESP", false);
    clearInterval(window.espInterval);
    document.getElementById("temperature").innerText = "--°C";
    document.getElementById("humidity").innerText = "--%";
}

function updateChart(data, period = currentTimeframe) {
    const ctx = document.getElementById("weatherChart")?.getContext("2d");
    if (!ctx) {
        console.error("⚠️ Không tìm thấy canvas #weatherChart trong HTML!");
        return;
    }
    if (!data) {
        console.error("⚠️ Dữ liệu đầu vào cho biểu đồ rỗng!");
        return;
    }

    if (myChart) myChart.destroy();

    const multipliers = { day: 1, week: 7, month: 30, year: 365 };
    const multiplier = multipliers[period] || 1;

    const scaledData = {
        pm10: Number(data.pm10) || 0,
        pm25: Number(data.pm25) || 0,
        uv_index: Number(data.uv_index) || 0,
        temperature: 0,
        humidity: 0
    };

    // Logic xử lý nhiệt độ và độ ẩm
    if (isEspOn && data.city === "ESP_Location") {
        if (period === "day") {
            // Biểu đồ ngày: dùng dữ liệu ESP thời gian thực
            scaledData.temperature = Number(data.temperature) || 0;
            scaledData.humidity = Number(data.humidity) || 0;
        } else {
            // Biểu đồ tuần/tháng/năm: dùng dữ liệu thời gian thực từ ESP và nhân với multiplier
            scaledData.temperature = (Number(data.temperature) || 0) * multiplier;
            scaledData.humidity = (Number(data.humidity) || 0) * multiplier;
        }
    } else {
        scaledData.temperature = Number(data.temperature) || 0;
        scaledData.humidity = Number(data.humidity) || 0;
    }

    console.log("📊 Dữ liệu biểu đồ trước khi vẽ:", scaledData);

    const periodLabels = { day: "Ngày", week: "Tuần", month: "Tháng", year: "Năm" };

    try {
        myChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["PM10", "PM2.5", "Chỉ số UV", "Nhiệt độ", "Độ ẩm"],
                datasets: [{
                    label: `Chất lượng không khí & Thời tiết (${periodLabels[period]})`,
                    data: [
                        scaledData.pm10,
                        scaledData.pm25,
                        scaledData.uv_index,
                        scaledData.temperature,
                        scaledData.humidity
                    ],
                    backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#ff9f40", "#4bc0c0"],
                    borderColor: ["#ff6384", "#36a2eb", "#ffce56", "#ff9f40", "#4bc0c0"],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Biểu đồ Chất lượng không khí & Thời tiết (${periodLabels[period]}) - ${data.city}`
                    }
                },
                scales: {
                    y: { beginAtZero: true, suggestedMax: Math.max(...Object.values(scaledData).filter(v => v > 0), 100) * 1.2 }
                }
            }
        });
    } catch (error) {
        console.error("Lỗi khởi tạo biểu đồ:", error);
    }
}

function getWeatherIcon(temperature, humidity) {
    if (temperature > 30 && humidity < 50) return "☀️";
    if (temperature < 20 && humidity > 70) return "🌧️";
    return "☁️";
}

function updateForecastTable(data) {
    const tableBody = document.getElementById("forecastTable");
    tableBody.innerHTML = "";
    const currentTime = new Date();

    // Dùng dữ liệu thời gian thực từ ESP nếu bật ESP và là ESP_Location
    let baseTemp = 28.42; // Giá trị mặc định hợp lý cho nhiệt độ
    let baseHumid = 57.08; // Giá trị mặc định hợp lý cho độ ẩm

    if (isEspOn && data.city === "ESP_Location" && data.temperature !== undefined && data.humidity !== undefined) {
        baseTemp = Math.max(0, Number(data.temperature)); // Đảm bảo không âm
        baseHumid = Math.max(0, Math.min(100, Number(data.humidity))); // Đảm bảo trong khoảng 0-100
    } else if (data.temperature !== undefined && data.humidity !== undefined) {
        baseTemp = Math.max(0, Number(data.temperature));
        baseHumid = Math.max(0, Math.min(100, Number(data.humidity)));
    }

    console.log("📅 Dữ liệu dự đoán trước khi tính toán:", { baseTemp, baseHumid });

    for (let i = 0; i < 5; i++) {
        const row = document.createElement("tr");
        const dateCell = document.createElement("td");
        const tempCell = document.createElement("td");
        const humidCell = document.createElement("td");
        const weatherCell = document.createElement("td");

        const forecastTime = new Date(currentTime.getTime() + i * 24 * 3600 * 1000);
        dateCell.textContent = forecastTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

        const forecastTemp = (baseTemp + (Math.random() * 4 - 2)).toFixed(1); // Biến thiên ±2°C
        const forecastHumid = (baseHumid + (Math.random() * 10 - 5)).toFixed(1); // Biến thiên ±5%

        const finalTemp = Math.max(0, parseFloat(forecastTemp)); // Không âm
        const finalHumid = Math.max(0, Math.min(100, parseFloat(forecastHumid))); // Giữ trong 0-100%

        tempCell.textContent = `${finalTemp}°C`;
        humidCell.textContent = `${finalHumid}%`;
        weatherCell.textContent = getWeatherIcon(finalTemp, finalHumid);

        row.appendChild(dateCell);
        row.appendChild(tempCell);
        row.appendChild(humidCell);
        row.appendChild(weatherCell);
        tableBody.appendChild(row);
    }
    console.log("📅 Dữ liệu dự đoán sau khi tính toán:", { baseTemp, baseHumid });
}

function getCurrentDisplayedCityData() {
    return weatherData.find(city => city.city === document.getElementById("city").innerText) || weatherData[0] || {};
}

function setButtonState(text, disabled) {
    const button = document.getElementById("espButton");
    if (button) {
        button.innerText = text;
        button.disabled = disabled;
    }
}