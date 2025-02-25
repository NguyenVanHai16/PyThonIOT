import firebase_admin
from firebase_admin import credentials, db

# Khởi tạo Firebase nếu chưa khởi tạo
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(r"D:\FileHocTap\PyThonIOT\firebase\iot-13-6c835-firebase-adminsdk-fbsvc-a9fa44aa0a.json")
        firebase_admin.initialize_app(cred, {'databaseURL': 'https://iot-13-6c835-default-rtdb.asia-southeast1.firebasedatabase.app/'})
        print("✅ Firebase đã được khởi tạo thành công!")
    except Exception as e:
        print(f"❌ Lỗi khi khởi tạo Firebase: {e}")

def push_data(data):
    """Đẩy dữ liệu trực tiếp lên Firebase"""
    try:
        ref = db.reference("sensor_data")
        ref.push({
            "city": data["city"],
            "temperature": data["temperature"],
            "humidity": data["humidity"],
            "pm10": data["pm10"],
            "pm25": data["pm25"],
            "uv_index": data["uv_index"]
        })
        print(f"✅ Đã gửi dữ liệu của {data['city']} lên Firebase!")
    except Exception as e:
        print(f"❌ Lỗi khi đẩy dữ liệu lên Firebase: {e}")