#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { parseCitation, extractCitations } from './parsers/index.js';
import { toFootnote, toBibliography, convertCitation, sortBibliography } from './converters/index.js';
import { initRAG, searchCitations, getPaperCitations, getStats, isRAGInitialized } from './rag/index.js';
import { convertEssayToPaper, toMarkdown, toWordHTML, SHINSA_TEMPLATE, SHINSA_2025_CHECKLIST, getChecklistSummary, checkItem, generateValidationReport } from './formatter/index.js';
import type { FormatCheckResult } from './formatter/index.js';
import type { ParsedCitation, BatchConvertResult, CitationType } from './types/citation.js';
import type { EssayInput, ConversionOptions } from './formatter/index.js';

// MCP 서버 생성
const server = new Server(
  {
    name: 'shinsa-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ============================================
// 리소스: 신학과사회 전체 논문 규정
// ============================================

const FULL_STYLE_GUIDE = `# 「신학과 사회」 논문 작성 완전 가이드

## 1. 논문 구조

### 1.1 필수 구성요소
1. **논문 제목** (국문/영문)
2. **저자 정보** (이름, 소속, 직위)
3. **국문 초록** (300자 내외)
4. **주제어** (5개 내외)
5. **본문**
6. **참고문헌**
7. **영문 초록** (Abstract)
8. **Keywords** (5개 내외)

### 1.2 본문 구조
I. 서론
II. 본론
  1. 첫 번째 절
    1) 소제목
    2) 소제목
  2. 두 번째 절
III. 결론

## 2. 형식 규정

### 2.1 기본 설정
- **용지**: A4
- **여백**: 위 30mm, 아래 25mm, 좌우 25mm
- **본문 글꼴**: 신명조 또는 바탕, 10pt
- **각주 글꼴**: 9pt
- **줄간격**: 160%
- **문단 들여쓰기**: 2칸

### 2.2 제목 형식
- **논문 제목**: 16pt, 가운데 정렬, 굵게
- **부제**: 14pt, 가운데 정렬
- **장 제목** (I, II, III): 12pt, 굵게
- **절 제목** (1, 2, 3): 11pt, 굵게
- **항 제목** (1), 2), 3)): 10pt

### 2.3 초록 형식
\`\`\`
[국문 초록 예시]

본 논문은 ... 를 분석하였다. 연구 결과, ... 임을 확인하였다.
이를 통해 ... 의 의의를 논의하였다.

주제어: 신학, 사회, 교회, 윤리, 한국
\`\`\`

## 3. 인용 규정 상세

### 3.1 기호 사용
| 유형 | 기호 | 예시 |
|------|------|------|
| 국문 논문 제목 | " " | "신학적 상상력의 회복" |
| 국문 학술지명 | 「 」 | 「신학과 사회」 |
| 국문 단행본 | 『 』 | 『조직신학』 |
| 외국어 학술지/단행본 | *이탤릭* | *Theology Today* |

### 3.2 각주 형식 (콤마 구분, 괄호 사용)

**① 국문 학술논문**
저자, "논문제목," 「학술지명」 권/호 (연도), 페이지.
→ 홍길동, "신학적 상상력," 「신학과 사회」 35/2 (2020), 45-78.

**② 국문 단행본**
저자, 『책제목』 (도시: 출판사, 연도), 페이지.
→ 홍길동, 『조직신학 개론』 (서울: 대한기독교서회, 2020), 125.

**③ 번역서** ⚠️ 슬래시(/) 필수
원저자 / 역자 옮김, 『책제목』 (도시: 출판사, 연도), 페이지.
→ Max Weber / 박성수 옮김, 『프로테스탄티즘의 윤리와 자본주의 정신』 (서울: 문예출판사, 2010), 87.

**④ 단행본 내 챕터**
저자, "챕터제목," 편저자 편, 『책제목』 (도시: 출판사, 연도), 페이지.
→ 김철수, "한국교회의 미래," 이영희 편, 『21세기 한국신학』 (서울: 대한기독교서회, 2019), 45-67.

**⑤ 외국어 논문**
Author, "Title," *Journal* Vol/Issue (Year), Pages.
→ John Smith, "Theology and Society," *Theology Today* 75/2 (2018), 123-145.

**⑥ 외국어 단행본**
Author, *Title* (City: Publisher, Year), Pages.
→ Paul Tillich, *Systematic Theology* (Chicago: University of Chicago Press, 1951), 234.

**⑦ 학위논문**
저자, "논문제목," 박사/석사학위논문, 대학교, 연도, 페이지.
→ 박영수, "한국교회 사회참여 연구," 박사학위논문, 연세대학교, 2015, 78.

**⑧ 인터넷 자료**
저자, "제목," [온라인자료] URL, 접속일.
→ 한국기독교교회협의회, "사회선교 성명서," [온라인자료] https://ncck.org, 2023.05.15 접속.

**⑨ 성경 인용**
(약어 장:절, 번역본)
→ (마 5:3-10, 개역개정)

**⑩ 반복 인용**
- 직전 인용: Ibid., 페이지.
- 이전 인용: 저자, 『제목』, 페이지.

### 3.3 참고문헌 형식 (마침표 구분, 괄호 해제)

**① 국문 학술논문**
저자. "논문제목." 「학술지명」 권/호. 연도. 페이지.
→ 홍길동. "신학적 상상력." 「신학과 사회」 35/2. 2020. 45-78.

**② 국문 단행본**
저자. 『책제목』. 도시: 출판사. 연도.
→ 홍길동. 『조직신학 개론』. 서울: 대한기독교서회. 2020.

**③ 번역서**
원저자 / 역자 옮김. 『책제목』. 도시: 출판사. 연도.
→ Max Weber / 박성수 옮김. 『프로테스탄티즘의 윤리와 자본주의 정신』. 서울: 문예출판사. 2010.

**④ 외국어 문헌** (Last, First 형식)
Last, First. "Title." *Journal* Vol/Issue. Year. Pages.
→ Smith, John. "Theology and Society." *Theology Today* 75/2. 2018. 123-145.

### 3.4 참고문헌 배열 순서
1. 국문 문헌 (가나다순)
2. 외국어 문헌 (알파벳순)

## 4. 본문 작성 규칙

### 4.1 문장 스타일
- 학술적 문체 사용 (경어체 "~입니다" 지양, "~이다" 체 사용)
- 단락 첫 문장 들여쓰기
- 인용문은 블록 인용(3줄 이상) 또는 본문 내 인용으로 구분

### 4.2 블록 인용 형식
\`\`\`
본문 내용이 계속되다가 긴 인용이 필요한 경우,

    인용문은 별도의 단락으로 구분하여 좌우 여백을 늘리고
    글자 크기를 줄여서 표시한다. 이때 인용문 앞뒤로 한 줄씩
    공백을 두어 본문과 구분한다.¹⁾

본문이 다시 이어진다.
\`\`\`

### 4.3 약어 사용
- 최초 언급 시 풀네임 후 괄호 안에 약어 표기
- 예: 세계교회협의회(WCC)는 ... 이후 WCC는 ...

### 4.4 숫자 표기
- 일반적인 숫자: 아라비아 숫자 (1, 2, 3)
- 장/절 번호: 로마 숫자 (I, II, III) 또는 아라비아 숫자

## 5. 특수 사례

### 5.1 공저 표기
- 국문: 홍길동 · 김철수
- 영문: John Smith and Jane Doe

### 5.2 편저 표기
- 국문: 홍길동 편, 『책제목』
- 영문: John Smith, ed., *Title*

### 5.3 재인용
원저자, 『원제목』, 페이지; 재인용: 인용저자, 『인용서』, 페이지.

## 6. 체크리스트

### 투고 전 확인사항
- [ ] 논문 제목 국문/영문 모두 포함
- [ ] 초록 300자 내외
- [ ] 주제어/Keywords 5개
- [ ] 각주 형식 통일 (콤마 구분, 괄호)
- [ ] 참고문헌 형식 통일 (마침표 구분)
- [ ] 번역서 슬래시(/) 표기
- [ ] 외국저자 Last, First 형식 (참고문헌)
- [ ] 참고문헌 정렬 (국문 가나다 → 외국어 알파벳)
- [ ] 성경 약어 및 번역본 표기
- [ ] 페이지 설정 확인
`;

const CITATION_QUICK_GUIDE = `# 「신학과 사회」 인용 형식 빠른 참조

## 기호 규칙
- 국문 논문: " "
- 국문 학술지: 「 」
- 국문 단행본: 『 』
- 외국어 학술지/단행본: *이탤릭*

## 각주 vs 참고문헌
| 구분 | 각주 | 참고문헌 |
|------|------|----------|
| 구분자 | 콤마(,) | 마침표(.) |
| 출판정보 | (괄호) | 괄호 없음 |
| 외국저자 | First Last | Last, First |

## 핵심 규칙
1. **번역서**: 반드시 슬래시(/) 사용
   - ✓ Weber / 박성수 옮김
   - ✗ Weber, 박성수 옮김

2. **반복인용**: Ibid., 페이지.

3. **참고문헌 순서**: 국문(가나다) → 외국어(알파벳)
`;

const PAPER_TEMPLATE = `# 「신학과 사회」 논문 템플릿

---

## [논문 제목]
### 부제가 있는 경우

---

**저자명**
소속, 직위

---

### 국문 초록

[300자 내외의 연구 요약을 작성합니다. 연구 목적, 방법, 주요 발견, 결론을 포함합니다.]

**주제어**: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5

---

## I. 서론

[연구의 배경, 목적, 연구 질문, 논문 구성을 서술합니다.]

## II. [본론 제목 1]

### 1. [절 제목]

[본문 내용]

#### 1) [항 제목]

[세부 내용]

### 2. [절 제목]

[본문 내용]

## III. [본론 제목 2]

### 1. [절 제목]

[본문 내용]

## IV. 결론

[연구 요약, 발견의 의의, 한계, 향후 연구 방향을 서술합니다.]

---

## 참고문헌

[국문 문헌 - 가나다순]

홍길동. "신학적 상상력의 회복." 「신학과 사회」 35/2. 2020. 45-78.
홍길동. 『조직신학 개론』. 서울: 대한기독교서회. 2020.

[외국어 문헌 - 알파벳순]

Smith, John. "Theology and Society." *Theology Today* 75/2. 2018. 123-145.
Tillich, Paul. *Systematic Theology*. Chicago: University of Chicago Press. 1951.

---

### Abstract

**[English Title]**

[Abstract in English, approximately 200 words]

**Keywords**: keyword1, keyword2, keyword3, keyword4, keyword5

---
`;

// Tools 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ============================================
      // 인용 변환 도구
      // ============================================
      {
        name: 'convert_citation',
        description: '인용 정보를 신학과사회 형식(각주/참고문헌)으로 변환합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '변환할 인용 텍스트'
            },
            format: {
              type: 'string',
              enum: ['footnote', 'bibliography', 'both'],
              default: 'both',
              description: '출력 형식'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'batch_convert',
        description: '여러 인용을 일괄 추출하고 신학과사회 형식으로 변환합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '인용이 포함된 텍스트'
            },
            output_format: {
              type: 'string',
              enum: ['both', 'footnotes_only', 'bibliography_only'],
              default: 'both'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'validate_citation',
        description: '인용 형식이 신학과사회 규정을 준수하는지 검증합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '검증할 인용 텍스트'
            },
            format_type: {
              type: 'string',
              enum: ['footnote', 'bibliography'],
              description: '형식 유형'
            }
          },
          required: ['text', 'format_type']
        }
      },

      // ============================================
      // RAG 검색 도구
      // ============================================
      {
        name: 'search_examples',
        description: 'DB에서 유사한 인용 형식 사례를 검색합니다. 형식 변환 시 참고용으로 사용하세요.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '검색할 인용 텍스트 또는 질문'
            },
            top_k: {
              type: 'integer',
              default: 5,
              description: '반환할 결과 수'
            },
            filter_type: {
              type: 'string',
              enum: ['footnote', 'bibliography'],
              description: '필터링할 인용 유형'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_paper_examples',
        description: '특정 논문의 인용 사례를 모두 반환합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            paper_title: {
              type: 'string',
              description: '논문 제목 (부분 검색 가능)'
            }
          },
          required: ['paper_title']
        }
      },

      // ============================================
      // 논문 포맷팅 도구 (NEW)
      // ============================================
      {
        name: 'format_paragraph',
        description: '문단/텍스트를 신학과사회 논문 스타일로 포맷팅합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '포맷팅할 텍스트'
            },
            section_type: {
              type: 'string',
              enum: ['abstract', 'introduction', 'body', 'conclusion', 'auto'],
              default: 'auto',
              description: '섹션 유형'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'format_paper',
        description: '논문 전체를 신학과사회 형식으로 구조화합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '논문 제목'
            },
            author: {
              type: 'string',
              description: '저자 정보'
            },
            abstract_kr: {
              type: 'string',
              description: '국문 초록'
            },
            keywords_kr: {
              type: 'array',
              items: { type: 'string' },
              description: '국문 키워드'
            },
            body: {
              type: 'string',
              description: '본문 텍스트'
            },
            references: {
              type: 'array',
              items: { type: 'string' },
              description: '참고문헌 목록'
            },
            abstract_en: {
              type: 'string',
              description: '영문 초록'
            },
            keywords_en: {
              type: 'array',
              items: { type: 'string' },
              description: '영문 키워드'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'check_format',
        description: '논문이 신학과사회 형식 요건을 충족하는지 체크합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            paper_text: {
              type: 'string',
              description: '검사할 논문 전문'
            }
          },
          required: ['paper_text']
        }
      },
      {
        name: 'suggest_structure',
        description: '주제에 맞는 논문 구조를 제안합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: '논문 주제'
            },
            type: {
              type: 'string',
              enum: ['theoretical', 'empirical', 'review', 'case_study'],
              default: 'theoretical',
              description: '논문 유형'
            }
          },
          required: ['topic']
        }
      },

      // ============================================
      // 유틸리티 도구
      // ============================================
      {
        name: 'get_stats',
        description: 'RAG DB 통계를 반환합니다.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // ============================================
      // 에세이 → 논문 변환 도구 (NEW)
      // ============================================
      {
        name: 'convert_essay_to_paper',
        description: '에세이/초안을 신학과사회 저널 형식의 완전한 논문으로 변환합니다. 페이지 번호, 헤더, 섹션 번호, 각주, 참고문헌 등 정확한 형식을 적용합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '논문 제목'
            },
            subtitle: {
              type: 'string',
              description: '부제 (선택)'
            },
            author: {
              type: 'string',
              description: '저자명'
            },
            affiliation: {
              type: 'string',
              description: '소속 및 직위'
            },
            email: {
              type: 'string',
              description: '이메일 (선택)'
            },
            abstract_kr: {
              type: 'string',
              description: '국문 초록 (300자 내외)'
            },
            keywords_kr: {
              type: 'array',
              items: { type: 'string' },
              description: '국문 주제어 (5개)'
            },
            body: {
              type: 'string',
              description: '본문 (마크다운 또는 일반 텍스트, # 또는 I. II. 로 섹션 구분)'
            },
            references: {
              type: 'array',
              items: { type: 'string' },
              description: '참고문헌 목록 (자동 변환됨)'
            },
            abstract_en: {
              type: 'string',
              description: '영문 초록'
            },
            keywords_en: {
              type: 'array',
              items: { type: 'string' },
              description: '영문 키워드 (5개)'
            },
            output_format: {
              type: 'string',
              enum: ['markdown', 'html', 'both'],
              default: 'markdown',
              description: '출력 형식'
            },
            volume: {
              type: 'integer',
              description: '권 번호 (기본: 39)'
            },
            issue: {
              type: 'integer',
              description: '호 번호 (기본: 2)'
            },
            year: {
              type: 'integer',
              description: '연도 (기본: 2025)'
            },
            start_page: {
              type: 'integer',
              description: '시작 페이지 번호'
            }
          },
          required: ['title', 'author', 'affiliation', 'body']
        }
      },
      {
        name: 'get_journal_template',
        description: '신학과사회 저널의 정확한 형식 템플릿 정보를 반환합니다.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // ============================================
      // 2025년 형식 검증 도구 (NEW)
      // ============================================
      {
        name: 'validate_format',
        description: '논문이 2025년 신학과사회 형식 기준을 충족하는지 상세 검증합니다. 페이지 설정, 폰트 크기, 구조, 저자 정보, 섹션 번호, 참고문헌 등 30개 이상 항목을 체크합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            checks: {
              type: 'object',
              description: '검증할 항목들 (체크리스트 ID를 키로, 실제값을 값으로)',
              additionalProperties: true
            },
            get_checklist: {
              type: 'boolean',
              default: false,
              description: 'true이면 체크리스트만 반환 (검증 수행 안 함)'
            }
          }
        }
      },
      {
        name: 'get_format_checklist',
        description: '2025년 신학과사회 논문 형식 체크리스트를 반환합니다. 검증 전 참고용.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // ============================================
      // DOCX 파일 생성 도구 (python-docx 기반)
      // ============================================
      {
        name: 'create_shinsa_docx',
        description: '신학과사회 2025년 형식의 DOCX 파일을 직접 생성합니다. python-docx를 사용하여 신국판(152x225mm), 바탕체, 정확한 마진/폰트 크기가 적용된 Word 문서를 만듭니다. Claude 스킬의 Word 변환보다 정확합니다.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '논문 제목'
            },
            subtitle: {
              type: 'string',
              description: '부제 (선택)'
            },
            author: {
              type: 'string',
              description: '저자명 (예: 홍길동)'
            },
            affiliation: {
              type: 'string',
              description: '소속 (예: 강남대학교)'
            },
            field: {
              type: 'string',
              description: '전공 분야 (예: 조직신학)'
            },
            email: {
              type: 'string',
              description: '이메일'
            },
            funding: {
              type: 'string',
              description: '연구비 지원 정보 (선택)'
            },
            abstract_kr: {
              type: 'string',
              description: '국문 초록 (300자 내외)'
            },
            keywords_kr: {
              type: 'array',
              items: { type: 'string' },
              description: '국문 주제어 (5개)'
            },
            body: {
              type: 'string',
              description: '본문 (# 또는 I. II. 로 섹션 구분)'
            },
            references: {
              type: 'array',
              items: { type: 'string' },
              description: '참고문헌 목록'
            },
            abstract_en: {
              type: 'string',
              description: '영문 초록'
            },
            keywords_en: {
              type: 'array',
              items: { type: 'string' },
              description: '영문 키워드 (5개)'
            },
            volume: {
              type: 'integer',
              description: '권 번호 (기본: 39)'
            },
            issue: {
              type: 'integer',
              description: '호 번호 (기본: 2)'
            },
            year: {
              type: 'integer',
              description: '연도 (기본: 2025)'
            },
            start_page: {
              type: 'integer',
              description: '시작 페이지 번호 (기본: 1)'
            },
            output_path: {
              type: 'string',
              description: '저장 경로 (기본: 바탕화면/논문제목_신사형식.docx)'
            }
          },
          required: ['title', 'author', 'affiliation', 'body']
        }
      }
    ]
  };
});

