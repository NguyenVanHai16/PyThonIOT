#  IoT Weather & Air Quality Monitoring System

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.info/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MQTT](https://img.shields.io/badge/MQTT-660066?style=for-the-badge&logo=mqtt&logoColor=white)](https://mqtt.org/)

Hệ thống giám sát môi trường toàn diện kết hợp dữ liệu từ **cảm biến thực tế (ESP32/ESP8266)** và **Weather API**. Dự án cung cấp giải pháp theo dõi trực quan các chỉ số bụi mịn PM2.5, PM10, UV và điều kiện vi khí hậu trong phòng.

---

##  Tính năng nổi bật

Dự án tập trung vào việc xử lý dữ liệu thời gian thực và trải nghiệm người dùng trực quan:

* ** Real-time Monitoring**: Kết nối thiết bị phần cứng qua giao thức **MQTT**. Hỗ trợ điều khiển bật/tắt ESP và tùy chỉnh chu kỳ lấy mẫu dữ liệu (5s - 60s) ngay trên Dashboard.
* ** Data Visualization**: Tích hợp **Chart.js** để vẽ biểu đồ tương tác, hỗ trợ lọc dữ liệu theo **Ngày, Tuần, Tháng, Năm**.
* ** Smart Search**: Tra cứu chất lượng không khí tại hơn 9 tỉnh thành lớn (Hà Nội, TP.HCM, Đà Nẵng, Thái Nguyên...) với hệ thống gợi ý tìm kiếm thông minh.
* ** Predictive System**: Thuật toán dự báo thời tiết 5 ngày tới dựa trên sự biến thiên dữ liệu môi trường thực tế.
* ** Glassmorphism UI**: Giao diện hiện đại, tối ưu hóa hiển thị (Responsive) trên cả Desktop và Mobile.

---

##  Công nghệ sử dụng

### **Frontend**
- **HTML5 & CSS3**: Thiết kế giao diện hiện đại với hiệu ứng Glassmorphism và Gradient.
- **JavaScript (ES6+)**: Xử lý logic phía Client, gọi API và quản lý trạng thái thiết bị.
- **Chart.js**: Thư viện hiển thị biểu đồ chuyên nghiệp.

### **Backend & Communication**
- **Node.js / Express.js**: Xây dựng Server quản lý API và luồng dữ liệu chính.
- **Python (Flask)**: Xử lý các kịch bản MQTT và logic bổ trợ cho phần cứng.
- **MQTT Protocol**: Truyền nhận dữ liệu nhẹ, tối ưu cho các thiết bị nhúng.

### **Database**
- **MySQL & MySQL2**: Lưu trữ dữ liệu cảm biến và lịch sử môi trường để phân tích xu hướng.

---

## 📂 Cấu trúc dự án

```text
├── static/            # CSS, JavaScript (Xử lý logic Dashboard & Chart.js)
├── templates/         # Giao diện chính (index.html)
├── web.py             # Script Python xử lý MQTT & Flask API
├── package.json       # Quản lý dependencies (Express, MQTT, MySQL2, Axios)
├── .env               # Cấu hình biến môi trường (Database, API Key)
└── firebase/          # Cấu hình Firebase cho các tính năng mở rộng

- Hướng dẫn cài đặt
Clone dự án:

Bash

git clone [https://github.com/your-username/iot-weather.git](https://github.com/your-username/iot-weather.git)
cd iot-weather
Cài đặt thư viện:

Bash

npm install
pip install paho-mqtt flask flask-cors
Cấu hình môi trường: Tạo file .env tại thư mục gốc và điền thông số MySQL/MQTT.

Chạy server:

Bash

npm start
- Lộ trình phát triển
[ ] Tích hợp thông báo đẩy qua Firebase khi mức ô nhiễm vượt ngưỡng an toàn.

[ ] Xây dựng Mobile App để quản lý các trạm đo từ xa.

Ghi chú: Đây là dự án thực tế giúp tôi rèn luyện tư duy lập trình hệ thống IoT, cách xử lý bất đồng bộ trong JavaScript và quản trị cơ sở dữ liệu MySQL. Mã nguồn thể hiện rõ khả năng tối ưu hóa luồng dữ liệu từ phần cứng lên giao diện Web.
