const { Plugin, Notice } = require('obsidian');

// 전환: 기본 ↔ wide
const CYCLE = [null, 'wide'];
const LABELS = { null: '기본', wide: '넓게 (Wide)' };

class PageWidthPlugin extends Plugin {
  async onload() {
    this.addRibbonIcon('arrow-left-right', '페이지 너비 전환', () => this.cycle());

    this.addCommand({
      id: 'cycle-page-width',
      name: '페이지 너비 전환 (기본 ↔ Wide)',
      callback: () => this.cycle(),
    });

    // 에디터 우클릭 메뉴
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu) => {
        menu.addItem(item =>
          item.setTitle('페이지 너비 전환 (기본 ↔ Wide)')
              .setIcon('arrow-left-right')
              .onClick(() => this.cycle())
        );
      })
    );

    // 노트 우상단 ⋯ 더보기 메뉴
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, source) => {
        if (source === 'more-options') {
          menu.addItem(item =>
            item.setTitle('페이지 너비 전환 (기본 ↔ Wide)')
                .setIcon('arrow-left-right')
                .onClick(() => this.cycle())
          );
        }
      })
    );
  }

  async cycle() {
    const file = this.app.workspace.getActiveFile();
    if (!file) { new Notice('열린 노트가 없습니다.'); return; }

    await this.app.fileManager.processFrontMatter(file, (fm) => {
      let classes = fm.cssclasses ?? [];
      if (typeof classes === 'string') classes = [classes];

      const current = CYCLE.find(c => c && classes.includes(c)) ?? null;
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

      fm.cssclasses = classes.filter(c => !CYCLE.includes(c));
      if (next) fm.cssclasses.push(next);
      if (fm.cssclasses.length === 0) delete fm.cssclasses;

      new Notice(`너비: ${LABELS[next]}`);
    });
  }
}

module.exports = PageWidthPlugin;

/* nosourcemap */