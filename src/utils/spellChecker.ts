// Comprehensive English Spell Checker & Typo Analysis Utility for Free Writing Mode

// 1. Core Vocabulary (Top common words across formal, academic, and daily communication)
const CORE_WORDS = new Set<string>([
  'a', 'about', 'above', 'across', 'act', 'active', 'activity', 'add', 'address', 'admin', 'administration',
  'after', 'again', 'against', 'age', 'ago', 'agree', 'agreement', 'ahead', 'air', 'all', 'allow', 'almost',
  'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'among', 'amount', 'an', 'analysis',
  'analytical', 'and', 'another', 'answer', 'any', 'anyone', 'anything', 'appear', 'apply', 'approach',
  'appropriate', 'are', 'area', 'arm', 'around', 'art', 'article', 'as', 'ask', 'aspect', 'assign', 'assignment',
  'at', 'attention', 'attitude', 'author', 'authority', 'available', 'average', 'avoid', 'aware', 'awareness',
  'away', 'back', 'bad', 'balance', 'bank', 'bar', 'base', 'basic', 'basically', 'basis', 'be', 'bear', 'beat',
  'beautiful', 'because', 'become', 'bed', 'before', 'begin', 'behavior', 'behind', 'believe', 'benefit', 'best',
  'better', 'between', 'beyond', 'big', 'bill', 'billion', 'bit', 'black', 'blood', 'blue', 'board', 'body',
  'book', 'born', 'both', 'box', 'boy', 'break', 'brief', 'bring', 'brother', 'budget', 'build', 'building',
  'business', 'busy', 'but', 'buy', 'by', 'call', 'camera', 'campaign', 'can', 'cancer', 'candidate', 'capital',
  'car', 'card', 'care', 'career', 'carry', 'case', 'catch', 'cause', 'cell', 'center', 'central', 'century',
  'certain', 'certainly', 'chair', 'challenge', 'chance', 'change', 'character', 'charge', 'check', 'child',
  'choice', 'choose', 'church', 'citizen', 'city', 'civil', 'claim', 'class', 'classroom', 'clear', 'clearly',
  'clerical', 'close', 'coach', 'cold', 'collection', 'college', 'color', 'come', 'commercial', 'common',
  'communication', 'community', 'company', 'compare', 'competency', 'complete', 'completely', 'complex',
  'computer', 'concern', 'condition', 'conference', 'confidence', 'consider', 'consistent', 'consumer',
  'contain', 'continue', 'continuous', 'control', 'conversation', 'copy', 'corner', 'corporate', 'correct',
  'cost', 'could', 'country', 'couple', 'course', 'court', 'cover', 'create', 'crime', 'critical', 'cultural',
  'culture', 'cup', 'current', 'customer', 'cut', 'daily', 'dark', 'data', 'daughter', 'day', 'dead', 'deal',
  'death', 'debate', 'decade', 'decide', 'decision', 'deep', 'defense', 'degree', 'delhi', 'demographic',
  'department', 'describe', 'design', 'despite', 'detail', 'determine', 'develop', 'development', 'device',
  'difference', 'different', 'difficult', 'digital', 'direction', 'director', 'discipline', 'discover', 'discuss',
  'discussion', 'disease', 'do', 'doctor', 'document', 'dog', 'door', 'down', 'draw', 'dream', 'drive', 'drop',
  'drug', 'during', 'each', 'early', 'east', 'easy', 'eat', 'economic', 'economy', 'edge', 'education', 'effect',
  'effective', 'efficiency', 'effort', 'eight', 'either', 'election', 'element', 'else', 'employee', 'end',
  'energy', 'engine', 'enjoy', 'enough', 'enter', 'entire', 'environment', 'environmental', 'equal', 'equipment',
  'error', 'especially', 'essay', 'essential', 'establish', 'even', 'evening', 'event', 'ever', 'every',
  'everybody', 'everyone', 'everything', 'evidence', 'exact', 'examination', 'example', 'executive', 'exist',
  'expect', 'experience', 'expert', 'explain', 'eye', 'face', 'fact', 'factor', 'faculty', 'fade', 'fail',
  'failure', 'fall', 'family', 'far', 'fast', 'father', 'fear', 'feature', 'federal', 'feel', 'feeling', 'few',
  'field', 'fight', 'figure', 'fill', 'film', 'final', 'finally', 'financial', 'find', 'fine', 'finger', 'finish',
  'fire', 'firm', 'first', 'fish', 'five', 'floor', 'flow', 'fly', 'focus', 'follow', 'food', 'foot', 'for',
  'force', 'foreign', 'forest', 'forget', 'form', 'formal', 'formation', 'former', 'forward', 'four', 'free',
  'freedom', 'friend', 'from', 'front', 'full', 'fund', 'fundamental', 'future', 'game', 'garden', 'gas',
  'general', 'generation', 'get', 'girl', 'give', 'glass', 'go', 'goal', 'god', 'gold', 'gomoh', 'good',
  'government', 'great', 'green', 'ground', 'group', 'grow', 'growth', 'guess', 'guidance', 'gun', 'guy',
  'habit', 'hair', 'half', 'hand', 'hang', 'happen', 'happy', 'hard', 'hardware', 'has', 'have', 'having', 'he',
  'head', 'health', 'hear', 'heart', 'heat', 'heavy', 'help', 'her', 'here', 'herself', 'high', 'him', 'himself',
  'his', 'history', 'hit', 'hold', 'home', 'hope', 'hospital', 'hot', 'hotel', 'hour', 'house', 'how', 'however',
  'huge', 'human', 'hundred', 'husband', 'i', 'idea', 'identify', 'if', 'image', 'imagine', 'immediate', 'impact',
  'important', 'improve', 'in', 'include', 'including', 'income', 'increase', 'indeed', 'india', 'indicate',
  'individual', 'industry', 'information', 'inside', 'instead', 'institution', 'interest', 'interesting',
  'international', 'interview', 'into', 'investment', 'involve', 'issue', 'it', 'item', 'its', 'itself',
  'jharkhand', 'job', 'join', 'just', 'keep', 'key', 'keyboard', 'kill', 'kind', 'kinetic', 'kitchen', 'know',
  'knowledge', 'kumar', 'land', 'language', 'large', 'last', 'late', 'later', 'laugh', 'law', 'lawyer', 'lay',
  'lead', 'leader', 'learn', 'least', 'leave', 'left', 'leg', 'legal', 'less', 'let', 'letter', 'level', 'lie',
  'life', 'light', 'like', 'likely', 'line', 'linguistic', 'list', 'listen', 'literacy', 'literature', 'little',
  'live', 'local', 'locate', 'location', 'long', 'look', 'lose', 'loss', 'lot', 'love', 'low', 'machine',
  'magazine', 'main', 'maintain', 'major', 'majority', 'make', 'man', 'manage', 'management', 'manager', 'many',
  'market', 'marriage', 'material', 'matter', 'may', 'maybe', 'me', 'mean', 'measure', 'media', 'medical',
  'meet', 'meeting', 'member', 'memory', 'mention', 'message', 'method', 'middle', 'might', 'military', 'million',
  'mind', 'minute', 'miss', 'mission', 'model', 'modern', 'moment', 'money', 'monitor', 'month', 'more',
  'morning', 'most', 'mother', 'mouth', 'move', 'movement', 'movie', 'mr', 'mrs', 'much', 'music', 'must', 'my',
  'myself', 'name', 'nation', 'national', 'natural', 'nature', 'near', 'nearly', 'necessary', 'need', 'network',
  'never', 'new', 'news', 'newspaper', 'next', 'nice', 'night', 'no', 'none', 'nor', 'north', 'not', 'note',
  'notepad', 'nothing', 'notice', 'now', 'number', 'occur', 'of', 'off', 'offer', 'office', 'officer', 'official',
  'often', 'oh', 'oil', 'ok', 'okay', 'old', 'on', 'once', 'one', 'only', 'onto', 'open', 'operation',
  'operational', 'opportunity', 'option', 'or', 'order', 'organization', 'other', 'others', 'our', 'out',
  'outside', 'over', 'own', 'page', 'pain', 'paper', 'paragraph', 'parent', 'part', 'participant', 'particular',
  'particularly', 'partner', 'party', 'pass', 'passage', 'past', 'patient', 'pattern', 'pay', 'peace', 'people',
  'per', 'perform', 'performance', 'perhaps', 'period', 'person', 'personal', 'phone', 'physical', 'pick',
  'picture', 'piece', 'place', 'plan', 'plant', 'play', 'player', 'pm', 'point', 'police', 'policy', 'political',
  'politics', 'poor', 'popular', 'population', 'position', 'positive', 'possible', 'post', 'power', 'practice',
  'prepare', 'present', 'president', 'pressure', 'pretty', 'prevent', 'price', 'private', 'probable', 'probably',
  'problem', 'procedural', 'process', 'produce', 'product', 'production', 'professional', 'proficiency',
  'program', 'progress', 'progressive', 'project', 'property', 'protect', 'prove', 'provide', 'public', 'pull',
  'purpose', 'push', 'put', 'quality', 'question', 'quick', 'quickly', 'quite', 'race', 'radio', 'raise', 'range',
  'rate', 'rather', 'reach', 'read', 'ready', 'real', 'reality', 'realize', 'really', 'reason', 'receive',
  'recent', 'recently', 'recognize', 'record', 'red', 'reduce', 'reflect', 'region', 'regular', 'regulation',
  'relate', 'relationship', 'religious', 'remain', 'remember', 'remove', 'report', 'represent', 'require',
  'research', 'resource', 'respect', 'respond', 'response', 'responsibility', 'rest', 'restaurant', 'result',
  'return', 'reveal', 'rich', 'right', 'rise', 'risk', 'road', 'rock', 'role', 'room', 'roy', 'rule', 'run',
  'safe', 'same', 'sample', 'save', 'say', 'scale', 'scene', 'schedule', 'school', 'science', 'scientist', 'score',
  'sea', 'season', 'seat', 'second', 'section', 'security', 'see', 'seek', 'seem', 'select', 'self', 'sell',
  'send', 'senior', 'sense', 'sentence', 'series', 'serious', 'serve', 'service', 'session', 'set', 'seven',
  'several', 'sex', 'sexual', 'shake', 'share', 'she', 'sheet', 'shoot', 'short', 'shot', 'should', 'shoulder',
  'show', 'side', 'sign', 'significant', 'similar', 'simple', 'simply', 'since', 'sing', 'single', 'sister',
  'sit', 'site', 'situation', 'six', 'size', 'skill', 'skin', 'small', 'smile', 'so', 'social', 'society',
  'soldier', 'some', 'somebody', 'someone', 'something', 'sometimes', 'son', 'song', 'soon', 'sort', 'sound',
  'source', 'south', 'southern', 'space', 'speak', 'special', 'specific', 'specifically', 'speech', 'spend',
  'sport', 'spring', 'staff', 'stage', 'stand', 'standard', 'star', 'start', 'state', 'statement', 'station',
  'stay', 'step', 'still', 'stock', 'stop', 'store', 'story', 'strategy', 'street', 'strong', 'structure',
  'student', 'study', 'stuff', 'style', 'subject', 'success', 'successful', 'such', 'suddenly', 'suffer',
  'suggest', 'suit', 'summer', 'support', 'sure', 'surface', 'system', 'systematic', 'table', 'take', 'talk',
  'task', 'tax', 'teach', 'teacher', 'team', 'technology', 'television', 'tell', 'ten', 'tend', 'term', 'test',
  'than', 'thank', 'thanks', 'that', 'the', 'their', 'them', 'themselves', 'then', 'theory', 'there', 'these',
  'they', 'thing', 'think', 'third', 'this', 'those', 'though', 'thought', 'thousand', 'threat', 'three',
  'through', 'throughout', 'throw', 'thus', 'time', 'to', 'today', 'together', 'tonight', 'too', 'top', 'total',
  'tough', 'toward', 'town', 'track', 'trade', 'traditional', 'training', 'transcript', 'travel', 'treat',
  'treatment', 'tree', 'trial', 'trip', 'trouble', 'true', 'truth', 'try', 'turn', 'tv', 'two', 'type', 'typing',
  'typographical', 'under', 'understand', 'unit', 'until', 'up', 'upon', 'us', 'use', 'user', 'usually', 'value',
  'various', 'velocity', 'verbatim', 'very', 'victim', 'view', 'violence', 'visit', 'voice', 'vote', 'wait',
  'walk', 'wall', 'want', 'war', 'warm', 'watch', 'water', 'way', 'we', 'weapon', 'wear', 'week', 'weight',
  'well', 'west', 'western', 'what', 'whatever', 'when', 'where', 'whether', 'which', 'while', 'white', 'who',
  'whole', 'whom', 'whose', 'why', 'wide', 'wife', 'will', 'win', 'wind', 'window', 'wish', 'with', 'within',
  'without', 'woman', 'wonder', 'word', 'work', 'worker', 'working', 'world', 'worry', 'would', 'write', 'writer',
  'writing', 'wrong', 'yard', 'yeah', 'year', 'yes', 'yet', 'you', 'young', 'your', 'yourself', 'zero',
  // Common Indian names and places relevant to typing tests
  'sahil', 'amit', 'rahul', 'priya', 'pooja', 'singh', 'sharma', 'patel', 'gupta', 'mumbai', 'kolkata', 'chennai',
  'bihar', 'bengal', 'patna', 'ranchi', 'dhanbad'
]);

