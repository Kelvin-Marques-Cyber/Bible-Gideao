/**
 * Build-independent GitHub Pages publishing. Run after "bun run build".
 * Places only dist/ files on gh-pages; never rewrites source files on main.
 * Uses Git worktrees so an in-progress local checkout remains untouched.
 */
import { spawnSync } from 'node:child_process';
import { access, cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const branch = 'gh-pages';

function command(bin, args, cwd = root, capture = false) {
  const result = spawnSync(bin, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${bin} ${args.join(' ')} falhou (código ${result.status}).${capture ? '\n' + result.stderr : ''}`);
  }
  return (result.stdout ?? '').trim();
}

async function main() {
  const htmlPath = join(dist, 'index.html');
  const html = await readFile(htmlPath, 'utf8').catch(() => {
    throw new Error('Falta dist/index.html. Execute "bun run build" antes de publicar.');
  });
  if (html.includes('/src/main.tsx') || html.includes('src="/src/')) {
    throw new Error('dist/index.html ainda aponta para os fontes TSX. É necessário compilar com Vite.');
  }
  for (const file of ['manifest.webmanifest', 'sw.js']) {
    await access(join(dist, file));
  }
  await access(join(dist, 'assets'));

  command('git', ['rev-parse', '--show-toplevel'], root, true);
  const url = command('git', ['remote', 'get-url', 'origin'], root, true);
  if (!/Kelvin-Marques-Cyber\/Bible-Gideao(?:\.git)?(?:$|\/)/i.test(url)) {
    throw new Error(`Remote origin inesperado: ${url}. Verifique o repositório antes da publicação.`);
  }
  const remote = command('git', ['ls-remote', '--heads', 'origin', branch], root, true);
  const exists = remote.length > 0;
  if (exists) command('git', ['fetch', '--no-tags', 'origin', branch], root);

  const tmp = await mkdtemp(join(tmpdir(), 'gideao-pages-'));
  const worktree = join(tmp, 'site');
  let added = false;
  try {
    command('git', ['worktree', 'add', '--detach', worktree, exists ? 'FETCH_HEAD' : 'HEAD'], root);
    added = true;
    const cname = await readFile(join(worktree, 'CNAME'), 'utf8').catch(() => null);
    for (const name of await readdir(worktree)) {
      if (name !== '.git') await rm(join(worktree, name), { recursive: true, force: true });
    }
    for (const name of await readdir(dist)) {
      await cp(join(dist, name), join(worktree, name), { recursive: true, force: true });
    }
    if (cname && !(await readdir(dist)).includes('CNAME')) {
      await writeFile(join(worktree, 'CNAME'), cname);
    }
    await writeFile(join(worktree, '.nojekyll'), '');
    command('git', ['add', '-A'], worktree);
    const changes = command('git', ['status', '--porcelain'], worktree, true);
    if (!changes) {
      console.log('gh-pages já contém exatamente os mesmos arquivos.');
      return;
    }
    command('git', ['commit', '-m', 'deploy: publish compiled Bible-Gideao PWA'], worktree);
    command('git', ['push', 'origin', 'HEAD:refs/heads/gh-pages'], worktree);
    console.log('\nArquivos compilados publicados na branch gh-pages.');
    console.log('Selecione Settings > Pages > Deploy from a branch > gh-pages > /(root).');
    console.log('Site: https://kelvin-marques-cyber.github.io/Bible-Gideao/');
  } finally {
    if (added) {
      try { command('git', ['worktree', 'remove', '--force', worktree], root); }
      catch (error) { console.error('Não foi possível limpar worktree temporário:', error); }
    }
    await rm(tmp, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error('Falha ao publicar:', error.message);
  process.exitCode = 1;
});
