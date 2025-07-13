# MFlow - Modern Manga ve Webtoon Okuma Sitesi

Modern ve kullanıcı dostu bir manga ve webtoon okuma platformu. Next.js, TypeScript ve MongoDB ile geliştirilmiştir.

## 🚀 Özellikler

- **Modern UI/UX**: Responsive ve kullanıcı dostu arayüz
- **Manga Yönetimi**: Manga ekleme, düzenleme ve silme
- **Bölüm Okuma**: Gelişmiş okuma deneyimi
- **Kullanıcı Sistemi**: Kayıt, giriş ve profil yönetimi
- **Admin Paneli**: Kapsamlı yönetim araçları
- **Arama ve Filtreleme**: Gelişmiş arama özellikleri
- **Yorumlar ve Reaksiyonlar**: Sosyal etkileşim
- **Okuma Geçmişi**: Kişisel okuma takibi
- **Listeler**: Özel manga listeleri oluşturma
- **Çeviri Desteği**: AI destekli çeviri özellikleri

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Veritabanı**: MongoDB, Mongoose
- **Kimlik Doğrulama**: NextAuth.js, JWT
- **Dosya Yükleme**: Multer
- **AI**: Google Generative AI (Gemini)
- **OCR**: Tesseract.js

## 📦 Kurulum

1. **Repository'yi klonlayın:**
   ```bash
   git clone https://github.com/[kullanici-adi]/MFlow.git
   cd MFlow
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın:**
   `.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Admin kullanıcısı oluşturun:**
   ```bash
   npm run init-admin
   ```

5. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Vercel (Önerilen)

1. GitHub repository'nizi Vercel'e bağlayın
2. Ortam değişkenlerini Vercel dashboard'unda ayarlayın
3. Deploy edin

### Manuel Deployment

1. **Production build oluşturun:**
   ```bash
   npm run build
   ```

2. **Production sunucusunu başlatın:**
   ```bash
   npm start
   ```

## 📁 Proje Yapısı

```
MFlow/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin paneli
│   ├── manga/             # Manga sayfaları
│   └── ...
├── components/            # React bileşenleri
│   ├── ui/               # UI bileşenleri
│   ├── layout/           # Layout bileşenleri
│   └── home/             # Ana sayfa bileşenleri
├── lib/                  # Yardımcı kütüphaneler
│   ├── database.ts       # Veritabanı bağlantısı
│   ├── models/           # MongoDB modelleri
│   └── ...
├── public/               # Statik dosyalar
├── scripts/              # Yardımcı scriptler
├── types/                # TypeScript tip tanımları
└── utils/                # Yardımcı fonksiyonlar
```

## 🔧 Kullanım

### Admin Paneli
- `/admin` adresinden admin paneline erişebilirsiniz
- Manga ekleme, düzenleme ve silme
- Kullanıcı yönetimi
- Sistem ayarları

### Kullanıcı Özellikleri
- Manga okuma ve takip etme
- Yorum yapma ve reaksiyon verme
- Kişisel listeler oluşturma
- Okuma geçmişi takibi

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje Sahibi - [GitHub](https://github.com/[kullanici-adi])

Proje Linki: [https://github.com/[kullanici-adi]/MFlow](https://github.com/[kullanici-adi]/MFlow)