window.WEDDING_CONFIG = {
  /* Thư mục chứa ảnh. Bỏ ảnh vào đây rồi ghi tên file bên dưới. */
  imagesDir: 'images/',

  /* Mỗi ảnh: tên file trong images/ (vd 'anh1.jpg'), hoặc null = để ô phông xanh.
     Muốn chỉnh vùng giữ lại khi cắt khung: viết dạng { src: 'anh1.jpg', focus: '50% 20%' } */
  images: {
    collageCutout: "AC_01_no_background.png", // Cảnh 1: nửa người + bó hoa (PNG nền trong suốt)
    saveCutout:    "AC_02_no_background.png", // Cảnh 2: toàn thân (PNG nền trong suốt)
    storyCutout:   "AC_05_no_background.png", // Cảnh 4: người cắt nền (PNG nền trong suốt)
    gallery1:      "AC_06.jpg", // Cảnh 5: 3 ảnh dọc
    gallery2:      "AC_08.jpg",
    gallery3:      "AC_07.jpg",
    /* Cảnh 6: full màn hình, phủ kín khung (không blur). focus: số thứ hai nhỏ = lấy phần trên ảnh (ảnh như dịch xuống), lớn = lấy phần dưới. */
    finally:       { src: "AC_10.jpg", focus: "50% 30%" },
    pairTall:      "AC_03.jpg", // Cảnh 7
    /* Cảnh 7: ảnh ngang phía trên chữ. focus: số thứ hai nhỏ = lấy phần trên ảnh (ảnh như dịch xuống, thấy mặt), lớn = lấy phần dưới. */
    pairWide:      { src: "AC_04.jpg", focus: "50% 15%" },
    gratitude:     "AC_01_no_background.png", // Cảnh 8: dọc bên phải
    promise:       "AC_05.jpg", // Cảnh 9: dọc bên trái
    thanksPhoto:   "AC_10.jpg", // Cảnh 10: dọc bên trái
    /* Cảnh 12: ngang trong chữ LOVE. focus: số thứ hai nhỏ = lấy phần trên ảnh (ảnh như dịch xuống), lớn = lấy phần dưới. */
    love:          { src: "AC_09.jpg", focus: "50% 30%" },
  },

  text: {
    groom: 'Vũ Mạnh',
    bride: 'Ngọc Ánh',
    date: '13.12.2026',

    comments: {
      q1: '“ Rửa bát ai làm?”',
      a1: 'Anh Làm',
      q2: '“Giặt đồ ai làm?”',
      a2: 'Anh Làm',
      q3: '“Đổ rác ai làm?”',
      a3: 'Anh Làm',
      ok: 'Oke =)))',
      wife1: 'Vợ anh thì',
      wife2: 'Em làm !!!',
    },

    firstWords: {
      title: 'Lời đầu tiên',
      lines: [
        'Chúng con rất hân hạnh được chào đón sự',
        'có mặt của đông đủ quý vị khách quý.',
        'Sự hiện diện của tất cả mọi người là lời',
        'chúc tốt đẹp nhất cho chúng con.',
      ],
    },

    story: {
      title: 'Sau quãng thời gian',
      lines: [
        'tìm hiểu, yêu thương và được sự vun vén của gia',
        'đình, chúng con đã chính thức về chung một nhà',
        'trong sự chúc phúc của gia đình, họ hàng hai bên,',
        'anh chị em, bạn bè, đồng nghiệp.',
      ],
    },

    today: ['NGÀY HÔM NAY LÀ MỘT NGÀY VÔ CÙNG', 'Ý NGHĨA ĐỐI VỚI CHÚNG CON'],

    finally: { script: 'Finally We', small: 'ARE GETTING MARRIED' },

    pair: [
      'Hôm nay, giữa những người',
      'thân yêu nhất, chúng ta lựa chọn',
      'nắm tay nhau bước sang chương mới',
    ],

    gratitude: {
      title: 'Lời tri ân',
      lines: [
        'Chúng con biết, nếu không có ba mẹ,',
        'sẽ không có khoảnh khắc thiêng liêng này.',
        'Cảm ơn ba mẹ đã luôn dang rộng vòng tay',
        'yêu thương, đã thầm lặng vun vén, lo toan',
        'từ những điều giản dị nhất, để chúng con',
        'được trọn vẹn trong ngày hôm nay.',
      ],
    },

    promise: [
      'Chúng con biết rằng, từ nay,',
      'mỗi bước chúng con đi sẽ có ba mẹ',
      'dõi theo, âm thầm nhưng sâu sắc.',
      'Chúng con xin hứa sẽ gìn giữ sự yêu',
      'thương, sẽ nâng niu và vun đắp tổ ấm',
      'này bằng sự chân thành và trách nhiệm.',
      'Chúng con yêu ba mẹ rất nhiều!',
    ],

    deep: {
      title: 'Từ sâu thẳm đáy lòng',
      lines: [
        'Một lần nữa, con/cháu/em/mình',
        'xin được gửi lời cảm ơn sâu sắc',
        'đến ông bà, cha mẹ, gia đình hai bên',
        'cùng anh chị em, đồng nghiệp,',
        'bạn bè đã góp mặt và chúc phúc cho',
        'ngày đặc biệt này.',
      ],
    },

    thankYou: {
      title: 'THANK YOU',
      lines: [
        'Ngày trọng đại nhất của vợ chồng con đã trở nên',
        'ý nghĩa và tuyệt vời nhờ sự giúp đỡ, hiện diện, hàng ngàn lời chúc và',
        'tình yêu thương từ toàn thể Ông Bà, Cha Mẹ, họ hàng hai bên,',
        'quý vị quan khách, cùng anh/chị/em đồng nghiệp và bạn bè.',
      ],
      closing: 'CHÚNG CON XIN CẢM ƠN!',
    },

    loveCaption: 'Cảm ơn tất cả mọi người đã đến chung vui',
  },

  // Lắc lư nhẹ của cô dâu chú rể: deg = biên độ (độ), period = chu kỳ (giây). deg: 0 để tắt.
  cutoutSway: { deg: 1.6, period: 1.7 },

  playback: {
    autoplay: true,
    loop: true,
    loopDelay: 1.5,
    // Làm chậm chữ + các cảnh từ cảnh 2 trở đi (cảnh 1 giữ nguyên để khớp giọng thoại).
    // 1 = tốc độ gốc, 1.4 = chậm hơn 40%, 1.7 = chậm hơn nữa. Tăng nếu vẫn thấy nhanh.
    slow: 3,
    // Nhạc nền: đặt bài hát của bạn vào thư mục audio/ rồi điền đường dẫn, vd 'audio/bai-hat.mp3'
    // (hoặc một link https://). Muốn dùng nguyên âm thanh gốc của video: 'audio/original-full.mp3'
    music: "audio/noi_gio_len.mp3",
    musicVolume: 0.6,    // âm lượng tối đa của bài hát (0–1)
    musicStart: 11.4,    // (dự phòng) giây bắt đầu mở nhạc, nếu không dùng musicFadeWithVoice
    musicFadeIn: 6,      // (dự phòng) nhỏ → to dần trong 6 giây, nếu không đọc được độ dài giọng thoại
    musicFadeWithVoice: 9, // nhạc vào ĐÚNG lúc giọng thứ 9 (09-em-lam, đếm từ 0) bắt đầu, nhỏ → to dần HẾT giọng đó rồi về âm lượng chuẩn
    musicFadeFrom: 0.1,  // âm lượng lúc mới vào = 10% âm lượng chuẩn (0 = từ im lặng)
    musicFrom: 0,        // muốn bỏ qua đoạn đầu bài hát thì tăng số này (giây)

    // Giọng thoại ở cảnh 1, phát đúng mốc giây (at). Chỉnh `at` nếu muốn lệch sớm/muộn.
    // Dùng file đã cắt sẵn trong audio/voices/ hoặc thay bằng file thu âm của bạn.
    voiceVolume: 1,
    voices: [
      // 0–2 giây đầu: âm thanh mở đầu (nhạc + hiệu ứng khi biển THE WEDDING hiện). Xoá dòng này nếu dùng bài hát riêng.
      { src: 'audio/voices/00-intro.mp3',          at: 0 },
      { src: 'audio/voices/01-rua-bat-ai-lam.mp3', at: 2.0 },
      { src: 'audio/voices/02-anh-lam.mp3',        at: 3.2 },
      { src: 'audio/voices/03-giat-do-ai-lam.mp3', at: 3.95 },
      { src: 'audio/voices/04-anh-lam.mp3',        at: 5.2 },
      { src: 'audio/voices/05-do-rac-ai-lam.mp3',  at: 6.2 },
      { src: 'audio/voices/06-anh-lam.mp3',        at: 8.0 },
      { src: 'audio/voices/07-oke.mp3',            at: 9.25 },
      { src: 'audio/voices/08-vo-anh-thi.mp3',     at: 10.15 },
      { src: 'audio/voices/09-em-lam.mp3',         at: 11.4 },
    ],
  },
};