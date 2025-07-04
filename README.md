# 🕒 Görev Takip Uygulaması

Bu proje, React tabanlı görev Takip Uygulamasıdır. Kullanıcılar sistem üzerinden görevler tanımlayabilir, bu görevleri kişilerle ilişkilendirebilir ve her görev için tahmini süre belirleyebilir. Görevler başlatıldığında sistem saniye bazında süreyi takip eder; duraklatılabilir, devam ettirilebilir ve tamamlandığında “tamamlanan görevler” listesine kaydedilir. Uygulama, görev yönetimini kolaylaştırmak, süre takibini görselleştirmek ve kullanıcıya esnek bir kontrol sağlamak amacıyla geliştirilmiştir.

⚙️ Firebase Ayarları:

Uygulamanın veritabanına erişebilmesi için aşağıdaki security rules Firebase Console üzerinden eklenmelidir:

Firebase Console'a gidin: https://console.firebase.google.com
Sol menüden "Build" > "Realtime Database" sekmesine geçin.
Sağ üstte yer alan "Rules" sekmesine tıklayın.
Aşağıdaki JSON içeriğini kural kutusuna yapıştırın:
{
  "rules": {
    ".read": true,
    ".write": true
  }
}

"Publish" butonuna tıklayarak değişiklikleri kaydedin.


firebase.js içindeki firebaseConfig alanını Firebase Console'daki "Project Settings > General" sekmesinde yer alan "Firebase SDK snippet (config)" bölümünden alınan bilgilerle doldurun.

Örnek: const firebaseConfig = { 
    apiKey: "...", 
    authDomain: "...", 
    databaseURL: "...", 
    projectId: "...", 
    storageBucket: "...", 
    messagingSenderId: "...", 
    appId: "..." 
    };

