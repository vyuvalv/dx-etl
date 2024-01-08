import fs from 'fs';

export const html = () => ({
  name: 'html',
  buildStart() {
    this.addWatchFile('src/index.html');
  },
  generateBundle() {
    let source = fs.readFileSync('src/index.html', 'utf-8');

    this.emitFile({
      type: 'asset',
      source,
      name: 'HTML Asset',
      fileName: 'index.html'
    });
  }
});

export default html;
