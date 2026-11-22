# Slide cưới tone đỏ

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
Sửa mọi thứ trong `config.js`: cloudName + ảnh Cloudinary, tên, nhạc, giọng thoại.
Tua nhanh để kiểm tra: `/?t=33.5&paused=1`