// Resources 목록
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'shinsa://style-guide',
        name: '신학과사회 논문 작성 완전 가이드',
        description: '논문 구조, 형식, 인용 규정 전체',
        mimeType: 'text/markdown'
      },
      {
        uri: 'shinsa://citation-guide',
        name: '인용 형식 빠른 참조',
        description: '인용 규정 요약본',
        mimeType: 'text/markdown'
      },
      {
        uri: 'shinsa://template',
        name: '논문 템플릿',
        description: '신학과사회 논문 템플릿',
        mimeType: 'text/markdown'
      }
    ]
  };
});

// Resource 읽기
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  const resources: Record<string, string> = {
    'shinsa://style-guide': FULL_STYLE_GUIDE,
    'shinsa://citation-guide': CITATION_QUICK_GUIDE,
    'shinsa://template': PAPER_TEMPLATE
  };

  if (resources[uri]) {
    return {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: resources[uri]
      }]
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Tool 실행
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // ============================================
    // 인용 변환 도구
    // ============================================
    case 'convert_citation': {
      const text = args?.text as string;
      const format = (args?.format as string) || 'both';
      if (!text) throw new Error('text is required');

      const parsed = parseCitation(text);
      const result: Record<string, unknown> = {
        original: text,
        type: parsed.type,
        confidence: parsed.confidence
      };

      if (format === 'footnote' || format === 'both') {
        result.footnote = toFootnote(parsed);
      }
      if (format === 'bibliography' || format === 'both') {
        result.bibliography = toBibliography(parsed);
      }
      if (parsed.warnings) {
        result.warnings = parsed.warnings;
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }

    case 'batch_convert': {
      const text = args?.text as string;
      const outputFormat = (args?.output_format as string) || 'both';
      if (!text) throw new Error('text is required');

      const citations = extractCitations(text);
      const result: BatchConvertResult = {
        footnotes: [],
        bibliography: [],
        stats: { total: citations.length, converted: 0, failed: 0, byType: {} },
        warnings: []
      };

      const bibliographySet = new Set<string>();

      citations.forEach(citation => {
        result.stats.byType[citation.type] = (result.stats.byType[citation.type] || 0) + 1;

        if (citation.type === 'unknown') {
          result.stats.failed++;
          result.warnings.push(`파싱 실패: ${citation.original.substring(0, 50)}...`);
          return;
        }

        result.stats.converted++;

        if (outputFormat === 'both' || outputFormat === 'footnotes_only') {
          result.footnotes.push({
            original: citation.original,
            converted: toFootnote(citation)
          });
        }

        if (outputFormat === 'both' || outputFormat === 'bibliography_only') {
          const bib = toBibliography(citation);
          if (bib && !['bible', 'ibid', 'short_ref'].includes(citation.type)) {
            bibliographySet.add(bib);
          }
        }
      });

      result.bibliography = sortBibliography(Array.from(bibliographySet));

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }

    case 'validate_citation': {
      const text = args?.text as string;
      const formatType = args?.format_type as string;
      if (!text || !formatType) throw new Error('text and format_type are required');

      const parsed = parseCitation(text);
      const errors: string[] = [];
      const suggestions: string[] = [];

      // 번역서 슬래시 규칙
      if (parsed.type === 'korean_translation' || text.includes('옮김')) {
        if (!text.includes('/')) {
          errors.push('번역서는 "원저자 / 역자 옮김" 형식으로 슬래시(/)를 사용해야 합니다.');
        }
      }

      // 기호 검증
      if (text.includes('「') && !text.includes('」')) {
        errors.push('학술지명 괄호가 짝이 맞지 않습니다.');
      }
      if (text.includes('『') && !text.includes('』')) {
        errors.push('단행본 괄호가 짝이 맞지 않습니다.');
      }

      // 참고문헌 외국저자 형식
      if (formatType === 'bibliography') {
        if (parsed.type === 'foreign_article' || parsed.type === 'foreign_book') {
          const authorPart = text.split('.')[0];
          if (authorPart && !authorPart.includes(',')) {
            errors.push('외국 저자는 참고문헌에서 "Last, First" 형식이어야 합니다.');
          }
        }
      }

      const valid = errors.length === 0;
      let corrected: string | undefined;
      if (!valid) {
        corrected = formatType === 'footnote' ? toFootnote(parsed) : toBibliography(parsed);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ valid, errors, suggestions, corrected, parsed_type: parsed.type }, null, 2)
        }]
      };
    }

    // ============================================
    // RAG 검색 도구
    // ============================================
    case 'search_examples': {
      if (!isRAGInitialized()) {
        initRAG();
      }

      const query = args?.query as string;
      const topK = (args?.top_k as number) || 5;
      const filterType = args?.filter_type as string | undefined;

      if (!query) throw new Error('query is required');

      try {
        const results = await searchCitations(query, topK, filterType);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query,
              results: results.map(r => ({
                content: r.content,
                type: r.citation_type,
                paper: r.paper_title,
                similarity: Math.round(r.similarity * 1000) / 1000
              })),
              count: results.length
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: String(error), note: 'RAG 기능을 사용하려면 환경변수가 필요합니다.' })
          }]
        };
      }
    }

    case 'get_paper_examples': {
      if (!isRAGInitialized()) {
        initRAG();
      }

      const paperTitle = args?.paper_title as string;
      if (!paperTitle) throw new Error('paper_title is required');

      try {
        const results = await getPaperCitations(paperTitle);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              paper_title: paperTitle,
              citations: results.map(r => ({ content: r.content, type: r.citation_type })),
              count: results.length
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: String(error) }) }]
        };
      }
    }

    // ============================================
    // 논문 포맷팅 도구
    // ============================================
    case 'format_paragraph': {
      const text = args?.text as string;
      const sectionType = (args?.section_type as string) || 'auto';
      if (!text) throw new Error('text is required');

      let formatted = text.trim();

      // 기본 포맷팅
      formatted = formatted
        .replace(/\s+/g, ' ')  // 다중 공백 제거
        .replace(/\.\s*/g, '. ')  // 문장 끝 공백 통일
        .replace(/,\s*/g, ', ')  // 콤마 뒤 공백 통일
        .trim();

      // 섹션별 스타일 적용
      const style: Record<string, unknown> = {
        section_type: sectionType,
        original_length: text.length,
        formatted_length: formatted.length
      };

      if (sectionType === 'abstract' || sectionType === 'auto' && formatted.length < 500) {
        style.note = '초록은 300자 내외로 작성합니다.';
        style.current_chars = formatted.length;
        if (formatted.length > 400) {
          style.warning = '초록이 권장 길이(300자)를 초과합니다.';
        }
      }

      // 학술적 문체 체크
      const informalPatterns = ['것 같다', '인 것 같습니다', '~거든요', '~네요'];
      const foundInformal = informalPatterns.filter(p => formatted.includes(p));
      if (foundInformal.length > 0) {
        style.style_warnings = foundInformal.map(p => `비학술적 표현 발견: "${p}" → 학술적 문체로 수정 필요`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ formatted, style }, null, 2)
        }]
      };
    }

    case 'format_paper': {
      const title = args?.title as string;
      const author = args?.author as string || '';
      const abstractKr = args?.abstract_kr as string || '';
      const keywordsKr = args?.keywords_kr as string[] || [];
      const body = args?.body as string || '';
      const references = args?.references as string[] || [];
      const abstractEn = args?.abstract_en as string || '';
      const keywordsEn = args?.keywords_en as string[] || [];

      if (!title) throw new Error('title is required');

      // 참고문헌 정렬 및 변환
      const sortedRefs = sortBibliography(
        references.map(ref => {
          const parsed = parseCitation(ref);
          return toBibliography(parsed) || ref;
        }).filter(r => r)
      );

      const formatted = `# ${title}

${author ? `**${author}**\n` : ''}
---

## 국문 초록

${abstractKr || '[초록 작성 필요]'}

**주제어**: ${keywordsKr.length > 0 ? keywordsKr.join(', ') : '[주제어 5개]'}

---

${body || '[본문 작성]'}

---

## 참고문헌

${sortedRefs.length > 0 ? sortedRefs.join('\n') : '[참고문헌 추가 필요]'}

---

## Abstract

${abstractEn || '[English abstract required]'}

**Keywords**: ${keywordsEn.length > 0 ? keywordsEn.join(', ') : '[5 keywords]'}
`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            formatted_paper: formatted,
            stats: {
              title_length: title.length,
              abstract_kr_length: abstractKr.length,
              keywords_kr_count: keywordsKr.length,
              references_count: sortedRefs.length,
              has_english_abstract: abstractEn.length > 0
            }
          }, null, 2)
        }]
      };
    }

    case 'check_format': {
      const paperText = args?.paper_text as string;
      if (!paperText) throw new Error('paper_text is required');

      const checks = {
        has_title: /^#\s+.+/m.test(paperText),
        has_kr_abstract: paperText.includes('국문 초록') || paperText.includes('초록'),
        has_keywords: paperText.includes('주제어') || paperText.includes('키워드'),
        has_en_abstract: paperText.toLowerCase().includes('abstract'),
        has_en_keywords: paperText.toLowerCase().includes('keywords'),
        has_references: paperText.includes('참고문헌') || paperText.includes('References'),
        uses_correct_brackets: {
          korean_journal: (paperText.match(/「[^」]+」/g) || []).length,
          korean_book: (paperText.match(/『[^』]+』/g) || []).length,
          foreign_italic: (paperText.match(/\*[^*]+\*/g) || []).length
        },
        translation_slash: {
          correct: (paperText.match(/[A-Za-z]+\s*\/\s*[가-힣]+\s*옮김/g) || []).length,
          incorrect: (paperText.match(/[A-Za-z]+\s*,\s*[가-힣]+\s*옮김/g) || []).length
        }
      };

      const issues: string[] = [];
      if (!checks.has_title) issues.push('논문 제목이 없습니다.');
      if (!checks.has_kr_abstract) issues.push('국문 초록이 없습니다.');
      if (!checks.has_keywords) issues.push('주제어가 없습니다.');
      if (!checks.has_en_abstract) issues.push('영문 초록(Abstract)이 없습니다.');
      if (!checks.has_references) issues.push('참고문헌이 없습니다.');
      if (checks.translation_slash.incorrect > 0) {
        issues.push(`번역서 표기 오류 ${checks.translation_slash.incorrect}건: 슬래시(/) 사용 필요`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            passed: issues.length === 0,
            checks,
            issues,
            score: Math.round((6 - issues.length) / 6 * 100)
          }, null, 2)
        }]
      };
    }

    case 'suggest_structure': {
      const topic = args?.topic as string;
      const type = (args?.type as string) || 'theoretical';
      if (!topic) throw new Error('topic is required');

      const structures: Record<string, string[]> = {
        theoretical: [
          'I. 서론',
          '  - 연구 배경 및 목적',
          '  - 연구 방법 및 범위',
          '  - 선행연구 검토',
          'II. 이론적 배경',
          '  1. 핵심 개념 정의',
          '  2. 관련 이론 검토',
          'III. 본론',
          '  1. 주요 논점 분석',
          '  2. 신학적 해석',
          '  3. 사회적 함의',
          'IV. 결론',
          '  - 연구 요약',
          '  - 의의 및 한계',
          '  - 향후 연구 제언'
        ],
        empirical: [
          'I. 서론',
          '  - 연구 문제',
          '  - 연구 가설',
          'II. 이론적 배경',
          '  1. 선행연구 검토',
          '  2. 연구 모형',
          'III. 연구 방법',
          '  1. 연구 대상',
          '  2. 자료 수집',
          '  3. 분석 방법',
          'IV. 연구 결과',
          '  1. 기술통계',
          '  2. 가설 검증',
          'V. 논의',
          '  1. 결과 해석',
          '  2. 신학적 함의',
          'VI. 결론'
        ],
        review: [
          'I. 서론',
          '  - 연구 목적',
          '  - 검토 범위',
          'II. 연구동향 분석',
          '  1. 시기별 연구 흐름',
          '  2. 주제별 분류',
          'III. 주요 쟁점 검토',
          '  1. 쟁점 1',
          '  2. 쟁점 2',
          'IV. 비판적 평가',
          'V. 결론 및 제언'
        ],
        case_study: [
          'I. 서론',
          '  - 연구 배경',
          '  - 사례 선정 이유',
          'II. 이론적 틀',
          'III. 사례 분석',
          '  1. 사례 개요',
          '  2. 맥락 분석',
          '  3. 특징 및 의의',
          'IV. 신학적 성찰',
          'V. 결론'
        ]
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            topic,
            paper_type: type,
            suggested_structure: structures[type] || structures.theoretical,
            tips: [
              '각 장은 명확한 제목을 가져야 합니다.',
              '서론에서 연구 질문을 명시하세요.',
              '결론에서 서론의 질문에 답하세요.',
              '참고문헌은 본문에서 인용한 것만 포함합니다.'
            ]
          }, null, 2)
        }]
      };
    }

    // ============================================
    // 유틸리티
    // ============================================
    case 'get_stats': {
      if (!isRAGInitialized()) {
        initRAG();
      }

      try {
        const stats = await getStats();
        return {
          content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: String(error) }) }]
        };
      }
    }

    // ============================================
    // 에세이 → 논문 변환 도구
    // ============================================
    case 'convert_essay_to_paper': {
      const title = args?.title as string;
      const author = args?.author as string;
      const affiliation = args?.affiliation as string;
      const body = args?.body as string;

      if (!title || !author || !affiliation || !body) {
        throw new Error('title, author, affiliation, body are required');
      }

      const input: EssayInput = {
        title,
        subtitle: args?.subtitle as string | undefined,
        author,
        affiliation,
        email: args?.email as string | undefined,
        abstract_kr: args?.abstract_kr as string | undefined,
        keywords_kr: args?.keywords_kr as string[] | undefined,
        body,
        references: args?.references as string[] | undefined,
        abstract_en: args?.abstract_en as string | undefined,
        keywords_en: args?.keywords_en as string[] | undefined
      };

      const options: ConversionOptions = {
        volume: args?.volume as number | undefined,
        issue: args?.issue as number | undefined,
        year: args?.year as number | undefined,
        start_page: args?.start_page as number | undefined
      };

      const outputFormat = (args?.output_format as string) || 'markdown';

      try {
        const paper = convertEssayToPaper(input, options);

        const result: Record<string, unknown> = {
          metadata: paper.metadata,
          stats: {
            sections: paper.body.length,
            footnotes: paper.footnotes.length,
            references: paper.references.length,
            estimated_pages: paper.headers.length
          }
        };

        if (outputFormat === 'markdown' || outputFormat === 'both') {
          result.markdown = toMarkdown(paper);
        }
        if (outputFormat === 'html' || outputFormat === 'both') {
          result.html = toWordHTML(paper);
        }

        result.headers = paper.headers;
        result.footnotes = paper.footnotes;

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: String(error) }) }]
        };
      }
    }

    case 'get_journal_template': {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            template: SHINSA_TEMPLATE,
            description: {
              journal_name: '신학과 사회',
              page_format: {
                size: '신국판 (152x225mm)',
                margins: '상 24mm, 하 25mm, 좌 25mm, 우 23mm'
              },
              fonts: {
                title: '바탕 14pt 굵게',
                subtitle: '바탕 12.3pt',
                author: '바탕 11pt',
                body: '바탕 10.3pt',
                abstract: '바탕 8.5pt',
                abstract_title: '바탕 9pt',
                section_title: '바탕 13pt 굵게',
                footnote: '바탕 8.5pt',
                header: '바탕 8.1pt',
                line_spacing: '160%'
              },
              section_numbering: {
                chapter: 'Ⅰ. Ⅱ. Ⅲ. (로마숫자)',
                section: '1. 2. 3. (아라비아숫자)',
                subsection: '1) 2) 3) (괄호숫자)'
              },
              header_format: {
                first_page: '신학과 사회 39(2) 2025   pp. 29 - 54',
                even_page: '신학과 사회 39(2) 2025'
              },
              author_footnote: {
                format: '{affiliation}/ {position}/ {field}/ {email}',
                symbol_with_title: '**',
                symbol_without_title: '*'
              },
              abstract_kr_title: '국문초록 (붙여쓰기)',
              page_number: {
                position: '하단 중앙',
                format: '아라비아 숫자'
              }
            }
          }, null, 2)
        }]
      };
    }

    // ============================================
    // 2025년 형식 검증 도구
    // ============================================
    case 'validate_format': {
      const checks = args?.checks as Record<string, string | number | boolean | null> | undefined;
      const getChecklist = args?.get_checklist as boolean;

      // 체크리스트만 요청하는 경우
      if (getChecklist) {
        return {
          content: [{
            type: 'text',
            text: getChecklistSummary()
          }]
        };
      }

      // 검증 수행
      if (!checks || Object.keys(checks).length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'checks 파라미터가 필요합니다.',
              hint: '체크리스트를 먼저 확인하려면 get_checklist: true를 사용하세요.',
              available_checks: SHINSA_2025_CHECKLIST.map(item => ({
                id: item.id,
                name: item.name,
                expected: item.expected,
                category: item.category
              }))
            }, null, 2)
          }]
        };
      }

      const results: FormatCheckResult[] = [];

      for (const item of SHINSA_2025_CHECKLIST) {
        if (item.id in checks) {
          const result = checkItem(item, checks[item.id]);
          results.push(result);
        }
      }

      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: '유효한 체크 항목이 없습니다.',
              provided_keys: Object.keys(checks),
              valid_keys: SHINSA_2025_CHECKLIST.map(item => item.id)
            }, null, 2)
          }]
        };
      }

      const report = generateValidationReport(results);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...report,
            checklist_version: '2025',
            based_on: '2-39-2 이민규 (2025) 실제 논문 분석'
          }, null, 2)
        }]
      };
    }

    case 'get_format_checklist': {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            version: '2025',
            based_on: '2-39-2 이민규 (2025) 실제 논문 분석',
            checklist: SHINSA_2025_CHECKLIST,
            summary: getChecklistSummary(),
            usage: {
              validate_format: {
                description: 'validate_format 도구에 checks 파라미터로 검증할 항목을 전달하세요.',
                example: {
                  checks: {
                    font_title: 14,
                    font_body: 10.3,
                    page_size: '신국판',
                    abstract_kr_title: '국문초록'
                  }
                }
              }
            }
          }, null, 2)
        }]
      };
    }

    // ============================================
    // DOCX 파일 생성 도구 (python-docx 기반)
    // ============================================
    case 'create_shinsa_docx': {
      const { spawn } = await import('child_process');
      const { writeFile, unlink, mkdir } = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');

      const title = args?.title as string;
      const author = args?.author as string;
      const affiliation = args?.affiliation as string;
      const body = args?.body as string;

      if (!title || !author || !affiliation || !body) {
        throw new Error('title, author, affiliation, body are required');
      }

      // 입력 데이터 준비
      const inputData = {
        title,
        subtitle: args?.subtitle as string | undefined,
        author,
        affiliation,
        field: args?.field as string | undefined,
        email: args?.email as string | undefined,
        funding: args?.funding as string | undefined,
        abstract_kr: args?.abstract_kr as string | undefined,
        keywords_kr: args?.keywords_kr as string[] | undefined,
        body,
        references: args?.references as string[] | undefined,
        abstract_en: args?.abstract_en as string | undefined,
        keywords_en: args?.keywords_en as string[] | undefined,
        volume: args?.volume as number | undefined,
        issue: args?.issue as number | undefined,
        year: args?.year as number | undefined,
        start_page: args?.start_page as number | undefined
      };

      // 출력 경로 결정
      let outputPath = args?.output_path as string;
      if (!outputPath) {
        const desktop = path.join(os.homedir(), 'Desktop');
        const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
        outputPath = path.join(desktop, `${safeTitle}_신사형식.docx`);
      }

      // 임시 JSON 파일 생성
      const tempDir = os.tmpdir();
      const tempJsonPath = path.join(tempDir, `shinsa_input_${Date.now()}.json`);

      try {
        await writeFile(tempJsonPath, JSON.stringify(inputData, null, 2), 'utf-8');

        // Python 스크립트 경로
        const scriptDir = path.dirname(new URL(import.meta.url).pathname);
        let scriptPath = path.join(scriptDir, '..', 'scripts', 'create_docx.py');

        // Windows 경로 수정
        if (process.platform === 'win32' && scriptPath.startsWith('/')) {
          scriptPath = scriptPath.substring(1);
        }

        // Python 실행
        const result = await new Promise<string>((resolve, reject) => {
          const pythonProcess = spawn('python', [scriptPath, tempJsonPath, outputPath], {
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
          });

          let stdout = '';
          let stderr = '';

          pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          pythonProcess.on('close', (code) => {
            if (code === 0) {
              resolve(stdout);
            } else {
              reject(new Error(stderr || `Python exited with code ${code}`));
            }
          });

          pythonProcess.on('error', (err) => {
            reject(err);
          });
        });

        // 임시 파일 삭제
        await unlink(tempJsonPath).catch(() => {});

        // 결과 파싱
        const resultJson = JSON.parse(result);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: resultJson.success,
              path: resultJson.path,
              message: resultJson.message,
              format: {
                page_size: '신국판 (152x225mm)',
                font: '바탕체',
                title_size: '14pt',
                body_size: '10.3pt',
                line_spacing: '160%'
              },
              note: 'python-docx로 생성된 정확한 형식의 DOCX 파일입니다.'
            }, null, 2)
          }]
        };

      } catch (error) {
        // 임시 파일 정리
        await unlink(tempJsonPath).catch(() => {});

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: String(error),
              hint: 'python-docx가 설치되어 있는지 확인하세요: pip install python-docx',
              fallback: 'convert_essay_to_paper 도구를 사용하여 HTML/Markdown으로 변환할 수 있습니다.'
            }, null, 2)
          }]
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 서버 시작
async function main() {
  // RAG 초기화 시도 (실패해도 citation 기능은 동작)
  try {
    initRAG();
    console.error('RAG initialized successfully');
  } catch (e) {
    console.error('RAG initialization skipped (optional)');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('shinsa-mcp server started');
}

main().catch(console.error);
