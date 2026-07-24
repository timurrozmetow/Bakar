/// Default content for the «О нас» page.
///
/// Kept in its own module so both prisma/seed.ts (which wipes and re-creates
/// everything) and prisma/upgradeAbout.ts (which only fills gaps on a live
/// database) work from one source. Importing seed.ts instead would run it.
const t = (tm: string, ru: string, en: string) => ({ tm, ru, en });

export const ABOUT_DEFAULT = {
    heading: t('Biz hakda', 'О нас', 'About us'),
    lead: t(
      'Ýönekeý önümler, ak ýürekden.',
      'Простые продукты, сделанные добросовестно.',
      'Simple products, made in good faith.',
    ),
    body: t(
      'Meýdandan gaplama çenli: her tapgyr arassalaýyşdan, kalibrlemeden we hil barlagyndan geçýär.',
      'От поля до упаковки: каждая партия проходит очистку, калибровку и контроль качества.',
      'From field to package: each batch is cleaned, calibrated and quality-checked.',
    ),
    // Photos of the plant are added by the client in the admin panel.
    image: '',
    story: {
      heading: t('Taryhymyz', 'Наша история', 'Our story'),
      body: t(
        'BAKAR — türkmen önüm öndürijisi. Biz her gün saçagyň üstünde durýan ýönekeý önümleri çykarýarys: ýarma, makaron, kösükliler, tüwi, perşenkler we çigit.\n\nIşimiz daýhan hojalyklaryndan başlanýar. Hasyl kabul edilende barlanýar, soňra arassalanýar, kalibrlenýär we gaplanýar. Her tapgyryň öz belgisi bar — şonuň üçin islendik gaplamany önümçiligiň gününe çenli yzarlap bolýar.',
        'BAKAR — туркменский производитель продуктов питания. Мы выпускаем то, что стоит на столе каждый день: крупы, макароны, бобовые, рис, хлопья и семечки.\n\nРабота начинается с хозяйств. Урожай проверяют при приёмке, затем очищают, калибруют и фасуют. У каждой партии свой номер — поэтому любую упаковку можно проследить вплоть до дня производства.',
        'BAKAR is a Turkmen food producer. We make what belongs on the table every day: grains, pasta, legumes, rice, flakes and sunflower seeds.\n\nThe work starts at the farms. Each harvest is checked on arrival, then cleaned, calibrated and packed. Every batch carries its own number, so any pack can be traced back to the day it was made.',
      ),
    },
    steps: [
      {
        image: '',
        title: t('Çig malyň kabul edilmegi', 'Приёмка сырья', 'Intake'),
        text: t(
          'Her tapgyr barlagdan geçýär: çyglylyk, arassalyk we däneleriň bitewiligi.',
          'Каждая партия проходит входной контроль: влажность, чистота, целостность зерна.',
          'Every batch is checked on arrival: moisture, cleanliness and grain integrity.',
        ),
      },
      {
        image: '',
        title: t('Arassalaýyş', 'Очистка', 'Cleaning'),
        text: t(
          'Tozan, ýat garyndylar we ýeňil bölejikler aýrylýar.',
          'Удаляются пыль, посторонние примеси и лёгкие частицы.',
          'Dust, foreign matter and light particles are removed.',
        ),
      },
      {
        image: '',
        title: t('Kalibrleme', 'Калибровка', 'Calibration'),
        text: t(
          'Däneler ölçegi boýunça saýlanýar — şonuň üçin gaplamadaky däne deň bolýar.',
          'Зерно сортируется по размеру — поэтому в упаковке оно ровное.',
          'Grain is sorted by size, which is why the pack is even throughout.',
        ),
      },
      {
        image: '',
        title: t('Gaplama', 'Фасовка', 'Packing'),
        text: t(
          'Awtomat setirde, howa bilen az galtaşykda — önüm täzeligini saklaýar.',
          'На автоматической линии, с минимальным контактом с воздухом — продукт сохраняет свежесть.',
          'On an automatic line with minimal contact with air, so the product stays fresh.',
        ),
      },
      {
        image: '',
        title: t('Hil gözegçiligi', 'Контроль качества', 'Quality control'),
        text: t(
          'Her tapgyrdan nusga alynýar we barlaghanada barlanýar.',
          'От каждой партии берётся образец и проверяется в лаборатории.',
          'A sample is taken from every batch and tested in the laboratory.',
        ),
      },
      {
        image: '',
        title: t('Ammar we ugratma', 'Склад и отгрузка', 'Storage and dispatch'),
        text: t(
          'Bellenen temperaturada saklanýar, tapgyr belgisi boýunça hasaba alynýar.',
          'Хранение при заданной температуре, учёт по номеру партии.',
          'Stored at a set temperature and tracked by batch number.',
        ),
      },
    ],
    values: [
      {
        title: t('Yzarlanylýan tapgyr', 'Прослеживаемость партии', 'Traceable batches'),
        text: t(
          'Islendik gaplama boýunça çig malyň gelen gününi we üpjün edijini tapyp bolýar.',
          'По любой упаковке можно найти поставщика и день приёмки сырья.',
          'Any pack leads back to its supplier and the day the raw material arrived.',
        ),
      },
      {
        title: t('Şahadatnamalar', 'Сертификаты', 'Certification'),
        text: t(
          'Halal, GMO-syz we glýutensiz — resminamalar «Şahadatnamalar» bölüminde.',
          'Halal, без ГМО и без глютена — документы в разделе «Сертификаты».',
          'Halal, non-GMO and gluten-free — the documents are in the Certificates section.',
        ),
      },
      {
        title: t('Durnukly hil', 'Стабильность качества', 'Consistency'),
        text: t(
          'Bir standart — her tapgyrda. Söwda nokady üçin bu goşmaça arzalaryň ýoklugy diýmek.',
          'Один стандарт в каждой партии. Для магазина это отсутствие лишних возвратов.',
          'One standard in every batch — which for a shop means fewer returns.',
        ),
      },
      {
        title: t('Amatly gaplama', 'Удобная фасовка', 'Practical packaging'),
        text: t(
          '50 gramdan 5 kilograma çenli — tekje we HoReCa üçin.',
          'От 50 граммов до 5 килограммов — для полки и для HoReCa.',
          'From 50 grams to 5 kilograms — for the shelf and for HoReCa.',
        ),
      },
    ],
    gallery: [],
  };
