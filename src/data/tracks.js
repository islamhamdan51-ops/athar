/**
 * سجل بيانات ألبومات وأناشيد منصة أَثَر | ATHAR
 * جميع البيانات مستخرجة ومحققة من الملفات الحقيقية
 */

export const GHARSA_ALBUM = {
  id: 'gharsa-vol-1',
  title: 'ألبوم غرسة الإنشادي',
  englishTitle: 'Gharsa Official Album — Roots of Hope',
  entity: 'مشروع غرسة & منظمة رِحلة',
  year: '2026',
  cover: '/media/brand/gharsa-album-cover.jpg',
  badge: 'الإصدار الإنشادي الرسمي',
  description: 'الألبوم الإنشادي والتوثيقي الرسمي لمشروع غرسة، يوثّق بالألحان والكلمات مسيرة التشجير، وعناق الجذور بالتراب الليبي، وعزيمة المتطوعين والطلاب في مدن الجنوب والشمال لمكافحة التصحر وصناعة بيئة خضراء مستدامة.',
  officialLinks: {
    gharsa: 'https://gharsa.ly',
    rehla: 'https://rehlaa.org'
  },
  tracks: [
    {
      id: 'track-1',
      trackNumber: 1,
      title: 'عناق الجذور',
      englishTitle: 'Embrace of the Roots',
      duration: '02:26',
      durationSeconds: 146,
      audioSrc: '/media/gharsa/tracks/enaq-al-juthoor.mp4',
      videoSrc: '/media/gharsa/tracks/enaq-al-juthoor.mp4',
      format: 'MP4 / AAC High Quality',
      fileSize: '8.79 MB',
      theme: 'التجذر بالأرض والانتماء',
      description: 'نشيد يفيض بالمعاني حول عمق ارتباط الإنسان بأرضه، وكيف تنمو الجذور في باطن التراب لتصنع حياة جديدة وظلالاً وارفة.',
      lyricsPreview: 'في عمق التربة نبضٌ يسري... حكاية غرسة تصنع فجرًا...',
      status: 'available'
    },
    {
      id: 'track-2',
      trackNumber: 2,
      title: 'غداً شجرة',
      englishTitle: 'Tomorrow a Tree',
      duration: '02:05',
      durationSeconds: 125,
      audioSrc: '/media/gharsa/tracks/ghadan-shajarah.mp4',
      videoSrc: '/media/gharsa/tracks/ghadan-shajarah.mp4',
      format: 'MP4 / AAC High Quality',
      fileSize: '6.17 MB',
      theme: 'الأمل ونماء الغد',
      description: 'رسالة ملهمة إلى أطفال المدارس والجيل الصاعد بأن كل بذرة صغيرة نزرعها اليوم ستغدو غداً شجرة يستظل بها المجتمع.',
      lyricsPreview: 'بذرة اليوم بأيدينا تغدو غداً شجرة تروينا...',
      status: 'available'
    },
    {
      id: 'track-3',
      trackNumber: 3,
      title: 'غرسة الأمل',
      englishTitle: 'Plant of Hope',
      duration: '01:41',
      durationSeconds: 101,
      audioSrc: '/media/gharsa/tracks/gharsat-al-amal.mp4',
      videoSrc: '/media/gharsa/tracks/gharsat-al-amal.mp4',
      format: 'MP4 / AAC High Quality',
      fileSize: '7.34 MB',
      theme: 'العمل الجماعي وروح التطوع',
      description: 'لحن حماسي خفيف يواكب سواعد المتطوعين في الميادين والساحات المدرسية، محتفياً بروح التعاون والبناء.',
      lyricsPreview: 'غرسة أملٍ في كل فناء... سواعد تبني دون عناء...',
      status: 'available'
    },
    {
      id: 'track-4',
      trackNumber: 4,
      title: 'وعد السنابل',
      englishTitle: 'Promise of the Spikes',
      duration: '01:30',
      durationSeconds: 90,
      audioSrc: '/media/gharsa/tracks/waad-al-sanabel.mp4',
      videoSrc: '/media/gharsa/tracks/waad-al-sanabel.mp4',
      format: 'MP4 / AAC High Quality',
      fileSize: '5.14 MB',
      theme: 'الوفاء والمستقبل',
      description: 'وعد قاطع بأن الخير الذي يُبذر لن يضيع، وأن الأرض المعطاءة ستثمر خيراً وجمالاً لأجيال ليبيا القادمة.',
      lyricsPreview: 'وعد السنابل في المدى يزهر... صوت العطاء بنوره يظهر...',
      status: 'available'
    },
    {
      id: 'track-5',
      trackNumber: 5,
      title: 'بيدٍ تُنبت الأمل (إصدار صوتي خاص)',
      englishTitle: 'A Hand That Grows Hope',
      duration: '02:41',
      durationSeconds: 161,
      audioSrc: '/media/gharsa/tracks/biyadin-tunbitu-al-amal.mp3',
      videoSrc: null,
      format: 'MP3 Studio Master',
      fileSize: '3.69 MB',
      theme: 'سواعد المتطوعين',
      description: 'تسجيل صوتي استوديو نقي يحتفي بالأيدي الكادحة التي تحفر وتزرع وترعى الشتلات.',
      lyricsPreview: 'بيدٍ تُنبت الأمل وتصنع في المدى عملاً...',
      status: 'available'
    },
    {
      id: 'track-6',
      trackNumber: 6,
      title: 'غرسة الخير (النسخة الإيقاعية)',
      englishTitle: 'Gharsa of Goodness',
      duration: '03:00',
      durationSeconds: 180,
      audioSrc: '/media/gharsa/tracks/gharsat-al-khair.mp3',
      videoSrc: null,
      format: 'MP3 Studio Master',
      fileSize: '4.12 MB',
      theme: 'الهتاف الميداني',
      description: 'النسخة الإنشادية المتكاملة لنشيد غرسة التأسيسي، إيقاع دافئ ومؤثر يعكس بهجة العطاء.',
      lyricsPreview: 'غرسة الخير يا بلادي... في رباكِ والأودية...',
      status: 'available'
    }
  ]
};

export const REHLA_ALBUM_TEASER = {
  id: 'rehla-vol-1',
  title: 'ألبوم منظمة رِحلة — أصداء القرى',
  englishTitle: 'Rehla: Echoes of the Journey',
  entity: 'منظمة رِحلة للتنمية المستدامة',
  year: 'قيد الإنتاج (قريباً)',
  badge: 'قريباً — Coming Soon',
  cover: '/media/brand/rehla-logo.png',
  description: 'مجموعة إنشادية وتوثيقية مستقبلية مكرسة لتوثيق حكايات الجنوب، وقصص رفاق رحلة في القرى والبلدات الليبية النائية، وأصوات المشاركين في برامج "كُن الفارق" و"رحلة الجنوب". المنظومة مجهزة تقنياً لاستقبال المسارات فور اعتمادها.',
  isUpcoming: true,
  plannedTracksCount: '6 مسارات إنشادية',
  officialLink: 'https://rehlaa.org'
};
