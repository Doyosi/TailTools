# TailTools inceleme ve bakım raporu

**Tarih:** 4 Ekim 2026

## CGEDataGrid ve CGEDataTable ek incelemesi — tamamlandı

Kullanıcının eklediği iki plugin; çekirdek sınıfları, yedi standalone modül, JS/type barrel'ları, package exports, stiller, mevcut demo, docs ve iki canonical skill ile birlikte incelendi. AGENTS.md ve üç rules belgesi uygulandı; mevcut plan/checklist dosyalarına bakım fazı eklendi. Mimari, public metot isimleri, tema ve Laravel/Tailwind kullanım biçimi korundu.

| Alan | Bulunan sorun | Uygulanan düzeltme |
| --- | --- | --- |
| İki pluginin modülleri | onChange callback ile parent bildirimi aynı anda çalışıp iki render/istek üretiyordu. | Callback varsa bir kez çağrılır; yoksa parent bildirimi kullanılır. |
| AJAX sürücüleri | Eski yanıt yeni veriyi ezebiliyor, eski finally aktif loading'i kapatabiliyordu. Grid Axios daima GET gönderiyordu; Table Fetch HTTP hatalarını başarılı içerik gibi işleyebiliyordu. | AbortController ve istek sürümü; yalnızca güncel yanıt render/loading'i değiştirir. Ortak küçük internal collection helper Fetch/Axios yöntem, JSON gövde, başlık ve HTTP hata davranışını eşitler. |
| Yerel/uzak veri pipeline'ı | Grid client-side AJAX bütün veriyi doğrudan basıyor ve paginator metadata'sı yerel limitleri değiştirebiliyordu. | serverSide:false yerel filter/sort/page pipeline'ını kullanır; serverSide:true sunucu toplamını/sayfasını korur. Görünüm değişikliği yüklü uzak sayfayı tekrar kullanır. |
| Seçim kimlikleri | Grid'in id olmayan kayıtları sayfadaki index üzerinden yeniden kimlik alıyordu. Table, sıfır ID'yi düşürüyor; paginator kayıtlarını farklı DOM ID'leriyle render ediyordu. Tırnaklı ID'ler selector/checkbox markup'ını bozabiliyordu. | Yerel Grid kayıtlarına sabit kimlik eşlemesi; Table'da nullish ID normalizasyonu ve Blade satırlarının veri kümesine alınması; attribute escaping ve CSS.escape. |
| Silme onayları | Grid yanlış CGEAlert argümanlarını kullanıyordu. Table iptal sonucunu truthy nesne kabul ediyordu; seçim araç çubuğu hiç oluşturulmuyordu. | Positional CGEAlert API ve isConfirmed denetimi; Table toolbar oluşturulur. Onay sırasında ikinci işlem engellenir, diyalogda gösterilen seçim snapshot'ı kullanılır; destroy/veri değişimi sonrasında onay etkisizdir. |
| Yerel kaldırma | Timer'lar destroy sonrası çalışabiliyor, yeni veri kümesinden kayıt silebiliyor; Grid kaldırma sonrası sayfayı yenilemiyordu. | Sahip olunan timer'lar iptal edilir, veri sürümü kontrol edilir; eşzamanlı farklı kaldırmalar tamamlanır; yerel sayfa yeniden hesaplanır. Sunucu sayfasında yalnızca yüklü görünüm/toplam güncellenir. |
| CGEActionButton uyumu | init metoduna HTMLElement veriliyordu; Grid her başarılı action'da kart siliyordu. | init() ile mevcut global delegation kullanılır. Restore ve diğer normal başarılar kartı korur; destructive başarıları veya açık silme işaretleri kaldırır. |
| Table sıralama/pagination | thead, attachHeaders tarafından tanınmıyordu; klavye listener'ı silinmiyor; false sortable ayarı göz ardı ediliyordu. Toplam azalınca aktif sayfa sınır dışında kalabiliyordu. Currency sıralaması binlik ayırıcıları yanlış okuyordu. | thead/HTMLElement desteği, tekil click/Enter/Space binding, non-sortable/selection header hariç tutma ve özgün attribute/class restorasyonu. Sayfa clamp edilir; All açıkça serialize edilir. US/Avrupa para biçimleri doğru sıralanır. |
| Responsive/teardown | Child row parent ID'si boştu; detached expanded row referansları, fallback resize listener'ı ve scroll sınıfları kalabiliyordu. | Parent kimliği bağlanır; detached referanslar elenir; observer/resize ve mode sınıfları temizlenir. Helper özgün DOM node'larını geri yükler, consumer listener'larını korur. |
| Plugin lifecycle | Table DOM handler'ları ve timer/frame'ları temizlenmiyordu. Grid destroyed callback'i listener temizlendikten sonra çağrılıyordu. | İdempotent destroy, istek/timer/frame/listener temizliği, destroy event'inin bir kez bildirilmesi ve aynı DOM üzerinde recreation. use() eski modülü bırakır, kontrolleri yeniden bağlar ve custom extension teardown'ını takip eder. |
| Tipler, docs ve skills | Default root declaration dört standalone modülü içermiyordu; filter.on() skill örneği gerçek API'de yoktu. | Root/default tipler, çeviri/seçim tipleri ve thead tipi eşitlendi. İki pluginin README/usage/examples/api, Table Blade rehberi ve iki skill güncellendi. API belgelerine yedi modülün declaration'ları da eklendi. |

