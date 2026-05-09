# Admin Web App Roadmap

Mục tiêu:
- Giữ nguyên đường dẫn admin hiện tại: `/admin/`
- Nâng admin từ trang quản trị nội dung thành web app quản lý vận hành nhà xe
- Không làm lại từ đầu, mở rộng trên nền hiện có

## 1. Cấu trúc menu đề xuất cho `/admin/`

### 1. Tổng quan
- Dashboard

### 2. Điều hành
- Booking
- Điều phối hôm nay
- Chuyến đi

### 3. Nguồn lực
- Xe
- Tài xế

### 4. Nội dung website
- Nội dung web
- Dịch vụ
- Đội xe
- Phản hồi khách hàng

### 5. Hệ thống
- Thông báo Telegram
- Nhật ký thông báo
- Tài khoản quản trị

## 2. Mục tiêu của từng màn hình

### Dashboard
Mục tiêu:
- Nhìn nhanh toàn bộ tình trạng trong ngày

Nội dung nên có:
- Booking mới hôm nay
- Booking chưa xử lý
- Booking đã xác nhận
- Booking đã gán xe/tài xế
- Xe đang bận
- Tài xế đang bận
- Chuyến sắp chạy

Action nhanh:
- Mở booking mới
- Mở danh sách chuyến hôm nay
- Mở xe/tài xế đang bận

### Booking
Mục tiêu:
- Đây là màn trung tâm để xử lý yêu cầu khách

Nội dung:
- Danh sách booking
- Lọc theo ngày
- Lọc theo trạng thái
- Tìm theo số điện thoại / tên khách
- Cột trạng thái
- Cột xe
- Cột tài xế
- Ghi chú nội bộ

Action nhanh:
- Đánh dấu đã gọi
- Xác nhận booking
- Gán xe
- Gán tài xế
- Hoàn tất
- Hủy

Trạng thái đề xuất:
- `new`
- `called_back`
- `confirmed`
- `assigned`
- `completed`
- `canceled`

### Điều phối hôm nay
Mục tiêu:
- Dùng như màn vận hành thực tế trong ngày

Nội dung:
- Booking hôm nay
- Booking chưa gán
- Xe đang rảnh
- Tài xế đang rảnh
- Chuyến đang chạy

Phần hiển thị nên theo card/list rõ ràng, thao tác nhanh hơn màn bảng.

### Chuyến đi
Mục tiêu:
- Quản lý từng chuyến đã chốt

Nội dung:
- Danh sách chuyến
- Ngày đi
- Giờ đón
- Điểm đón
- Điểm trả
- Xe phụ trách
- Tài xế phụ trách
- Booking thuộc chuyến

Trạng thái:
- `draft`
- `confirmed`
- `in_progress`
- `completed`
- `canceled`

### Xe
Mục tiêu:
- Biết xe nào đang có, xe nào rảnh, xe nào đang bận

Nội dung:
- Tên xe
- Biển số
- Số chỗ
- Loại xe
- Trạng thái
- Ghi chú

Trạng thái:
- `available`
- `busy`
- `maintenance`
- `inactive`

### Tài xế
Mục tiêu:
- Quản lý tài xế giống như quản lý xe

Nội dung:
- Họ tên
- Số điện thoại
- Trạng thái
- Ghi chú

Trạng thái:
- `available`
- `assigned`
- `off`
- `inactive`

## 3. Luồng thao tác đề xuất

### Luồng booking cơ bản
1. Khách gửi booking từ website
2. Booking vào admin với trạng thái `new`
3. Điều hành gọi lại khách
4. Chuyển sang `called_back`
5. Nếu chốt được thì chuyển `confirmed`
6. Gán xe và tài xế
7. Chuyển `assigned`
8. Khi chuyến hoàn thành thì chuyển `completed`
9. Nếu hủy thì chuyển `canceled`

### Luồng điều phối
1. Điều hành mở màn `Điều phối hôm nay`
2. Xem booking chưa gán
3. Chọn xe phù hợp
4. Chọn tài xế phù hợp
5. Nếu cần thì gom vào một chuyến
6. Theo dõi đến khi hoàn tất

## 4. Gợi ý bố cục sidebar cho admin

```text
Tổng quan
  Dashboard

Điều hành
  Booking
  Điều phối hôm nay
  Chuyến đi

Nguồn lực
  Xe
  Tài xế

Website
  Nội dung web
  Dịch vụ
  Đội xe
  Phản hồi

Hệ thống
  Telegram
  Nhật ký thông báo
  Tài khoản quản trị
```

## 5. Gợi ý thứ tự triển khai thực tế

### Sprint 1
- Nâng cấp màn Booking
- Thêm module Xe
- Thêm module Tài xế
- Thêm gán xe / gán tài xế cho booking

### Sprint 2
- Thêm Dashboard
- Thêm `Điều phối hôm nay`
- Thêm lịch sử trạng thái booking

### Sprint 3
- Thêm module `Chuyến đi`
- Gom nhiều booking vào một chuyến
- Theo dõi trạng thái chuyến

## 6. Điểm quan trọng khi giữ `/admin/`

- Không đổi đường dẫn truy cập
- Không đổi cách đăng nhập hiện tại
- Không đổi deploy flow hiện có
- Chỉ mở rộng bên trong app `admin`

Nghĩa là sau này bạn vẫn truy cập:
- `https://nhaxedinhdung.vn/admin/`

Nhưng bên trong sẽ đầy đủ hơn để dùng như web app quản lý vận hành.

## 7. Bước tiếp theo nên làm ngay

Sau tài liệu này, bước code hợp lý nhất là:
1. Chốt schema DB cho `Vehicle`, `Driver`, mở rộng `BookingRequest`
2. Tạo migration Prisma
3. Làm API CRUD cho xe và tài xế
4. Làm UI admin cho:
   - Booking nâng cao
   - Xe
   - Tài xế

## 8. Lưu ý bám đúng hệ thống hiện tại

Ở hệ thống hiện tại:
- `Vehicle` đã tồn tại và đang phục vụ cả phần website lẫn lịch xe
- Sprint 1 có thể tận dụng chính `Vehicle` hiện có để gán xe cho booking

Điều đó giúp:
- không phải phá schema cũ
- làm nhanh hơn
- giữ `/admin/` và flow hiện tại ổn định

Nếu sau này cần tách rõ hơn giữa:
- xe dùng để hiển thị website
- xe vận hành thực tế

thì mới cân nhắc thêm model riêng ở giai đoạn sau.
