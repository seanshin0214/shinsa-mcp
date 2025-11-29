// 신학과사회 2025년 논문 형식 체크리스트
// 기준: 2-39-2 이민규 (2025) 실제 논문 분석

export interface FormatCheckItem {
  id: string;
  category: string;
  name: string;
  expected: string | number | boolean;
  tolerance?: number;  // 허용 오차 (숫자인 경우)
  required: boolean;
  description: string;
}

export interface FormatCheckResult {
  item: FormatCheckItem;
  actual: string | number | boolean | null;
  passed: boolean;
  message: string;
}

export interface ValidationReport {
  passed: boolean;
  score: number;  // 0-100
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: FormatCheckResult[];
  summary: string;
}

// 2025년 신학과사회 형식 체크리스트
export const SHINSA_2025_CHECKLIST: FormatCheckItem[] = [
  // ===== 페이지 설정 =====
  {
    id: 'page_size',
    category: '페이지 설정',
    name: '페이지 크기',
    expected: '신국판',  // 152x225mm (근사값 155x225)
    required: true,
    description: '신국판 크기 (약 155x225mm), A4가 아님'
  },
  {
    id: 'margin_left',
    category: '페이지 설정',
    name: '좌측 마진',
    expected: 25,
    tolerance: 3,
    required: true,
    description: '좌측 마진 약 25mm'
  },
  {
    id: 'margin_right',
    category: '페이지 설정',
    name: '우측 마진',
    expected: 23,
    tolerance: 3,
    required: true,
    description: '우측 마진 약 23mm'
  },
  {
    id: 'margin_top',
    category: '페이지 설정',
    name: '상단 마진',
    expected: 24,
    tolerance: 3,
    required: true,
    description: '상단 마진 약 24mm'
  },
  {
    id: 'margin_bottom',
    category: '페이지 설정',
    name: '하단 마진',
    expected: 25,
    tolerance: 3,
    required: true,
    description: '하단 마진 약 25mm'
  },

  // ===== 폰트 크기 =====
  {
    id: 'font_title',
    category: '폰트',
    name: '논문 제목 크기',
    expected: 14,
    tolerance: 0.5,
    required: true,
    description: '논문 제목 14pt'
  },
  {
    id: 'font_subtitle',
    category: '폰트',
    name: '부제 크기',
    expected: 12.3,
    tolerance: 0.5,
    required: false,
    description: '부제 12.3pt (부제가 있는 경우)'
  },
  {
    id: 'font_author',
    category: '폰트',
    name: '저자명 크기',
    expected: 11,
    tolerance: 0.5,
    required: true,
    description: '저자명 11pt, 띄어쓰기 (예: 이 민 규)'
  },
  {
    id: 'font_body',
    category: '폰트',
    name: '본문 크기',
    expected: 10.3,
    tolerance: 0.3,
    required: true,
    description: '본문 10.3pt'
  },
  {
    id: 'font_abstract',
    category: '폰트',
    name: '초록 본문 크기',
    expected: 8.5,
    tolerance: 0.3,
    required: true,
    description: '국문/영문 초록 본문 8.5pt'
  },
  {
    id: 'font_abstract_title',
    category: '폰트',
    name: '초록 제목 크기',
    expected: 9,
    tolerance: 0.3,
    required: true,
    description: '국문초록/Abstract 제목 9pt'
  },
  {
    id: 'font_section_title',
    category: '폰트',
    name: '섹션 제목 크기',
    expected: 13,
    tolerance: 0.5,
    required: true,
    description: '장 제목 (Ⅰ. 서론) 13pt'
  },
  {
    id: 'font_footnote',
    category: '폰트',
    name: '각주 크기',
    expected: 8.5,
    tolerance: 0.3,
    required: true,
    description: '각주 8.5pt'
  },
  {
    id: 'font_header',
    category: '폰트',
    name: '헤더 크기',
    expected: 8.1,
    tolerance: 0.3,
    required: true,
    description: '페이지 헤더 8.1-8.2pt'
  },

  // ===== 구조 요소 =====
  {
    id: 'abstract_kr_title',
    category: '구조',
    name: '국문초록 제목',
    expected: '국문초록',
    required: true,
    description: '국문초록 (붙여쓰기, 공백 없음)'
  },
  {
    id: 'abstract_en_title',
    category: '구조',
    name: '영문초록 제목',
    expected: 'Abstract',
    required: true,
    description: 'Abstract'
  },
  {
    id: 'keywords_kr_label',
    category: '구조',
    name: '주제어 라벨',
    expected: '주제어:',
    required: true,
    description: '주제어: (콜론 포함)'
  },
  {
    id: 'keywords_en_label',
    category: '구조',
    name: 'Keywords 라벨',
    expected: 'Keywords:',
    required: true,
    description: 'Keywords: (콜론 포함)'
  },
  {
    id: 'keywords_count',
    category: '구조',
    name: '주제어 개수',
    expected: 5,
    tolerance: 2,
    required: true,
    description: '주제어 5개 (±2)'
  },

  // ===== 저자 정보 =====
  {
    id: 'author_footnote_symbol',
    category: '저자 정보',
    name: '저자 각주 기호',
    expected: '**',
    required: true,
    description: '저자 각주 기호 ** (제목각주 * 다음)'
  },
  {
    id: 'author_footnote_format',
    category: '저자 정보',
    name: '저자 각주 형식',
    expected: '{affiliation}/ {position}/ {field}/ {email}',
    required: true,
    description: '소속/ 직위/ 전공/ 이메일 (슬래시+공백 구분)'
  },
  {
    id: 'title_footnote_symbol',
    category: '저자 정보',
    name: '제목 각주 기호',
    expected: '*',
    required: false,
    description: '연구비 지원 표시 * (있는 경우)'
  },

  // ===== 헤더/푸터 =====
  {
    id: 'header_first_page',
    category: '헤더',
    name: '첫 페이지 헤더',
    expected: '신학과 사회 {volume}({issue}) {year}',
    required: true,
    description: '첫 페이지: 신학과 사회 39(2) 2025'
  },
  {
    id: 'header_page_range',
    category: '헤더',
    name: '페이지 범위',
    expected: 'pp. {start} - {end}',
    required: true,
    description: '첫 페이지: pp. 29 - 54'
  },
  {
    id: 'header_even_page',
    category: '헤더',
    name: '짝수 페이지 헤더',
    expected: '신학과 사회 {volume}({issue}) {year}',
    required: true,
    description: '짝수 페이지 헤더'
  },

  // ===== 섹션 번호 =====
  {
    id: 'section_level1',
    category: '섹션 번호',
    name: '1단계 번호',
    expected: 'Ⅰ, Ⅱ, Ⅲ',
    required: true,
    description: '로마 숫자 (Ⅰ. 서론, Ⅱ. 본론)'
  },
  {
    id: 'section_level2',
    category: '섹션 번호',
    name: '2단계 번호',
    expected: '1, 2, 3',
    required: true,
    description: '아라비아 숫자 (1. 절제목)'
  },
  {
    id: 'section_level3',
    category: '섹션 번호',
    name: '3단계 번호',
    expected: '1), 2), 3)',
    required: true,
    description: '괄호 숫자 (1) 소제목)'
  },

  // ===== 참고문헌 =====
  {
    id: 'ref_section_headers',
    category: '참고문헌',
    name: '섹션 구분',
    expected: true,
    required: true,
    description: '<국문 자료> / <외국어 자료> 구분'
  },
  {
    id: 'ref_korean_sort',
    category: '참고문헌',
    name: '국문 정렬',
    expected: '가나다순',
    required: true,
    description: '국문 참고문헌 가나다순 정렬'
  },
  {
    id: 'ref_foreign_sort',
    category: '참고문헌',
    name: '외국어 정렬',
    expected: '알파벳순',
    required: true,
    description: '외국어 참고문헌 알파벳순 정렬'
  },
  {
    id: 'ref_author_format',
    category: '참고문헌',
    name: '외국 저자 형식',
    expected: 'Last, First',
    required: true,
    description: '외국 저자 Last, First 형식'
  },
  {
    id: 'ref_separator',
    category: '참고문헌',
    name: '구분자',
    expected: '.',
    required: true,
    description: '참고문헌 항목 간 마침표(.) 구분'
  }
];