### Doğrulama sonuçları

- npm test: **27/27 Node testi** geçti; strict **NodeNext ve Bundler** type checks geçti.
- Chrome: **82/82 tarayıcı senaryosu** geçti; bunun 32'si yeni collection regresyonudur. Programmatic ve declarative kullanım, AJAX yarışları/hataları, kimlik/seçim, onay snapshot'ı/iptali, responsive, module replacement ve destroy/recreation sınandı. Uncaught JS error yok.
- npm run build: **library ESM/UMD/CSS ve demo build** geçti.
- npm run test:package: gerçek npm arşivinde **11 plugin ve 7 modül alt yolu**, named/default import'lar ve izole NodeNext/Bundler declaration çözümlemesi geçti.
- Chrome demo **11 plugin + 4 standalone root export** ile hatasız açıldı. Derlenmiş **ESM ve UMD** içinde Select FormData, Grid/Table declarative initialization ve gerçek veri render'ı geçti.
- git diff --check: temiz. Testler tests/collections.test.mjs ve tests/collection-regressions.js içinde; mevcut interactive test sayfasına ve index.html bağlantısına entegre edildi.

### Kullanım sınırları ve teslim

Bulk delete, removeCard ve removeRow **yerel veri/görünüm işlemleridir**; sunucuya DELETE isteği göndermez. Kalıcı silmeyi backend endpoint'i veya CGEActionButton üstlenmelidir. Uzak sayfalarda kararlı ve benzersiz id verilmelidir; selected data getter'ları yalnızca yüklü yanıttaki kayıtları döndürür. Grid renderer, Table formatter ve Blade HTML güvenilen uygulama markup'ı kabul eder.

Gerçek Laravel/CSRF/backend entegrasyonu, tüm tarayıcı motorları ve screen reader davranışı bu yerel/mocked testlerle doğrulanmış sayılmaz. Paket metadata'sı private:true ve version:0.0.0 olarak korundu; publish/commit/push yapılmadı. Kaynak değişiklikleri çalışma alanındadır; node_modules/dist ignored kalır.

## Önceki dokuz plugin bakımının kaydı

İlk inceleme ile “Sonraki küçük bakım adayları” listesinin tamamı uygulandı. Dokuz plugin, AGENTS.md, rules, canonical/eski skills, docs, paket girişleri ve test altyapısı birlikte incelendi. Mevcut plugin sınıfları, CSS tasarımı ve Laravel/Tailwind akışı korundu; gerekli ortak sahiplik kodu üç küçük internal helper dosyasında toplandı.

## Sonraki küçük bakım adayları — tamamlandı