// Common typos and instant replacements
const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  taht: 'that',
  waht: 'what',
  wiht: 'with',
  thsi: 'this',
  wierd: 'weird',
  seperate: 'separate',
  definately: 'definitely',
  recieved: 'received',
  untill: 'until',
  goverment: 'government',
  enviroment: 'environment',
  tommorow: 'tomorrow',
  truely: 'truly',
  neccessary: 'necessary',
  acheive: 'achieve',
  occured: 'occurred',
  beleive: 'believe',
  wich: 'which',
  becuase: 'because',
  kymar: 'kumar',
  cta: 'can',
  kumarroy: 'kumar roy'
};

export interface TypoIssue {
  index: number;
  word: string;
  expected?: string;
  reason: string;
}

/**
 * Validates a word in English using the core dictionary and morphological rules.
 */
export function isValidEnglishWord(rawWord: string): boolean {
  const clean = rawWord.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (!clean) return true;
  if (/^\d+$/.test(clean)) return true; // Numbers are valid
  if (clean.length === 1 && (clean === 'a' || clean === 'i')) return true;
  if (clean.length === 1) return false; // Single random letters like 'x', 'q' alone are typos

  if (CORE_WORDS.has(clean)) return true;
  if (COMMON_TYPOS[clean]) return false;

  // Standard morphological English derivations:
  // Plurals: -s, -es, -ies
  if (clean.endsWith('ies') && CORE_WORDS.has(clean.slice(0, -3) + 'y')) return true;
  if (clean.endsWith('es') && CORE_WORDS.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('s') && CORE_WORDS.has(clean.slice(0, -1))) return true;

  // Past tense / Participle: -ed, -d
  if (clean.endsWith('ed') && CORE_WORDS.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('ed') && CORE_WORDS.has(clean.slice(0, -1))) return true;

  // Continuous: -ing
  if (clean.endsWith('ing') && CORE_WORDS.has(clean.slice(0, -3))) return true;
  if (clean.endsWith('ing') && CORE_WORDS.has(clean.slice(0, -3) + 'e')) return true;

  // Adverbs: -ly
  if (clean.endsWith('ly') && CORE_WORDS.has(clean.slice(0, -2))) return true;

  // Comparatives: -er, -est
  if (clean.endsWith('er') && CORE_WORDS.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('est') && CORE_WORDS.has(clean.slice(0, -3))) return true;

  // Noun endings: -ment, -ness, -tion
  if (clean.endsWith('ment') && CORE_WORDS.has(clean.slice(0, -4))) return true;
  if (clean.endsWith('ness') && CORE_WORDS.has(clean.slice(0, -4))) return true;
  if (clean.endsWith('tion') && CORE_WORDS.has(clean.slice(0, -4) + 'te')) return true;

  return false;
}

