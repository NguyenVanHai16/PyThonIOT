import paho.mqtt.client as mqtt
import json
import time
import threading
import mysql.connector
from datetime import datetime
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import requests
import random

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, resources={r"/api/*": {"origins": "*"}})

MQTT_BROKER = "192.168.0.103"
MQTT_PORT = 1883
MQTT_TOPIC = "CamBien"

API_TOKEN = "e27f9e5ea31856496aaf4d6fcdb1ea7cdefb2334"
city_ids = {
    "Hà Nội": 8641,
    "TP Hồ Chí Minh": 13756,
    "Đà Nẵng": 13658,
    "Bắc Ninh": 12964,
    "Cần Thơ": 13687,
    "Sơn La": 13663,
    "Thái Bình": 14641,
    "Thái Nguyên": 13027,
    "Thừa Thiên Huế": 12488,
}

latest_esp_data = {"temperature": 0, "humidity": 0}
api_data_cache = {}

def connect_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="12345",
        database="weather_db"
    )

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Kết nối MQTT thành công!")
        client.subscribe(MQTT_TOPIC)
        print(f"📡 Đã subscribe vào topic: {MQTT_TOPIC}")
    else:
        print(f"❌ Kết nối thất bại, mã lỗi: {rc}")

def on_message(client, userdata, msg):
    global latest_esp_data
    #print(f"📡 Nhận tin nhắn từ topic {msg.topic}: {msg.payload.decode('utf-8')}")
    try:
        payload = msg.payload.decode("utf-8")
        data = json.loads(payload)
        new_data = {
            "temperature": round(float(data.get("temperature", 0)), 2),
            "humidity": round(float(data.get("humidity", 0)), 2)
        }
        if new_data != latest_esp_data:
            latest_esp_data = new_data
            save_to_db("ESP_Location", new_data["temperature"], new_data["humidity"], 0, 0, 0)
        #print(f"📡 Dữ liệu MQTT từ ESP: {latest_esp_data}")
    except Exception as e:
        print(f"❌ Lỗi xử lý dữ liệu MQTT: {e}")

mqtt_client = None
try:
    mqtt_client = mqtt.Client(client_id="web_server", protocol=mqtt.MQTTv5)  # Thêm client_id để tránh DeprecationWarning
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    #print(f"📡 Đang kết nối tới MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
except Exception as e:
    print(f"⚠️ Không thể kết nối MQTT broker: {e}. Chạy web mà không có ESP.")

def fetch_all_air_quality():
    global api_data_cache
    results = {}
    for city, city_id in city_ids.items():
        url = f"https://api.waqi.info/feed/@{city_id}/?token={API_TOKEN}"
        try:
            response = requests.get(url)
            data = response.json()
            if "data" in data and "iaqi" in data["data"]:
                result = {
                    "city": city,
                    "pm10": round(data["data"]["iaqi"].get("pm10", {}).get("v", random.uniform(10, 50)), 2),
                    "pm25": round(data["data"]["iaqi"].get("pm25", {}).get("v", random.uniform(5, 40)), 2),
                    "uv_index": round(data["data"]["iaqi"].get("o3", {}).get("v", random.uniform(0, 5)), 2),
                    "temperature": 0,
                    "humidity": 0
                }
                #print(f"🌍 Dữ liệu API cho {city}: {result}")
                if result != api_data_cache.get(city):
                    save_to_db(city, 0, 0, result["pm10"], result["pm25"], result["uv_index"])
                results[city] = result
            else:
                print(f"⚠️ Không có dữ liệu cho {city}")
        except Exception as e:
            print(f"❌ Lỗi gọi API cho {city}: {e}")
        time.sleep(1)
    api_data_cache = results
    return results

def has_data_changed(city, temp, humidity, pm10, pm25, uv):
    try:
        db = connect_db()
        cursor = db.cursor()
        today = datetime.now().date()
        sql = """SELECT temperature, humidity, pm10, pm25, uv_index 
                 FROM sensor_data 
                 WHERE city = %s AND DATE(timestamp) = %s 
                 ORDER BY timestamp DESC LIMIT 1"""
        cursor.execute(sql, (city, today))
        result = cursor.fetchone()
        cursor.close()
        db.close()
        if result:
            last_temp, last_humidity, last_pm10, last_pm25, last_uv = result
            return (abs(temp - last_temp) > 0.1 or
                    abs(humidity - last_humidity) > 0.1 or
                    abs(pm10 - last_pm10) > 0.1 or
                    abs(pm25 - last_pm25) > 0.1 or
                    abs(uv - last_uv) > 0.1)
        return True
    except mysql.connector.Error as err:
        print(f"❌ Lỗi kiểm tra dữ liệu: {err}")
        return True

def save_to_db(city, temp, humidity, pm10, pm25, uv):
    try:
        if not has_data_changed(city, temp, humidity, pm10, pm25, uv):
            print(f"⚠️ Dữ liệu không thay đổi ({city})")
            return
        db = connect_db()
        cursor = db.cursor()
        sql = """INSERT INTO sensor_data 
                 (city, temperature, humidity, pm10, pm25, uv_index) 
                 VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(sql, (city, temp, humidity, pm10, pm25, uv))
        db.commit()
        #print(f"✅ Đã lưu ({city}): ({temp}, {humidity}, {pm10}, {pm25}, {uv})")
        cursor.close()
        db.close()
    except mysql.connector.Error as err:
        print(f"❌ Lỗi lưu MySQL: {err}")

def update_api_data():
    while True:
        fetch_all_air_quality()
        time.sleep(60)

@app.route('/')
def home():
    #print("📡 Truy cập trang chủ")
    return render_template('index.html')

@app.route('/api/latest', methods=['GET'])
def get_latest_data():
    data = {
        "ESP_Location": latest_esp_data,
        **api_data_cache
    }
    #print(f"📡 Trả về dữ liệu API /latest: {list(data.values())}")
    return jsonify(list(data.values()))

@app.route('/api_esp', methods=['GET'])
def get_esp_data():
    #print(f"📡 Trả về dữ liệu ESP: {latest_esp_data}")
    return jsonify(latest_esp_data)

if __name__ == "__main__":
    print("✅ Flask app đang khởi động...")
    fetch_all_air_quality()
    threading.Thread(target=update_api_data, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=True)