| Madde | Durum | Uygulanan düzenleme |
| --- | --- | --- |
| Drawer listener ve animasyon temizliği | Tamamlandı | Click/key/touch listener'ları AbortSignal ile kaldırılır. Modal/Drawer destroy timer ve RAF'ları iptal eder, animation Promise'lerini sonuçlandırır. Aynı DOM üzerinde yeniden oluşturma ve animasyon sırasında destroy sınandı; layout-push önceki inline stilleri geri yükler. |
| Dropzone bulk clear / avatar | Tamamlandı | clear Promise döndürür; uzak silmeleri bekler, başarısız dosyaları ve işlem sırasında yeni eklenenleri korur. Aynı dosyadaki remove/clear tek silme isteğini paylaşır. remote:false yerel önizlemeyi kaldırır. Avatar değiştirme uzak dosyayı otomatik silmez; geçersiz yeni dosya eski avatarı korur. Backend nihai sunucu varlığının sahibi olarak kalır. |
| Form aktif isteğin iptali | Tamamlandı | Axios/Fetch/XHR destroy ile abort edilir; frozen alanlar geri alınır; gecikmiş success/error/complete/progress ve redirect engellenir. Bekleyen beforeSubmit sonrasında yeni istek başlamaz. SubmitEvent submitter FormData'ya eklenir. |
| Select erişilebilirlik / native senkronizasyon | Tamamlandı | İç içe button markup kaldırıldı; trigger artık HTMLDivElement combobox. Label, listbox ID, aria-controls, aria-activedescendant ve disabled durumu bağlandı. Dış native change, boş seçim ve form reset UI'a yansır. open/opened/close/closed payload'ları declaration ile eşleşir. |
| Alert submitter / ActionButton multipart | Tamamlandı | requestSubmit yalnızca uygun gerçek submitter alır; diğer tetikleyicinin geçici hidden alanı finally ile kaldırılır. Form-associated dış butonlar desteklenir. Onay beklerken ikinci click native submit yapamaz. ActionButton FormData'yı freeze öncesi toplar, submitter değerini bir kez ekler; multipart PATCH/PUT/DELETE POST + _method, GET query parametreleri kullanır. Simülasyon ve direct request davranışı korunur. |
| Ortak overlay scroll/focus sahipliği | Tamamlandı | Modal, Drawer, Alert ve Lightbox aynı küçük ownership helper'ını kullanır. Son overlay kapanana kadar scroll kilidi kalır; eski overflow/padding/class ve z-index geri yüklenir. Üst overlay tek klavye olayını işler. Alt pencerenin erken kapanması üst pencerenin focus'unu çalmaz; nested delegation tek click işler. |
| TypeScript / paket dağıtımı | Tamamlandı | Dokuz index.d.ts barrel ve kök/default API declaration eklendi. Strict NodeNext/Bundler kontrolleri, exports, ESM/UMD + CSS library build, ayrı demo build ve gerçek npm arşivi doğrulaması eklendi. |
| Kopya doküman / skill / tracking yolları | Tamamlandı | installing/developing ve canonical SKILL.md/plan/checklist tek bakım kaynağı oldu. Eski installation/development, cge-*-skill, plan-* ve todo-checks/check-* yolları silinmeden yönlendirmeye dönüştü. Select'in eski oluşturma kaydı canonical dosyaya korundu. Makineye özel file:/// linkleri göreli bağlantılarla değiştirildi. |
| Radius / lifecycle talimatları | Tamamlandı | Rules ve skills gerçek instance/static/promise API'lerini ayırır; her plugine aynı lifecycle yöntemleri dayatılmaz. rounded-sm yeni uygun markup için tercih, Dropzone rounded-xl/circular mevcut tasarım sözleşmesidir. Tasarım topluca değiştirilmedi. |
| node_modules / dist Git takibi | Tamamlandı | .gitignore eklendi; 1.386 izlenen üretilmiş/bağımlılık dosyası yalnızca Git indeksinden çıkarıldı. Yerel klasörler korunur; npm ci/build ile yeniden üretilir. |
| Lightbox sürücü ve HTML/API kapsamı | Tamamlandı | none/css/tailwind-animations/auto portal davranışları uygulandı; auto açık işaretçiye dayanır. Destroy bekleyen media load/close/reopen işlemlerini durdurur. Tab focus trap ve ortak overlay sahipliği test edildi. Trusted HTML sözleşmesi kurulum ve kullanım belgelerinde açıklandı; doğrulanmamış erişilebilirlik iddiaları daraltıldı. |

## Kullanımı etkileyen küçük değişiklikler

- Dropzone için uzak silmenin bitmesini beklemek isteyen kod await dz.clear() kullanmalı. await dz.clear({ remote:false }) sadece yerel temizlemedir; hatalı uzak silmenin kartı kalır.
- CGESelect.trigger declaration'ı HTMLButtonElement yerine HTMLDivElement oldu. Trigger'a doğrudan disabled yazmak yerine select.disable()/enable() kullanılmalı. Dış native seçenek değişikliğinde change dispatch edin veya refresh çağırın; reset kendiliğinden yansır.
- Ana paket private tailtools@0.0.0 olarak yerel dağıtım metadata'sı kazandı. Bu bir public sürüm artışı/yayın değildir. ESM ve UMD çıktılarını yerelde doğruladık; npm/CDN yayınlaması yapılmadı.
- Root import mevcut auto-init/globals davranışını korur; individual plugin importlarında root auto-init yoktur. UMD dosyası JavaScript content-type ile servis edilmelidir.
- Yeni çalışma zamanı bağımlılığı eklenmedi. TypeScript yalnızca geliştirme/test bağımlılığıdır; mevcut runtime dependency listesi korunmuştur.

