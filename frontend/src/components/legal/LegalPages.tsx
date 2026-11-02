import React from 'react';

interface LegalPageProps {
  type: 'terms' | 'privacy' | 'refund' | 'pricing';
  onBackToStore: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBackToStore }) => {
  return (
    <div className="min-h-screen bg-[#070b14] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-[#0d1527]/90 border border-cyan-500/20 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-8">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-400 border border-cyan-500/40 rounded-xl transition duration-200 text-sm font-semibold"
          >
            <span>⬅️ العودة للمتجر الرئيسي (Store)</span>
          </button>
          <span className="text-xs text-gray-400 font-mono">pes.fouadf9.network</span>
        </div>

        {/* Content Router */}
        {type === 'terms' && <TermsContent />}
        {type === 'privacy' && <PrivacyContent />}
        {type === 'refund' && <RefundContent />}
        {type === 'pricing' && <PricingContent onBackToStore={onBackToStore} />}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} eFootball PES Store - All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={onBackToStore} className="hover:text-cyan-400">المتجر</button>
            <a href="/terms" className="hover:text-cyan-400">الشروط</a>
            <a href="/privacy" className="hover:text-cyan-400">الخصوصية</a>
            <a href="/refund" className="hover:text-cyan-400">الاسترداد</a>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── 1. Terms of Service ─────────────────────────────────────────────────────
function TermsContent() {
  return (
    <div className="space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          📜 شروط الخدمة (Terms of Service)
        </h1>
        <p className="text-xs text-cyan-400 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="bg-cyan-950/20 border border-cyan-800/40 p-4 rounded-xl text-xs sm:text-sm text-cyan-200" dir="ltr">
        <strong>English Summary:</strong> By accessing and purchasing digital services and football gaming packages on <strong>pes.fouadf9.network</strong>, you agree to comply with our Terms of Service. Paddle.com is our authorized Merchant of Record providing international checkout and billing.
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. مقدمة وقبول الشروط (Acceptance of Terms)</h2>
        <p>
          أهلاً بكم في متجر <strong>eFootball PES Store</strong>. استخدامك للموقع وشراء أي من المنتجات والخدمات الرقمية المعروضة يعني موافقتك الكاملة وغير المشروطة على شروط وأحكام هذه الاتفاقية. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الموقع.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. طبيعة المنتجات الرقمية (Digital Goods & Services)</h2>
        <p>
          يقدم متجرنا خدمات وحزم حسابات رقمية جاهزة لمستخدمي ألعاب كرة القدم الإلكترونية (Android & iOS). جميع المنتجات رقمية بالكامل ويتم تسليمها فورياً وبشكل تلقائي بمجرد تأكيد الدفع عبر شاشة العميل وعبر البريد الإلكتروني.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. معالجة المدفوعات وبوابات الدفع (Payment Processors)</h2>
        <p>
          تتم معالجة المدفوعات الدولية عبر بوابة <strong>Paddle.com</strong> بصفته التاجر المعتمد (Merchant of Record)، مما يضمن أعلى معايير الأمان والتشفير (PCI-DSS compliant). كما تتم معالجة المدفوعات المحلية داخل جمهورية مصر العربية عبر بوابة <strong>Paymob</strong> المعتمدة من البنك المركزي المصري.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. مسؤولية العميل وتأمين البيانات (Customer Security)</h2>
        <p>
          يتحمل المشتري مسؤولية تغيير بيانات تسجيل الدخول وتعيين كلمة مرور جديدة وربط الحساب ببريده الخاص فور استلام بيانات الحساب بنجاح لضمان أقصى درجات الأمان والخصوصية الدائمة.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. الدعم الفني والتواصل (Support & Inquiries)</h2>
        <p>
          فريق الدعم الفني متواجد على مدار 24/7 لمساعدة العملاء في حال وجود أي استفسار أو مشكلة في استلام البيانات عبر نافذة المحادثة الفورية بالموقع.
        </p>
      </section>
    </div>
  );
}

// ─── 2. Privacy Policy ───────────────────────────────────────────────────────
function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          🔒 سياسة الخصوصية (Privacy Policy)
        </h1>
        <p className="text-xs text-cyan-400 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="bg-cyan-950/20 border border-cyan-800/40 p-4 rounded-xl text-xs sm:text-sm text-cyan-200" dir="ltr">
        <strong>English Summary:</strong> We respect your privacy. We do not store or process payment card details directly. International payments are securely handled by <strong>Paddle.com</strong>. We only retain minimal order data necessary to fulfill your digital delivery.
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. المعلومات التي نجمعها (Information We Collect)</h2>
        <p>
          نحن نجمع الحد الأدنى الضروري من البيانات لإتمام عملية التسليم الرقمي للمشتريات:
        </p>
        <ul className="list-disc list-inside space-y-1 pr-4 text-gray-400">
          <li>عنوان البريد الإلكتروني (لتسليم تفاصيل الطلب وتأكيد العملية).</li>
          <li>رقم الهاتف (اختياري - لأغراض الدعم الفني وتأكيد الطلب محلياً).</li>
          <li>معرف المعاملة (Transaction ID) المولد من بوابة الدفع للتحقق من سلامة الطلب.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. حماية بيانات الدفع والبطاقات البنكية (Card Security)</h2>
        <p>
          لا يقوم موقعنا نهائياً بتسجيل أو تخزين أو معالجة أي بيانات خاصة ببطاقات الائتمان أو أرقام الحسابات البنكية. تتم جميع عمليات التحصيل بشكل مباشر ومشفر بالكامل عبر خوادم <strong>Paddle</strong> أو <strong>Paymob</strong> المتوافقة مع معايير الأمان الدولية (PCI DSS Level 1).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. ملفات تعريف الارتباط (Cookies)</h2>
        <p>
          نستخدم ملفات تعريف ارتباط مؤقتة لأغراض فنية بحتة لتأمين جلسات الدفع وحفظ حالة المعاملة الجارية حتى استلام العميل لبيانات حسابه بنجاح.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. عدم مشاركة البيانات (No Third-Party Sharing)</h2>
        <p>
          نحن ملتزمون بعدم بيع أو تأجير أو مشاركة أي من بيانات العملاء لأي طرف ثالث لأغراض التسويق أو الإعلانات.
        </p>
      </section>
    </div>
  );
}

