import zipfile
import xml.etree.ElementTree as ET
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

docx_path = r'C:\Users\sshin\OneDrive - Global Education Research Institutute\바탕 화면\GPTs_Leadership_Paper_ShinSa_Format.docx'

ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

# Claude Desktop Output 분석 결과
print('=' * 60)
print('Claude Desktop 출력물 분석 결과')
print('=' * 60)

with zipfile.ZipFile(docx_path, 'r') as z:
    # 페이지 설정 (sectPr)
    with z.open('word/document.xml') as f:
        doc_tree = ET.parse(f)
        doc_root = doc_tree.getroot()

        sectPr = doc_root.find('.//w:sectPr', ns)
        if sectPr is not None:
            pgSz = sectPr.find('w:pgSz', ns)
            pgMar = sectPr.find('w:pgMar', ns)

            if pgSz is not None:
                # 1 inch = 1440 twips, 1 mm = 56.7 twips
                w = int(pgSz.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}w', '0'))
                h = int(pgSz.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}h', '0'))
                w_mm = round(w / 56.7)
                h_mm = round(h / 56.7)
                print(f'\n[페이지 크기]')
                print(f'  실제: {w_mm}mm x {h_mm}mm ({w} x {h} twips)')

                if w_mm > 200:
                    print(f'  → A4 사용됨 (210x297mm)')
                    print(f'  ❌ 2025 기준: 신국판 (152x225mm)')
                else:
                    print(f'  ✓ 신국판 사용됨')

            if pgMar is not None:
                top = int(pgMar.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}top', '0'))
                bottom = int(pgMar.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bottom', '0'))
                left = int(pgMar.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}left', '0'))
                right = int(pgMar.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}right', '0'))

                # 1 inch = 1440 twips, 1 mm = 56.7 twips
                top_mm = round(top / 56.7)
                bottom_mm = round(bottom / 56.7)
                left_mm = round(left / 56.7)
                right_mm = round(right / 56.7)

                print(f'\n[마진]')
                print(f'  실제: 상 {top_mm}mm, 하 {bottom_mm}mm, 좌 {left_mm}mm, 우 {right_mm}mm')
                print(f'  2025 기준: 상 24mm, 하 25mm, 좌 25mm, 우 23mm')

                # 체크
                issues = []
                if abs(top_mm - 24) > 3:
                    issues.append(f'상단 마진 ({top_mm}mm != 24mm)')
                if abs(bottom_mm - 25) > 3:
                    issues.append(f'하단 마진 ({bottom_mm}mm != 25mm)')
                if abs(left_mm - 25) > 3:
                    issues.append(f'좌측 마진 ({left_mm}mm != 25mm)')
                if abs(right_mm - 23) > 3:
                    issues.append(f'우측 마진 ({right_mm}mm != 23mm)')

                if issues:
                    print(f'  ❌ 문제: ' + ', '.join(issues))
                else:
                    print(f'  ✓ 마진 OK')

    # 폰트 분석
    print(f'\n[폰트 설정]')
    with z.open('word/document.xml') as f:
        content = f.read().decode('utf-8')

        # 타이틀 폰트 (sz val=32 is 16pt)
        sz_matches = re.findall(r'<w:sz w:val="(\d+)"', content)
        font_matches = re.findall(r'w:eastAsia="([^"]+)"', content)
        ascii_fonts = re.findall(r'w:ascii="([^"]+)"', content)

        unique_sizes = sorted(set(int(s) for s in sz_matches), reverse=True)
        unique_fonts = set(font_matches)
        unique_ascii = set(ascii_fonts)

        print(f'  사용된 폰트 크기 (half-points): {unique_sizes[:10]}')
        pt_sizes = [s/2 for s in unique_sizes[:10]]
        print(f'  → pt 변환: {pt_sizes}')
        print(f'  사용된 eastAsia 폰트: {unique_fonts}')
        print(f'  사용된 ascii 폰트: {unique_ascii}')

        # 2025 기준 비교
        print(f'\n[2025 기준 폰트 크기 비교]')
        max_size = max(unique_sizes)/2 if unique_sizes else 0
        print(f'  - 제목: 14pt (2025 기준) vs {max_size}pt (실제)')
        print(f'  - 본문: 10.3pt (2025 기준)')
        print(f'  - 초록: 8.5pt (2025 기준)')
        print(f'  - 폰트: 바탕체 (2025 기준) vs {unique_fonts or unique_ascii} (실제)')

        if 'Times New Roman' in unique_fonts or 'Times New Roman' in unique_ascii:
            print(f'  ❌ Times New Roman 사용됨 (바탕체 사용해야 함)')

    # 줄간격 분석
    print(f'\n[줄간격]')
    with z.open('word/document.xml') as f:
        content = f.read().decode('utf-8')
        spacing_matches = re.findall(r'<w:spacing[^>]*w:line="(\d+)"[^>]*/>', content)
        if spacing_matches:
            unique_spacing = sorted(set(int(s) for s in spacing_matches), reverse=True)
            print(f'  사용된 줄간격 (twips): {unique_spacing[:5]}')
            # 160% of 12pt = 480 twips roughly
            print(f'  2025 기준: 160% (약 384 twips for 10pt)')
        else:
            print(f'  줄간격 설정 없음 (기본값 사용)')

# 2025 실제 논문과 비교 요약
print('\n' + '=' * 60)
print('A/B 테스트 요약')
print('=' * 60)
print('''
항목                | 2025 실제 논문      | Claude Desktop 출력
--------------------|--------------------|-----------------------
페이지 크기         | 신국판 (152x225mm) | A4 (210x297mm) ❌
마진               | 24/25/25/23mm      | 25.4mm (1inch) ❌
폰트               | 바탕체             | Times New Roman ❌
제목 크기          | 14pt               | 16pt ❌
본문 크기          | 10.3pt             | 12pt ❌
초록 크기          | 8.5pt              | 9pt
헤더 크기          | 8.1pt              | 9pt
줄간격             | 160%               | 기본값 (100%?)
''')