## Docs, skills ve rules

Dokuz pluginin README, usage, examples ve API dosyaları eşitlendi. API referansları dağıtılan declaration'ın birebir kopyasını içerir; bu eşitlik otomatik kontrol edilir. İlgili canonical skills gerçek davranışlarla güncellendi; eski girişler canonical skill'e yönlenir. Üç rules dosyası ve creator workflow; bakım, iptal, type barrels ve canonical kaynak politikasını açıklar. AGENTS.md'nin mimari kuralları korundu, demo linki taşınabilir hale getirildi.

Kurulum belgesi doğrulanmış yerel paket yollarını, raw/precompiled CSS farkını, Tailwind source taramasını ve Laravel multipart kullanımını anlatır. Geliştirme/versioning belgeleri build/test ve yayınlanmamış bakım durumunu kaydeder.

## Nihai doğrulama

| Kontrol | Sonuç |
| --- | --- |
| npm test | 12/12 Node request/API/belge sözleşmesi testi başarılı. |
| Strict TypeScript | NodeNext ve Bundler, strict:true ve skipLibCheck:false başarılı; hatalı event/option örnekleri de type error olarak doğrulanır. |
| Chrome regresyonları | 50/50 başarılı; yakalanmayan JavaScript hatası yok. |
| Mevcut demo | Dokuz plugin başlatıldı; yakalanmayan hata yok. |
| Derlenen ESM / UMD | Her iki bundle Chrome'da dokuz export, declarative init ve multiple FormData serileştirmesini doğru çalıştırdı. |
| npm run build | Library ESM/UMD/CSS ve dist/demo showcase/regression üretimi başarılı; build uyarısı yok. |
| npm run test:package | Gerçek tailtools-0.0.0.tgz içinde dokuz plugin importu, default/root exportlar ve izole strict declaration kontrolleri geçti; node_modules/demo paket dışında. |
| Kaynak/belge tutarlılığı | API snapshotları, compatibility linkleri ve portable link kontrolleri başarılı. |
| Git hijyeni | node_modules/dist için izlenen dosya sayısı 0; iki yerel klasör de mevcut. |

İlk incelemedeki tarihsel karşılaştırmada ilk 23 browser senaryosu özgün Git HEAD ile 4 başarılı / 19 başarısızdı. Bu sonuçlar ilk bakım hatalarının gerçek olduğunu gösterir; mevcut genişletilmiş 50 senaryonun baseline sayısı değildir.

Testler gerçek DOM, event, FormData ve focus kullanır; HTTP yanıtları kontrollü mock'lardır. Canlı Laravel, gerçek dosya transferi, Firefox/Safari, ekran okuyucu ve fiziksel touch cihaz testi yapılmadı. Demo kontrolü her demo düğmesinin elle tek tek sınanması anlamına gelmez. Rich HTML API'leri evrensel sanitizer sağlamaz; güvenilmeyen metin escape edilmelidir. Portal none modu media öğelerinin ayrı fade stillerini değiştirmez.

## Tekrar çalıştırma

    npm test
    npm run build
    npm run test:package
    npm run dev
    # /tests/regressions.html veya index.html altındaki test bağlantısı

Playwright mevcutsa:

    $env:TAILTOOLS_PLAYWRIGHT_MODULE = 'C:/path/to/node_modules/playwright'
    node tests/run-browser.mjs --serve --demo --bundle --compact

Ayrıntılar: [tests/README.md](tests/README.md), [kurulum](docs/installing.md), [geliştirme](docs/developing.md).

## Git çalışma durumu

**Önceki bakım aşamasındaki teslim notu:** Runtime/doküman/test düzenlemeleri çalışma alanındadır; commit/push yapılmadı. node_modules/dist takibini kaldırmak için yapılan Git indeks silmeleri staged durumdadır. Bu silmeler yerel dosyaları diskten kaldırmaz. Diğer kaynak değişiklikleri normal çalışma alanı değişiklikleridir; kullanıcının önceki bakım değişiklikleri korunmuştur.

## İlk incelemede düzeltilen sorunlar