// ─── 3. Refund & Return Policy ───────────────────────────────────────────────
function RefundContent() {
  return (
    <div className="space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base">
      <div className="border-b border-cyan-500/30 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          🔄 سياسة الاسترداد والضمان (Refund Policy)
        </h1>
        <p className="text-xs text-cyan-400 mt-1">Last Updated: November 2026</p>
      </div>

      <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl text-xs sm:text-sm text-emerald-200" dir="ltr">
        <strong>English Summary:</strong> We provide a 100% Delivery Guarantee. If a delivered digital item does not match the specifications or fails to operate upon receipt, you are eligible for an immediate replacement or full refund within 48 hours.
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. ضمان التسليم الفوري ومطابقة المواصفات (Delivery Guarantee)</h2>
        <p>
          نحن نضمن صحة وسلامة ومطابقة جميع الحسابات الرقمية للمواصفات المعروضة في المتجر (قوة الفريق، اللاعبين الأساطير) بنسبة 100% وقت التسليم.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. شروط الاسترداد أو الاستبدال (Eligibility for Refund)</h2>
        <p>يحق للمشتري طلب استرداد المبلغ بالكامل أو استبدال الحساب فوراً في الحالات التالية:</p>
        <ul className="list-disc list-inside space-y-1.5 pr-4 text-gray-300">
          <li>عدم صحة بيانات تسجيل الدخول المسلمة وعدم القدرة على الدخول فور الشراء.</li>
          <li>وجود اختلاف جوهري بين مواصفات الحساب المسلم والمواصفات الموضحة في المتجر.</li>
          <li>حدوث خطأ تقني في البوابة أدى لخصم المبلغ دون إنشاء المعاملة أو تسليم المنتج.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. مدة تقديم الطلب وطريقة الاسترجاع (Refund Window & Process)</h2>
        <p>
          يتم تقديم طلب الاسترداد أو الاستبدال خلال <strong>48 ساعة</strong> من وقت إتمام عملية الشراء عبر التواصل مع الدعم الفني المباشر في المتجر. يتم فحص المشكلة وحلها فورياً أو رد المبلغ إلى نفس وسيلة الدفع الأصلية عبر Paddle خلال فترة تتراوح بين 3 إلى 7 أيام عمل طبقاً لسياسات البنك المصدر.
        </p>
      </section>
    </div>
  );
}

