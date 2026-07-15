import { saveVerseToDb, saveLessonToDb } from '../lib/supabase';
import { Verse, GongGwa } from '../types';

// Deterministic UUID helper matching supabase.ts
function toUUID(str: string): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str.toLowerCase();
  
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = (hash1 * 31 + ch) | 0;
    hash2 = (hash2 * 37 + ch) | 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padEnd(16, 'f');
  const hex2 = Math.abs(hash2).toString(16).padEnd(16, 'f');
  const fullHex = (hex1 + hex2).slice(0, 32);
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(12, 15)}-a${fullHex.slice(15, 18)}-${fullHex.slice(18, 30)}`.toLowerCase();
}

export const SEED_VERSES: Verse[] = [
  {
    id: toUUID('seed-verse-1'),
    title: '금주 암송 구절 (1주차)',
    reference: '요한복음 3장 16절',
    text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라',
    quarter: 1,
    week: 1,
    hint: '하나님이 세상을... 독생자를... 믿는 자마다...',
    date: '2026.01.04',
    duration: '2026.01.04 ~ 2026.01.10',
    isCustom: false,
    isPersonal: false,
    isActive: true
  },
  {
    id: toUUID('seed-verse-2'),
    title: '금주 암송 구절 (2주차)',
    reference: '로마서 5장 8절',
    text: '우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라',
    quarter: 1,
    week: 2,
    hint: '우리가 아직 죄인... 그리스도께서 우리를... 자기의 사랑을 확증...',
    date: '2026.01.11',
    duration: '2026.01.11 ~ 2026.01.17',
    isCustom: false,
    isPersonal: false,
    isActive: true
  },
  {
    id: toUUID('seed-verse-3'),
    title: '금주 암송 구절 (3주차)',
    reference: '창세기 1장 1절',
    text: '태초에 하나님이 천지를 창조하시니라',
    quarter: 1,
    week: 3,
    hint: '태초에 하나님이...',
    date: '2026.01.18',
    duration: '2026.01.18 ~ 2026.01.24',
    isCustom: false,
    isPersonal: false,
    isActive: true
  },
  {
    id: toUUID('seed-verse-4'),
    title: '금주 암송 구절 (4주차)',
    reference: '시편 23장 1절',
    text: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
    quarter: 1,
    week: 4,
    hint: '여호와는 나의...',
    date: '2026.01.25',
    duration: '2026.01.25 ~ 2026.01.31',
    isCustom: false,
    isPersonal: false,
    isActive: true
  }
];

export const SEED_LESSONS: GongGwa[] = [
  {
    id: 'gonggwa-seed-1',
    title: '제 1 과 거듭남의 은혜',
    scriptureReference: '요한복음 3장 3~8절',
    introduction: [
      '예수님께서는 한밤중에 찾아온 니고데모에게 사람이 물과 성령으로 거듭나지 아니하면 하나님 나라를 볼 수 없고 들어갈 수도 없다고 선포하셨습니다.',
      '오늘 우리는 이 말씀을 통해 위로부터 새롭게 태어나는 구원의 신비와 거듭남의 은혜를 깊이 묵상해 봅니다.'
    ],
    verses: [
      { id: 'gv-s1-1', reference: '요한복음 3장 3절', text: '예수께서 대답하여 이르시되 진실로 진실로 네게 이르노니 사람이 거듭나지 아니하면 하나님의 나라를 볼 수 없느니라', isKey: true, hint: '사람이 거듭나지 아니하면...' },
      { id: 'gv-s1-2', reference: '요한복음 3장 5절', text: '예수께서 대답하시되 진실로 진실로 네게 이르노니 사람이 물과 성령으로 나지 아니하면 하나님의 나라에 들어갈 수 없느니라', isKey: true, hint: '사람이 물과 성령으로 나지...' },
      { id: 'gv-s1-3', reference: '요한복음 3장 6절', text: '육으로 난 것은 육이요 영으로 난 것은 영이니', isKey: false, hint: '육으로 난 것은 육이요...' }
    ],
    coreLessons: [
      { title: '거듭남의 절대적 필요성', verse: '요한복음 3:3', desc: '타락한 인류는 영적으로 죽었기 때문에 위로부터 다시 새 생명으로 태어나는 거듭남이 없이는 천국을 인지할 수도 참여할 수도 없습니다.' },
      { title: '물과 성령의 역사', verse: '요한복음 3:5', desc: '거듭남은 사람의 의지가 아닌, 하나님의 말씀(물)과 성령의 주권적인 역사로 성취되는 은혜의 사건입니다.' }
    ],
    qnas: [
      { id: 'qna-s1-1', question: '사람이 거듭나기 위해서 스스로 할 수 있는 육체적 노력이 있습니까?', answer: '없습니다. 거듭남은 육의 힘이나 사람의 지혜가 아닌 오직 성령께서 은혜로 거주하시는 위로부터의 창조적 역사입니다.' },
      { id: 'qna-s1-2', question: '거듭난 성도에게 나타나는 가장 뚜렷한 증거는 무엇입니까?', answer: '예수 그리스도를 구주로 믿고 영접하게 되며, 죄를 미워하고 하나님의 말씀을 사랑하며 동행하는 마음이 우러나오게 됩니다.' }
    ]
  },
  {
    id: 'gonggwa-seed-2',
    title: '제 2 과 하나님의 확증된 사랑',
    scriptureReference: '로마서 5장 1~11절',
    introduction: [
      '우리가 아직 연약하고, 경건하지 않으며, 심지어 원수 되었을 때에 하나님께서는 독생자 예수 그리스도를 이 땅에 보내어 십자가에 아낌없이 내어주셨습니다.',
      '이것으로 하나님께서는 우리를 향한 그분의 절절하고 위대한 사랑을 완벽하게 확증해 주셨습니다.'
    ],
    verses: [
      { id: 'gv-s2-1', reference: '로마서 5장 8절', text: '우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라', isKey: true, hint: '우리가 아직 죄인 되었을 때에...' },
      { id: 'gv-s2-2', reference: '로마서 5장 1절', text: '그러므로 우리가 믿음으로 의롭다 하심을 받았으니 우리 주 예수 그리스도로 말미암아 하나님과 화평을 누리자', isKey: false, hint: '그러므로 우리가 믿음으로...' }
    ],
    coreLessons: [
      { title: '아무 공로 없는 십자가 사랑', verse: '로마서 5:8', desc: '우리가 의롭거나 선할 때가 아니라, 여전히 연약하고 흉악한 죄인이었을 때 독생자께서 대속물이 되어 주셨습니다.' },
      { title: '하나님과의 화평과 즐거움', verse: '로마서 5:1', desc: '죄의 문제가 십자가 대속으로 영원히 해결되었으므로 성도는 이제 담대히 은혜의 보좌에 나가 화평을 누립니다.' }
    ],
    qnas: [
      { id: 'qna-s2-1', question: '하나님의 사랑이 언제 확증되었다고 기록합니까?', answer: '우리가 아직 죄인 되었을 때에 예수 그리스도께서 우리를 위하여 대속의 죽음을 죽으신 십자가 사건에서 확증되었습니다.' }
    ]
  }
];

/**
 * Execute Seeding of Master Data
 */
export async function runMasterDataSeed(): Promise<{ success: boolean; versesCount: number; lessonsCount: number }> {
  let versesCount = 0;
  let lessonsCount = 0;

  try {
    for (const v of SEED_VERSES) {
      const ok = await saveVerseToDb(v);
      if (ok) versesCount++;
    }

    for (const l of SEED_LESSONS) {
      const ok = await saveLessonToDb(l);
      if (ok) lessonsCount++;
    }

    return {
      success: true,
      versesCount,
      lessonsCount
    };
  } catch (err) {
    console.error('Error running seed data script:', err);
    return {
      success: false,
      versesCount,
      lessonsCount
    };
  }
}