| Alan | Önceki sorun | Yapılan düzenleme |
| --- | --- | --- |
| CGEForm | Blade `@method` alanı zaten varsa Fetch/XHR gerçek PATCH/PUT/DELETE gönderiyordu; multipart dosyalar Laravel/PHP tarafında işlenemeyebilirdi. | Üç sürücüde de POST + doğru `_method`; mevcut alan korunup çözümlenen yöntemle güncellenir. |
| CGEForm | Devam eden submit sırasında ikinci programatik çağrı ikinci istek oluşturabiliyordu. | Aktif submit tamamlanana kadar yeni çağrılar engellendi. |
| CGEForm | destroy sonrası input/change listener'ları kalıyordu; yeniden oluşturma temizliği bozulabiliyordu. | Delegated listener'lar kaldırılır; sadece pluginin eklediği novalidate geri alınır. Gereksiz tek seferlik alan listener'ları kaldırıldı. |
| CGESelect | JS ile multiple açmak native select'i multiple yapmıyordu; FormData seçim kaybediyordu. | Native multiple durumu seçenekle eşitlendi. |
| CGESelect | Uzak sonuçlardan seçilen değer native option olarak bulunmadığından formda kayboluyordu. | Seçilen uzak seçenek native option olarak eklenir. Sonraki aramada mevcut seçimin etiketi korunur. |
| CGESelect | Skill'in önerdiği async data öznitelikleri ve close-on-select okunmuyordu. | URL/driver/method/param/debounce ve close-on-select okunur; GET/POST sürücü davranışı eşitlendi. |
| CGESelect | Eski yanıt yeni sonucu ezebiliyor; destroy sonrası timer/istek devam edebiliyordu. | Sürüm kontrolü, abort, timer temizliği ve minSearchLength kontrolü eklendi. |
| CGESelect | destroy eski style/tabindex/aria-hidden değerlerini siliyordu; tekrar açınca önceki yerel filtre kalıyordu; disabled optgroup atlanmıyordu. | Başlangıç öznitelikleri geri yüklenir; yerel filtre sıfırlanır; optgroup disabled durumu uygulanır. |
| Çekirdek | initTailTools(root), select'leri tüm document'te başlatıyordu. | CGESelect.init'e geriye uyumlu üçüncü root parametresi eklendi; kapsamla sınırlı başlatma sağlandı. Kullanılmayan registry kaldırıldı. |
| CGEDropzone | CGEAlert.confirm nesne argümanıyla çağrılıyordu; başlık/mesaj gerçek API ile uyuşmuyordu. | confirm(title, message, options) kullanıldı. |
| CGEDropzone | Fetch silme isteği 500 döndüğünde başarılı sayılıyordu; hata halinde kart kaldırılıyordu. | HTTP başarısı denetlenir; bireysel silme hatasında kart/dosya korunur, error ve onError çalışır. |
| CGEDropzone | uploadAll maxConcurrent'i aşıyordu; cancel aynı slotu iki kere azaltabiliyordu. Yüklenen dosyayı kaldırmak komşu dosyayı da silebiliyordu. | Kuyruk üzerinden sınırlı uploadAll; slotu tek finally bloğu bırakır; iç içe remove/cancel akışı düzeltildi. |
| CGEDropzone | destroy sırasında iptal edilen isteklerin finally bloğu yeni upload başlatabiliyordu. | Destroy guard ile kuyruk ve sonradan gelen sonuçlar durduruldu; instance listener registry temizlendi. XHR multipart boundary başlığı tarayıcıya bırakıldı. |
| CGELightbox | Kapanış timer'ı hızlı yeniden açılan portalı kaldırabiliyordu; await close cleanup'ı beklemiyordu. | Kapanış Promise'i portal kaldırma/scroll restoration tamamlanana kadar bekler; yeniden açılış kapanışı bekler. Diğer aktif lightbox önce kapatılır. |
| CGELightbox | Her açılış global mouse listener'ları biriktiriyordu; yavaş eski görsel yeni slayta sonradan eklenebiliyordu. | Global listener'lar AbortController ile kapatılır; render sürümü eski sonucu eler. Kapanan instance registry'den çıkarılır. |
| CGELightbox | Kısmi çeviri counter gibi varsayılanları silip hata yaratıyordu; tırnaklı galeri adları CSS selector hatası oluşturuyordu. | Çeviriler doğru sırayla birleşir; galeriler dataset karşılaştırmasıyla bulunur. Instance callback'lerine tip sözleşmesindeki lightbox alanı da verilir. |
| CGEActionButton | Onay beklerken hızlı çift execute ikinci diyalog/işlem açıyordu; kısmi çeviri varsayılanları siliyordu. | Onay bekleme guard'ı ve doğru çeviri birleştirme sırası eklendi. |
| CGEToast | Tekrar init aynı session flash'ı yeniden gösteriyordu; duration=0/false beş saniyeye dönüyordu. Document ve subtree listener'ları tek tıklamada çift toast açabiliyordu. | Flash düğümleri bir kez tüketilir; kalıcı süreler desteklenir; aynı click yalnızca bir kez işlenir. |