// ─── 4. Pricing & Plans Page ─────────────────────────────────────────────────
function PricingContent({ onBackToStore }: { onBackToStore: () => void }) {
  return (
    <div className="space-y-8 text-gray-300 leading-relaxed text-sm sm:text-base">
      <div className="border-b border-cyan-500/30 pb-4 text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          💎 قائمة الأسعار والخطط (Pricing & Packages)
        </h1>
        <p className="text-sm text-cyan-400 mt-2">
          أسعار شفافة وثابتة مع تسليم فوري وضمان شامل 100%
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tier 1 */}
        <div className="bg-[#111c38] border border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition">
          <div>
            <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Starter Tier</div>
            <h3 className="text-xl font-bold text-white mt-1">حسابات الفئة الذهبية</h3>
            <p className="text-xs text-gray-400 mt-2">مناسبة للبدء بفريق قوي وميزانية اقتصادية.</p>
            <div className="my-6">
              <span className="text-3xl font-extrabold text-white">300 EGP</span>
              <span className="text-xs text-gray-400 block mt-1">≈ $6.00 USD</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>⚡ تسليم فوري وتلقائي</li>
              <li>🛡️ ضمان فحص 48 ساعة</li>
              <li>⚽ متوافق مع Android & iOS</li>
            </ul>
          </div>
          <button
            onClick={onBackToStore}
            className="mt-6 w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
          >
            تصفح وشراء الحسابات 🛒
          </button>
        </div>

        {/* Tier 2 (Featured) */}
        <div className="bg-[#142347] border-2 border-cyan-400 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg shadow-cyan-500/10 scale-105">
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full">
            الأكثر طلباً 🔥
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-cyan-300 tracking-wider">Pro Tier</div>
            <h3 className="text-xl font-bold text-white mt-1">حسابات ديفيجن 1 أسطورية</h3>
            <p className="text-xs text-gray-400 mt-2">تشكيلات بطاقات إبيك وشو تايم وتصنيف عالي.</p>
            <div className="my-6">
              <span className="text-3xl font-extrabold text-cyan-300">490 EGP</span>
              <span className="text-xs text-gray-400 block mt-1">≈ $9.80 USD</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-200">
              <li>⚡ تسليم فوري وتلقائي عبر Paddle</li>
              <li>🛡️ لاعبين نيتف أساطير (شيفشينكو، باتستوتا)</li>
              <li>⚽ بطاقات نجوم متطورة جاهزة</li>
              <li>💬 دعم فني مخصص مباشر</li>
            </ul>
          </div>
          <button
            onClick={onBackToStore}
            className="mt-6 w-full py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold rounded-xl text-xs transition"
          >
            اطلب الآن عبر المتجر 🚀
          </button>
        </div>

        {/* Tier 3 */}
        <div className="bg-[#111c38] border border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition">
          <div>
            <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Elite Tier</div>
            <h3 className="text-xl font-bold text-white mt-1">حسابات النخبة VIP</h3>
            <p className="text-xs text-gray-400 mt-2">قوة فريق قصوى (3150+) وبطاقات بيج تايم نادرة.</p>
            <div className="my-6">
              <span className="text-3xl font-extrabold text-white">750+ EGP</span>
              <span className="text-xs text-gray-400 block mt-1">≈ $15.00+ USD</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>⚡ حسابات نادرة بأعلى تقييم</li>
              <li>🛡️ ضمان أمان شامل ودائم</li>
              <li>💬 أولوية في خدمة العملاء</li>
            </ul>
          </div>
          <button
            onClick={onBackToStore}
            className="mt-6 w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
          >
            تصفح وشراء الحسابات 🛒
          </button>
        </div>

      </div>

      <div className="text-center pt-4">
        <button
          onClick={onBackToStore}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-xl text-sm transition"
        >
          الانتقال للمتجر واختيار حسابك المفضل ⚽
        </button>
      </div>
    </div>
  );
}


