-- 1. Add new column for "Açık Rıza Metni" if it doesn't exist
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS consent_content TEXT;

-- 2. Update Site Settings with Professional Legal Texts
UPDATE site_settings
SET
  -- Titles
  terms_text = 'Kullanım Koşulları',
  privacy_text = 'Gizlilik Politikası',
  kvkk_text = 'KVKK Aydınlatma Metni',
  cookie_text = 'Ticari Elektronik İleti Onayı', 

  -- Content
  
  -- AÇIK RIZA METNİ (Consent) - New Column
  consent_content = '<h3>AÇIK RIZA METNİ</h3>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; <strong>Katılım Uzmanı</strong> ("Şirket") tarafından Aydınlatma Metni ile bilgilendirildim.</p>
<p>Kimlik, iletişim, işlem güvenliği ve pazarlama verilerimin; Şirket tarafından sunulan ürün ve hizmetlerin beğeni, kullanım alışkanlıkları ve ihtiyaçlarıma göre özelleştirilerek önerilmesi, analiz çalışmaları yapılması, kampanya ve tanıtım faaliyetlerinin yürütülmesi amaçlarıyla işlenmesine; ve bu amaçlarla sınırlı olmak üzere yurt içinde bulunan tedarikçiler ve iş ortaklarıyla paylaşılmasına özgür irademle <strong>AÇIK RIZA</strong> veriyorum.</p>',
  
  -- 1. KULLANIM KOŞULLARI (Terms)
  terms_content = '<h3>1. TARAFLAR</h3>
<p>İşbu Kullanım Koşulları ("Sözleşme"), <strong>Katılım Uzmanı</strong> ("Platform") ile Platform''a üye olan veya Platform''u ziyaret eden kullanıcı ("Kullanıcı") arasında akdedilmiştir. Kullanıcı, Platform''u kullanarak işbu Sözleşme''de yer alan tüm şartları kabul etmiş sayılır.</p>

<h3>2. HİZMETİN KAPSAMI</h3>
<p>2.1. <strong>Katılım Uzmanı</strong>, kullanıcılarına tasarruf finansman hesaplama araçları, karşılaştırma tabloları ve sektörel bilgilendirme hizmetleri sunan bir web platformudur.</p>
<p>2.2. Platform üzerinde sunulan hesaplama sonuçları, faiz oranları ve maliyet tabloları "tahmini" nitelikte olup, kesin sonuçlar ilgili tasarruf finansman şirketlerinin şubelerinde belirlenir. Platform, bu bilgilerin kesinliği konusunda garanti vermez.</p>

<h3>3. KULLANIM ŞARTLARI VE YÜKÜMLÜLÜKLER</h3>
<p>3.1. Kullanıcı, Platform''a üye olurken verdiği bilgilerin doğru ve güncel olduğunu kabul ve taahhüt eder.</p>
<p>3.2. Kullanıcı, Platform''u hukuka ve ahlaka aykırı amaçlarla kullanamaz. Platform''un sistemine, yazılımına veya içeriğine zarar verecek girişimlerde bulunamaz.</p>
<p>3.3. Platform, sunduğu hizmetlerin sürekliliğini sağlamak için azami gayret gösterecek olup, teknik arızalar veya bakım çalışmaları nedeniyle hizmet kesintilerinden sorumlu tutulamaz.</p>

<h3>4. FİKRİ MÜLKİYET HAKLARI</h3>
<p>Platform''da yer alan tüm logolar ("Katılım Uzmanı"), tasarımlar, yazılımlar ve içerikler Platform''un mülkiyetindedir veya lisanslı olarak kullanılmaktadır. İzinsiz kopyalanması, çoğaltılması veya dağıtılması yasaktır.</p>

<h3>5. SORUMLULUK REDDİ</h3>
<p>Platform, üçüncü taraf web sitelerine veya hizmetlerine bağlantılar içerebilir. Bu bağlantıların içeriğinden veya güvenliğinden Platform sorumlu değildir. Kullanıcı, üçüncü taraf hizmetlerini kendi sorumluluğunda kullanır.</p>

<h3>6. SÖZLEŞME DEĞİŞİKLİKLERİ</h3>
<p>Katılım Uzmanı, işbu Sözleşme şartlarını dilediği zaman güncelleme hakkını saklı tutar. Değişiklikler Platform''da yayınlandığı tarihte yürürlüğe girer.</p>

<h3>7. UYUŞMAZLIKLARIN ÇÖZÜMÜ</h3>
<p>İşbu Sözleşme''den doğabilecek uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>',

  -- 2. GİZLİLİK POLİTİKASI (Privacy)
  privacy_content = '<h3>1. GİRİŞ</h3>
<p><strong>Katılım Uzmanı</strong> olarak, gizliliğinize ve kişisel verilerinizin güvenliğine büyük önem veriyoruz. İşbu Gizlilik Politikası, Platform''umuzu kullandığınızda verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.</p>

<h3>2. TOPLANAN VERİLER</h3>
<p>Platform''umuzu kullanırken aşağıdaki veriler toplanabilir:</p>
<ul>
<li><strong>Kimlik Bilgileri:</strong> Ad, soyad.</li>
<li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası (varsa).</li>
<li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, giriş-çıkış logları, cihaz bilgileri.</li>
<li><strong>Hesaplama Verileri:</strong> Yaptığınız hesaplamalar ve tercihler.</li>
</ul>