/**
 * Evaluates free-form typing text for:
 * 1. Spelling mistakes (unknown words)
 * 2. Uncapitalized standalone personal pronoun 'i'
 * 3. Double spaces
 * 4. Repeated consecutive words
 */
export function analyzeFreeWritingErrors(text: string): {
  totalErrors: number;
  typoIssues: TypoIssue[];
  invalidWordIndexes: Set<number>;
} {
  const issues: TypoIssue[] = [];
  const invalidIndexes = new Set<number>();
  let errorCount = 0;

  // 1. Double space errors
  const doubleSpaces = (text.match(/  +/g) || []).length;
  if (doubleSpaces > 0) {
    errorCount += doubleSpaces;
    issues.push({
      index: 0,
      word: '  (Double Space)',
      reason: `${doubleSpaces} unnecessary double spaces detected`
    });
  }

  // 2. Word by word spelling and grammar verification
  const words = text.trim().split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const raw = words[i];
    const clean = raw.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');

    // Check standalone lowercase 'i'
    if (raw === 'i') {
      errorCount++;
      invalidIndexes.add(i);
      issues.push({
        index: i + 1,
        word: raw,
        expected: 'I',
        reason: 'Personal pronoun "I" must always be capitalized'
      });
      continue;
    }

    // Check known typo list
    if (COMMON_TYPOS[clean]) {
      errorCount++;
      invalidIndexes.add(i);
      issues.push({
        index: i + 1,
        word: raw,
        expected: COMMON_TYPOS[clean],
        reason: `Common misspelling of "${COMMON_TYPOS[clean]}"`
      });
      continue;
    }

    // Check duplicate consecutive words (e.g., "you you", "am am")
    if (i > 0 && clean && clean === words[i - 1].toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')) {
      errorCount++;
      invalidIndexes.add(i);
      issues.push({
        index: i + 1,
        word: raw,
        expected: '',
        reason: `Duplicate repeated word "${raw}"`
      });
      continue;
    }

    // Check English word validity
    if (!isValidEnglishWord(raw)) {
      errorCount++;
      invalidIndexes.add(i);
      issues.push({
        index: i + 1,
        word: raw,
        expected: 'Valid English word',
        reason: `Unrecognized word or spelling mistake`
      });
    }
  }

  return {
    totalErrors: errorCount,
    typoIssues: issues,
    invalidWordIndexes: invalidIndexes,
  };
}
