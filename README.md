# Vũ Mạnh & Ngọc Ánh

Site tĩnh (HTML/CSS/JS), không cần build.

## Chạy thử trên máy
Mở `index.html`, hoặc chạy `npx serve .` rồi vào địa chỉ hiện ra.
(Nên dùng server như trên để âm thanh trong `audio/` phát ổn định.)

## Đưa lên Vercel
Cách 1 – CLI:
    npm i -g vercel
    cd wedding-slide
    vercel --prod

Cách 2 – Web: đẩy thư mục này lên GitHub → vercel.com/new → Import.
Framework Preset: **Other**. Build Command và Output Directory để trống
(vercel.json đã cấu hình sẵn). Nếu repo chứa cả thư mục cha, đặt
**Root Directory** = `wedding-slide`.

## Tuỳ chỉnh
Chép ảnh vào thư mục `images/`, rồi sửa `config.js`: tên file ảnh (vd `gallery1: 'anh1.jpg'`), tên, nhạc, giọng thoại. Không còn dùng Cloudinary.
Tua nhanh để kiểm tra: `/?t=33.5&paused=1`