<h3>3. VERİLERİN KULLANIM AMACI</h3>
<p>Toplanan verileriniz şu amaçlarla işlenir:</p>
<ul>
<li>Üyelik işlemlerinin gerçekleştirilmesi ve hesabınızın yönetilmesi.</li>
<li>Hesaplama araçlarının size özel sonuçlar sunabilmesi.</li>
<li>Yasal yükümlülüklerin yerine getirilmesi (5651 sayılı Kanun vb.).</li>
<li>İletişim taleplerinizin yanıtlanması.</li>
</ul>

<h3>4. ÇEREZLER (COOKIES)</h3>
<p>Kullanıcı deneyimini iyileştirmek, site trafiğini analiz etmek ve tercihlerinizi hatırlamak amacıyla çerezler kullanılmaktadır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.</p>

<h3>5. VERİ GÜVENLİĞİ</h3>
<p>Kişisel verileriniz, yetkisiz erişime, kaybolmaya veya değiştirilmeye karşı uygun teknik ve idari tedbirlerle korunmaktadır. Verileriniz, yasal zorunluluklar haricinde üçüncü kişilerle paylaşılmaz.</p>

<h3>6. İLETİŞİM</h3>
<p>Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz.</p>',

  -- 3. KVKK AYDINLATMA METNİ (KVKK)
  kvkk_content = '<h3>1. VERİ SORUMLUSU</h3>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <strong>Katılım Uzmanı</strong> ("Şirket") tarafından işbu Aydınlatma Metni kapsamında işlenebilecektir.</p>

<h3>2. KİŞİSEL VERİLERİN İŞLENME AMACI</h3>
<p>Kişisel verileriniz (Ad, Soyad, E-posta, IP Adresi vb.), aşağıdaki amaçlarla işlenmektedir:</p>
<ul>
<li>Platform üyelik süreçlerinin yürütülmesi.</li>
<li>Bilgi güvenliği süreçlerinin yürütülmesi.</li>
<li>Kullanıcı taleplerinin ve şikayetlerinin takibi.</li>
<li>Yetkili kişi, kurum ve kuruluşlara bilgi verilmesi.</li>
</ul>

<h3>3. VERİ TOPLAMA YÖNTEMİ VE HUKUKİ SEBEBİ</h3>
<p>Kişisel verileriniz, web sitesi üzerinden elektronik ortamda otomatik yollarla toplanmaktadır. Bu toplama faaliyeti, KVKK Madde 5''te belirtilen "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması" ve "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması" hukuki sebeplerine dayanmaktadır.</p>

<h3>4. KİŞİSEL VERİLERİN AKTARILMASI</h3>
<p>Kişisel verileriniz, yasal düzenlemelerin öngördüğü kapsamda yetkili kamu kurum ve kuruluşlarına (örn. Emniyet Genel Müdürlüğü, Mahkemeler) aktarılabilir. Bunun haricinde açık rızanız olmaksızın üçüncü kişilerle paylaşılmaz.</p>

<h3>5. İLGİLİ KİŞİNİN HAKLARI</h3>
<p>KVKK Madde 11 uyarınca, veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
<ul>
<li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
<li>İşlenmişse buna ilişkin bilgi talep etme,</li>
<li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
<li>Yanlış veya eksik işlenmişse düzeltilmesini isteme,</li>
<li>KVKK''da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme.</li>
</ul>',

  -- 5. TİCARİ İLETİ ONAYI (Commercial) - Mapped to cookie_content
  cookie_content = '<h3>TİCARİ ELEKTRONİK İLETİ ONAY METNİ</h3>
<p>İşbu metin, 6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik kapsamında, <strong>Katılım Uzmanı</strong> ("Platform") tarafından sunulan hizmetler ilgili olarak onayınızın alınması amacıyla hazırlanmıştır.</p>

<h3>1. ONAYIN KAPSAMI</h3>
<p>İşbu metni onaylayarak; Platform tarafından sağlanan tasarruf finansman hesaplama araçları, karşılaştırma hizmetleri, kampanyalar, özel fırsatlar, anketler, tanıtımlar, reklamlar, kutlamalar ve benzeri bilgilendirmeler hakkında; tarafıma <strong>SMS, E-posta, Telefon araması ve diğer elektronik iletişim araçları</strong> yoluyla ticari elektronik ileti gönderilmesine açık rıza gösteriyorum.</p>

<h3>2. HİZMET SAĞLAYICILAR VE İYS</h3>
<p>Verdiğim onayın, İleti Yönetim Sistemi (İYS) üzerinden görüntülenebileceğini ve yönetilebileceğini biliyorum. İletişim bilgilerimin, ticari ileti gönderimi sağlanması amacıyla hizmet alınan üçüncü taraf iş ortakları ve hizmet sağlayıcılarla (SMS firmaları, e-posta gönderim servisleri vb.) paylaşılmasına onay veriyorum.</p>

<h3>3. RED HAKKI VE İPTAL</h3>
<p>Tarafıma gönderilen ticari elektronik iletileri dilediğim zaman, hiçbir gerekçe göstermeksizin reddetme hakkına sahip olduğumu; iletilerde yer alan "ret/iptal" bağlantılarını kullanarak veya İYS üzerinden onayımı kaldırarak ticari ileti alımını durdurabileceğimi kabul ve beyan ederim.</p>'

WHERE id IS NOT NULL;
