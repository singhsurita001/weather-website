const API_KEY = "f561bb86ee646db65aebd17132ed3815";
const UNSPLASH_KEY = "WVGuMH64W841UJ9klQ9Z-nan5n1ZShN4Xm-k3i81nxk";
let chart;

// GIF Mapping (Ensure these filenames match your local folder exactly)
const weatherGifs = {
    Clear: "icegif-956.gif",
    Rain: "rain.gif",
    Clouds: "7RtV.gif",
    Mist: "mist.gif",
    Snow: "snow.gif",
    Drizzle: "rain.gif" // Fallback to rain if drizzle.mp4 isn't working
};

window.onload = () => {
    fetchWeatherByCity("London");
};

async function fetchWeatherByCity(city) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await res.json();
        if (data.cod !== 200) return alert("City not found!");

        // Update UI
        document.getElementById("city").innerText = data.name;
        document.getElementById("temp").innerText = Math.round(data.main.temp) + "°";
        document.getElementById("feels").innerText = Math.round(data.main.feels_like) + "°";
        document.getElementById("conditionText").innerText = data.weather[0].description;
        document.getElementById("humidity").innerText = data.main.humidity + "%";
        document.getElementById("windSpeed").innerText = data.wind.speed;
        document.getElementById("arrow").style.transform = `rotate(${data.wind.deg}deg)`;
        
        // Character GIF
        const mainState = data.weather[0].main;
        document.getElementById("weatherGif").src = weatherGifs[mainState] || weatherGifs.Clear;

        // Sub-calls
        updateSunArc(data.sys.sunrise, data.sys.sunset, data.timezone);
        fetchAQI(data.coord.lat, data.coord.lon);
        fetch5DayForecast(data.coord.lat, data.coord.lon);
        updateBackground(data.name);
        setMoonPhase();

    } catch (err) { console.error("Error:", err); }
}

async function updateBackground(cityName) {
    try {
        const res = await fetch(`https://api.unsplash.com/photos/random?query=${cityName},cityscape&client_id=${UNSPLASH_KEY}`);
        const data = await res.json();
        if (data.urls) {
            document.body.style.backgroundImage = `url('${data.urls.regular}')`;
        }
    } catch (err) {
        console.error("Unsplash Error:", err);
    }
}

async function fetch5DayForecast(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const data = await res.json();
    
    const grid = document.getElementById("forecast");
    grid.innerHTML = "";
    const daily = data.list.filter(f => f.dt_txt.includes("12:00:00"));
    
    daily.forEach(day => {
        const d = new Date(day.dt * 1000).toLocaleDateString('en', {weekday:'short'});
        grid.innerHTML += `<div class="forecast-item"><p>${d}</p><img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png"><br><strong>${Math.round(day.main.temp)}°</strong></div>`;
    });

    drawChart(data.list.slice(0, 8));
}

function drawChart(hours) {
    const ctx = document.getElementById("tempChart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours.map(h => h.dt_txt.split(" ")[1].substring(0, 5)),
            datasets: [{
                data: hours.map(h => h.main.temp),
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, 
            scales: { x: { ticks: { color: 'white' } }, y: { display: false } } 
        }
    });
}

function updateSunArc(sunrise, sunset, timezone) {
    const now = Math.floor(Date.now() / 1000);
    const sunDot = document.getElementById("sunDot");
    const format = (ts) => new Date((ts + timezone) * 1000).getUTCHours().toString().padStart(2, '0') + ":" + new Date((ts + timezone) * 1000).getUTCMinutes().toString().padStart(2, '0');
    
    document.getElementById("sunrise").innerText = format(sunrise);
    document.getElementById("sunset").innerText = format(sunset);

    let progress = (now - sunrise) / (sunset - sunrise);
    progress = Math.max(0, Math.min(1, progress));
    const t = progress;
    const x = Math.pow(1 - t, 2) * 20 + 2 * (1 - t) * t * 150 + Math.pow(t, 2) * 280;
    const y = Math.pow(1 - t, 2) * 120 + 2 * (1 - t) * t * 10 + Math.pow(t, 2) * 120;

    sunDot.setAttribute("cx", x);
    sunDot.setAttribute("cy", y);
    sunDot.style.opacity = (now > sunrise && now < sunset) ? "1" : "0";
}

async function fetchAQI(lat, lon) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const data = await res.json();
    const aqi = data.list[0].main.aqi;
    document.getElementById("aqi").innerText = ["Good", "Fair", "Mod", "Poor", "Haz"][aqi - 1];
}

function setMoonPhase() {
    const phase = ((new Date() - new Date("2024-01-11")) / 86400000 % 29.53) / 29.53;
    const offset = phase <= 0.5 ? 50 + phase * 100 : 150 - phase * 100;
    document.getElementById("moonPhase").style.background = `radial-gradient(circle at ${offset}% 50%, #fff 50%, #000 51%)`;
}

document.getElementById("searchBtn").onclick = () => fetchWeatherByCity(document.getElementById("searchInput").value);
document.getElementById("searchInput").onkeypress = (e) => { if(e.key === "Enter") fetchWeatherByCity(e.target.value); };