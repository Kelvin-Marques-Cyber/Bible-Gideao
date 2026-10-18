import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
async function files(dir){const all=await readdir(dir,{withFileTypes:true});return (await Promise.all(all.map(x=>x.isDirectory()?files(join(dir,x.name)):join(dir,x.name)))).flat();}
const revision=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
const sourceCommit=revision.status===0?revision.stdout.trim():'unversioned';
const metadata=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/version.json',JSON.stringify({sourceCommit,version:metadata.version})+'\n');
const assets=(await files('dist')).filter(x=>!x.endsWith('/sw.js')&&!x.endsWith('.map'));
const template=await readFile('public/sw.js','utf8');
const digest=createHash('sha256');digest.update(template);for(const file of assets)digest.update(await readFile(file));
const version=digest.digest('hex').slice(0,12), paths=['./',...assets.map(x=>'./'+relative('dist',x).replaceAll('\\','/'))];
const generated=template.replace("'gideao-v1.0.0'",JSON.stringify('gideao-'+version)).replace(/\[BASE, BASE\+'index.html'.*?\]/,JSON.stringify(paths));
await writeFile('dist/sw.js',generated);
console.log(`Offline: ${paths.length} arquivos incluídos · versão ${version}`);