// 체크리스트 카테고리별 그룹화
export function getChecklistByCategory(): Map<string, FormatCheckItem[]> {
  const grouped = new Map<string, FormatCheckItem[]>();

  for (const item of SHINSA_2025_CHECKLIST) {
    if (!grouped.has(item.category)) {
      grouped.set(item.category, []);
    }
    grouped.get(item.category)!.push(item);
  }

  return grouped;
}

// 체크리스트 요약 출력
export function getChecklistSummary(): string {
  const grouped = getChecklistByCategory();
  let summary = '# 신학과사회 2025년 논문 형식 체크리스트\n\n';

  for (const [category, items] of grouped) {
    summary += `## ${category}\n`;
    for (const item of items) {
      const required = item.required ? '(필수)' : '(선택)';
      summary += `- [ ] ${item.name} ${required}: ${item.description}\n`;
    }
    summary += '\n';
  }

  return summary;
}

// 단일 항목 검증
export function checkItem(
  item: FormatCheckItem,
  actual: string | number | boolean | null
): FormatCheckResult {
  let passed = false;
  let message = '';

  if (actual === null || actual === undefined) {
    passed = false;
    message = `${item.name}: 값 없음`;
  } else if (typeof item.expected === 'number' && typeof actual === 'number') {
    const tolerance = item.tolerance || 0;
    passed = Math.abs(actual - item.expected) <= tolerance;
    message = passed
      ? `${item.name}: ${actual} (기준: ${item.expected}±${tolerance})`
      : `${item.name}: ${actual} ≠ ${item.expected}±${tolerance}`;
  } else if (typeof item.expected === 'boolean') {
    passed = actual === item.expected;
    message = passed
      ? `${item.name}: ${actual ? '있음' : '없음'}`
      : `${item.name}: ${actual ? '있음' : '없음'} (기대: ${item.expected ? '있음' : '없음'})`;
  } else {
    // 문자열 비교
    const expectedStr = String(item.expected).toLowerCase();
    const actualStr = String(actual).toLowerCase();
    passed = actualStr.includes(expectedStr) || expectedStr.includes(actualStr);
    message = passed
      ? `${item.name}: "${actual}"`
      : `${item.name}: "${actual}" ≠ "${item.expected}"`;
  }

  return { item, actual, passed, message };
}

// 전체 검증 리포트 생성
export function generateValidationReport(
  results: FormatCheckResult[]
): ValidationReport {
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = results.filter(r => !r.passed).length;
  const totalChecks = results.length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  const passed = score >= 80;  // 80% 이상이면 통과

  let summary = `## 검증 결과: ${passed ? '통과' : '실패'} (${score}점)\n\n`;
  summary += `- 총 항목: ${totalChecks}\n`;
  summary += `- 통과: ${passedChecks}\n`;
  summary += `- 실패: ${failedChecks}\n\n`;

  if (failedChecks > 0) {
    summary += '### 실패 항목\n';
    for (const result of results.filter(r => !r.passed)) {
      const req = result.item.required ? '(필수)' : '(선택)';
      summary += `- ❌ ${result.message} ${req}\n`;
    }
  }

  return {
    passed,
    score,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
    summary
  };
}
