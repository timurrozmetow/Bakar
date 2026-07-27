/// Trilingual descriptions for every catalogue product, keyed by slug.
///
/// Kept in its own module so the idempotent scripts share one source:
///   - prisma/upgradeDescriptions.ts fills empty description fields on a live DB
///   - prisma/addRiceProducts.ts uses the rice entries when it (re)creates them
/// Importing seed.ts instead would run main() and wipe the database.
///
/// Editing rules: fill in the language you know; leave a blank string only if
/// you genuinely have no text — the upgrade script treats a fully-blank entry as
/// "nothing to add" and never overwrites a description already written by hand.
const t = (tm: string, ru: string, en: string) => ({ tm, ru, en });

export const PRODUCT_DESCRIPTIONS: Record<string, { tm: string; ru: string; en: string }> = {
  // ── Крупы ───────────────────────────────────────────────────
  irmik: t(
    'Inçe üwelen bugdaý irmigi — näzik şüle, gatlama we bişirmeler üçin.',
    'Пшеничная манная крупа тонкого помола — для нежной каши, запеканок и выпечки.',
    'Fine-ground wheat semolina — for tender porridge, bakes and pastry.',
  ),
  bulgur: t(
    'Owradylan, buglanan bugdaý — dagap duran garnir, palaw we işdäaçarlar üçin esas.',
    'Дроблёная пропаренная пшеница — рассыпчатый гарнир и основа для плова и салатов.',
    'Cracked parboiled wheat — a fluffy side and a base for pilaf and salads.',
  ),
  grechka: t(
    'Greçka dänesi — dagap duran şüle we belokdan baý doýumly garnir.',
    'Ядрица гречихи — рассыпчатая каша и сытный гарнир с высоким содержанием белка.',
    'Whole buckwheat groats — fluffy porridge and a filling, protein-rich side.',
  ),
  nohut: t(
    'Saýlanan nohut — humus, çorba we palaw üçin; bişirmezden öň gije suwda goýuň.',
    'Отборный нут — для хумуса, супов и плова; замочите на ночь перед варкой.',
    'Choice chickpeas — for hummus, soups and pilaf; soak overnight before cooking.',
  ),

  // ── Макароны ────────────────────────────────────────────────
  penne: t(
    'Berk bugdaýdan «penne» — görnüşini saklaýar we sousy gowy tutýar.',
    'Перья из твёрдых сортов пшеницы — держат форму и хорошо удерживают соус.',
    'Durum-wheat penne — holds its shape and carries sauce well.',
  ),
  burgu: t(
    'Berk bugdaýdan burma makaron — sous her towa girýär.',
    'Спиральки из твёрдых сортов пшеницы — соус попадает в каждый завиток.',
    'Durum-wheat spirals — sauce catches in every twist.',
  ),
  farfalle: t(
    'Berk bugdaýdan «farfalle» kebelekler — işdäaçarlar we yssy tagamlar üçin görkli görnüş.',
    'Бантики из твёрдых сортов пшеницы — красивая форма для салатов и горячих блюд.',
    'Durum-wheat bow-ties — a pretty shape for salads and hot dishes.',
  ),
  rozhki: t(
    'Berk bugdaýdan dirsek makaron — garnir we gatlamalar üçin adaty görnüş.',
    'Рожки из твёрдых сортов пшеницы — привычная форма для гарнира и запеканок.',
    'Durum-wheat elbows — a familiar shape for sides and bakes.',
  ),
  lingvini: t(
    'Berk bugdaýdan ýasy uzyn makaron — ýeňil gaýmakly we pomidorly souslar üçin.',
    'Плоская длинная паста из твёрдых сортов пшеницы — для лёгких сливочных и томатных соусов.',
    'Flat long durum-wheat pasta — for light cream and tomato sauces.',
  ),
  wermisel: t(
    'Berk bugdaýdan inçe wermişel — çalt bişýär, çorbalar we garnirler üçin.',
    'Тонкая вермишель из твёрдых сортов пшеницы — быстро варится, хороша в супах и гарнирах.',
    'Thin durum-wheat vermicelli — cooks fast, great in soups and sides.',
  ),

  // ── Бобовые ─────────────────────────────────────────────────
  'krasnaya-chechevitsa': t(
    'Çalt bişýän gyzyl merjimek — goýy çorbalar we püre üçin, öl etmezden.',
    'Красная чечевица быстрого разваривания — для густых супов и пюре, без замачивания.',
    'Quick-cooking red lentils — for thick soups and purée, no soaking needed.',
  ),
  'zelenaya-chechevitsa': t(
    'Ýaşyl merjimek — bişende görnüşini saklaýar, işdäaçarlar we garnirler üçin amatly.',
    'Зелёная чечевица — держит форму при варке, хороша в салатах и гарнирах.',
    'Green lentils — hold their shape when cooked, great in salads and sides.',
  ),
  'krasnaya-fasol': t(
    'Gyzyl noýba — lobio, çorba we güýelan üçin doýgun tagam; bişirmezden öň öl ediň.',
    'Красная фасоль — насыщенный вкус для лобио, супов и рагу; замочите перед варкой.',
    'Red beans — a rich taste for lobio, soups and stews; soak before cooking.',
  ),
  'belaya-fasol': t(
    'Ak noýba — çorbalar, buglanan tagamlar we işdäaçarlar üçin näzik gurluş.',
    'Белая фасоль — нежная текстура для супов, тушёных блюд и салатов.',
    'White beans — a tender texture for soups, stews and salads.',
  ),

  // ── Рис ─────────────────────────────────────────────────────
  baldo: t(
    'Togalak däneli baldo tüwisi — tagamy gowy sorýar, palaw we risotto üçin ajaýyp.',
    'Круглозёрный рис балдо — хорошо впитывает вкус, идеален для плова и ризотто.',
    'Round-grain baldo rice — soaks up flavour, ideal for pilaf and risotto.',
  ),
  basmati: t(
    'Uzyn däneli basmati — hoşboý ysly we dagap duran, däne-däne.',
    'Длиннозёрный басмати — ароматный и рассыпчатый, зёрнышко к зёрнышку.',
    'Long-grain basmati — fragrant and fluffy, grain by grain.',
  ),
  osmanchik: t(
    'Orta däneli osmançik tüwisi — palaw, garnir we çorbalar üçin ähliumumy.',
    'Среднезёрный рис османчик — универсальный, для плова, гарниров и супов.',
    'Medium-grain osmancik rice — versatile, for pilaf, sides and soups.',
  ),

  // ── Хлопья ──────────────────────────────────────────────────
  gerkules: t(
    'Bütin däneden süle perşenkleri — bäş minutda ýokumly ertirlik.',
    'Овсяные хлопья из цельного зерна — питательный завтрак за пять минут.',
    'Whole-grain oat flakes — a nourishing breakfast in five minutes.',
  ),

  // ── Семечки (уже заполнены addSeedsProducts; здесь для полноты) ─
  'semechki-solenye': t(
    'Gowrulan günebakar çigidi, doly duzlanan — güýçli tagam üçin.',
    'Жареные подсолнечные семечки с полной степенью посола — для насыщенного вкуса.',
    'Roasted sunflower seeds, fully salted — for a rich flavour.',
  ),
  'semechki-slabosolenye': t(
    'Gowrulan günebakar çigidi, ýeňil duzlanan — çigidiň öz tagamy saklanýar.',
    'Жареные подсолнечные семечки лёгкого посола — вкус самого ядра остаётся на первом плане.',
    'Roasted sunflower seeds, lightly salted — the kernel’s own taste stays in front.',
  ),
  'semechki-nesolenye': t(
    'Gowrulan günebakar çigidi, duzsuz — arassa tagam we duz goşulmadyk düzüm.',
    'Жареные подсолнечные семечки без соли — чистый вкус и состав без добавок.',
    'Roasted sunflower seeds, unsalted — clean taste, nothing added.',
  ),
};
