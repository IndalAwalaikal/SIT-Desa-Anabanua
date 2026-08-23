'use client';

import React from 'react';
import Link from 'next/link';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Quote } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function SejarahClient() {
  const { t } = useTranslation();

  return (
    <div className="bg-[#f5f8fc] py-8 sm:py-12 dark:bg-neutral-950">
      <div className="container-desa space-y-8 sm:space-y-12">
        {/* Header Masthead */}
        <PublicMasthead
          eyebrow={t('Sejarah.badge', 'WARISAN LELUHUR & SEJARAH DESA')}
          title={t('Sejarah.title', 'Sejarah dan Asal Usul Desa Borong')}
          description={t('Sejarah.subtitle', 'Menelusuri jejak peradaban, tradisi Adat Sampulo Rua, kepemimpinan Karaeng Borong, serta perjalanan panjang terbentuknya Desa Borong di Kecamatan Herlang, Kabupaten Bulukumba.')}
          image="/kantor_desa.png"
        />

        {/* Layout Artikel & Navigasi Samping */}
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
          {/* Sidebar Navigasi & Index Topik */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <Link
              href="/profil"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-400 hover:underline bg-white dark:bg-neutral-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" /> {t('Common.back', 'Kembali ke Profil Desa')}
            </Link>

            {/* Quick Index */}
            <Card className="p-5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                Daftar Isi Sejarah
              </p>
              <nav className="flex flex-col space-y-2 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                <a href="#pengantar" className="hover:text-primary-600 transition-colors">
                  • Pengantar Sejarah
                </a>
                <a href="#asal-usul" className="hover:text-primary-600 transition-colors">
                  • Asal-Usul Nama &amp; Saoraja
                </a>
                <a href="#adat-karaeng" className="hover:text-primary-600 transition-colors">
                  • Adat Sampulo Rua &amp; Karaeng
                </a>
                <a href="#sejarah-herlang" className="hover:text-primary-600 transition-colors">
                  • Borong dalam Sejarah Herlang
                </a>
                <a href="#terbentuknya-desa" className="hover:text-primary-600 transition-colors">
                  • Terbentuknya Desa Borong
                </a>
                <a href="#sosial-budaya" className="hover:text-primary-600 transition-colors">
                  • Kehidupan Sosial &amp; Budaya
                </a>
                <a href="#pelestarian" className="hover:text-primary-600 transition-colors">
                  • Melestarikan Sejarah
                </a>
              </nav>
            </Card>

            {/* Highlight Box Side */}
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-md space-y-3 border border-slate-800">
              <Quote className="h-5 w-5 text-primary-400" />
              <p className="text-xs font-serif leading-relaxed italic text-neutral-200">
                &ldquo;Sejarah bukan sekadar catatan masa lalu, melainkan kompas moral dan jati diri bagi generasi penerus Desa Borong.&rdquo;
              </p>
              <p className="text-[10px] font-bold tracking-widest text-primary-300 uppercase">
                – Tokoh Adat Borong
              </p>
            </div>
          </aside>

          {/* Main Editorial Content */}
          <article className="space-y-8">
            {/* Bagian 1: Pengantar */}
            <Card id="pengantar" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                PENGANTAR SEJARAH
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
                Sejarah dan Asal Usul Desa Borong
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Desa Borong merupakan salah satu desa yang berada di Kecamatan Herlang, Kabupaten Bulukumba, Provinsi Sulawesi Selatan. Desa ini dikenal sebagai salah satu wilayah yang memiliki perjalanan sejarah dan kebudayaan yang panjang. Kehidupan masyarakat Desa Borong hingga saat ini masih dipengaruhi oleh nilai-nilai adat, tradisi leluhur, serta kearifan lokal yang diwariskan secara turun-temurun.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Sejarah Desa Borong tidak dapat dipisahkan dari perkembangan wilayah adat dan pemerintahan di kawasan timur Kabupaten Bulukumba. Sejak masa kerajaan hingga terbentuknya pemerintahan desa sebagaimana dikenal sekarang, wilayah Borong telah menjadi bagian dari dinamika sosial, budaya, dan pemerintahan masyarakat setempat.
              </p>
            </Card>

            {/* Bagian 2: Asal Usul Nama & Saoraja */}
            <Card id="asal-usul" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                ETIMOLOGI &amp; WARISAN ADAT
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Asal-Usul Nama dan Wilayah Borong
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Nama <strong className="text-neutral-900 dark:text-white">Borong</strong> dalam pemahaman masyarakat setempat berkaitan dengan istilah dalam bahasa lokal yang merujuk pada <strong className="text-primary-700 dark:text-primary-300">hutan atau kawasan yang ditumbuhi vegetasi yang lebat</strong>. Nama tersebut dipercaya memiliki kaitan dengan kondisi wilayah pada masa lampau yang masih banyak ditumbuhi pepohonan dan kawasan hutan.
              </p>

              {/* Box Saoraja */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 space-y-2">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Rumah Adat Saoraja Borong
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Dalam perkembangan masyarakatnya, Borong kemudian tumbuh menjadi sebuah kawasan permukiman yang memiliki kedudukan penting dalam kehidupan sosial dan adat masyarakat di wilayah Herlang. Keberadaan berbagai peninggalan budaya, termasuk rumah adat atau <strong className="font-semibold text-neutral-900 dark:text-white">Saoraja Borong</strong>, menjadi salah satu gambaran bahwa wilayah ini memiliki hubungan yang erat dengan sejarah kehidupan bangsawan dan sistem adat masyarakat pada masa lalu.
                </p>
              </div>
            </Card>

            {/* Bagian 3: Tradisi Adat & Gelar Karaeng */}
            <Card id="adat-karaeng" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                KEPEMIMPIMAN &amp; STRUKTUR ADAT
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Tradisi Adat Sampulo Rua dan Gelar Karaeng
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Salah satu kekayaan sejarah dan budaya yang masih melekat dalam kehidupan masyarakat Desa Borong adalah tradisi <strong className="text-neutral-900 dark:text-white">Adat Sampulo Rua</strong>. Tradisi tersebut menjadi bagian dari warisan adat yang terus dijaga dan dihormati oleh masyarakat sebagai bagian dari identitas dan jati diri Desa Borong.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 space-y-2">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">TOKOH UTAMA</span>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    I Luluang Daeng Mabbiring (Karaeng Borong)
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Dalam sejarah adat Borong, salah satu tokoh yang memiliki kedudukan penting adalah I Luluang Daeng Mabbiring, yang dikenal dengan gelar Karaeng Borong. Kisah mengenai beliau menjadi bagian dari sejarah lisan dan tradisi adat yang diwariskan dari generasi ke generasi.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 space-y-2">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">PROSESI ADAT</span>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    Doang Karaeng &amp; Pakkaraengan Ri Borong
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Dalam tradisi tersebut dikenal prosesi <em className="font-semibold text-neutral-800 dark:text-neutral-200">Doang Karaeng</em> serta pemberian gelar adat <em className="font-semibold text-neutral-800 dark:text-neutral-200">Pakkaraengan Ri Borong</em>. Prosesi adat ini berkaitan dengan pengukuhan dan penghormatan terhadap garis keturunan serta kedudukan tokoh adat.
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Menurut riwayat adat yang berkembang di masyarakat, sebelum I Luluang Daeng Mabbiring diangkat sebagai <strong className="text-neutral-900 dark:text-white">Karaeng Maggau Ri Borong</strong>, terdapat persyaratan adat yang harus dipenuhi dan diajukan kepada dewan adat yang dikenal sebagai <strong className="text-primary-700 dark:text-primary-300">Adat Tallua</strong>. Rangkaian prosesi tersebut mencerminkan pentingnya musyawarah, penghormatan terhadap adat, serta nilai moral dan tata krama dalam kehidupan masyarakat Borong.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Hingga saat ini, nilai-nilai tersebut tetap menjadi bagian penting dari kehidupan sosial masyarakat. Pelestarian adat bukan hanya sebagai bentuk penghormatan terhadap leluhur, tetapi juga sebagai upaya menjaga identitas budaya dan memperkuat hubungan antargenerasi.
              </p>
            </Card>

            {/* Bagian 4: Perjalanan Sejarah Herlang */}
            <Card id="sejarah-herlang" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                KONTEKS WILAYAH HERLANG
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Borong dalam Perjalanan Sejarah Wilayah Herlang
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Dalam perjalanan sejarahnya, wilayah Borong memiliki keterkaitan dengan sistem pemerintahan dan pembagian wilayah adat di kawasan timur Bulukumba. Pada masa kerajaan, wilayah ini berada dalam lingkungan sosial-politik yang dipengaruhi oleh hubungan antara berbagai kerajaan dan wilayah adat di Sulawesi Selatan, termasuk Gowa dan Bone.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Memasuki masa kolonial, terjadi berbagai perubahan dalam sistem pemerintahan dan pembagian wilayah administratif. Penataan wilayah oleh pemerintah kolonial Belanda turut memengaruhi kedudukan beberapa wilayah adat dan kampung di kawasan yang kemudian dikenal sebagai Herlang.
              </p>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                Wilayah <strong className="font-bold text-neutral-900 dark:text-white">Hero dan Lange-Lange</strong> kemudian menjadi bagian penting dalam pembentukan wilayah administratif yang selanjutnya dikenal dengan nama <strong className="font-bold text-neutral-900 dark:text-white">Herlang</strong>. Dalam perkembangan tersebut, Borong menjadi salah satu wilayah yang berada dalam lingkungan pemerintahan dan kehidupan masyarakat Herlang.
              </div>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Perjalanan sejarah tersebut menunjukkan bahwa terbentuknya Desa Borong tidak terjadi secara terpisah, melainkan merupakan bagian dari proses panjang perubahan sosial, adat, dan pemerintahan di kawasan timur Bulukumba.
              </p>
            </Card>

            {/* Bagian 5: Terbentuknya Desa Borong */}
            <Card id="terbentuknya-desa" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                ADMINISTRASI PEMERINTAHAN DESA
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Terbentuknya Desa Borong
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Setelah Indonesia merdeka, sistem pemerintahan mengalami berbagai penataan dan perubahan. Wilayah-wilayah yang sebelumnya berada dalam struktur pemerintahan kolonial secara bertahap disesuaikan dengan sistem pemerintahan Negara Kesatuan Republik Indonesia.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Dalam perkembangan administrasi pemerintahan di Kabupaten Bulukumba, wilayah Herlang kemudian berkembang menjadi sebuah kecamatan. Seiring dengan penataan pemerintahan desa, kawasan Borong yang sebelumnya dikenal sebagai wilayah permukiman dan komunitas adat kemudian berkembang menjadi <strong className="text-primary-700 dark:text-primary-300">Desa Borong</strong> sebagai bagian dari wilayah administratif Kecamatan Herlang, Kabupaten Bulukumba.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Sejak terbentuk sebagai desa, kehidupan masyarakat Borong terus berkembang mengikuti perubahan zaman. Meskipun demikian, hubungan masyarakat dengan adat, budaya, dan nilai-nilai leluhur tetap menjadi bagian penting dalam kehidupan sehari-hari.
              </p>
            </Card>

            {/* Bagian 6: Kehidupan Sosial & Budaya */}
            <Card id="sosial-budaya" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                SOSIAL, KULTUR &amp; EKONOMI
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Kehidupan Sosial dan Budaya Masyarakat
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Masyarakat Desa Borong memiliki kehidupan sosial yang kuat dan menjunjung tinggi nilai kebersamaan, gotong royong, serta penghormatan terhadap orang tua dan tokoh adat. Nilai-nilai tersebut menjadi bagian dari kehidupan masyarakat dan diwariskan melalui keluarga serta lingkungan sosial.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Kehidupan budaya masyarakat Borong juga tidak terlepas dari pengaruh kebudayaan masyarakat di wilayah Bulukumba bagian timur, termasuk lingkungan budaya <strong className="text-neutral-900 dark:text-white">Konjo dan Bugis-Makassar</strong>. Kedekatan geografis dengan wilayah Kajang turut membentuk hubungan budaya dan sosial yang berkembang di kawasan Herlang dan sekitarnya.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Dalam kehidupan ekonomi, masyarakat Desa Borong secara turun-temurun banyak menggantungkan kehidupan pada sektor <strong className="text-neutral-900 dark:text-white">pertanian dan perkebunan</strong>. Tanaman pangan, jagung, serta kegiatan peternakan menjadi bagian dari aktivitas ekonomi masyarakat. Sektor tersebut terus berkembang seiring dengan perubahan kebutuhan dan kondisi masyarakat.
              </p>
            </Card>

            {/* Bagian 7: Pelestarian Budaya & Penutup */}
            <Card id="pelestarian" className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block">
                PELESTARIAN &amp; HARAPAN
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Melestarikan Sejarah dan Budaya Desa
              </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Sejarah Desa Borong merupakan bagian penting dari identitas masyarakatnya. Nilai-nilai adat, kisah para leluhur, tradisi <strong className="text-neutral-900 dark:text-white">Adat Sampulo Rua</strong>, serta keberadaan peninggalan budaya menjadi warisan yang perlu dijaga dan dilestarikan.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Bagi masyarakat Desa Borong, sejarah bukan sekadar catatan tentang masa lalu, tetapi juga menjadi sumber nilai dan pembelajaran bagi generasi yang akan datang. Dengan mengenal sejarah dan menjaga adat serta budaya, masyarakat dapat mempertahankan jati diri desa sekaligus menyambut perkembangan zaman.
              </p>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                Pemerintah Desa Borong bersama masyarakat berkomitmen untuk terus menjaga dan mengembangkan nilai-nilai budaya lokal sebagai bagian dari pembangunan desa. Dengan semangat kebersamaan dan gotong royong, warisan sejarah dan budaya Desa Borong diharapkan tetap hidup dan dapat diwariskan kepada generasi penerus.
              </p>
            </Card>

            {/* Closing Motto Card Banner */}
            <div className="rounded-2xl bg-slate-900 p-8 sm:p-10 text-white shadow-md text-center space-y-3 border border-slate-800">
              <p className="font-serif text-base sm:text-xl font-bold leading-relaxed max-w-2xl mx-auto text-neutral-100">
                &ldquo;Desa Borong bukan hanya sebuah wilayah administratif, tetapi juga sebuah ruang hidup yang menyimpan sejarah, adat, budaya, dan nilai-nilai luhur yang telah diwariskan dari generasi ke generasi.&rdquo;
              </p>
              <div className="pt-2 text-[11px] font-extrabold tracking-widest uppercase text-primary-400">
                Pemerintah &amp; Masyarakat Desa Borong
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
