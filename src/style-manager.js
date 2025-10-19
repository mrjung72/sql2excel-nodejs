const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// 언어 설정 (명령줄 인수에서 가져오기)
const args = process.argv.slice(2);
const langArg = args.find(arg => arg.startsWith('--lang='));
const LANGUAGE = langArg ? langArg.split('=')[1] : 'en';

// 다국어 메시지
const messages = {
    en: {
        styleTemplatesLoaded: '📋 Style templates loaded:',
        templates: 'templates',
        styleTemplateLoadFailed: '⚠️  Style template load failed:',
        error: '   Error:',
        usingDefaultStyle: '   💡 Using default style.',
        availableStyles: '\n📋 Available Excel style templates:',
        separator: '─'
    },
    kr: {
        styleTemplatesLoaded: '📋 로드된 스타일 템플릿:',
        templates: '개',
        styleTemplateLoadFailed: '⚠️  스타일 템플릿 로드 실패:',
        error: '   오류:',
        usingDefaultStyle: '   💡 기본 스타일을 사용합니다.',
        availableStyles: '\n📋 사용 가능한 엑셀 스타일 템플릿:',
        separator: '─'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 스타일 관리 관련 함수들을 담당하는 모듈
 */
class StyleManager {
  constructor() {
    this.styleTemplates = null;
    this.msg = msg;
  }

  /**
   * 엑셀 스타일 템플릿 로더
   * @returns {Promise<Object>} 스타일 템플릿 객체
   */
  async loadStyleTemplates() {
    if (this.styleTemplates) return this.styleTemplates;
    
    // pkg로 빌드된 exe 파일에서는 실행 파일과 같은 디렉토리의 templates 폴더를 사용
    let templatePath;
    if (process.pkg) {
      // exe 파일로 실행 중인 경우: 실행 파일과 같은 디렉토리의 templates 폴더
      templatePath = path.join(path.dirname(process.execPath), 'templates', 'excel-styles.xml');
    } else {
      // 개발 환경에서 실행 중인 경우: 기존 경로
      templatePath = path.join(__dirname, '..', 'templates', 'excel-styles.xml');
    }
    
    try {
      const xml = fs.readFileSync(templatePath, 'utf8');
      const parsed = await xml2js.parseStringPromise(xml, { trim: true });
      
      this.styleTemplates = {};
      if (parsed.excelStyles && parsed.excelStyles.style) {
        for (const style of parsed.excelStyles.style) {
          if (style.$ && style.$.id) {
            const styleId = style.$.id;
            const styleName = style.$.name || styleId;
            const description = style.$.description || '';
            
            this.styleTemplates[styleId] = {
              id: styleId,
              name: styleName,
              description: description,
              header: this.parseStyleSection(style.header && style.header[0]),
              body: this.parseStyleSection(style.body && style.body[0])
            };
          }
        }
      }
      
      console.log(`${this.msg.styleTemplatesLoaded} ${Object.keys(this.styleTemplates).length}${this.msg.templates}`);
      return this.styleTemplates;
    } catch (error) {
      console.warn(`${this.msg.styleTemplateLoadFailed} ${templatePath}`);
      console.warn(`${this.msg.error} ${error.message}`);
      console.warn(this.msg.usingDefaultStyle);
      return {};
    }
  }

  /**
   * 스타일 섹션 파싱
   * @param {Object} section - 스타일 섹션 객체
   * @returns {Object} 파싱된 스타일 객체
   */
  parseStyleSection(section) {
    if (!section) return {};
    
    const result = {};
    
    if (section.font && section.font[0] && section.font[0].$) {
      result.font = section.font[0].$;
    }
    if (section.fill && section.fill[0] && section.fill[0].$) {
      result.fill = section.fill[0].$;
    }
    if (section.colwidths && section.colwidths[0] && section.colwidths[0].$) {
      result.colwidths = section.colwidths[0].$;
    }
    if (section.alignment && section.alignment[0] && section.alignment[0].$) {
      result.alignment = section.alignment[0].$;
    }
    if (section.border && section.border[0]) {
      result.border = this.parseXmlBorder(section.border[0]);
    }
    
    return result;
  }

  /**
   * XML 형식의 border 요소를 JSON 형식으로 변환
   * @param {Object} xmlBorder - XML에서 파싱된 border 객체
   * @returns {Object} JSON 형식의 border 객체
   */
  parseXmlBorder(xmlBorder) {
    const result = {};
    
    // <border><all style="thin" color="000000"/></border> 형식 처리
    if (xmlBorder.all && xmlBorder.all[0] && xmlBorder.all[0].$) {
      result.all = xmlBorder.all[0].$;
    }
    
    // 개별 방향별 테두리 처리
    if (xmlBorder.top && xmlBorder.top[0] && xmlBorder.top[0].$) {
      result.top = xmlBorder.top[0].$;
    }
    if (xmlBorder.left && xmlBorder.left[0] && xmlBorder.left[0].$) {
      result.left = xmlBorder.left[0].$;
    }
    if (xmlBorder.right && xmlBorder.right[0] && xmlBorder.right[0].$) {
      result.right = xmlBorder.right[0].$;
    }
    if (xmlBorder.bottom && xmlBorder.bottom[0] && xmlBorder.bottom[0].$) {
      result.bottom = xmlBorder.bottom[0].$;
    }
    
    return result;
  }

  /**
   * 스타일 ID로 스타일 가져오기
   * @param {string} styleId - 스타일 ID
   * @returns {Promise<Object|null>} 스타일 객체 또는 null
   */
  async getStyleById(styleId) {
    const templates = await this.loadStyleTemplates();
    return templates[styleId] || templates['default'] || null;
  }

  /**
   * 사용 가능한 스타일 목록 출력
   */
  async listAvailableStyles() {
    const templates = await this.loadStyleTemplates();
    
    console.log(this.msg.availableStyles);
    console.log(this.msg.separator.repeat(60));
    
    for (const [id, style] of Object.entries(templates)) {
      console.log(`  ${id.padEnd(12)} | ${style.name.padEnd(15)} | ${style.description}`);
    }
    console.log(this.msg.separator.repeat(60));
  }

  /**
   * 컬럼 너비 파싱
   * @param {Object} colwidths - 컬럼 너비 설정
   * @param {number} colCount - 컬럼 개수
   * @returns {Function} 컬럼 너비 계산 함수
   */
  parseColWidths(colwidths, colCount) {
    // colwidths: {min, max} or undefined
    // colCount: 실제 컬럼 개수
    return function(lengths) {
      // lengths: 각 컬럼별 최대 문자열 길이 배열
      let min = 10, max = 30;
      if (colwidths && typeof colwidths === 'object') {
        if (colwidths.min) min = Number(colwidths.min);
        if (colwidths.max) max = Number(colwidths.max);
      }
      return lengths.map(len => Math.max(min, Math.min(max, len)));
    };
  }

  /**
   * 시트가 활성화되어 있는지 확인
   * @param {Object} sheetDef - 시트 정의 객체
   * @returns {boolean} 활성화 여부
   */
  isSheetEnabled(sheetDef) {
    let use = true;
    // JSON: use 속성
    if (typeof sheetDef.use !== 'undefined') {
      if (
        sheetDef.use === false ||
        sheetDef.use === 0 ||
        sheetDef.use === 'false' ||
        sheetDef.use === '0' ||
        sheetDef.use === '' ||
        sheetDef.use === null
      ) use = false;
    }
    // XML: $.use 속성
    else if (sheetDef.hasOwnProperty('$') && typeof sheetDef.$.use !== 'undefined') {
      const val = sheetDef.$.use;
      if (
        val === false ||
        val === 0 ||
        val === 'false' ||
        val === '0' ||
        val === '' ||
        val === null
      ) use = false;
    }
    return use;
  }

  /**
   * 스타일 템플릿 가져오기
   * @returns {Object} 스타일 템플릿 객체
   */
  getStyleTemplates() {
    return this.styleTemplates;
  }

  /**
   * 스타일 템플릿 초기화
   */
  clearStyleTemplates() {
    this.styleTemplates = null;
  }

  /**
   * 스타일 병합
   * @param {Object} baseStyle - 기본 스타일
   * @param {Object} overrideStyle - 덮어쓸 스타일
   * @returns {Object} 병합된 스타일
   */
  mergeStyles(baseStyle, overrideStyle) {
    if (!overrideStyle) return baseStyle;
    
    const merged = { ...baseStyle };
    
    // header 스타일 병합
    if (overrideStyle.header) {
      merged.header = { ...merged.header, ...overrideStyle.header };
    }
    
    // body 스타일 병합
    if (overrideStyle.body) {
      merged.body = { ...merged.body, ...overrideStyle.body };
    }
    
    return merged;
  }

  /**
   * 기본 스타일 생성
   * @returns {Object} 기본 스타일 객체
   */
  createDefaultStyle() {
    return {
      header: {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      },
      body: {
        font: { size: 11 },
        alignment: { vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'D3D3D3' } },
          left: { style: 'thin', color: { argb: 'D3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'D3D3D3' } },
          right: { style: 'thin', color: { argb: 'D3D3D3' } }
        }
      }
    };
  }
}

module.exports = StyleManager;
